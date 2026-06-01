import { describe, expect, it } from "vitest";
import { estimateValuationRange } from "./valuation";
import { scoreComparableProperties } from "./scoring";
import type { ComparableProperty, SubjectProperty } from "./types";

const subject: SubjectProperty = {
  address: "100 Test Drive",
  city: "Edmonton",
  neighbourhood: "Windermere",
  propertyType: "Detached",
  yearBuilt: 2015,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2200,
  lotSizeSqft: 5600,
  parking: 2,
  latitude: 53.45,
  longitude: -113.57,
  condition: "Good"
};

const comps: ComparableProperty[] = Array.from({ length: 5 }, (_, index) => ({
  id: `T-${index}`,
  address: `${index} Test Drive`,
  city: "Edmonton",
  neighbourhood: "Windermere",
  propertyType: "Detached",
  yearBuilt: 2012 + index,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2140 + index * 20,
  lotSizeSqft: 5500,
  parking: 2,
  saleDate: "2026-04-01",
  salePrice: 675000 + index * 9000,
  latitude: 53.45 + index * 0.002,
  longitude: -113.57 - index * 0.002,
  condition: "Good"
}));

describe("valuation", () => {
  it("returns low <= point <= high", () => {
    const range = estimateValuationRange(subject, scoreComparableProperties(subject, comps));
    expect(range.lowEstimate).toBeLessThanOrEqual(range.pointEstimate);
    expect(range.pointEstimate).toBeLessThanOrEqual(range.highEstimate);
    expect(range.posteriorVariance).toBeGreaterThan(0);
    expect(range.effectiveSampleSize).toBeGreaterThan(0);
    expect(range.subModels.map((model) => model.label)).toContain("ComparableEvidenceModel");
    expect(range.modelFusion.finalEstimate).toBeGreaterThan(0);
    expect(range.adjustedComparables.every((comp) => typeof comp.normalizedEvidenceWeight === "number")).toBe(true);
  });

  it("reduces posterior variance when high-quality evidence is added", () => {
    const ranked = scoreComparableProperties(subject, comps);
    const sparse = estimateValuationRange(subject, ranked.slice(0, 2));
    const fuller = estimateValuationRange(subject, ranked.slice(0, 5));

    expect(fuller.posteriorVariance).toBeLessThan(sparse.posteriorVariance);
    expect(fuller.effectiveSampleSize).toBeGreaterThan(sparse.effectiveSampleSize);
  });

  it("widens residual-buffered range when residuals are high", () => {
    const stable = estimateValuationRange(subject, scoreComparableProperties(subject, comps));
    const noisy = estimateValuationRange(subject, scoreComparableProperties(subject, [
      ...comps.slice(0, 4),
      { ...comps[4], id: "wide", salePrice: 980000 }
    ]));

    expect(noisy.rangeWidth).toBeGreaterThan(stable.rangeWidth);
    expect(noisy.residualBuffer).toBeGreaterThanOrEqual(stable.residualBuffer);
  });

  it("creates lower confidence for missing or weak comp data", () => {
    const weakComps = comps.slice(0, 2).map((comp) => ({
      ...comp,
      city: "Calgary",
      neighbourhood: "Mahogany",
      propertyType: "Condo" as const,
      saleDate: "2024-01-01",
      latitude: 51.0447,
      longitude: -114.0719
    }));
    const range = estimateValuationRange(subject, scoreComparableProperties(subject, weakComps));
    const strongRange = estimateValuationRange(subject, scoreComparableProperties(subject, comps));
    expect(range.confidenceScore).toBeLessThan(strongRange.confidenceScore);
    expect(["Low", "Review Required"]).toContain(range.confidenceLevel);
  });
});
