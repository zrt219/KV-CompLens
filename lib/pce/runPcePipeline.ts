import { syntheticComparables } from "../mockData";
import { normalizeSubjectProperty } from "../agent";
import { generateUnderwritingMemo } from "../memo";
import { previewCandidateImpact } from "../marginalImpact";
import { runSourceScan } from "../sourceScan";
import { rankComparables, selectTopComparables } from "../scoring";
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
  type:
    | "source_scan"
    | "ranking"
    | "selection"
    | "valuation"
    | "memo"
    | "review_intelligence_v2_added_to_memo"
    | "review_evidence_pack_built"
    | "review_context_retrieved"
    | "review_insight_generated"
    | "review_insight_verified"
    | "review_insight_fallback_used";
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
  analysisStatus: "idle" | "complete";
  isZeroState: boolean;
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

export function createZeroPceSnapshot(subject: SubjectProperty, generatedAt = new Date().toISOString()): PceAnalysisSnapshot {
  const normalizedSubject = normalizeSubjectProperty(subject);
  return {
    analysisStatus: "idle",
    isZeroState: true,
    subject: normalizedSubject,
    sourceScan: {
      syntheticRecentSalesScanned: 0,
      municipalAssessmentReferences: 0,
      listingStyleRecords: 0,
      priorDealComparables: 0,
      marketTrendReferences: 0,
      totalRecordsScanned: 0,
      recordsScanned: 0,
      syntheticRecentSalesMatched: 0,
      assessmentRecordsMatched: 0,
      listingRecordsMatched: 0,
      priorDealCompsMatched: 0,
      marketTrendReferencesMatched: 0,
      candidatePoolCount: 0,
      selectedCompCount: 0,
      rejectedCount: 0,
      sourcesConsolidated: 0,
      estimatedManualTimeSavedHours: 0,
      dataBoundaryNote: "Awaiting subject intake. No scan has run."
    },
    rankedComparables: [],
    selectedComparables: [],
    rejectedComparables: [],
    remainingCandidates: [],
    valuation: estimateValuationRange(normalizedSubject, []),
    memo: "",
    auditEvents: [],
    activeComparableId: undefined,
    generatedAt,
    candidateImpact: undefined,
    valuationDelta: undefined,
    riskFlags: []
  };
}

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
      source: "Source review",
      status: "confirmed",
      summary: `${snapshot.sourceScan.recordsScanned} demo records reviewed across ${snapshot.sourceScan.sourcesConsolidated} source groups.`
    },
    {
      id: `ranking-${snapshot.generatedAt}`,
      timestamp: snapshot.generatedAt,
      type: "ranking",
      source: "Comparable ranking",
      status: "confirmed",
      summary: `${snapshot.rankedComparables.length} comparables ranked; ${snapshot.remainingCandidates.length} remain outside the review set.`
    },
    {
      id: `selection-${snapshot.generatedAt}`,
      timestamp: snapshot.generatedAt,
      type: "selection",
      source: "Comparable selection",
      status: snapshot.selectedComparables.length ? "confirmed" : "review",
      summary: `${snapshot.selectedComparables.length} comparables selected for review.`
    },
    {
      id: `valuation-${snapshot.generatedAt}`,
      timestamp: snapshot.generatedAt,
      type: "valuation",
      source: "Value estimate",
      status: "ready",
      summary: `Estimated value ${snapshot.valuation.pointEstimate}; confidence ${snapshot.valuation.confidenceScore}%.`
    },
    {
      id: `memo-${snapshot.generatedAt}`,
      timestamp: snapshot.generatedAt,
      type: "memo",
      source: "Summary export",
      status: "ready",
      summary: "Plain-language summary generated from the current review set."
    }
  ];
}

export function runPcePipeline(input: PcePipelineInput): PceAnalysisSnapshot {
  const subject = normalizeSubjectProperty(input.subject);
  const candidates = input.candidates ?? syntheticComparables;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const rankedComparables = rankComparables(subject, candidates);
  const selectedIdSet = input.selectedComparableIds ? new Set(input.selectedComparableIds) : undefined;
  const selectedComparables = selectedIdSet
    ? rankedComparables
        .filter((comp) => selectedIdSet.has(comp.id))
        .map((comp) => ({ ...comp, status: "selected" as const, wasSelected: true }))
    : selectTopComparables(rankedComparables, 5)
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
      rejectionReason: comp.rejectionReason ?? comp.penalties[0] ?? "Lower match than the comparables already selected."
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
    analysisStatus: "complete" as const,
    isZeroState: false,
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
  return { ...withoutAudit, analysisStatus: "complete", isZeroState: false, auditEvents: buildAuditEvents(withoutAudit) };
}

function selectHighestPositiveImpact(subject: SubjectProperty, selectedComparables: ScoredComparable[], remainingCandidates: ScoredComparable[]) {
  return remainingCandidates
    .map((comp) => ({ comp, impact: previewCandidateImpact(subject, selectedComparables, comp) }))
    .filter(({ impact }) => impact.marginalInformationGain > 0)
    .sort((a, b) => b.impact.marginalInformationGain - a.impact.marginalInformationGain || b.comp.totalScore - a.comp.totalScore || a.comp.id.localeCompare(b.comp.id))[0]?.comp;
}
