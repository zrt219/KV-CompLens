import { describe, expect, it } from "vitest";
import { rankComparables, scoreComparableProperty } from "./scoring";
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
  condition: "Good",
  targetPriceHint: 700000
};

const baseComp: ComparableProperty = {
  id: "T-001",
  address: "101 Test Drive",
  city: "Edmonton",
  neighbourhood: "Windermere",
  propertyType: "Detached",
  yearBuilt: 2014,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2180,
  lotSizeSqft: 5500,
  parking: 2,
  saleDate: "2026-04-01",
  salePrice: 690000,
  latitude: 53.451,
  longitude: -113.571,
  condition: "Good"
};

describe("scoring", () => {
  it("scores same property type higher than different type", () => {
    const same = scoreComparableProperty(subject, baseComp);
    const different = scoreComparableProperty(subject, { ...baseComp, propertyType: "Condo" });
    expect(same.breakdown.propertyTypeScore).toBeGreaterThan(different.breakdown.propertyTypeScore);
    expect(same.totalScore).toBeGreaterThan(different.totalScore);
  });

  it("scores closer distance higher than farther distance", () => {
    const close = scoreComparableProperty(subject, baseComp);
    const far = scoreComparableProperty(subject, { ...baseComp, latitude: 51.0447, longitude: -114.0719, city: "Calgary", neighbourhood: "Altadore" });
    expect(close.breakdown.locationScore).toBeGreaterThan(far.breakdown.locationScore);
    expect(close.totalScore).toBeGreaterThan(far.totalScore);
  });

  it("scores recent sale higher than old sale", () => {
    const recent = scoreComparableProperty(subject, baseComp);
    const old = scoreComparableProperty(subject, { ...baseComp, saleDate: "2024-03-01" });
    expect(recent.breakdown.saleRecencyScore).toBeGreaterThan(old.breakdown.saleRecencyScore);
    expect(recent.totalScore).toBeGreaterThan(old.totalScore);
  });

  it("increases comparable probability and energy quality for stronger factors", () => {
    const strong = scoreComparableProperty(subject, baseComp);
    const weak = scoreComparableProperty(subject, {
      ...baseComp,
      propertyType: "Condo",
      livingAreaSqft: 1500,
      saleDate: "2024-01-01",
      latitude: 51.0447,
      longitude: -114.0719,
      city: "Calgary",
      neighbourhood: "Mahogany"
    });

    expect(strong.comparableProbability).toBeGreaterThan(weak.comparableProbability);
    expect(strong.energyQuality).toBeGreaterThan(weak.energyQuality);
    expect(strong.evidenceEnergy).toBeLessThan(weak.evidenceEnergy);
    expect(strong.energyReasons.length).toBeGreaterThan(0);
  });

  it("ranks comparables by total score descending with reasons and penalties", () => {
    const ranked = rankComparables(subject, [
      { ...baseComp, id: "close" },
      { ...baseComp, id: "far", latitude: 51.0447, longitude: -114.0719, city: "Calgary", neighbourhood: "Altadore", saleDate: "2024-03-01" }
    ]);

    expect(ranked[0].totalScore).toBeGreaterThanOrEqual(ranked[1].totalScore);
    expect(ranked[0].reasons?.length).toBeGreaterThan(0);
    expect(ranked[1].penalties.length).toBeGreaterThan(0);
    expect(ranked[0].daysSinceSale).toEqual(expect.any(Number));
    expect(ranked[0].comparableProbability).toBeGreaterThan(ranked[1].comparableProbability);
    expect(ranked[0].eligibility.passed).toBe(true);
    expect(ranked[0].precision).toBeGreaterThan(0);
  });
});
