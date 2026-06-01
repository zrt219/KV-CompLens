import { describe, expect, it } from "vitest";
import { calculateConfidence } from "./confidence";
import { adjustComparableValue } from "./adjustments";
import { scoreComparableProperties } from "./scoring";
import type { ComparableProperty, SubjectProperty } from "./types";

const subject: SubjectProperty = {
  address: "100 Confidence Drive",
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

const strongComps: ComparableProperty[] = Array.from({ length: 5 }, (_, index) => ({
  id: `C-${index}`,
  address: `${index} Confidence Drive`,
  city: "Edmonton",
  neighbourhood: "Windermere",
  propertyType: "Detached",
  yearBuilt: 2013 + index,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2160 + index * 15,
  lotSizeSqft: 5500,
  parking: 2,
  saleDate: "2026-04-01",
  salePrice: 680000 + index * 8000,
  latitude: 53.45 + index * 0.001,
  longitude: -113.57 - index * 0.001,
  condition: "Good"
}));

describe("confidence model", () => {
  it("scores stronger evidence above weaker sparse evidence", () => {
    const strong = scoreComparableProperties(subject, strongComps).map((comp) => adjustComparableValue(subject, comp));
    const weak = scoreComparableProperties(subject, strongComps.slice(0, 2).map((comp) => ({
      ...comp,
      city: "Calgary",
      neighbourhood: "Mahogany",
      propertyType: "Condo" as const,
      saleDate: "2024-01-01",
      latitude: 51.0447,
      longitude: -114.0719,
      sourceConfidence: 0.58
    }))).map((comp) => adjustComparableValue(subject, comp));

    const strongConfidence = calculateConfidence({ adjustedComparables: strong, valueSpreadPercent: 8, evidenceWeights: strong.map((comp) => comp.evidenceWeight) });
    const weakConfidence = calculateConfidence({ adjustedComparables: weak, valueSpreadPercent: 24, evidenceWeights: weak.map((comp) => comp.evidenceWeight) });

    expect(strongConfidence.score).toBeGreaterThan(weakConfidence.score);
    expect(weakConfidence.level).toBe("Review Required");
  });
});
