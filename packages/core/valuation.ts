import { adjustComparableValue, roundToThousand } from "./adjustments";
import { calculateConfidence } from "./confidence";
import { createValuationSubModels, fuseValuationSubModels } from "./modelFusion";
import { effectiveSampleSize, entropy, normalizeWeights, weightedMean, weightedPercentile, weightedVariance } from "./probability";
import type { AdjustedComparable, ScoredComparable, SubjectProperty, ValuationDelta, ValuationRange } from "./types";

function priorMean(subject: SubjectProperty, selectedComparables: ScoredComparable[]) {
  if (subject.priorEstimate && subject.priorEstimate > 0) return subject.priorEstimate;
  if (subject.assessmentAnchor && subject.assessmentAnchor > 0) return subject.assessmentAnchor;
  if (subject.targetPriceHint && subject.targetPriceHint > 0) return subject.targetPriceHint;
  const prices = selectedComparables.map((comp) => comp.salePrice).filter(Number.isFinite);
  return prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
}

function evidenceWeight(comp: AdjustedComparable) {
  const raw = comp.comparableProbability * comp.energyQuality * comp.sourceReliability * comp.precision;
  return Math.max(1e-12, Number.isFinite(raw) ? raw : 1e-12);
}

function withNormalizedWeights(adjustedComparables: AdjustedComparable[], weights: number[]) {
  const normalized = normalizeWeights(weights);
  return adjustedComparables.map((comp, index) => ({ ...comp, normalizedEvidenceWeight: normalized[index] ?? 0 }));
}

function leaveOneOutResiduals(values: number[], weights: number[]) {
  return values.map((value, index) => {
    const otherValues = values.filter((_, otherIndex) => otherIndex !== index);
    const otherWeights = weights.filter((_, otherIndex) => otherIndex !== index);
    const estimate = otherValues.length ? weightedMean(otherValues, otherWeights) : weightedMean(values, weights);
    return Math.abs(value - estimate);
  });
}

export function createZeroValuationRange(): ValuationRange {
  return {
    lowEstimate: 0,
    pointEstimate: 0,
    midpointEstimate: 0,
    highEstimate: 0,
    confidenceScore: 0,
    confidenceLevel: "Review Required",
    confidenceRationale: "Awaiting intake and initial scan.",
    valueDispersion: 0,
    valueSpreadPercent: 0,
    rangeWidth: 0,
    posteriorMean: 0,
    posteriorVariance: 0,
    posteriorStd: 0,
    weightedAdjustedMean: 0,
    weightedP20: 0,
    weightedP80: 0,
    residualBuffer: 0,
    effectiveSampleSize: 0,
    evidenceEntropy: 0,
    averageComparableProbability: 0,
    averageSourceReliability: 0,
    averageRecency: 0,
    normalizedRiskSeverity: 0,
    averageSimilarity: 0,
    riskFlags: [],
    includedCompCount: 0,
    adjustedComparables: [],
    subModels: [],
    modelFusion: {
      finalEstimate: 0,
      finalVariance: 0,
      modelWeights: []
    },
    analysisStatus: "idle",
    isZeroState: true
  };
}

