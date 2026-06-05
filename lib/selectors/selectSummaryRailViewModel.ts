import { formatCurrency } from "../format";
import type { PceAuditEvent } from "../pce/runPcePipeline";
import type { AdjustedComparable } from "../types";
import type { PceAnalysisState } from "../../hooks/usePceAnalysis";
import { displayConfidenceLevel, distanceRange, selectActiveAdjustedComparable } from "./pceSelectors";

export type SummaryRailPage = "intake" | "sources" | "review" | "adjust" | "export";

export type SummaryRailActionId =
  | "run-analysis"
  | "open-sources"
  | "open-review"
  | "explain-review-set"
  | "open-adjustments"
  | "lock-adjustments"
  | "open-export"
  | "generate-export";

export type SummaryRailTone = "confirmed" | "review" | "ready" | "locked" | "neutral";

export type SummaryRailMetric = {
  label: string;
  value: string;
  tone?: SummaryRailTone;
};

export type SummaryRailDetail = {
  id: string;
  label: string;
  count: string;
  rows: SummaryRailMetric[];
  note?: string;
};

export type SummaryRailViewModel = {
  page: SummaryRailPage;
  localOnlyLabel: string;
  decisionSnapshot: {
    rangeLabel: string;
    rangeValue: string;
    metrics: SummaryRailMetric[];
    note: string;
  };
  currentFocus: {
    title: string;
    status?: {
      label: string;
      tone: SummaryRailTone;
    };
    rows: SummaryRailMetric[];
    note?: string;
  };
  nextAction: {
    title: string;
    detail: string;
    buttonLabel: string;
    actionId: SummaryRailActionId;
    disabled?: boolean;
    tone?: SummaryRailTone;
  };
  details: SummaryRailDetail[];
};

type SummaryRailSelectorOptions = {
  page: SummaryRailPage;
  canRunAnalysis: boolean;
  adjustmentsLocked: boolean;
  reportPrepared: boolean;
  subjectDirty: boolean;
  reviewIntelligenceAvailable: boolean;
};

const demoBoundaryNote = "Synthetic/public-style demo data.";

export function selectSummaryRailViewModel(
  state: PceAnalysisState,
  options: SummaryRailSelectorOptions
): SummaryRailViewModel {
  const snapshot = state.snapshot;
  const selectedComparable = selectActiveAdjustedComparable(state);
  const auditEvents = [...snapshot.auditEvents, ...state.uiAuditEvents];
  const decisionSnapshot: SummaryRailViewModel["decisionSnapshot"] = state.analysisStarted
    ? {
        rangeLabel: options.page === "export" ? "Final export range" : "Estimated range",
        rangeValue: `${formatCurrency(snapshot.valuation.lowEstimate)} - ${formatCurrency(snapshot.valuation.highEstimate)}`,
        metrics: [
          { label: "Current estimate", value: formatCurrency(snapshot.valuation.pointEstimate) },
          { label: "Confidence", value: `${Math.round(snapshot.valuation.confidenceScore)}% · ${displayConfidenceLevel(snapshot.valuation.confidenceLevel)}`, tone: confidenceTone(snapshot.valuation.confidenceScore) }
        ],
        note: demoBoundaryNote
      }
    : {
        rangeLabel: "Decision Snapshot",
        rangeValue: "Awaiting analysis",
        metrics: [
          { label: "Source scan", value: options.canRunAnalysis ? "Unlocked" : "Locked", tone: options.canRunAnalysis ? "ready" as const : "locked" as const }
        ],
        note: "No value range appears until the required property fields are complete."
      };

  return {
    page: options.page,
    localOnlyLabel: state.analysisStarted ? "LOCAL ONLY" : "WAITING FOR DETAILS",
    decisionSnapshot,
    currentFocus: buildCurrentFocus(state, options, selectedComparable),
    nextAction: buildNextAction(state, options),
    details: buildDetails(state, options, selectedComparable, auditEvents)
  };
}

