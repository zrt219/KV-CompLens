import { describe, expect, it } from "vitest";
import { syntheticComparables } from "./data";
import { runSourceScan } from "./sourceScan";
import type { SubjectProperty } from "./types";

const subject: SubjectProperty = {
  address: "100 Scan Drive",
  city: "Edmonton",
  neighbourhood: "Central McDougall",
  propertyType: "Detached",
  yearBuilt: 2015,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2200,
  lotSizeSqft: 5600,
  parking: 2,
  latitude: 53.58,
  longitude: -113.5,
  condition: "Good"
};

describe("source scan", () => {
  it("derives source scan summary from dataset and never claims MLS sold-data provenance", () => {
    const summary = runSourceScan(subject, syntheticComparables, 18, 5);

    expect(summary.syntheticRecentSalesScanned).toBe(syntheticComparables.length);
    expect(summary.recordsScanned).toBe(summary.totalRecordsScanned);
    expect(summary.candidatePoolCount).toBe(18);
    expect(summary.selectedCompCount).toBe(5);
    expect(summary.sourcesConsolidated).toBe(5);
    expect(summary.estimatedManualTimeSavedHours).toBeGreaterThan(0);
    expect(summary.dataBoundaryNote.toLowerCase()).toContain("synthetic");
    expect(summary.dataBoundaryNote.toLowerCase()).toContain("not live mls");
  });
});
