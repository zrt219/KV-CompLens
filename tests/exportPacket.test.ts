import { describe, expect, it } from "vitest";
import { buildExportPacket } from "../lib/export/buildExportPacket";
import { createExportFileNames } from "../lib/export/fileNaming";
import { syntheticComparables } from "../lib/mockData";
import { runPcePipeline } from "../lib/pce/runPcePipeline";
import type { SubjectProperty } from "../lib/types";

const subject: SubjectProperty = {
  address: "12345 109 St NW",
  city: "Edmonton",
  province: "AB",
  postalCode: "T5G 0A0",
  neighbourhood: "Central McDougall",
  propertyType: "Detached",
  yearBuilt: 2014,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2180,
  lotSizeSqft: 5800,
  parking: 2,
  latitude: 53.5828,
  longitude: -113.5082,
  condition: "Good",
  underwritingDate: "2026-05-31"
};

const snapshot = runPcePipeline({ subject, candidates: syntheticComparables, generatedAt: "2026-05-31T12:00:00.000Z" });

describe("ExportPacket", () => {
  it("returns required sections from the PCE snapshot", () => {
    const packet = buildExportPacket(snapshot);

    expect(packet.meta.appName).toBe("KV CompLens");
    expect(packet.subject.address).toBe(subject.address);
    expect(packet.valuation.midpointEstimate).toBe(snapshot.valuation.pointEstimate);
    expect(packet.sourceScan.comparablesSelected).toBe(snapshot.valuation.includedCompCount);
    expect(packet.comparables.length).toBe(snapshot.valuation.adjustedComparables.length);
    expect(packet.adjustments.length).toBe(snapshot.valuation.adjustedComparables.length);
    expect(packet.auditEvents.length).toBe(snapshot.auditEvents.length);
  });

  it("includes required limitations and excludes raw reasoning terms", () => {
    const content = JSON.stringify(buildExportPacket(snapshot, { includeReviewIntelligence: true }));

    expect(content).toContain("Not live MLS data");
    expect(content).toContain("Not an appraisal");
    expect(content).toContain("Not a credit decision");
    expect(content).toContain("Analyst review required");
    expect(content).not.toMatch(/Agent Reasoning Trace|chain-of-thought/i);
  });

  it("creates stable sanitized file names", () => {
    const names = createExportFileNames(buildExportPacket(snapshot));

    expect(names.pdf).toBe("kv-complens-12345-109-st-nw-review-package-2026-05-31.pdf");
    expect(names.docx).toBe("kv-complens-12345-109-st-nw-review-package-2026-05-31.docx");
    expect(Object.values(names).every((name) => !/[\\/:*?\"<>|]/.test(name))).toBe(true);
  });
});
