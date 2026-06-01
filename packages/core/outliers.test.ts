import { describe, expect, it } from "vitest";
import { detectPpsfOutlier, medianAbsoluteDeviation, robustZScore } from "./outliers";
import type { ComparableProperty } from "./types";

const base: ComparableProperty = {
  id: "O-1",
  address: "100 Outlier Way",
  city: "Edmonton",
  neighbourhood: "Windermere",
  propertyType: "Detached",
  yearBuilt: 2014,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2000,
  lotSizeSqft: 5200,
  parking: 2,
  saleDate: "2026-04-01",
  salePrice: 700000,
  latitude: 53.45,
  longitude: -113.57,
  condition: "Good"
};

describe("robust outlier detection", () => {
  it("uses median absolute deviation for robust spread", () => {
    expect(medianAbsoluteDeviation([10, 11, 12, 13, 300])).toBe(1);
    expect(Math.abs(robustZScore(300, [10, 11, 12, 13, 300]))).toBeGreaterThan(100);
  });

  it("flags unusual price-per-square-foot evidence", () => {
    const pool = [
      { ...base, id: "A", salePrice: 680000 },
      { ...base, id: "B", salePrice: 690000 },
      { ...base, id: "C", salePrice: 700000 },
      { ...base, id: "D", salePrice: 710000 },
      { ...base, id: "E", salePrice: 720000 },
      { ...base, id: "X", salePrice: 1600000 }
    ];
    const outlier = detectPpsfOutlier(pool[5], pool);

    expect(outlier.outlierProbability).toBeGreaterThan(0.5);
    expect(outlier.riskFlag).toContain("PPSF_OUTLIER");
    expect(outlier.scorePenalty).toBeGreaterThan(0);
  });
});
