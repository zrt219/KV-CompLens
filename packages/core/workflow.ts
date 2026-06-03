import { runCompAnalysis } from "./agent";
import type { CompAnalysisResult, ScoredComparable, SubjectProperty } from "./types";

export type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  time: string;
  status: "confirmed" | "review" | "ready";
};

export function createInitialWorkflow(subject: SubjectProperty) {
  const analysis = runCompAnalysis(subject);
  return {
    analysis,
    selectedIds: analysis.selectedComparables.map((comp) => comp.id),
    activityFeed: createInitialActivity(analysis)
  };
}

export function createInitialActivity(analysis: CompAnalysisResult): ActivityItem[] {
  return [
    {
      id: "analysis-created",
      label: "Initial home set created",
      detail: `${analysis.valuation.includedCompCount} homes selected for review.`,
      time: "Start",
      status: "confirmed"
    },
    {
      id: "sources-attached",
      label: "Public context attached",
      detail: "Public assessment links recorded as background context.",
      time: "Start",
      status: "review"
    }
  ];
}

export function addCandidateToAnalysis(subject: SubjectProperty, current: CompAnalysisResult, candidate: ScoredComparable, existingActivity: ActivityItem[]) {
  const selectedIds = Array.from(new Set([...current.selectedComparables.map((comp) => comp.id), candidate.id]));
  const next = runCompAnalysis(subject, {
    selectedComparableIds: selectedIds,
    previousValuation: current.valuation
  });
  next.selectedComparables = next.selectedComparables.map((comp) => comp.id === candidate.id ? { ...comp, status: "new" } : comp);
  next.valuation.adjustedComparables = next.valuation.adjustedComparables.map((comp) => comp.id === candidate.id ? { ...comp, status: "new" } : comp);
  const delta = next.valuationDelta;
  const nextActivity: ActivityItem[] = [
    {
      id: `comp-added-${candidate.id}`,
      label: `Home ${selectedIds.length} added`,
      detail: `${candidate.address} added to the selected review set.`,
      time: "Just now",
      status: "confirmed"
    },
    {
      id: `confidence-${candidate.id}`,
      label: "Confidence recalculated",
      detail: delta ? `${formatSigned(delta.confidenceDelta)} pts confidence change.` : "Review confidence recalculated from the selected homes.",
      time: "Just now",
      status: "confirmed"
    },
    {
      id: `valuation-${candidate.id}`,
      label: "Valuation range updated",
      detail: delta ? `${formatSigned(delta.pointDelta)} midpoint change.` : "Value range updated.",
      time: "Just now",
      status: "ready"
    },
    {
      id: `report-${candidate.id}`,
      label: "Report draft refreshed",
      detail: "Review summary refreshed from the selected homes.",
      time: "Just now",
      status: "ready"
    },
    ...existingActivity
  ];

  return {
    analysis: next,
    selectedIds,
    activityFeed: nextActivity
  };
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(Math.round(value)).toLocaleString()}`;
}
