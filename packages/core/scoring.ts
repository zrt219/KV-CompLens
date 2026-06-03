import type { ComparableProperty, GateResult, ScoredComparable, ScoreBreakdown, SubjectProperty } from "./types";
import { haversineDistanceKm } from "./geo";
import { clamp01, clampScore, exponentialDecay, gaussianKernel, safeExp, sigmoid } from "./probability";
import { detectPpsfOutlier } from "./outliers";
import { calculateSourceReliability, missingDataPenalty } from "./sourceReliability";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CONDITION_RANK = { Poor: 0, Average: 1, Good: 2, Renovated: 3, New: 4 };
const DEFAULT_UNDERWRITING_DATE = "2026-05-31";

type FactorValues = {
  location: number;
  propertyType: number;
  size: number;
  bedsBaths: number;
  recency: number;
  ageCondition: number;
  pricePerSqft: number;
};

export function haversineKm(a: Pick<SubjectProperty, "latitude" | "longitude">, b: Pick<ComparableProperty, "latitude" | "longitude">) {
  return haversineDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
}

export function calculateDaysSinceSale(saleDate: string, targetDate = DEFAULT_UNDERWRITING_DATE) {
  return Math.max(0, Math.round((new Date(`${targetDate}T00:00:00Z`).getTime() - new Date(`${saleDate}T00:00:00Z`).getTime()) / MS_PER_DAY));
}

export function scoreLocation(distanceKm: number) {
  return clampScore(100 * gaussianKernel(Math.max(0, distanceKm), 3));
}

function locationScore(subject: SubjectProperty, comp: ComparableProperty, distanceKm: number) {
  const cityBonus = subject.city === comp.city ? 8 : 0;
  const neighbourhoodBonus = subject.neighbourhood === comp.neighbourhood ? 12 : 0;
  return clampScore(scoreLocation(distanceKm) * 0.8 + cityBonus + neighbourhoodBonus);
}

function propertyTypeFactor(subject: SubjectProperty, comp: ComparableProperty) {
  if (subject.propertyType === comp.propertyType) return 1;
  const near = new Set(["Detached:SemiDetached", "SemiDetached:Townhouse", "Townhouse:Condo"]);
  if (near.has(`${subject.propertyType}:${comp.propertyType}`) || near.has(`${comp.propertyType}:${subject.propertyType}`)) return 0.65;
  if (subject.propertyType === "Detached" && comp.propertyType === "Condo") return 0;
  if (subject.propertyType === "Condo" && comp.propertyType === "Detached") return 0;
  return 0.35;
}

export function scorePropertyType(subject: SubjectProperty, comp: ComparableProperty) {
  return clampScore(propertyTypeFactor(subject, comp) * 100);
}

export function scoreSize(subject: SubjectProperty, comp: ComparableProperty) {
  if (subject.livingAreaSqft <= 0 || comp.livingAreaSqft <= 0) return 0;
  const ratio = Math.abs(subject.livingAreaSqft - comp.livingAreaSqft) / subject.livingAreaSqft;
  return clampScore(100 * gaussianKernel(ratio, 0.25));
}

export function scoreBedsBaths(subject: SubjectProperty, comp: ComparableProperty) {
  const bedroomDiff = Math.abs(subject.bedrooms - comp.bedrooms);
  const bathroomDiff = Math.abs(subject.bathrooms - comp.bathrooms);
  return clampScore(100 * clamp01(1 - 0.18 * bedroomDiff - 0.12 * bathroomDiff));
}

export function scoreRecency(days: number) {
  return clampScore(100 * exponentialDecay(Math.max(0, days), 180));
}

export function scoreAgeCondition(subject: SubjectProperty, comp: ComparableProperty) {
  const yearDiff = Math.abs(subject.yearBuilt - comp.yearBuilt);
  const conditionDiff = Math.abs(CONDITION_RANK[subject.condition] - CONDITION_RANK[comp.condition]);
  const age = gaussianKernel(yearDiff, 20);
  const condition = clamp01(1 - 0.2 * conditionDiff);
  return clampScore(100 * (0.55 * age + 0.45 * condition));
}

