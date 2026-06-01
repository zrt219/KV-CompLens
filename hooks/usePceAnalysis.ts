"use client";

import { useReducer } from "react";
import { syntheticComparables } from "../lib/data";
import { formatCurrency } from "../lib/format";
import { previewCandidateImpact } from "../lib/marginalImpact";
import { runPcePipeline, type PceAnalysisSnapshot } from "../lib/pce/runPcePipeline";
import type { AdjustedComparable, ComparableProperty, SubjectProperty } from "../lib/types";

export type PceViewMode = "network" | "discovery" | "table" | "adjustments" | "valuation" | "report" | "memo";
export type PceToast = { title: string; detail: string; tone: "success" | "review" };

export type PceAnalysisState = {
  subject: SubjectProperty;
  candidates: ComparableProperty[];
  selectedComparableIds: string[];
  activeComparableId?: string;
  newCandidateId?: string;
  snapshot: PceAnalysisSnapshot;
  activeView: PceViewMode;
  toast?: PceToast;
};

export type PceAnalysisAction =
  | { type: "UPDATE_SUBJECT"; key: keyof SubjectProperty; value: SubjectProperty[keyof SubjectProperty] }
  | { type: "LOAD_SUBJECT"; subject: SubjectProperty }
  | { type: "RUN_ANALYSIS"; generatedAt?: string }
  | { type: "FIND_MORE_COMPARABLES"; generatedAt?: string }
  | { type: "ADD_CANDIDATE_TO_ANALYSIS"; generatedAt?: string }
  | { type: "DISMISS_CANDIDATE" }
  | { type: "SELECT_COMPARABLE"; id: string }
  | { type: "EXCLUDE_COMPARABLE"; id: string; generatedAt?: string }
  | { type: "SET_VIEW"; view: PceViewMode }
  | { type: "CLEAR_TOAST" };

export function createInitialPceState(subject: SubjectProperty, candidates: ComparableProperty[] = syntheticComparables, generatedAt?: string): PceAnalysisState {
  const snapshot = runPcePipeline({ subject, candidates, generatedAt });
  return {
    subject: snapshot.subject,
    candidates,
    selectedComparableIds: snapshot.selectedComparables.map((comp) => comp.id),
    activeComparableId: snapshot.activeComparableId,
    snapshot,
    activeView: "network"
  };
}

export function pceAnalysisReducer(state: PceAnalysisState, action: PceAnalysisAction): PceAnalysisState {
  switch (action.type) {
    case "UPDATE_SUBJECT":
      return { ...state, subject: { ...state.subject, [action.key]: action.value } };
    case "LOAD_SUBJECT":
      return { ...state, subject: action.subject };
    case "RUN_ANALYSIS": {
      const snapshot = runPcePipeline({ subject: state.subject, candidates: state.candidates, generatedAt: action.generatedAt });
      return {
        ...state,
        subject: snapshot.subject,
        selectedComparableIds: snapshot.selectedComparables.map((comp) => comp.id),
        activeComparableId: snapshot.activeComparableId,
        newCandidateId: undefined,
        snapshot,
        toast: {
          title: "Comparable set recalculated",
          detail: `${snapshot.valuation.includedCompCount} comps selected.`,
          tone: "success"
        }
      };
    }
    case "FIND_MORE_COMPARABLES": {
      const candidate = findHighestPositiveCandidate(state.snapshot);
      if (!candidate) {
        return {
          ...state,
          newCandidateId: undefined,
          toast: {
            title: "No positive candidate available",
            detail: "Remaining candidates did not improve marginal information gain.",
            tone: "review"
          }
        };
      }
      return {
        ...state,
        activeComparableId: candidate.id,
        newCandidateId: candidate.id,
        toast: {
          title: "Candidate surfaced",
          detail: `${candidate.address} selected for analyst review.`,
          tone: "review"
        }
      };
    }
    case "ADD_CANDIDATE_TO_ANALYSIS": {
      if (!state.newCandidateId) return state;
      const selectedComparableIds = Array.from(new Set([...state.selectedComparableIds, state.newCandidateId]));
      const snapshot = runPcePipeline({
        subject: state.subject,
        candidates: state.candidates,
        selectedComparableIds,
        activeComparableId: state.newCandidateId,
        previousValuation: state.snapshot.valuation,
        generatedAt: action.generatedAt
      });
      const added = snapshot.valuation.adjustedComparables.find((comp) => comp.id === state.newCandidateId);
      const confidence = snapshot.valuationDelta?.confidenceDelta ?? 0;
      return {
        ...state,
        selectedComparableIds,
        activeComparableId: state.newCandidateId,
        newCandidateId: undefined,
        snapshot,
        activeView: "network",
        toast: {
          title: "New comparable added",
          detail: `${added?.address ?? "Candidate"} included. Confidence ${formatSigned(confidence)} pts.`,
          tone: "success"
        }
      };
    }
    case "DISMISS_CANDIDATE":
      return { ...state, newCandidateId: undefined };
    case "SELECT_COMPARABLE":
      return { ...state, activeComparableId: action.id };
    case "EXCLUDE_COMPARABLE": {
      const selectedComparableIds = state.selectedComparableIds.filter((id) => id !== action.id);
      const snapshot = runPcePipeline({
        subject: state.subject,
        candidates: state.candidates,
        selectedComparableIds,
        previousValuation: state.snapshot.valuation,
        generatedAt: action.generatedAt
      });
      return {
        ...state,
        selectedComparableIds,
        activeComparableId: snapshot.activeComparableId,
        newCandidateId: state.newCandidateId === action.id ? undefined : state.newCandidateId,
        snapshot,
        toast: {
          title: "Comparable excluded",
          detail: `${snapshot.valuation.includedCompCount} comps remain in the valuation set.`,
          tone: "review"
        }
      };
    }
    case "SET_VIEW":
      return { ...state, activeView: action.view };
    case "CLEAR_TOAST":
      return { ...state, toast: undefined };
    default:
      return state;
  }
}

