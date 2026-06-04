import { formatCurrency } from "../format";
import { previewCandidateImpact } from "../marginalImpact";
import type { PceAnalysisSnapshot } from "../pce/runPcePipeline";
import type { AdjustedComparable } from "../types";
import type { PceAnalysisState } from "../../hooks/usePceAnalysis";

export function selectCivicGridViewModel(state: PceAnalysisState) {
  const snapshot = state.snapshot;
  const candidate = state.newCandidateId
    ? snapshot.remainingCandidates.find((comp) => comp.id === state.newCandidateId)
    : undefined;
  const selectedIds = new Set(state.selectedComparableIds);
  const subjectAddress = snapshot.subject.address.trim() || "Waiting for property details";
  return {
    subject: snapshot.subject,
    pointEstimate: snapshot.valuation.pointEstimate,
    selectedComparables: snapshot.valuation.adjustedComparables,
    rankedComparables: snapshot.rankedComparables,
    rejectedComparables: snapshot.rejectedComparables,
    selectedIds,
    candidate,
    candidateImpact: candidate ? previewCandidateImpact(snapshot.subject, snapshot.selectedComparables, candidate) : snapshot.candidateImpact,
    activeComparableId: state.activeComparableId ?? snapshot.activeComparableId,
    newCandidateId: state.newCandidateId,
    selectedComparable: selectActiveAdjustedComparable(state),
    workflow: {
      subjectAddress,
      sourceSummary: state.analysisStarted ? `${snapshot.sourceScan.sourcesConsolidated} sources / ${snapshot.sourceScan.recordsScanned} records` : "Awaiting intake",
      candidateSummary: state.analysisStarted ? `${snapshot.sourceScan.candidatePoolCount} comparables ranked` : "No comparables ranked yet",
      adjustmentSummary: state.analysisStarted ? `${snapshot.valuation.includedCompCount} comparables confirmed` : "No comparables confirmed yet",
      valueSummary: state.analysisStarted ? `${formatCurrency(snapshot.valuation.lowEstimate)} - ${formatCurrency(snapshot.valuation.highEstimate)}` : "Awaiting analysis"
    }
  };
}

export function selectInsightsViewModel(state: PceAnalysisState) {
  const snapshot = state.snapshot;
  const selectedComparable = selectActiveAdjustedComparable(state);
  if (!state.analysisStarted) {
    return {
      valueRange: "Awaiting analysis",
      lowEstimate: "N/A",
      highEstimate: "N/A",
      pointEstimate: "N/A",
      confidenceScore: 0,
      confidenceLevel: "Review Required" as const,
      confidenceRationale: "Enter the property details and run the analysis to see the value range.",
      selectedComparable: undefined,
      averageScore: 0,
      distanceRange: "No comparables selected",
      averageMatch: "Awaiting analysis",
      averageComparableProbability: "No comparables reviewed yet",
      effectiveSampleSize: "No comparables reviewed yet",
      averageSourceReliability: "No source scan yet",
      valueSpread: "No value range yet",
      sourceScan: snapshot.sourceScan,
      riskFlags: [],
      auditEvents: [],
      confidenceSupportsReview: false,
      valuationRiskFlags: new Set<string>(),
      valuation: snapshot.valuation
    };
  }
  const averageScore = Math.round(snapshot.selectedComparables.reduce((sum, comp) => sum + comp.totalScore, 0) / Math.max(1, snapshot.selectedComparables.length));
  return {
    valueRange: `${formatCurrency(snapshot.valuation.lowEstimate)} - ${formatCurrency(snapshot.valuation.highEstimate)}`,
    lowEstimate: formatCurrency(snapshot.valuation.lowEstimate),
    highEstimate: formatCurrency(snapshot.valuation.highEstimate),
    pointEstimate: formatCurrency(snapshot.valuation.pointEstimate),
    confidenceScore: snapshot.valuation.confidenceScore,
    confidenceLevel: displayConfidenceLevel(snapshot.valuation.confidenceLevel),
    confidenceRationale: snapshot.valuation.confidenceRationale,
    selectedComparable,
    averageScore,
    distanceRange: distanceRange(snapshot.valuation.adjustedComparables),
    averageMatch: `${snapshot.valuation.averageSimilarity}/100`,
    averageComparableProbability: `${Math.round(snapshot.valuation.averageComparableProbability * 100)}% average probability`,
    effectiveSampleSize: `${snapshot.valuation.effectiveSampleSize} reviewed comparables`,
    averageSourceReliability: `${Math.round(snapshot.valuation.averageSourceReliability * 100)}% average`,
    valueSpread: `${snapshot.valuation.valueSpreadPercent}% range spread`,
    sourceScan: snapshot.sourceScan,
    riskFlags: snapshot.riskFlags.length ? snapshot.riskFlags : ["No major review flags in the selected comparables."],
    auditEvents: snapshot.auditEvents,
    confidenceSupportsReview: snapshot.valuation.confidenceLevel === "High",
    valuationRiskFlags: new Set(snapshot.valuation.riskFlags),
    valuation: snapshot.valuation
  };
}