export function estimateValuationRange(subject: SubjectProperty, selectedComparables: ScoredComparable[]): ValuationRange {
  const adjustedWithoutWeights = selectedComparables.map((comp) => adjustComparableValue(subject, comp));
  if (!adjustedWithoutWeights.length) return createZeroValuationRange();

  const values = adjustedWithoutWeights.map((comp) => comp.adjustedValue);
  const weights = adjustedWithoutWeights.map(evidenceWeight);
  const adjustedComparables = withNormalizedWeights(adjustedWithoutWeights, weights);
  const weightedAdjustedMean = weightedMean(values, weights);
  const weightedP20 = weightedPercentile(values, weights, 0.2);
  const weightedP80 = weightedPercentile(values, weights, 0.8);
  const looResiduals = leaveOneOutResiduals(values, weights);
  const q_alpha = weightedPercentile(looResiduals, weights, 0.90);

  const prior = priorMean(subject, selectedComparables) || weightedAdjustedMean;
  const priorStd = 65000;
  const priorPrecision = 1 / Math.pow(priorStd, 2);
  const evidencePrecision = adjustedComparables.reduce((sum, comp) => sum + comp.comparableProbability * comp.precision, 0);
  const posteriorPrecision = priorPrecision + evidencePrecision;
  
  const posteriorMean = posteriorPrecision > 0
    ? (priorPrecision * prior + adjustedComparables.reduce((sum, comp) => sum + (comp.comparableProbability * comp.precision) * comp.adjustedValue, 0)) / posteriorPrecision
    : weightedAdjustedMean;
    
  const posteriorVariance = posteriorPrecision > 0 ? 1 / posteriorPrecision : weightedVariance(values, weights);
  const posteriorStd = Math.sqrt(Math.max(0, posteriorVariance));

  const baseLow = posteriorMean - 1.645 * posteriorStd;
  const baseHigh = posteriorMean + 1.645 * posteriorStd;
  const lowEstimate = roundToThousand(baseLow - q_alpha);
  const highEstimate = roundToThousand(baseHigh + q_alpha);
  const midpointEstimate = roundToThousand(posteriorMean);
  const rangeWidth = highEstimate - lowEstimate;
  const valueSpreadPercent = midpointEstimate > 0 ? Math.round((rangeWidth / midpointEstimate) * 1000) / 10 : 0;
  const averageSimilarity = adjustedComparables.reduce((sum, comp) => sum + comp.totalScore, 0) / adjustedComparables.length;
  const normalizedRiskSeverity = adjustedComparables.reduce((sum, comp) => sum + comp.riskSeverity, 0) / adjustedComparables.length;
  const staleSales = adjustedComparables.filter((comp) => comp.daysSinceSale > 180).length;
  const confidence = calculateConfidence({ adjustedComparables, valueSpreadPercent, evidenceWeights: weights });
  const subModels = createValuationSubModels(subject, adjustedComparables, posteriorMean, posteriorVariance, weightedAdjustedMean);
  const fusion = fuseValuationSubModels(subModels);

  const riskFlags = Array.from(new Set([
    ...adjustedComparables.flatMap((comp) => comp.riskFlags),
    adjustedComparables.length < 3 ? "Not enough comparables selected." : "",
    valueSpreadPercent > 18 ? "Wide adjusted-value spread" : "",
    staleSales > 0 ? "Stale sale dates in selected comparables." : ""
  ].filter(Boolean)));

  return {
    lowEstimate,
    pointEstimate: midpointEstimate,
    midpointEstimate,
    highEstimate,
    confidenceScore: confidence.score,
    confidenceLevel: confidence.level,
    confidenceRationale: confidence.rationale,
    valueDispersion: valueSpreadPercent,
    valueSpreadPercent,
    rangeWidth,
    posteriorMean: roundToThousand(posteriorMean),
    posteriorVariance,
    posteriorStd: Math.round(posteriorStd),
    weightedAdjustedMean: roundToThousand(weightedAdjustedMean),
    weightedP20: roundToThousand(weightedP20),
    weightedP80: roundToThousand(weightedP80),
    residualBuffer: roundToThousand(q_alpha),
    effectiveSampleSize: Math.round(confidence.effectiveSampleSize * 10) / 10 || Math.round(effectiveSampleSize(weights) * 10) / 10,
    evidenceEntropy: confidence.evidenceEntropy || Math.round(entropy(weights) * 100) / 100,
    averageComparableProbability: confidence.averageComparableProbability,
    averageSourceReliability: confidence.averageSourceReliability,
    averageRecency: confidence.averageRecencyScore,
    normalizedRiskSeverity: Math.round(normalizedRiskSeverity * 100) / 100,
    averageSimilarity: Math.round(averageSimilarity * 10) / 10,
    riskFlags,
    includedCompCount: adjustedComparables.length,
    adjustedComparables,
    subModels,
    modelFusion: {
      finalEstimate: fusion.finalEstimate,
      finalVariance: fusion.finalVariance,
      modelWeights: fusion.modelWeights
    },
    analysisStatus: "complete",
    isZeroState: false
  };
}

export function compareValuationBeforeAfter(before: ValuationRange, after: ValuationRange): ValuationDelta {
  const beforeWidth = before.highEstimate - before.lowEstimate;
  const afterWidth = after.highEstimate - after.lowEstimate;
  const varianceGain = before.posteriorVariance > 0 && after.posteriorVariance > 0
    ? Math.max(0, 0.5 * Math.log(before.posteriorVariance / after.posteriorVariance))
    : 0;
  
  const lambdaN = 5.0;
  const lambdaR = 15.0;
  const lambdaV = 100.0;
  
  const nEffGain = after.effectiveSampleSize - before.effectiveSampleSize;
  const riskGain = after.normalizedRiskSeverity - before.normalizedRiskSeverity;
  const valueShift = before.pointEstimate > 0 
    ? Math.abs(after.pointEstimate - before.pointEstimate) / before.pointEstimate 
    : 0;

  const marginalInformationGain = varianceGain + (lambdaN * nEffGain) - (lambdaR * riskGain) - (lambdaV * valueShift);
  return {
    lowDelta: after.lowEstimate - before.lowEstimate,
    pointDelta: after.pointEstimate - before.pointEstimate,
    highDelta: after.highEstimate - before.highEstimate,
    confidenceDelta: after.confidenceScore - before.confidenceScore,
    compCountDelta: after.includedCompCount - before.includedCompCount,
    rangeWidthDelta: afterWidth - beforeWidth,
    rangeNarrowed: afterWidth < beforeWidth,
    effectiveSampleSizeDelta: Math.round((after.effectiveSampleSize - before.effectiveSampleSize) * 10) / 10,
    entropyDelta: Math.round((after.evidenceEntropy - before.evidenceEntropy) * 100) / 100,
    riskSeverityDelta: Math.round((after.normalizedRiskSeverity - before.normalizedRiskSeverity) * 100) / 100,
    marginalInformationGain: Math.round(marginalInformationGain * 1000) / 1000
  };
}