export function usePceAnalysis(subject: SubjectProperty, candidates: ComparableProperty[] = syntheticComparables) {
  return useReducer(pceAnalysisReducer, undefined, () => createInitialPceState(subject, candidates));
}

export function selectCivicGridViewModel(state: PceAnalysisState) {
  const snapshot = state.snapshot;
  const candidate = state.newCandidateId
    ? snapshot.remainingCandidates.find((comp) => comp.id === state.newCandidateId)
    : undefined;
  const selectedIds = new Set(state.selectedComparableIds);
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
      subjectAddress: snapshot.subject.address,
      sourceSummary: `${snapshot.sourceScan.sourcesConsolidated} src / ${snapshot.sourceScan.recordsScanned} recs`,
      candidateSummary: `${snapshot.sourceScan.candidatePoolCount} ranked`,
      adjustmentSummary: `${snapshot.valuation.includedCompCount} comps`,
      valueSummary: `${formatCurrency(snapshot.valuation.lowEstimate)}-${formatCurrency(snapshot.valuation.highEstimate)}`
    }
  };
}

export function selectInsightsViewModel(state: PceAnalysisState) {
  const snapshot = state.snapshot;
  const selectedComparable = selectActiveAdjustedComparable(state);
  const averageScore = Math.round(snapshot.selectedComparables.reduce((sum, comp) => sum + comp.totalScore, 0) / Math.max(1, snapshot.selectedComparables.length));
  return {
    valueRange: `${formatCurrency(snapshot.valuation.lowEstimate)} - ${formatCurrency(snapshot.valuation.highEstimate)}`,
    lowEstimate: formatCurrency(snapshot.valuation.lowEstimate),
    highEstimate: formatCurrency(snapshot.valuation.highEstimate),
    pointEstimate: formatCurrency(snapshot.valuation.pointEstimate),
    confidenceScore: snapshot.valuation.confidenceScore,
    confidenceLevel: snapshot.valuation.confidenceLevel,
    confidenceRationale: snapshot.valuation.confidenceRationale,
    selectedComparable,
    averageScore,
    distanceRange: distanceRange(snapshot.valuation.adjustedComparables),
    averageMatch: `${snapshot.valuation.averageSimilarity}/100`,
    averageComparableProbability: `${Math.round(snapshot.valuation.averageComparableProbability * 100)}% avg comp probability`,
    effectiveSampleSize: `${snapshot.valuation.effectiveSampleSize} probability-weighted comps`,
    averageSourceReliability: `${Math.round(snapshot.valuation.averageSourceReliability * 100)}% average`,
    valueSpread: `${snapshot.valuation.valueSpreadPercent}% adjusted spread`,
    sourceScan: snapshot.sourceScan,
    riskFlags: snapshot.riskFlags.length ? snapshot.riskFlags : ["No major comp-quality flags in selected set."],
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
    auditEvents: state.snapshot.auditEvents,
    generatedAt: state.snapshot.generatedAt
  };
}

export function selectExportViewModel(state: PceAnalysisState) {
  return {
    pointEstimate: formatCurrency(state.snapshot.valuation.pointEstimate),
    valueRange: `${formatCurrency(state.snapshot.valuation.lowEstimate)} - ${formatCurrency(state.snapshot.valuation.highEstimate)}`,
    confidence: `${state.snapshot.valuation.confidenceScore}% ${state.snapshot.valuation.confidenceLevel}`,
    includedCompCount: String(state.snapshot.valuation.includedCompCount),
    adjustedComparables: state.snapshot.valuation.adjustedComparables,
    newCandidateId: state.newCandidateId,
    auditEvents: state.snapshot.auditEvents
  };
}

function findHighestPositiveCandidate(snapshot: PceAnalysisSnapshot) {
  return snapshot.remainingCandidates
    .map((comp) => ({ comp, impact: previewCandidateImpact(snapshot.subject, snapshot.selectedComparables, comp) }))
    .filter(({ impact }) => impact.marginalInformationGain > 0)
    .sort((a, b) => b.impact.marginalInformationGain - a.impact.marginalInformationGain || b.comp.totalScore - a.comp.totalScore || a.comp.id.localeCompare(b.comp.id))[0]?.comp;
}

function selectActiveAdjustedComparable(state: PceAnalysisState): AdjustedComparable | undefined {
  return state.snapshot.valuation.adjustedComparables.find((comp) => comp.id === state.activeComparableId) ?? state.snapshot.valuation.adjustedComparables[0];
}

function distanceRange(comps: AdjustedComparable[]) {
  if (!comps.length) return "No selected comps";
  const distances = comps.map((comp) => comp.distanceKm).sort((a, b) => a - b);
  return `${distances[0].toFixed(1)}-${distances[distances.length - 1].toFixed(1)} km`;
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(Math.round(value)).toLocaleString()}`;
}
