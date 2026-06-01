import { describe, expect, it } from "vitest";
import { previewCandidateImpact } from "./marginalImpact";
import { scoreComparableProperties } from "./scoring";
import type { ComparableProperty, SubjectProperty } from "./types";

const subject: SubjectProperty = {
  address: "100 Impact Drive",
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
  condition: "Good",
  targetPriceHint: 700000
};

const comps: ComparableProperty[] = Array.from({ length: 6 }, (_, index) => ({
  id: `M-${index}`,
  address: `${index} Impact Drive`,
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
  latitude: 53.45 + index * 0.001,
  longitude: -113.57 - index * 0.001,
  condition: "Good"
}));

describe("marginal candidate impact", () => {
  it("returns deterministic before/after deltas and information gain", () => {
    const ranked = scoreComparableProperties(subject, comps);
    const impact = previewCandidateImpact(subject, ranked.slice(0, 3), ranked[3]);

    expect(impact.afterValuation.includedCompCount).toBe(4);
    expect(impact.delta.compCountDelta).toBe(1);
    expect(impact.deltaEffectiveSampleSize).toBeGreaterThan(0);
    expect(impact.marginalInformationGain).toBeGreaterThanOrEqual(0);
    expect(impact.afterValuation.confidenceScore).toBeGreaterThanOrEqual(impact.beforeValuation.confidenceScore);
  });

  it("scores risky candidates below useful candidates", () => {
    const ranked = scoreComparableProperties(subject, comps);
    const useful = previewCandidateImpact(subject, ranked.slice(0, 3), ranked[3]);
    const riskyCandidate = scoreComparableProperties(subject, [{
      ...comps[5],
      id: "risky",
      propertyType: "Condo",
      city: "Calgary",
      neighbourhood: "Mahogany",
      saleDate: "2024-01-01",
      salePrice: 1200000,
      latitude: 51.0447,
      longitude: -114.0719
    }])[0];
    const risky = previewCandidateImpact(subject, ranked.slice(0, 3), riskyCandidate);

    expect(useful.marginalInformationGain).toBeGreaterThan(risky.marginalInformationGain);
    expect(useful.deltaEffectiveSampleSize).toBeGreaterThan(0);
  });
});
