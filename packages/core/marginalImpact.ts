import { estimateValuationRange } from "./valuation";
import type { CandidateImpact, ScoredComparable, SubjectProperty } from "./types";

export function previewCandidateImpact(subject: SubjectProperty, selected: ScoredComparable[], candidate: ScoredComparable): CandidateImpact {
  const beforeValuation = estimateValuationRange(subject, selected);
  const afterSelection = [...selected, { ...candidate, status: "new" as const }];
  const afterValuation = estimateValuationRange(subject, afterSelection);
  const beforeWidth = beforeValuation.highEstimate - beforeValuation.lowEstimate;
  const afterWidth = afterValuation.highEstimate - afterValuation.lowEstimate;
  const varianceGain = beforeValuation.posteriorVariance > 0 && afterValuation.posteriorVariance > 0
    ? 0.5 * Math.log(beforeValuation.posteriorVariance / afterValuation.posteriorVariance)
    : 0;
  const deltaEffectiveSampleSize = afterValuation.effectiveSampleSize - beforeValuation.effectiveSampleSize;
  const deltaEntropy = afterValuation.evidenceEntropy - beforeValuation.evidenceEntropy;
  const riskChange = afterValuation.normalizedRiskSeverity - beforeValuation.normalizedRiskSeverity;
  const normalizedMeanShift = beforeValuation.posteriorMean > 0
    ? Math.abs(afterValuation.posteriorMean - beforeValuation.posteriorMean) / beforeValuation.posteriorMean
    : 0;
  const marginalInformationGain =
    varianceGain +
    0.12 * deltaEffectiveSampleSize +
    0.1 * deltaEntropy -
    0.15 * Math.max(0, riskChange) -
    0.35 * normalizedMeanShift;
  const roundedMig = Math.round(marginalInformationGain * 1000) / 1000;
  const delta = {
    lowDelta: afterValuation.lowEstimate - beforeValuation.lowEstimate,
    pointDelta: afterValuation.pointEstimate - beforeValuation.pointEstimate,
    highDelta: afterValuation.highEstimate - beforeValuation.highEstimate,
    confidenceDelta: afterValuation.confidenceScore - beforeValuation.confidenceScore,
    compCountDelta: afterValuation.includedCompCount - beforeValuation.includedCompCount,
    rangeWidthDelta: afterWidth - beforeWidth,
    rangeNarrowed: afterWidth < beforeWidth,
    effectiveSampleSizeDelta: Math.round(deltaEffectiveSampleSize * 10) / 10,
    entropyDelta: Math.round(deltaEntropy * 100) / 100,
    riskSeverityDelta: Math.round(riskChange * 100) / 100,
    marginalInformationGain: roundedMig
  };
  const improvementReasons = [
    delta.confidenceDelta > 0 ? `Confidence changes by ${delta.confidenceDelta} pts.` : "",
    delta.effectiveSampleSizeDelta > 0 ? `Effective sample size improves by ${delta.effectiveSampleSizeDelta.toFixed(1)}.` : "",
    delta.entropyDelta > 0 ? `Evidence balance improves by ${delta.entropyDelta.toFixed(2)}.` : "",
    delta.rangeNarrowed ? "Residual-buffered posterior range narrows after adding this evidence." : "",
    candidate.comparableProbability >= 0.7 ? `Comparable probability is ${candidate.comparableProbabilityPercent}%.` : "",
    candidate.energyQuality >= 0.55 ? `Evidence energy quality is ${Math.round(candidate.energyQuality * 100)}%.` : "",
    roundedMig > 0 ? `Marginal information gain is ${roundedMig.toFixed(3)}.` : ""
  ].filter(Boolean);

  return {
    valuation: afterValuation,
    delta,
    beforeValuation,
    afterValuation,
    deltaConfidence: delta.confidenceDelta,
    deltaMidpoint: delta.pointDelta,
    deltaRangeWidth: delta.rangeWidthDelta,
    deltaEffectiveSampleSize: delta.effectiveSampleSizeDelta,
    deltaEntropy: delta.entropyDelta,
    riskChange: delta.riskSeverityDelta,
    marginalInformationGain: roundedMig,
    improvementReasons: improvementReasons.length ? improvementReasons : ["Candidate provides additional deterministic comparable evidence for analyst review."],
    addedRisks: candidate.riskFlags
  };
}
