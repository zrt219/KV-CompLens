import { describe, expect, it } from "vitest";
import {
  createBlankPceState,
  createInitialPceState,
  isSubjectReadyForAnalysis,
  pceAnalysisReducer
} from "../hooks/usePceAnalysis";
import {
  selectAdjustmentGridViewModel,
  selectCivicGridViewModel,
  selectExportViewModel,
  selectInsightsViewModel,
  selectMemoViewModel
} from "../lib/selectors/pceSelectors";
import { syntheticComparables } from "../lib/mockData";
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

describe("PCE UI state reducer", () => {
  it("starts in a zero-state before intake is submitted", () => {
    const state = createBlankPceState(syntheticComparables, "2026-06-01T00:00:00.000Z");
    const civicGrid = selectCivicGridViewModel(state);
    const insights = selectInsightsViewModel(state);
    const adjustmentGrid = selectAdjustmentGridViewModel(state);
    const exportView = selectExportViewModel(state);

    expect(state.analysisStarted).toBe(false);
    expect(isSubjectReadyForAnalysis(state.subject)).toBe(false);
    expect(state.snapshot.sourceScan.recordsScanned).toBe(0);
    expect(state.snapshot.valuation.pointEstimate).toBe(0);
    expect(civicGrid.workflow.sourceSummary).toBe("Awaiting intake");
    expect(civicGrid.workflow.candidateSummary).toBe("No homes ranked yet");
    expect(civicGrid.workflow.adjustmentSummary).toBe("No homes confirmed yet");
    expect(civicGrid.workflow.valueSummary).toBe("Awaiting analysis");
    expect(insights.valueRange).toBe("Awaiting analysis");
    expect(insights.pointEstimate).toBe("N/A");
    expect(insights.confidenceScore).toBe(0);
    expect(insights.averageMatch).toBe("Awaiting analysis");
    expect(insights.effectiveSampleSize).toBe("No homes reviewed yet");
    expect(insights.auditEvents).toHaveLength(0);
    expect(adjustmentGrid.comps).toHaveLength(0);
    expect(exportView.includedCompCount).toBe("No homes selected yet");
  });

  it("keeps the app in intake mode until the subject is valid", () => {
    const blank = createBlankPceState(syntheticComparables, "2026-06-01T00:00:00.000Z");
    const blocked = pceAnalysisReducer(blank, { type: "RUN_ANALYSIS", generatedAt: "2026-06-01T00:30:00.000Z" });
    const loaded = pceAnalysisReducer(blank, { type: "LOAD_SUBJECT", subject });
    const ready = pceAnalysisReducer(loaded, { type: "RUN_ANALYSIS", generatedAt: "2026-06-01T01:00:00.000Z" });

    expect(blocked.analysisStarted).toBe(false);
    expect(blocked.toast?.tone).toBe("review");
    expect(loaded.analysisStarted).toBe(false);
    expect(isSubjectReadyForAnalysis(loaded.subject)).toBe(true);
    expect(ready.analysisStarted).toBe(true);
    expect(ready.snapshot.valuation.pointEstimate).toBeGreaterThan(0);
  });

  it("clears computed outputs when the subject changes after analysis", () => {
    const initial = createInitialPceState(subject, syntheticComparables, "2026-06-01T00:00:00.000Z");
    const edited = pceAnalysisReducer(initial, { type: "UPDATE_SUBJECT", key: "livingAreaSqft", value: 2400 });
    const civicGrid = selectCivicGridViewModel(edited);
    const insights = selectInsightsViewModel(edited);
    const exportView = selectExportViewModel(edited);

    expect(edited.analysisStarted).toBe(false);
    expect(edited.selectedComparableIds).toHaveLength(0);
    expect(edited.snapshot.valuation.pointEstimate).toBe(0);
    expect(civicGrid.workflow.valueSummary).toBe("Awaiting analysis");
    expect(insights.pointEstimate).toBe("N/A");
    expect(exportView.includedCompCount).toBe("No homes selected yet");
  });

  it("RUN_ANALYSIS recomputes the snapshot", () => {
    const initial = createInitialPceState(subject, syntheticComparables, "2026-06-01T00:00:00.000Z");
    const edited = pceAnalysisReducer(initial, { type: "UPDATE_SUBJECT", key: "livingAreaSqft", value: 2400 });
    const next = pceAnalysisReducer(edited, { type: "RUN_ANALYSIS", generatedAt: "2026-06-01T01:00:00.000Z" });

    expect(next.snapshot.generatedAt).toBe("2026-06-01T01:00:00.000Z");
    expect(next.snapshot.subject.livingAreaSqft).toBe(2400);
    expect(next.snapshot.valuation.pointEstimate).not.toBe(initial.snapshot.valuation.pointEstimate);
    expect(next.toast?.tone).toBe("success");
  });

  it("FIND_MORE_COMPARABLES selects a real remaining candidate with positive information gain", () => {
    const initial = createInitialPceState(subject, syntheticComparables, "2026-06-01T00:00:00.000Z");
    const next = pceAnalysisReducer(initial, { type: "FIND_MORE_COMPARABLES" });
    const civicGrid = selectCivicGridViewModel(next);

    expect(next.newCandidateId).toBeTruthy();
    expect(next.snapshot.remainingCandidates.some((comp) => comp.id === next.newCandidateId)).toBe(true);
    expect(civicGrid.candidate?.id).toBe(next.newCandidateId);
    expect(civicGrid.activeComparableId).toBe(next.newCandidateId);
    expect(civicGrid.newCandidateId).toBe(next.newCandidateId);
    expect(civicGrid.candidateImpact?.marginalInformationGain).toBeGreaterThan(0);
    expect(next.toast?.tone).toBe("review");
  });

  it("ADD_CANDIDATE_TO_ANALYSIS changes selected count and valuation", () => {
    const initial = createInitialPceState(subject, syntheticComparables, "2026-06-01T00:00:00.000Z");
    const surfaced = pceAnalysisReducer(initial, { type: "FIND_MORE_COMPARABLES" });
    const candidateId = surfaced.newCandidateId;
    const next = pceAnalysisReducer(surfaced, { type: "ADD_CANDIDATE_TO_ANALYSIS", generatedAt: "2026-06-01T02:00:00.000Z" });
    const civicGrid = selectCivicGridViewModel(next);

    expect(candidateId).toBeTruthy();
    expect(next.selectedComparableIds).toContain(candidateId);
    expect(next.activeComparableId).toBe(candidateId);
    expect(next.selectedComparableIds.length).toBe(initial.selectedComparableIds.length + 1);
    expect(next.snapshot.valuation.includedCompCount).toBe(initial.snapshot.valuation.includedCompCount + 1);
    expect(next.snapshot.valuation.adjustedComparables.some((comp) => comp.id === candidateId)).toBe(true);
    expect(next.snapshot.valuation.pointEstimate).not.toBe(initial.snapshot.valuation.pointEstimate);
    expect(next.snapshot.valuationDelta).toBeDefined();
    expect(next.newCandidateId).toBeUndefined();
    expect(civicGrid.selectedIds.has(candidateId as string)).toBe(true);
    expect(civicGrid.selectedComparable?.id).toBe(candidateId);
    expect(civicGrid.selectedComparables.some((comp) => comp.id === candidateId)).toBe(true);
  });

  it("SELECT_COMPARABLE updates the selected panel target", () => {
    const initial = createInitialPceState(subject, syntheticComparables, "2026-06-01T00:00:00.000Z");
    const targetId = initial.snapshot.valuation.adjustedComparables[1].id;
    const next = pceAnalysisReducer(initial, { type: "SELECT_COMPARABLE", id: targetId });
    const civicGrid = selectCivicGridViewModel(next);
    const insights = selectInsightsViewModel(next);
    const adjustmentGrid = selectAdjustmentGridViewModel(next);

    expect(civicGrid.activeComparableId).toBe(targetId);
    expect(civicGrid.selectedComparable?.id).toBe(targetId);
    expect(insights.selectedComparable?.id).toBe(targetId);
    expect(adjustmentGrid.activeComparableId).toBe(targetId);
  });

  it("EXCLUDE_COMPARABLE recalculates valuation", () => {
    const initial = createInitialPceState(subject, syntheticComparables, "2026-06-01T00:00:00.000Z");
    const excludedId = initial.selectedComparableIds[0];
    const next = pceAnalysisReducer(initial, { type: "EXCLUDE_COMPARABLE", id: excludedId, generatedAt: "2026-06-01T03:00:00.000Z" });

    expect(next.selectedComparableIds).not.toContain(excludedId);
    expect(next.snapshot.valuation.includedCompCount).toBe(initial.snapshot.valuation.includedCompCount - 1);
    expect(next.snapshot.valuation.pointEstimate).not.toBe(initial.snapshot.valuation.pointEstimate);
    expect(next.snapshot.valuationDelta).toBeDefined();
  });

  it("selectors return snapshot-backed values", () => {
    const state = createInitialPceState(subject, syntheticComparables, "2026-06-01T00:00:00.000Z");
    const civicGrid = selectCivicGridViewModel(state);
    const insights = selectInsightsViewModel(state);
    const adjustmentGrid = selectAdjustmentGridViewModel(state);
    const memo = selectMemoViewModel(state);
    const exportView = selectExportViewModel(state);

    expect(civicGrid.pointEstimate).toBe(state.snapshot.valuation.pointEstimate);
    expect(insights.confidenceScore).toBe(state.snapshot.valuation.confidenceScore);
    expect(adjustmentGrid.comps).toEqual(state.snapshot.valuation.adjustedComparables);
    expect(memo.memo).toBe(state.snapshot.memo);
    expect(exportView.adjustedComparables).toEqual(state.snapshot.valuation.adjustedComparables);
  });
});