export function scorePricePerSqft(comp: ComparableProperty, candidatePool: ComparableProperty[], subject?: SubjectProperty) {
  if (comp.salePrice <= 0 || comp.livingAreaSqft <= 0) return 0;
  const compPpsf = comp.salePrice / comp.livingAreaSqft;
  if (subject?.targetPriceHint && subject.livingAreaSqft > 0) {
    const subjectPpsf = subject.targetPriceHint / subject.livingAreaSqft;
    return clampScore(100 * gaussianKernel(Math.abs(subjectPpsf - compPpsf) / subjectPpsf, 0.28));
  }
  const peerPpsf = candidatePool
    .filter((candidate) => candidate.salePrice > 0 && candidate.livingAreaSqft > 0)
    .map((candidate) => candidate.salePrice / candidate.livingAreaSqft)
    .sort((a, b) => a - b);
  const median = peerPpsf[Math.floor(peerPpsf.length / 2)] ?? compPpsf;
  return clampScore(100 * gaussianKernel(median > 0 ? Math.abs(median - compPpsf) / median : 1, 0.3));
}

export function evaluateEligibility(subject: SubjectProperty, comp: ComparableProperty): GateResult {
  const reasons: string[] = [];
  let penalty = 0;
  let failed = false;
  const distanceKm = haversineKm(subject, comp);
  const daysSinceSale = calculateDaysSinceSale(comp.saleDate, subject.underwritingDate ?? DEFAULT_UNDERWRITING_DATE);
  const sizeVariance = subject.livingAreaSqft > 0 ? Math.abs(subject.livingAreaSqft - comp.livingAreaSqft) / subject.livingAreaSqft : 1;
  const sourceReliability = calculateSourceReliability(comp);

  if (comp.salePrice <= 0 || comp.livingAreaSqft <= 0) {
    failed = true;
    penalty += 100;
    reasons.push("Missing or invalid sale price or home size.");
  }
  if (distanceKm > 65) {
    failed = true;
    penalty += 35;
    reasons.push(`Too far away at ${distanceKm.toFixed(1)} km.`);
  } else if (distanceKm > 18) {
    penalty += 12;
    reasons.push(`Farther than preferred at ${distanceKm.toFixed(1)} km from the subject home.`);
  }
  if (daysSinceSale > 730) {
    failed = true;
    penalty += 24;
    reasons.push(`Sale is older than preferred at ${daysSinceSale} days.`);
  } else if (daysSinceSale > 365) {
    penalty += 10;
    reasons.push(`Sale timing is weak at ${daysSinceSale} days.`);
  }
  if (scorePropertyType(subject, comp) < 35) {
    penalty += 16;
    reasons.push("Property type does not match the subject home.");
  }
  if (sizeVariance > 0.4) {
    penalty += 10;
    reasons.push(`Home size differs by ${Math.round(sizeVariance * 100)}%.`);
  }
  if (sourceReliability < 0.65) {
    penalty += 8;
    reasons.push("Source quality is below the preferred threshold.");
  }

  const severity: GateResult["severity"] = failed ? "fail" : penalty > 0 ? "warn" : "pass";
  return { passed: !failed, severity, reasons, penalty };
}

function weightedCoreScore(breakdown: ScoreBreakdown) {
  return (
    breakdown.locationScore * 0.3 +
    breakdown.propertyTypeScore * 0.2 +
    breakdown.sizeScore * 0.15 +
    breakdown.bedroomBathroomScore * 0.1 +
    breakdown.saleRecencyScore * 0.1 +
    breakdown.ageConditionScore * 0.1 +
    breakdown.pricePerSqftScore * 0.05
  ) * 0.96 + breakdown.sourceReliabilityScore * 0.04;
}

export function calculateRiskSeverity(riskFlags: string[], eligibility: GateResult, outlierProbability: number) {
  return clamp01(riskFlags.length * 0.075 + eligibility.penalty / 120 + outlierProbability * 0.18 + (eligibility.severity === "fail" ? 0.35 : 0));
}

function factorValues(subject: SubjectProperty, comp: ComparableProperty, candidatePool: ComparableProperty[], distanceKm: number, daysSinceSale: number): FactorValues {
  return {
    location: locationScore(subject, comp, distanceKm) / 100,
    propertyType: propertyTypeFactor(subject, comp),
    size: scoreSize(subject, comp) / 100,
    bedsBaths: scoreBedsBaths(subject, comp) / 100,
    recency: scoreRecency(daysSinceSale) / 100,
    ageCondition: scoreAgeCondition(subject, comp) / 100,
    pricePerSqft: scorePricePerSqft(comp, candidatePool, subject) / 100
  };
}

export function calculateComparableProbability(factors: FactorValues, flagSeverity: number, eligibility: GateResult) {
  if (!eligibility.passed) return Math.min(0.25, sigmoid(-3.2));
  const logit =
    -2.2 +
    1.35 * factors.location +
    1.15 * factors.propertyType +
    0.95 * factors.size +
    0.65 * factors.bedsBaths +
    0.75 * factors.recency +
    0.55 * factors.ageCondition +
    0.45 * factors.pricePerSqft -
    0.85 * flagSeverity -
    eligibility.penalty / 35;
  return clamp01(sigmoid(logit));
}

