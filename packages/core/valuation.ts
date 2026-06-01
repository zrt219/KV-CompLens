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

function emptyRange(subject: SubjectProperty, selectedComparables: ScoredComparable[]): ValuationRange {
  const fallback = roundToThousand(priorMean(subject, selectedComparables));
  const buffer = roundToThousand(Math.max(50000, fallback * 0.12));
  const subModels = createValuationSubModels(subject, [], fallback, Math.pow(buffer, 2), fallback);
  const fusion = fuseValuationSubModels(subModels);
  return {
    lowEstimate: Math.max(0, fallback - buffer),
    pointEstimate: fallback,
    midpointEstimate: fallback,
    highEstimate: fallback + buffer,
    confidenceScore: 20,
    confidenceLevel: "Review Required",
    confidenceRationale: "No usable selected comparable evidence was available.",
    valueDispersion: 0,
    valueSpreadPercent: 0,
    rangeWidth: buffer * 2,
    posteriorMean: fallback,
    posteriorVariance: Math.pow(buffer, 2),
    posteriorStd: buffer,
    weightedAdjustedMean: fallback,
    weightedP20: fallback,
    weightedP80: fallback,
    residualBuffer: buffer,
    effectiveSampleSize: 0,
    evidenceEntropy: 0,
    averageComparableProbability: 0,
    averageSourceReliability: 0,
    averageRecency: 0,
    normalizedRiskSeverity: 1,
    averageSimilarity: 0,
    riskFlags: ["Insufficient selected comps"],
    includedCompCount: 0,
    adjustedComparables: [],
    subModels,
    modelFusion: {
      finalEstimate: fusion.finalEstimate,
      finalVariance: fusion.finalVariance,
      modelWeights: fusion.modelWeights
    }
  };
}

export function estimateValuationRange(subject: SubjectProperty, selectedComparables: ScoredComparable[]): ValuationRange {
  const adjustedWithoutWeights = selectedComparables.map((comp) => adjustComparableValue(subject, comp));
  if (!adjustedWithoutWeights.length) return emptyRange(subject, selectedComparables);

  const values = adjustedWithoutWeights.map((comp) => comp.adjustedValue);
  const weights = adjustedWithoutWeights.map(evidenceWeight);
  const adjustedComparables = withNormalizedWeights(adjustedWithoutWeights, weights);
  const weightedAdjustedMean = weightedMean(values, weights);
  const weightedP20 = weightedPercentile(values, weights, 0.2);
  const weightedP80 = weightedPercentile(values, weights, 0.8);
  const looResiduals = leaveOneOutResiduals(values, weights);
  const q80Residual = weightedPercentile(looResiduals, weights, 0.8);

  const prior = priorMean(subject, selectedComparables) || weightedAdjustedMean;
  const priorStd = 65000;
  const priorPrecision = 1 / Math.pow(priorStd, 2);
  const evidencePrecision = weights.reduce((sum, weight) => sum + weight, 0);
  const posteriorPrecision = priorPrecision + evidencePrecision;
  const posteriorMean = posteriorPrecision > 0
    ? (priorPrecision * prior + adjustedComparables.reduce((sum, comp, index) => sum + (weights[index] ?? 0) * comp.adjustedValue, 0)) / posteriorPrecision
    : weightedAdjustedMean;
  const posteriorVariance = posteriorPrecision > 0 ? 1 / posteriorPrecision : weightedVariance(values, weights);
  const posteriorStd = Math.sqrt(Math.max(0, posteriorVariance));

  const baseLow = posteriorMean - 1.28 * posteriorStd;
  const baseHigh = posteriorMean + 1.28 * posteriorStd;
  const lowEstimate = roundToThousand(Math.min(baseLow, weightedP20) - 0.35 * q80Residual);
  const highEstimate = roundToThousand(Math.max(baseHigh, weightedP80) + 0.35 * q80Residual);
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
    adjustedComparables.length < 3 ? "Insufficient selected comps" : "",
    valueSpreadPercent > 18 ? "Wide adjusted-value spread" : "",
    staleSales > 0 ? "Stale sale dates in selected set" : ""
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
    residualBuffer: roundToThousand(0.35 * q80Residual),
    effectiveSampleSize: confidence.effectiveSampleSize || Math.round(effectiveSampleSize(weights) * 10) / 10,
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
    }
  };
}

export function compareValuationBeforeAfter(before: ValuationRange, after: ValuationRange): ValuationDelta {
  const beforeWidth = before.highEstimate - before.lowEstimate;
  const afterWidth = after.highEstimate - after.lowEstimate;
  const marginalInformationGain = before.posteriorVariance > 0 && after.posteriorVariance > 0
    ? Math.max(0, 0.5 * Math.log(before.posteriorVariance / after.posteriorVariance))
    : 0;
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
