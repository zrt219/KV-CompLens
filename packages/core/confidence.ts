import type { AdjustedComparable } from "./types";
import { clamp01, effectiveSampleSize, entropy, sigmoid } from "./probability";

export type ConfidenceInputs = {
  adjustedComparables: AdjustedComparable[];
  valueSpreadPercent: number;
  evidenceWeights: number[];
};

export type ConfidenceResult = {
  score: number;
  level: "Review Required" | "Low" | "Medium" | "High";
  rationale: string;
  effectiveSampleSize: number;
  evidenceEntropy: number;
  averageComparableProbability: number;
  averageSourceReliability: number;
  averageRecencyScore: number;
  normalizedRiskSeverity: number;
};

function confidenceLevel(score: number): ConfidenceResult["level"] {
  if (score >= 85) return "High";
  if (score >= 70) return "Medium";
  if (score >= 55) return "Low";
  return "Review Required";
}

export function calculateConfidence({ adjustedComparables, valueSpreadPercent, evidenceWeights }: ConfidenceInputs): ConfidenceResult {
  const count = adjustedComparables.length || 1;
  const weights = evidenceWeights.length ? evidenceWeights : adjustedComparables.map((comp) => Math.max(0.001, comp.evidenceWeight || comp.totalScore / 100));
  const nEff = effectiveSampleSize(weights);
  const evidenceEntropy = entropy(weights);
  const averageComparableProbability = adjustedComparables.reduce((sum, comp) => sum + comp.comparableProbability, 0) / count;
  const averageSourceReliability = adjustedComparables.reduce((sum, comp) => sum + comp.sourceReliability, 0) / count;
  const averageRecencyScore = adjustedComparables.reduce((sum, comp) => sum + comp.breakdown.saleRecencyScore / 100, 0) / count;
  const normalizedRiskSeverity = clamp01(adjustedComparables.reduce((sum, comp) => sum + comp.riskSeverity, 0) / count);
  const spreadRatio = Math.max(0, valueSpreadPercent / 100);

  const logit =
    -1.2 +
    0.55 * Math.log(1 + nEff) +
    1.15 * averageComparableProbability +
    0.75 * averageSourceReliability +
    0.6 * averageRecencyScore +
    0.45 * evidenceEntropy -
    1.8 * spreadRatio -
    0.95 * normalizedRiskSeverity;

  const score = Math.round(sigmoid(logit) * 100);
  const level = confidenceLevel(score);
  const riskFlags = adjustedComparables.flatMap((comp) => comp.riskFlags).length;

  return {
    score,
    level,
    rationale: `${adjustedComparables.length} comps used; effective sample size ${nEff.toFixed(1)}; average comparable probability ${Math.round(averageComparableProbability * 100)}%; adjusted value spread ${valueSpreadPercent}%; ${riskFlags} risk flags across selected comps.`,
    effectiveSampleSize: Math.round(nEff * 10) / 10,
    evidenceEntropy: Math.round(evidenceEntropy * 100) / 100,
    averageComparableProbability: Math.round(averageComparableProbability * 100) / 100,
    averageSourceReliability: Math.round(averageSourceReliability * 100) / 100,
    averageRecencyScore: Math.round(averageRecencyScore * 100) / 100,
    normalizedRiskSeverity: Math.round(normalizedRiskSeverity * 100) / 100
  };
}
