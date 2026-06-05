"use client";

import { useReducer } from "react";
import { syntheticComparables } from "../lib/mockData";
import { runPcePipeline, type PceAnalysisSnapshot } from "../lib/pce/runPcePipeline";
import type { ReviewIntelligenceAttachment } from "../lib/review-intelligence/types";
import type { ComparableProperty, SubjectProperty } from "../lib/types";
import { findHighestPositiveCandidate } from "../lib/selectors/pceSelectors";

export type PceViewMode = "network" | "discovery" | "table" | "adjustments" | "valuation" | "report" | "memo" | "sources";
import type { ValuationDelta } from "../packages/core/types";
export type PceToast = { title: string; detail: string; tone: "success" | "review"; delta?: ValuationDelta };

export type PceAnalysisState = {
  subject: SubjectProperty;
  candidates: ComparableProperty[];
  selectedComparableIds: string[];
  activeComparableId?: string;
  newCandidateId?: string;
  snapshot: PceAnalysisSnapshot;
  activeView: PceViewMode;
  analysisStarted: boolean;
  reviewIntelligenceAttachment?: ReviewIntelligenceAttachment;
  uiAuditEvents: PceAnalysisSnapshot["auditEvents"];
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
  | { type: "ATTACH_REVIEW_INTELLIGENCE"; attachment: ReviewIntelligenceAttachment }
  | { type: "APPEND_UI_AUDIT_EVENT"; event: PceAnalysisSnapshot["auditEvents"][number] }
  | { type: "CLEAR_REVIEW_INTELLIGENCE_ATTACHMENT" }
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
    analysisStarted: true,
    reviewIntelligenceAttachment: undefined,
    uiAuditEvents: []
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
    analysisStarted: false,
    reviewIntelligenceAttachment: undefined,
    uiAuditEvents: []
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
        reviewIntelligenceAttachment: state.analysisStarted ? undefined : state.reviewIntelligenceAttachment,
        uiAuditEvents: state.analysisStarted ? [] : state.uiAuditEvents,
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
        reviewIntelligenceAttachment: undefined,
        uiAuditEvents: [],
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
        reviewIntelligenceAttachment: undefined,
        uiAuditEvents: [],
        toast: {
          title: "Analysis complete",
          detail: `${snapshot.valuation.includedCompCount} comparables selected for review.`,
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
            title: "No stronger comparable available",
            detail: "The remaining comparables did not improve the review set.",
            tone: "review"
          }
        };
      }
      return {
        ...state,
        activeComparableId: candidate.id,
        newCandidateId: candidate.id,
        toast: {
          title: "Comparable surfaced",
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
      return {
        ...state,
        selectedComparableIds,
        activeComparableId: state.newCandidateId,
        newCandidateId: undefined,
        snapshot,
        activeView: "network",
        reviewIntelligenceAttachment: undefined,
        uiAuditEvents: [],
        toast: {
          title: "New comparable found",
          detail: `${added?.address ?? "Home"} included.`,
          tone: "success",
          delta: snapshot.valuationDelta
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
        reviewIntelligenceAttachment: undefined,
        uiAuditEvents: [],
        toast: {
          title: "Comparable removed",
          detail: `${snapshot.valuation.includedCompCount} comparables remain in the review set.`,
          tone: "review"
        }
      };
    }
    case "SET_VIEW":
      if (!state.analysisStarted && action.view !== "network") {
        return state;
      }
      return { ...state, activeView: action.view };
    case "ATTACH_REVIEW_INTELLIGENCE": {
      const timestamp = action.attachment.attachedAt;
      return {
        ...state,
        reviewIntelligenceAttachment: action.attachment,
        uiAuditEvents: [
          ...state.uiAuditEvents.filter((event) => event.type !== "review_intelligence_v2_added_to_memo"),
          {
            id: `review-intelligence-v2-added-to-memo-${timestamp}`,
            timestamp,
            type: "review_intelligence_v2_added_to_memo",
            source: "Review Intelligence V2",
            status: "ready",
            summary: "Verified review intelligence summary attached to the memo and export package."
          }
        ],
        toast: {
          title: "Review Intelligence attached",
          detail: "The verified summary is now included in the memo-ready export path.",
          tone: "success"
        }
      };
    }
    case "APPEND_UI_AUDIT_EVENT":
      if (state.uiAuditEvents.some((event) => event.id === action.event.id)) {
        return state;
      }
      return {
        ...state,
        uiAuditEvents: [...state.uiAuditEvents, action.event]
      };
    case "CLEAR_REVIEW_INTELLIGENCE_ATTACHMENT":
      if (!state.reviewIntelligenceAttachment && !state.uiAuditEvents.length) {
        return state;
      }
      return {
        ...state,
        reviewIntelligenceAttachment: undefined,
        uiAuditEvents: []
      };
    case "CLEAR_TOAST":
      return { ...state, toast: undefined };
    default:
      return state;
  }
}

export function usePceAnalysis(candidates: ComparableProperty[] = syntheticComparables) {
  return useReducer(pceAnalysisReducer, undefined, () => createBlankPceState(candidates));
}

