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
  analysisStarted: boolean;
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

export function createBlankSubjectProperty(): SubjectProperty {
  return {
    address: "",
    city: "",
    province: "AB",
    neighbourhood: "",
    propertyType: "Detached",
    yearBuilt: 0,
    bedrooms: 0,
    bathrooms: 0,
    livingAreaSqft: 0,
    lotSizeSqft: 0,
    parking: 0,
    latitude: 0,
    longitude: 0,
    condition: "Average",
    underwritingDate: "",
    targetUnderwritingDate: "",
    intendedUse: "",
    analystName: ""
  };
}

function createZeroSnapshot(subject: SubjectProperty, generatedAt?: string): PceAnalysisSnapshot {
  const timestamp = generatedAt ?? new Date().toISOString();
  const zeroSubject = { ...createBlankSubjectProperty(), ...subject };
  return {
    analysisStatus: "idle",
    isZeroState: true,
    subject: zeroSubject,
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
      dataBoundaryNote: "Enter the property details to start the review."
    },
    rankedComparables: [],
    selectedComparables: [],
    rejectedComparables: [],
    remainingCandidates: [],
    valuation: {
      lowEstimate: 0,
      pointEstimate: 0,
      midpointEstimate: 0,
      highEstimate: 0,
      confidenceScore: 0,
      confidenceLevel: "Review Required",
      confidenceRationale: "Enter the property details and run the analysis to see the value range.",
      valueDispersion: 0,
      valueSpreadPercent: 0,
      rangeWidth: 0,
      posteriorMean: 0,
      posteriorVariance: 0,
      posteriorStd: 0,
      weightedAdjustedMean: 0,
      weightedP20: 0,
      weightedP80: 0,
      residualBuffer: 0,
      effectiveSampleSize: 0,
      evidenceEntropy: 0,
      averageComparableProbability: 0,
      averageSourceReliability: 0,
      averageRecency: 0,
      normalizedRiskSeverity: 0,
      averageSimilarity: 0,
      riskFlags: [],
      includedCompCount: 0,
      adjustedComparables: [],
      subModels: [],
      modelFusion: {
        finalEstimate: 0,
        finalVariance: 0,
        modelWeights: []
      }
    },
    memo: "",
    auditEvents: [],
    activeComparableId: undefined,
    generatedAt: timestamp,
    candidateImpact: undefined,
    valuationDelta: undefined,
    riskFlags: []
  };
}

export function isSubjectReadyForAnalysis(subject: SubjectProperty) {
  return Boolean(
    subject.address.trim() &&
    subject.city.trim() &&
    subject.neighbourhood.trim() &&
    subject.yearBuilt > 0 &&
    subject.bedrooms > 0 &&
    subject.bathrooms > 0 &&
    subject.livingAreaSqft > 0 &&
    subject.latitude !== 0 &&
    subject.longitude !== 0
  );
}

export function createInitialPceState(subject: SubjectProperty, candidates: ComparableProperty[] = syntheticComparables, generatedAt?: string): PceAnalysisState {
  const snapshot = runPcePipeline({ subject, candidates, generatedAt });
  return {
    subject: snapshot.subject,
    candidates,
    selectedComparableIds: snapshot.selectedComparables.map((comp) => comp.id),
    activeComparableId: snapshot.activeComparableId,
    snapshot,
    activeView: "network",
    analysisStarted: true
  };
}

export function createBlankPceState(candidates: ComparableProperty[] = syntheticComparables, generatedAt?: string): PceAnalysisState {
  const subject = createBlankSubjectProperty();
  return {
    subject,
    candidates,
    selectedComparableIds: [],
    activeComparableId: undefined,
    newCandidateId: undefined,
    snapshot: createZeroSnapshot(subject, generatedAt),
    activeView: "network",
    analysisStarted: false
  };
}

