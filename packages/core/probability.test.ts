import { describe, expect, it } from "vitest";
import { effectiveSampleSize, entropy, gaussianKernel, logit, sigmoid, weightedMean, weightedPercentile } from "./probability";

describe("probability utilities", () => {
  it("keeps deterministic probability kernels bounded and monotonic", () => {
    expect(sigmoid(2)).toBeGreaterThan(sigmoid(-2));
    expect(sigmoid(logit(0.73))).toBeCloseTo(0.73, 5);
    expect(gaussianKernel(0, 1)).toBe(1);
    expect(gaussianKernel(2, 1)).toBeLessThan(gaussianKernel(1, 1));
  });

  it("calculates weighted evidence summaries", () => {
    const values = [100, 200, 300];
    const weights = [1, 2, 7];

    expect(weightedMean(values, weights)).toBe(260);
    expect(weightedPercentile(values, weights, 0.8)).toBe(300);
    expect(effectiveSampleSize(weights)).toBeLessThan(3);
    expect(effectiveSampleSize([1, 1, 1])).toBe(3);
    expect(entropy([1, 1, 1])).toBeCloseTo(1, 5);
    expect(entropy([10, 0, 0])).toBe(0);
  });
});
