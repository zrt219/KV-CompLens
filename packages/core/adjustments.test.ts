import { describe, expect, it } from "vitest";
import { adjustComparableValue } from "./adjustments";
import { scoreComparableProperty } from "./scoring";
import type { ComparableProperty, SubjectProperty } from "./types";

const subject: SubjectProperty = {
  address: "100 Adjustment Drive",
  city: "Edmonton",
  neighbourhood: "Windermere",
  propertyType: "Detached",
  yearBuilt: 2015,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2200,
  lotSizeSqft: 6200,
  parking: 2,
  latitude: 53.45,
  longitude: -113.57,
  condition: "Good"
};

const comp: ComparableProperty = {
  id: "A-1",
  address: "101 Adjustment Drive",
  city: "Edmonton",
  neighbourhood: "Windermere",
  propertyType: "Detached",
  yearBuilt: 2012,
  bedrooms: 3,
  bathrooms: 2,
  livingAreaSqft: 2050,
  lotSizeSqft: 5400,
  parking: 1,
  saleDate: "2026-04-01",
  salePrice: 640000,
  latitude: 53.451,
  longitude: -113.571,
  condition: "Average"
};

describe("adjustments", () => {
  it("returns deterministic adjustment breakdown and adjusted value", () => {
    const adjusted = adjustComparableValue(subject, scoreComparableProperty(subject, comp));

    expect(Object.values(adjusted.adjustments).every(Number.isFinite)).toBe(true);
    expect(adjusted.adjustments.lotSize).toBeGreaterThan(0);
    expect(adjusted.adjustedValue).toBe(comp.salePrice + adjusted.adjustments.total);
    expect(adjusted.adjustmentLines.map((line) => line.key)).toContain("time");
    expect(adjusted.adjustmentLines.every((line) => line.rationale.length > 0)).toBe(true);
  });
});