function buildCurrentFocus(
  state: PceAnalysisState,
  options: SummaryRailSelectorOptions,
  selectedComparable?: AdjustedComparable
): SummaryRailViewModel["currentFocus"] {
  const snapshot = state.snapshot;
  const activeComp = selectedComparable ?? snapshot.valuation.adjustedComparables[0];
  const adjustmentExceptions = activeComp?.adjustmentLines.filter((line) => line.reviewType === "analyst-reviewed").length ?? 0;

  switch (options.page) {
    case "intake":
      return {
        title: "Current Focus",
        status: { label: options.canRunAnalysis ? "Data ready" : "Fields required", tone: options.canRunAnalysis ? "ready" : "review" },
        rows: [
          { label: "Required fields", value: `${completedRequiredFieldCount(state)} / ${requiredSubjectFields.length} complete`, tone: options.canRunAnalysis ? "confirmed" : "review" },
          { label: "Source scan", value: options.canRunAnalysis ? "Ready to run" : "Locked" },
          { label: "Data boundary", value: "Local demo only" }
        ],
        note: options.canRunAnalysis ? "Run the source scan when ready." : "Complete required fields to unlock source scan."
      };
    case "sources":
      return {
        title: "Current Focus",
        status: { label: state.analysisStarted ? "Source scan complete" : "Waiting", tone: state.analysisStarted ? "confirmed" : "review" },
        rows: [
          { label: "Sources checked", value: `${snapshot.sourceScan.sourcesConsolidated} sources` },
          { label: "Candidate count", value: `${snapshot.sourceScan.candidatePoolCount} ranked comparables` },
          { label: "Data quality", value: `${snapshot.sourceScan.municipalAssessmentReferences} public records matched` }
        ]
      };
    case "review":
      return {
        title: "Current Focus",
        status: activeComp ? { label: "Selected Comparable", tone: "ready" } : { label: "No comparable selected", tone: "review" },
        rows: activeComp
          ? [
              { label: "Address", value: activeComp.address },
              { label: "Comparable probability", value: `${activeComp.comparableProbabilityPercent}%` },
              { label: "Evidence weight", value: `${Math.round((activeComp.normalizedEvidenceWeight ?? activeComp.evidenceWeight) * 100)}%` },
              { label: "Adjusted value", value: formatCurrency(activeComp.adjustedValue) }
            ]
          : [{ label: "Selected comparable", value: "Run analysis first" }]
      };
    case "adjust":
      return {
        title: "Current Focus",
        status: { label: options.adjustmentsLocked ? "Adjustments locked" : "Adjustment review", tone: options.adjustmentsLocked ? "confirmed" : "review" },
        rows: activeComp
          ? [
              { label: "Active comparable", value: activeComp.address },
              { label: "Net adjustment", value: formatSignedCurrency(activeComp.adjustments.total) },
              { label: "Adjustment exceptions", value: `${adjustmentExceptions} analyst-reviewed lines`, tone: adjustmentExceptions ? "review" : "confirmed" }
            ]
          : [{ label: "Active comparable", value: "No comparable selected" }]
      };
    case "export":
      return {
        title: "Package Status",
        status: { label: options.reportPrepared ? "Package generated" : options.adjustmentsLocked ? "Ready to export" : "Needs confirmation", tone: options.reportPrepared ? "confirmed" : options.adjustmentsLocked ? "ready" : "review" },
        rows: [
          { label: "Comparables included", value: `${snapshot.valuation.includedCompCount}` },
          { label: "Sections ready", value: "Memo, comparables, adjustments, audit" },
          { label: "Review Intelligence", value: state.reviewIntelligenceAttachment ? "Attached" : options.reviewIntelligenceAvailable ? "Ready" : "Not attached" }
        ]
      };
  }
}