export function selectAdjustmentGridViewModel(state: PceAnalysisState) {
  return {
    subject: state.snapshot.subject,
    comps: state.snapshot.valuation.adjustedComparables,
    valuation: state.snapshot.valuation,
    valuationDelta: state.snapshot.valuationDelta,
    activeComparableId: state.activeComparableId ?? state.snapshot.activeComparableId,
    newCandidateId: state.newCandidateId
  };
}

export function selectMemoViewModel(state: PceAnalysisState) {
  return {
    memo: state.snapshot.memo,
    auditEvents: [...state.snapshot.auditEvents, ...state.uiAuditEvents],
    generatedAt: state.snapshot.generatedAt,
    reviewIntelligenceAttached: state.reviewIntelligenceAttached
  };
}

export function selectExportViewModel(state: PceAnalysisState) {
  if (!state.analysisStarted) {
    return {
      pointEstimate: "Awaiting analysis",
      valueRange: "Awaiting analysis",
      confidence: "Waiting for property details",
      includedCompCount: "No comparables selected yet",
      adjustedComparables: [],
      newCandidateId: state.newCandidateId,
      auditEvents: [],
      reviewIntelligenceAttached: false
    };
  }
  return {
    pointEstimate: formatCurrency(state.snapshot.valuation.pointEstimate),
    valueRange: `${formatCurrency(state.snapshot.valuation.lowEstimate)} - ${formatCurrency(state.snapshot.valuation.highEstimate)}`,
    confidence: `${Math.round(state.snapshot.valuation.confidenceScore)}% ${displayConfidenceLevel(state.snapshot.valuation.confidenceLevel)}`,
    includedCompCount: String(state.snapshot.valuation.includedCompCount),
    adjustedComparables: state.snapshot.valuation.adjustedComparables,
    newCandidateId: state.newCandidateId,
    auditEvents: [...state.snapshot.auditEvents, ...state.uiAuditEvents],
    reviewIntelligenceAttached: state.reviewIntelligenceAttached
  };
}

export function displayConfidenceLevel(level: string) {
  return level === "Review Required" ? "Review needed" : level;
}

export function findHighestPositiveCandidate(snapshot: PceAnalysisSnapshot) {
  return snapshot.remainingCandidates
    .map((comp) => ({ comp, impact: previewCandidateImpact(snapshot.subject, snapshot.selectedComparables, comp) }))
    .filter(({ impact }) => impact.marginalInformationGain > 0)
    .sort((a, b) => b.impact.marginalInformationGain - a.impact.marginalInformationGain || b.comp.totalScore - a.comp.totalScore || a.comp.id.localeCompare(b.comp.id))[0]?.comp;
}

export function selectActiveAdjustedComparable(state: PceAnalysisState): AdjustedComparable | undefined {
  return state.snapshot.valuation.adjustedComparables.find((comp) => comp.id === state.activeComparableId) ?? state.snapshot.valuation.adjustedComparables[0];
}

export function distanceRange(comps: AdjustedComparable[]) {
  if (!comps.length) return "No comparables selected";
  const distances = comps.map((comp) => comp.distanceKm).sort((a, b) => a - b);
  return `${distances[0].toFixed(1)}-${distances[distances.length - 1].toFixed(1)} km`;
}

export function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(Math.round(value)).toLocaleString()}`;
}
