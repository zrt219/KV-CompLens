import { describe, expect, it } from "vitest";
import { syntheticComparables } from "../lib/mockData";
import { runPcePipeline } from "../lib/pce/runPcePipeline";
import type { SubjectProperty } from "../lib/types";

const subject: SubjectProperty = {
  id: "SUBJ-TEST-001",
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
  targetPriceHint: 690000,
  underwritingDate: "2026-05-31"
};

const generatedAt = "2026-06-01T00:00:00.000Z";

describe("runPcePipeline", () => {
  it("returns a complete deterministic snapshot", () => {
    const snapshot = runPcePipeline({ subject, candidates: syntheticComparables, generatedAt });

    expect(snapshot.analysisStatus).toBe("complete");
    expect(snapshot.isZeroState).toBe(false);
    expect(snapshot.subject.address).toBe(subject.address);
    expect(snapshot.sourceScan.recordsScanned).toBeGreaterThan(0);
    expect(snapshot.rankedComparables.length).toBeGreaterThan(0);
    expect(snapshot.selectedComparables.length).toBeGreaterThan(0);
    expect(snapshot.rejectedComparables).toBeDefined();
    expect(snapshot.remainingCandidates).toBeDefined();
    expect(snapshot.valuation.pointEstimate).toBeGreaterThan(0);
    expect(snapshot.memo).toContain("Subject Details");
    expect(snapshot.auditEvents).toHaveLength(5);
    expect(snapshot.activeComparableId).toBe(snapshot.valuation.adjustedComparables[0]?.id);
    expect(snapshot.generatedAt).toBe(generatedAt);
  });

  it("uses selected IDs as the selected comparable set", () => {
    const baseline = runPcePipeline({ subject, candidates: syntheticComparables, generatedAt });
    const selectedComparableIds = baseline.rankedComparables.slice(1, 4).map((comp) => comp.id);
    const snapshot = runPcePipeline({ subject, candidates: syntheticComparables, selectedComparableIds, generatedAt });

    expect(snapshot.selectedComparables.map((comp) => comp.id)).toEqual(selectedComparableIds);
    expect(snapshot.valuation.adjustedComparables.map((comp) => comp.id)).toEqual(selectedComparableIds);
  });

  it("excludes selected comparables from remaining candidates", () => {
    const snapshot = runPcePipeline({ subject, candidates: syntheticComparables, generatedAt });
    const selectedIds = new Set(snapshot.selectedComparables.map((comp) => comp.id));

    expect(snapshot.remainingCandidates.every((comp) => !selectedIds.has(comp.id))).toBe(true);
  });

  it("generates valuation and memo from snapshot facts", () => {
    const snapshot = runPcePipeline({ subject, candidates: syntheticComparables, generatedAt });

    expect(snapshot.memo).toContain(String(snapshot.sourceScan.recordsScanned));
    expect(snapshot.memo).toContain(String(snapshot.sourceScan.candidatePoolCount));
    expect(snapshot.memo).toContain(String(snapshot.sourceScan.selectedCompCount));
    expect(snapshot.memo).toContain(snapshot.selectedComparables[0].address);
    expect(snapshot.memo).toContain(snapshot.valuation.effectiveSampleSize.toString());
    expect(snapshot.memo).toContain("Selected Homes");
    expect(snapshot.memo).toContain("Review Summary");
  });

  it("builds deterministic audit events with a fixed timestamp", () => {
    const first = runPcePipeline({ subject, candidates: syntheticComparables, generatedAt });
    const second = runPcePipeline({ subject, candidates: syntheticComparables, generatedAt });

    expect(first.auditEvents).toEqual(second.auditEvents);
    expect(first.auditEvents.every((event) => event.timestamp === generatedAt)).toBe(true);
  });
});