function buildNextAction(state: PceAnalysisState, options: SummaryRailSelectorOptions): SummaryRailViewModel["nextAction"] {
  if (!state.analysisStarted) {
    return {
      title: "Next Action",
      detail: options.canRunAnalysis ? "Run the local source scan and build the review set." : "Complete required fields to unlock source scan.",
      buttonLabel: "Run analysis",
      actionId: "run-analysis",
      disabled: !options.canRunAnalysis,
      tone: options.canRunAnalysis ? "ready" : "locked"
    };
  }

  if (options.page === "sources") {
    return { title: "Next Action", detail: "Review the ranked comparables and select the evidence set.", buttonLabel: "Review ranked comparables", actionId: "open-review", tone: "ready" };
  }

  if (options.page === "review") {
    return options.reviewIntelligenceAvailable
      ? { title: "Next Action", detail: "Open the Review Intelligence summary before moving to adjustments.", buttonLabel: "Explain review set", actionId: "explain-review-set", tone: "ready" }
      : { title: "Next Action", detail: "Proceed to adjustment review for the selected comparables.", buttonLabel: "Proceed to adjustments", actionId: "open-adjustments", tone: "ready" };
  }

  if (options.page === "adjust") {
    return {
      title: "Next Action",
      detail: options.adjustmentsLocked ? "Adjustments are locked. The export package can be prepared." : "Confirm and lock adjustments before export.",
      buttonLabel: options.adjustmentsLocked ? "Open export package" : "Confirm and lock adjustments",
      actionId: options.adjustmentsLocked ? "open-export" : "lock-adjustments",
      disabled: false,
      tone: options.adjustmentsLocked ? "ready" : "review"
    };
  }

  if (options.page === "export") {
    return {
      title: "Next Action",
      detail: options.subjectDirty
        ? "Property details changed. Refresh the review before exporting."
        : options.adjustmentsLocked
          ? "Export the selected report package from the main export body."
          : "Confirm adjustments before generating the export package.",
      buttonLabel: options.reportPrepared ? "Export package ready" : "Generate export package",
      actionId: "generate-export",
      disabled: options.subjectDirty || !options.adjustmentsLocked,
      tone: options.reportPrepared ? "confirmed" : options.adjustmentsLocked ? "ready" : "review"
    };
  }

  return { title: "Next Action", detail: "Open the source scan summary.", buttonLabel: "Open sources", actionId: "open-sources", tone: "ready" };
}

