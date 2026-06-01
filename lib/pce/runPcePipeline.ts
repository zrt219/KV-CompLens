import { syntheticComparables } from "../data";
import { normalizeSubjectProperty } from "../agent";
import { generateUnderwritingMemo } from "../memo";
import { previewCandidateImpact } from "../marginalImpact";
import { runSourceScan } from "../sourceScan";
import { rankComparables } from "../scoring";
import { adjustComparableValue } from "../adjustments";
import { compareValuationBeforeAfter, estimateValuationRange } from "../valuation";
import type {
  AdjustedComparable,
  CandidateImpact,
  ComparableProperty,
  ScoredComparable,
  SourceScanSummary,
  SubjectProperty,
  ValuationDelta,
  ValuationRange
} from "../types";

export type PceAuditEvent = {
  id: string;
  timestamp: string;
  type: "source_scan" | "ranking" | "selection" | "valuation" | "memo";
  source: string;
  status: "confirmed" | "review" | "ready";
  summary: string;
};

export type PcePipelineInput = {
  subject: SubjectProperty;
  candidates?: ComparableProperty[];
  selectedComparableIds?: string[];
  activeComparableId?: string;
  generatedAt?: string;
  previousValuation?: ValuationRange;
};

export type PceAnalysisSnapshot = {
  subject: SubjectProperty;
  sourceScan: SourceScanSummary;
  rankedComparables: ScoredComparable[];
  selectedComparables: ScoredComparable[];
  rejectedComparables: ScoredComparable[];
  remainingCandidates: ScoredComparable[];
  valuation: ValuationRange;
  memo: string;
  auditEvents: PceAuditEvent[];
  activeComparableId?: string;
  generatedAt: string;
  candidateImpact?: CandidateImpact;
  valuationDelta?: ValuationDelta;
  riskFlags: string[];
};

export function calculateAdjustmentsForSelected(subject: SubjectProperty, selectedComparables: ScoredComparable[]): AdjustedComparable[] {
  return selectedComparables.map((comp) => adjustComparableValue(subject, comp));
}

export function calculateValuation(subject: SubjectProperty, selectedComparables: ScoredComparable[]) {
  return estimateValuationRange(subject, selectedComparables);
}

export function buildAuditEvents(snapshot: Omit<PceAnalysisSnapshot, "auditEvents">): PceAuditEvent[] {
  return [
    {
      id: `source-scan-${snapshot.generatedAt}`,
      timestamp: snapshot.generatedAt,
      type: "source_scan",
      source: "PCE-V2 deterministic pipeline",
      status: "confirmed",
      summary: `${snapshot.sourceScan.recordsScanned} demo records scanned across ${snapshot.sourceScan.sourcesConsolidated} source buckets.`
    },
    {
      id: `ranking-${snapshot.generatedAt}`,
      timestamp: snapshot.generatedAt,
      type: "ranking",
      source: "rankComparables",
      status: "confirmed",
      summary: `${snapshot.rankedComparables.length} candidates ranked; ${snapshot.remainingCandidates.length} remain outside selected set.`
    },
    {
      id: `selection-${snapshot.generatedAt}`,
      timestamp: snapshot.generatedAt,
      type: "selection",
      source: "PCE selectedComparableIds",
      status: snapshot.selectedComparables.length ? "confirmed" : "review",
      summary: `${snapshot.selectedComparables.length} comparables selected for valuation.`
    },
    {
      id: `valuation-${snapshot.generatedAt}`,
      timestamp: snapshot.generatedAt,
      type: "valuation",
      source: "estimateValuationRange",
      status: "ready",
      summary: `Point estimate ${snapshot.valuation.pointEstimate}; confidence ${snapshot.valuation.confidenceScore}%.`
    },
    {
      id: `memo-${snapshot.generatedAt}`,
      timestamp: snapshot.generatedAt,
      type: "memo",
      source: "generateUnderwritingMemo",
      status: "ready",
      summary: "Facts-only underwriting memo generated from snapshot evidence."
    }
  ];
}

export function runPcePipeline(input: PcePipelineInput): PceAnalysisSnapshot {
  const subject = normalizeSubjectProperty(input.subject);
  const candidates = input.candidates ?? syntheticComparables;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const rankedComparables = rankComparables(subject, candidates);
  const selectedIdSet = input.selectedComparableIds?.length ? new Set(input.selectedComparableIds) : undefined;
  const selectedComparables = selectedIdSet
    ? rankedComparables
        .filter((comp) => selectedIdSet.has(comp.id))
        .map((comp) => ({ ...comp, status: "selected" as const, wasSelected: true }))
    : rankedComparables
        .filter((comp) => comp.status !== "rejected")
        .slice(0, 5)
        .map((comp) => ({ ...comp, status: "selected" as const, wasSelected: true }));
  const selectedIds = new Set(selectedComparables.map((comp) => comp.id));
  const remainingCandidates = rankedComparables
    .filter((comp) => !selectedIds.has(comp.id))
    .map((comp) => ({ ...comp, status: comp.status === "rejected" ? "rejected" as const : "candidate" as const }));
  const rejectedComparables = remainingCandidates
    .filter((comp) => comp.status === "rejected" || comp.eligibility.severity === "fail")
    .map((comp) => ({
      ...comp,
      status: "rejected" as const,
      wasRejected: true,
      rejectionReason: comp.rejectionReason ?? comp.penalties[0] ?? "Lower-ranked than selected comparable set."
    }));
  const valuation = calculateValuation(subject, selectedComparables);
  const sourceScan = runSourceScan(subject, candidates, rankedComparables.length, selectedComparables.length, rejectedComparables.length);
  const candidate = selectHighestPositiveImpact(subject, selectedComparables, remainingCandidates);
  const candidateImpact = candidate ? previewCandidateImpact(subject, selectedComparables, candidate) : undefined;
  const valuationDelta = input.previousValuation ? compareValuationBeforeAfter(input.previousValuation, valuation) : undefined;
  const riskFlags = Array.from(new Set([...valuation.riskFlags, ...valuation.adjustedComparables.flatMap((comp) => comp.riskFlags)]));
  const activeComparableId = input.activeComparableId && selectedIds.has(input.activeComparableId)
    ? input.activeComparableId
    : valuation.adjustedComparables[0]?.id ?? selectedComparables[0]?.id;
  const partial = {
    subject,
    sourceScan,
    rankedComparables,
    selectedComparables,
    rejectedComparables,
    remainingCandidates,
    valuation,
    memo: "",
    activeComparableId,
    generatedAt,
    candidateImpact,
    valuationDelta,
    riskFlags
  };
  const memo = generateUnderwritingMemo({
    subject,
    sourceScanSummary: sourceScan,
    rankedComparables,
    selectedComparables,
    rejectedComparables,
    candidateComparable: candidate,
    candidateImpact,
    previousValuation: input.previousValuation,
    valuationDelta,
    valuation,
    riskFlags
  });
  const withoutAudit = { ...partial, memo };
  return { ...withoutAudit, auditEvents: buildAuditEvents(withoutAudit) };
}

function selectHighestPositiveImpact(subject: SubjectProperty, selectedComparables: ScoredComparable[], remainingCandidates: ScoredComparable[]) {
  return remainingCandidates
    .map((comp) => ({ comp, impact: previewCandidateImpact(subject, selectedComparables, comp) }))
    .filter(({ impact }) => impact.marginalInformationGain > 0)
    .sort((a, b) => b.impact.marginalInformationGain - a.impact.marginalInformationGain || b.comp.totalScore - a.comp.totalScore || a.comp.id.localeCompare(b.comp.id))[0]?.comp;
}