export function calculateEvidenceEnergy(subject: SubjectProperty, comp: ComparableProperty, distanceKm: number, daysSinceSale: number, outlierProbability: number, riskSeverity: number, missingPenalty: number) {
  const sizeRatio = subject.livingAreaSqft > 0 ? Math.abs(subject.livingAreaSqft - comp.livingAreaSqft) / subject.livingAreaSqft : 1;
  const distanceEnergy = 0.85 * Math.pow(distanceKm / 3, 2);
  const sizeEnergy = 0.7 * Math.pow(sizeRatio / 0.25, 2);
  const recencyEnergy = 0.45 * (daysSinceSale / 180);
  const outlierEnergy = 0.95 * outlierProbability;
  const riskEnergy = 0.75 * riskSeverity;
  const missingEnergy = 0.5 * missingPenalty;
  const evidenceEnergy = distanceEnergy + sizeEnergy + recencyEnergy + outlierEnergy + riskEnergy + missingEnergy;

  return {
    evidenceEnergy,
    energyQuality: clamp01(safeExp(-evidenceEnergy)),
    energyReasons: [
      distanceKm <= 3 ? "Distance is inside the preferred evidence radius." : `Distance energy increased by ${distanceKm.toFixed(1)} km separation.`,
      sizeRatio <= 0.25 ? "Size difference is inside tolerance." : `Size energy increased by ${Math.round(sizeRatio * 100)}% sqft variance.`,
      daysSinceSale <= 180 ? "Sale recency is inside the 180-day target." : `Recency energy increased by ${daysSinceSale} days since sale.`,
      outlierProbability < 0.35 ? "PPSF outlier energy is low." : `PPSF outlier probability is ${Math.round(outlierProbability * 100)}%.`,
      riskSeverity < 0.25 ? "Risk-severity energy is low." : `Risk-severity energy is ${Math.round(riskSeverity * 100)}%.`
    ]
  };
}

export function calculateComparableUncertainty(distanceKm: number, daysSinceSale: number, sourceReliability: number, outlierProbability: number, riskSeverity: number) {
  const baseVariance = Math.pow(35000, 2);
  const exponent = 0.08 * distanceKm + 0.25 * (daysSinceSale / 180) + 0.35 * outlierProbability + 0.18 * riskSeverity;
  return baseVariance * safeExp(exponent) * (1 / Math.max(0.35, sourceReliability));
}