function buildDetails(
  state: PceAnalysisState,
  options: SummaryRailSelectorOptions,
  selectedComparable: AdjustedComparable | undefined,
  auditEvents: PceAuditEvent[]
): SummaryRailDetail[] {
  const snapshot = state.snapshot;
  const riskFlags = snapshot.riskFlags;
  const activeComp = selectedComparable ?? snapshot.valuation.adjustedComparables[0];
  const sourceScan = snapshot.sourceScan;
  const details: SummaryRailDetail[] = [
    {
      id: "source-summary",
      label: "Source summary",
      count: `${sourceScan.sourcesConsolidated} sources`,
      rows: [
        { label: "Comparables scanned", value: `${sourceScan.syntheticRecentSalesScanned} simulated records` },
        { label: "Public records matched", value: `${sourceScan.municipalAssessmentReferences} matched` },
        { label: "Comparables to review", value: `${sourceScan.candidatePoolCount} ranked / ${sourceScan.rejectedCount} lower-ranked` },
        { label: "Estimated time saved", value: `${sourceScan.estimatedManualTimeSavedHours} hrs` }
      ],
      note: sourceScan.dataBoundaryNote
    },
    {
      id: "review-flags",
      label: "Review flags",
      count: String(riskFlags.length),
      rows: riskFlags.length
        ? riskFlags.slice(0, 5).map((flag) => ({ label: flag, value: "Analyst review", tone: "review" as const }))
        : [{ label: "Review flags", value: "No major review flags", tone: "confirmed" }]
    },
    {
      id: "recent-activity",
      label: "Recent activity",
      count: String(auditEvents.length),
      rows: auditEvents.length
        ? auditEvents.slice(0, 5).map((event) => ({ label: formatAuditEventType(event.type), value: event.summary, tone: event.status === "confirmed" ? "confirmed" : event.status === "ready" ? "ready" : "review" }))
        : [{ label: "Recent activity", value: "No activity yet" }]
    },
    {
      id: "review-intelligence",
      label: "Review Intelligence",
      count: state.reviewIntelligenceAttachment ? "Attached" : options.reviewIntelligenceAvailable ? "Ready" : "Not attached",
      rows: [
        { label: "Status", value: state.reviewIntelligenceAttachment ? "Attached to memo/export" : options.reviewIntelligenceAvailable ? "Ready to inspect" : "Run analysis first", tone: state.reviewIntelligenceAttachment ? "confirmed" : options.reviewIntelligenceAvailable ? "ready" : "locked" },
        { label: "Boundary", value: "Summary only. No raw agent reasoning trace." }
      ]
    },
    {
      id: "audit-trail",
      label: "Audit trail",
      count: `${auditEvents.length} events`,
      rows: [
        { label: "Audit events", value: `${auditEvents.length}` },
        { label: "Review status", value: options.adjustmentsLocked ? "Adjustments locked" : "Analyst review required", tone: options.adjustmentsLocked ? "confirmed" : "review" }
      ]
    }
  ];

  if (options.page === "review" && activeComp) {
    details.unshift({
      id: "match-factors",
      label: "Key match factors",
      count: "6 factors",
      rows: [
        { label: "Location fit", value: distanceRange(snapshot.valuation.adjustedComparables), tone: "confirmed" },
        { label: "Average match", value: `${snapshot.valuation.averageSimilarity}/100`, tone: snapshot.valuation.averageSimilarity >= 70 ? "confirmed" : "review" },
        { label: "Comparable probability", value: `${Math.round(snapshot.valuation.averageComparableProbability * 100)}% average` },
        { label: "Review size", value: `${snapshot.valuation.effectiveSampleSize} reviewed comparables` },
        { label: "Source quality", value: `${Math.round(snapshot.valuation.averageSourceReliability * 100)}% average` },
        { label: "Value range width", value: `${snapshot.valuation.valueSpreadPercent}% range spread`, tone: snapshot.valuation.riskFlags.includes("Wide adjusted-value spread") ? "review" : "confirmed" }
      ]
    });
  }

  if (options.page === "adjust" && activeComp) {
    details.unshift({
      id: "adjustment-detail",
      label: "Adjustment detail",
      count: `${activeComp.adjustmentLines.length} lines`,
      rows: [
        { label: "Top positive", value: adjustmentLineSummary(activeComp, "positive") },
        { label: "Top penalty", value: adjustmentLineSummary(activeComp, "negative") },
        { label: "Adjusted value", value: formatCurrency(activeComp.adjustedValue) }
      ]
    });
  }

  return details;
}

const requiredSubjectFields = [
  "address",
  "city",
  "neighbourhood",
  "yearBuilt",
  "bedrooms",
  "bathrooms",
  "livingAreaSqft",
  "latitude",
  "longitude"
] as const;

function completedRequiredFieldCount(state: PceAnalysisState) {
  return requiredSubjectFields.filter((field) => {
    const value = state.subject[field];
    if (typeof value === "number") {
      return value !== 0;
    }
    return Boolean(String(value ?? "").trim());
  }).length;
}

function confidenceTone(score: number): SummaryRailTone {
  if (score >= 70) return "confirmed";
  if (score >= 60) return "review";
  return "review";
}

function formatSignedCurrency(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function adjustmentLineSummary(comp: AdjustedComparable, direction: "positive" | "negative") {
  const line = comp.adjustmentLines
    .filter((item) => direction === "positive" ? item.amount > 0 : item.amount < 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];

  return line ? `${line.label}: ${formatSignedCurrency(line.amount)}` : "None";
}

function formatAuditEventType(value: PceAuditEvent["type"]) {
  return value.replace(/_/g, " ");
}