export function pceAnalysisReducer(state: PceAnalysisState, action: PceAnalysisAction): PceAnalysisState {
  switch (action.type) {
    case "UPDATE_SUBJECT":
      return {
        ...state,
        subject: { ...state.subject, [action.key]: action.value },
        selectedComparableIds: state.analysisStarted ? [] : state.selectedComparableIds,
        activeComparableId: state.analysisStarted ? undefined : state.activeComparableId,
        newCandidateId: state.analysisStarted ? undefined : state.newCandidateId,
        snapshot: state.analysisStarted
          ? createZeroSnapshot({ ...state.subject, [action.key]: action.value })
          : {
              ...state.snapshot,
              subject: { ...state.snapshot.subject, [action.key]: action.value }
            },
        activeView: state.analysisStarted ? "network" : state.activeView,
        analysisStarted: state.analysisStarted ? false : state.analysisStarted,
        toast: state.analysisStarted
          ? {
              title: "Property details updated",
              detail: "The current review was cleared. Run the analysis again to refresh the results.",
              tone: "review"
            }
          : state.toast
      };
    case "LOAD_SUBJECT":
      return {
        ...state,
      subject: action.subject,
        selectedComparableIds: [],
        activeComparableId: undefined,
        newCandidateId: undefined,
        snapshot: createZeroSnapshot(action.subject),
        activeView: "network",
        analysisStarted: false,
      toast: {
        title: "Subject loaded",
        detail: "Enter the property details into the form, then run the analysis.",
        tone: "review"
      }
    };
    case "RUN_ANALYSIS": {
      if (!isSubjectReadyForAnalysis(state.subject)) {
        return {
          ...state,
        toast: {
          title: "Property details incomplete",
          detail: "Enter the required property details before running the analysis.",
          tone: "review"
        }
      };
      }
      const snapshot = runPcePipeline({ subject: state.subject, candidates: state.candidates, generatedAt: action.generatedAt });
      return {
        ...state,
        subject: snapshot.subject,
        selectedComparableIds: snapshot.selectedComparables.map((comp) => comp.id),
        activeComparableId: snapshot.activeComparableId,
        newCandidateId: undefined,
        snapshot,
        activeView: "network",
        analysisStarted: true,
        toast: {
          title: "Analysis complete",
          detail: `${snapshot.valuation.includedCompCount} homes selected for review.`,
          tone: "success"
        }
      };
    }
    case "FIND_MORE_COMPARABLES": {
      if (!state.analysisStarted) {
        return {
          ...state,
          toast: {
            title: "Run the analysis first",
            detail: "Enter the property details and run analysis before finding more homes.",
            tone: "review"
          }
        };
      }
      const candidate = findHighestPositiveCandidate(state.snapshot);
      if (!candidate) {
        return {
          ...state,
          newCandidateId: undefined,
          toast: {
            title: "No stronger home available",
            detail: "The remaining homes did not improve the review set.",
            tone: "review"
          }
        };
      }
      return {
        ...state,
        activeComparableId: candidate.id,
        newCandidateId: candidate.id,
        toast: {
          title: "Home surfaced",
          detail: `${candidate.address} is ready for review.`,
          tone: "review"
        }
      };
    }
    case "ADD_CANDIDATE_TO_ANALYSIS": {
      if (!state.analysisStarted) return state;
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
          title: "Home added",
          detail: `${added?.address ?? "Home"} included. Confidence ${formatSigned(confidence)} pts.`,
          tone: "success"
        }
      };
    }
    case "DISMISS_CANDIDATE":
      return { ...state, newCandidateId: undefined };
    case "SELECT_COMPARABLE":
      if (!state.analysisStarted) return state;
      return { ...state, activeComparableId: action.id };
    case "EXCLUDE_COMPARABLE": {
      if (!state.analysisStarted) return state;
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
          title: "Home removed",
          detail: `${snapshot.valuation.includedCompCount} homes remain in the review set.`,
          tone: "review"
        }
      };
    }
    case "SET_VIEW":
      if (!state.analysisStarted && action.view !== "network") {
        return state;
      }
      return { ...state, activeView: action.view };
    case "CLEAR_TOAST":
      return { ...state, toast: undefined };
    default:
      return state;
  }
}

export function usePceAnalysis(candidates: ComparableProperty[] = syntheticComparables) {
  return useReducer(pceAnalysisReducer, undefined, () => createBlankPceState(candidates));
}

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
      candidateSummary: state.analysisStarted ? `${snapshot.sourceScan.candidatePoolCount} homes ranked` : "No homes ranked yet",
      adjustmentSummary: state.analysisStarted ? `${snapshot.valuation.includedCompCount} homes confirmed` : "No homes confirmed yet",
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
      distanceRange: "No homes selected",
      averageMatch: "Awaiting analysis",
      averageComparableProbability: "No homes reviewed yet",
      effectiveSampleSize: "No homes reviewed yet",
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
    averageComparableProbability: `${Math.round(snapshot.valuation.averageComparableProbability * 100)}% average match`,
    effectiveSampleSize: `${snapshot.valuation.effectiveSampleSize} reviewed homes`,
    averageSourceReliability: `${Math.round(snapshot.valuation.averageSourceReliability * 100)}% average`,
    valueSpread: `${snapshot.valuation.valueSpreadPercent}% range spread`,
    sourceScan: snapshot.sourceScan,
    riskFlags: snapshot.riskFlags.length ? snapshot.riskFlags : ["No major review flags in the selected homes."],
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
  if (!state.analysisStarted) {
    return {
      pointEstimate: "Awaiting analysis",
      valueRange: "Awaiting analysis",
      confidence: "Waiting for property details",
      includedCompCount: "No homes selected yet",
      adjustedComparables: [],
      newCandidateId: state.newCandidateId,
      auditEvents: []
    };
  }
  return {
    pointEstimate: formatCurrency(state.snapshot.valuation.pointEstimate),
    valueRange: `${formatCurrency(state.snapshot.valuation.lowEstimate)} - ${formatCurrency(state.snapshot.valuation.highEstimate)}`,
    confidence: `${state.snapshot.valuation.confidenceScore}% ${displayConfidenceLevel(state.snapshot.valuation.confidenceLevel)}`,
    includedCompCount: String(state.snapshot.valuation.includedCompCount),
    adjustedComparables: state.snapshot.valuation.adjustedComparables,
    newCandidateId: state.newCandidateId,
    auditEvents: state.snapshot.auditEvents
  };
}

function displayConfidenceLevel(level: string) {
  return level === "Review Required" ? "Review needed" : level;
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
  if (!comps.length) return "No homes selected";
  const distances = comps.map((comp) => comp.distanceKm).sort((a, b) => a - b);
  return `${distances[0].toFixed(1)}-${distances[distances.length - 1].toFixed(1)} km`;
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(Math.round(value)).toLocaleString()}`;
}
