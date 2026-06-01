import { describe, expect, it } from "vitest";
import { runCompAnalysis } from "./agent";
import type { SubjectProperty } from "./types";

const subject: SubjectProperty = {
  address: "412 Aspen Drive",
  city: "Edmonton",
  neighbourhood: "Windermere",
  propertyType: "Detached",
  yearBuilt: 2014,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2180,
  lotSizeSqft: 5800,
  parking: 2,
  latitude: 53.4522,
  longitude: -113.5781,
  condition: "Good",
  targetPriceHint: 690000
};

describe("underwriting memo", () => {
  it("includes subject, source scan, selected comps, value range, and risk sections from computed facts", () => {
    const analysis = runCompAnalysis(subject);

    expect(analysis.memo).toContain("Subject Property Summary");
    expect(analysis.memo).toContain(subject.address);
    expect(analysis.memo).toContain("Source Scan Summary");
    expect(analysis.memo).toContain(`${analysis.sourceScanSummary.recordsScanned} local demo records scanned`);
    expect(analysis.memo).toContain("Selected Comparable Sales");
    expect(analysis.memo).toContain("Indicated Value Range");
    expect(analysis.memo).toContain("PCE-V2 Evidence Reconciliation");
    expect(analysis.memo).toContain("Residual-buffered posterior range");
    expect(analysis.memo).toContain("normalized evidence weight");
    expect(analysis.memo).toContain("Confidence and Risk Flags");
    expect(analysis.memo).toContain("not an appraisal");
  });
});
