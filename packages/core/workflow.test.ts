import { describe, expect, it } from "vitest";
import { addCandidateToAnalysis, createInitialWorkflow } from "./workflow";
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

describe("workflow", () => {
  it("selects a candidate outside the initial selected set", () => {
    const workflow = createInitialWorkflow(subject);
    expect(workflow.analysis.candidateComparable).toBeDefined();
    expect(workflow.selectedIds).not.toContain(workflow.analysis.candidateComparable?.id);
  });

  it("adds a useful candidate once and records activity", () => {
    const workflow = createInitialWorkflow(subject);
    const candidate = workflow.analysis.candidateComparable;
    expect(candidate).toBeDefined();
    if (!candidate) return;

    const next = addCandidateToAnalysis(subject, workflow.analysis, candidate, workflow.activityFeed);
    expect(next.selectedIds.filter((id) => id === candidate.id)).toHaveLength(1);
    expect(next.analysis.selectedComparables.find((comp) => comp.id === candidate.id)?.status).toBe("new");
    expect(next.analysis.selectedComparables.find((comp) => comp.id === candidate.id)?.latitude).toEqual(expect.any(Number));
    expect(next.analysis.selectedComparables.find((comp) => comp.id === candidate.id)?.longitude).toEqual(expect.any(Number));
    expect(next.analysis.valuation.includedCompCount).toBe(workflow.analysis.valuation.includedCompCount + 1);
    expect(next.activityFeed.some((item) => item.label.includes("Comparable") && item.label.includes("added"))).toBe(true);

    const duplicate = addCandidateToAnalysis(subject, next.analysis, candidate, next.activityFeed);
    expect(duplicate.selectedIds.filter((id) => id === candidate.id)).toHaveLength(1);
  });

  it("calculates deterministic before and after valuation deltas", () => {
    const workflow = createInitialWorkflow(subject);
    const candidate = workflow.analysis.candidateComparable;
    expect(candidate).toBeDefined();
    if (!candidate) return;

    const next = addCandidateToAnalysis(subject, workflow.analysis, candidate, workflow.activityFeed);
    expect(next.analysis.valuationDelta).toBeDefined();
    expect(next.analysis.valuationDelta?.compCountDelta).toBe(1);
    expect(Number.isFinite(next.analysis.valuationDelta?.pointDelta)).toBe(true);
  });

  it("selects top-ranked candidates and keeps lower-ranked candidates explainable", () => {
    const workflow = createInitialWorkflow(subject);
    const selectedScores = workflow.analysis.selectedComparables.map((comp) => comp.totalScore);
    const sortedSelectedScores = [...selectedScores].sort((a, b) => b - a);

    expect(selectedScores).toEqual(sortedSelectedScores);
    expect(workflow.analysis.rejectedComparables.length).toBeGreaterThan(0);
    expect(workflow.analysis.rejectedComparables[0].rejectionReason).toEqual(expect.any(String));
  });
});
