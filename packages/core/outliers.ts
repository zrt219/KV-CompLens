import type { ComparableProperty } from "./types";
import { gaussianKernel } from "./probability";

export function median(values: number[]) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function medianAbsoluteDeviation(values: number[]) {
  const med = median(values);
  return median(values.map((value) => Math.abs(value - med)));
}

export function robustZScore(value: number, sample: number[]) {
  const mad = medianAbsoluteDeviation(sample);
  if (mad === 0) return 0;
  return 0.6745 * (value - median(sample)) / mad;
}

export function ppsfOutlierProbability(compOrPpsf: ComparableProperty | number, candidatePool: ComparableProperty[] | number[]) {
  const ppsf = typeof compOrPpsf === "number" ? compOrPpsf : compOrPpsf.salePrice / compOrPpsf.livingAreaSqft;
  const candidatePoolPpsf = candidatePool.map((candidate) => typeof candidate === "number" ? candidate : candidate.salePrice / candidate.livingAreaSqft);
  const z = Math.abs(robustZScore(ppsf, candidatePoolPpsf));
  return 1 - gaussianKernel(z, 3);
}

export function detectPpsfOutlier(comp: ComparableProperty, candidatePool: ComparableProperty[]) {
  const ppsf = comp.salePrice / comp.livingAreaSqft;
  const sample = candidatePool.map((candidate) => candidate.salePrice / candidate.livingAreaSqft);
  const z = robustZScore(ppsf, sample);
  const absZ = Math.abs(z);
  const outlierProbability = ppsfOutlierProbability(ppsf, sample);

  if (absZ > 3.5) {
    return {
      robustZScore: z,
      outlierProbability,
      riskFlag: "PPSF_OUTLIER_HIGH",
      scorePenalty: 15,
      riskPenalty: 0.18
    };
  }

  if (absZ > 2.5) {
    return {
      robustZScore: z,
      outlierProbability,
      riskFlag: "PPSF_OUTLIER_MODERATE",
      scorePenalty: 7,
      riskPenalty: 0.09
    };
  }

  return {
    robustZScore: z,
    outlierProbability,
    riskFlag: "",
    scorePenalty: 0,
    riskPenalty: 0
  };
}
