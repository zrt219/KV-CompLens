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
  const scores = adjustedComparables.map(c => Math.max(0.01, c.totalScore));
  const sumScores = scores.reduce((sum, s) => sum + s, 0);
  const weights = sumScores > 0 ? scores.map(s => s / sumScores) : scores.map(() => 1 / count);
  const nEff = sumScores > 0 ? 1 / weights.reduce((sum, w) => sum + w * w, 0) : 0;
  
  const evidenceEntropy = entropy(weights);
  const averageComparableProbability = adjustedComparables.reduce((sum, comp) => sum + comp.comparableProbability, 0) / count;
  const averageSourceReliability = adjustedComparables.reduce((sum, comp) => sum + comp.sourceReliability, 0) / count;
  const averageRecencyScore = adjustedComparables.reduce((sum, comp) => sum + comp.breakdown.saleRecencyScore / 100, 0) / count;
  const normalizedRiskSeverity = clamp01(adjustedComparables.reduce((sum, comp) => sum + comp.riskSeverity, 0) / count);
  
  const averageScore = adjustedComparables.reduce((sum, comp) => sum + comp.totalScore, 0) / count;
  const valueSpreadPenalty = Math.min(1, Math.max(0, valueSpreadPercent / 100));
  const riskPenalty = normalizedRiskSeverity * 15;

  const rawConfidence = 
    35 * Math.min(nEff / 5, 1) + 
    25 * (averageScore / 100) + 
    20 * averageRecencyScore + 
    20 * (1 - valueSpreadPenalty) - 
    riskPenalty;

  const score = clamp01(rawConfidence / 100) * 100;
  const level = confidenceLevel(score);
  const riskFlags = adjustedComparables.flatMap((comp) => comp.riskFlags).length;

  return {
    score,
    level,
    rationale: `${adjustedComparables.length} homes used; effective sample size ${nEff.toFixed(1)}; average match ${Math.round(averageComparableProbability * 100)}%; value spread ${valueSpreadPercent}%; ${riskFlags} review flags across the selected homes.`,
    effectiveSampleSize: Math.round(nEff * 10) / 10,
    evidenceEntropy: Math.round(evidenceEntropy * 100) / 100,
    averageComparableProbability: Math.round(averageComparableProbability * 100) / 100,
    averageSourceReliability: Math.round(averageSourceReliability * 100) / 100,
    averageRecencyScore: Math.round(averageRecencyScore * 100) / 100,
    normalizedRiskSeverity: Math.round(normalizedRiskSeverity * 100) / 100
  };
}