export function scoreComparableProperty(subject: SubjectProperty, comp: ComparableProperty, candidatePool: ComparableProperty[] = [comp]): ScoredComparable {
  const distanceKm = haversineKm(subject, comp);
  const daysSinceSale = calculateDaysSinceSale(comp.saleDate, subject.underwritingDate ?? DEFAULT_UNDERWRITING_DATE);
  const sizeVariance = subject.livingAreaSqft > 0 ? Math.abs(subject.livingAreaSqft - comp.livingAreaSqft) / subject.livingAreaSqft : 1;
  const compPpsf = comp.livingAreaSqft > 0 ? comp.salePrice / comp.livingAreaSqft : 0;
  const sourceReliability = calculateSourceReliability(comp);
  const outlier = detectPpsfOutlier(comp, candidatePool);
  const eligibility = evaluateEligibility(subject, comp);
  const breakdown: ScoreBreakdown = {
    locationScore: locationScore(subject, comp, distanceKm),
    propertyTypeScore: scorePropertyType(subject, comp),
    sizeScore: scoreSize(subject, comp),
    bedroomBathroomScore: scoreBedsBaths(subject, comp),
    saleRecencyScore: scoreRecency(daysSinceSale),
    ageConditionScore: scoreAgeCondition(subject, comp),
    pricePerSqftScore: scorePricePerSqft(comp, candidatePool, subject),
    sourceReliabilityScore: clampScore(sourceReliability * 100)
  };
  const rawScore = weightedCoreScore(breakdown);
  const basePenalties = [
    ...eligibility.reasons,
    breakdown.pricePerSqftScore < 60 ? "Large price-per-square-foot variance versus peer set." : "",
    outlier.riskFlag ? `Robust PPSF outlier flag: ${outlier.riskFlag} (z=${outlier.robustZScore.toFixed(2)}).` : ""
  ].filter(Boolean);
  const riskFlags = [
    distanceKm > 18 ? "Distant location" : "",
    breakdown.propertyTypeScore < 70 ? "Different property type" : "",
    daysSinceSale > 180 ? "Stale sale date" : "",
    breakdown.saleRecencyScore < 55 ? "Older sale" : "",
    breakdown.sizeScore < 55 ? "Size mismatch" : "",
    breakdown.ageConditionScore < 55 ? "Age or condition mismatch" : "",
    breakdown.pricePerSqftScore < 55 ? "Price-per-sqft outlier" : "",
    outlier.riskFlag
  ].filter(Boolean);

  const riskSeverity = calculateRiskSeverity(riskFlags, eligibility, outlier.outlierProbability);
  const missingPenalty = missingDataPenalty(comp);
  const energy = calculateEvidenceEnergy(subject, comp, distanceKm, daysSinceSale, outlier.outlierProbability, riskSeverity, missingPenalty);
  const comparableProbability = calculateComparableProbability(factorValues(subject, comp, candidatePool, distanceKm, daysSinceSale), riskSeverity, eligibility);
  const uncertaintyVariance = calculateComparableUncertainty(distanceKm, daysSinceSale, sourceReliability, outlier.outlierProbability, riskSeverity);
  const precision = uncertaintyVariance > 0 ? 1 / uncertaintyVariance : 0;
  const evidenceWeight = comparableProbability * energy.energyQuality * sourceReliability * precision;
  const totalScore = clampScore(rawScore * 0.72 + comparableProbability * 18 + energy.energyQuality * 10 - eligibility.penalty - outlier.scorePenalty);

  const reasonParts = [
    subject.propertyType === comp.propertyType ? `Same property type: ${comp.propertyType}.` : `Property type differs: ${comp.propertyType}.`,
    distanceKm <= 3 ? `Within the preferred distance at ${distanceKm.toFixed(1)} km.` : `${distanceKm.toFixed(1)} km from the subject home.`,
    sizeVariance <= 0.25 ? `Home size is within tolerance.` : `${Math.round(sizeVariance * 100)}% home-size difference.`,
    daysSinceSale <= 180 ? `Recent sale within ${daysSinceSale} days.` : `Sale age is ${daysSinceSale} days.`,
    `Match chance ${Math.round(comparableProbability * 100)}%, evidence strength ${Math.round(energy.energyQuality * 100)}%, source reliability ${Math.round(sourceReliability * 100)}%.`
  ];
  const status = !eligibility.passed || totalScore < 48 || comparableProbability < 0.28 ? "rejected" : "candidate";

  return {
    ...comp,
    status,
    wasRejected: status === "rejected",
    rejectionReason: status === "rejected" ? (basePenalties[0] ?? "Lower match than the homes already selected.") : comp.rejectionReason,
    totalScore: Math.round(totalScore * 10) / 10,
    rawScore: Math.round(rawScore * 10) / 10,
    breakdown,
    factorScores: breakdown,
    eligibility,
    matchReason: reasonParts.join(" "),
    reasons: reasonParts,
    penalties: basePenalties,
    riskFlags,
    distanceKm,
    daysSinceSale,
    pricePerSqft: Math.round(compPpsf),
    comparableProbability,
    comparableProbabilityPercent: Math.round(comparableProbability * 100),
    sourceReliability,
    missingDataPenalty: missingPenalty,
    evidenceEnergy: energy.evidenceEnergy,
    energyQuality: energy.energyQuality,
    energyReasons: energy.energyReasons,
    outlierProbability: outlier.outlierProbability,
    robustZScore: outlier.robustZScore,
    uncertaintyVariance,
    precision,
    evidenceWeight,
    riskSeverity
  };
}

export function scoreComparable(subject: SubjectProperty, comp: ComparableProperty, candidatePool: ComparableProperty[] = [comp]) {
  return scoreComparableProperty(subject, comp, candidatePool);
}

export function rankComparables(subject: SubjectProperty, candidatePool: ComparableProperty[]) {
  return candidatePool
    .map((comp) => scoreComparableProperty(subject, comp, candidatePool))
    .sort((a, b) => b.totalScore - a.totalScore || b.comparableProbability - a.comparableProbability || b.energyQuality - a.energyQuality || new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime() || a.distanceKm - b.distanceKm || a.id.localeCompare(b.id));
}

export function selectTopComparables(scored: ScoredComparable[], count = 5) {
  return scored
    .filter((comp) => comp.status !== "rejected")
    .sort((a, b) => b.totalScore - a.totalScore || b.comparableProbability - a.comparableProbability || b.energyQuality - a.energyQuality || a.distanceKm - b.distanceKm)
    .slice(0, count);
}

export function scoreComparableProperties(subject: SubjectProperty, comps: ComparableProperty[]) {
  return rankComparables(subject, comps);
}
