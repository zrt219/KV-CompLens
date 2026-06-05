"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, CSSProperties, FocusEvent, MutableRefObject } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import {
  BarChart3,
  ChevronRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileDown,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Grid3X3,
  Home as HomeIcon,
  Info,
  Eye,
  PackageCheck,
  Printer,
  Layers3,
  ListChecks,
  Lock,
  MoreHorizontal,
  RotateCcw,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  SquareCheck,
  Star,
  Target,
  X
} from "lucide-react";
import { PropertyThumbnail } from "../components/PropertyThumbnail";
import { EvidenceBoard } from "../components/evidence-board/EvidenceBoard";
import { SummaryRail } from "../components/right-rail/SummaryRail";
import { QuickAnswersPanel } from "../components/quick-answers/QuickAnswersPanel";
import { ReviewIntelligenceV2Button } from "../components/review-intelligence-v2/ReviewIntelligenceV2Button";
import { ReviewIntelligenceV2Drawer } from "../components/review-intelligence-v2/ReviewIntelligenceV2Drawer";
import { formatCurrency } from "../../lib/agent";
import { buildEvidenceCourtPacket } from "../../lib/review-intelligence-v2/buildEvidenceCourtPacket";
import { runEvidenceCourt } from "../../lib/review-intelligence-v2/runEvidenceCourt";
import { dataProvenanceLabel, publicAssessmentSources } from "../../lib/provenance";
import { buildExportPacket } from "../../lib/export/buildExportPacket";
import { createExportFileNames } from "../../lib/export/fileNaming";
import { runExport } from "../../lib/export/runExport";
import { openPrintReport } from "../../lib/export/html/openPrintReport";
import { CopyReportFallback } from "../../components/export/CopyReportFallback";
import { BuilderAttribution } from "../../components/social/BuilderAttribution";
import type { ExportOptions, ExportPacket, ExportRunResult } from "../../lib/export/types";
import type { ReviewIntelligenceAttachment } from "../../lib/review-intelligence/types";
import {
  selectAdjustmentGridViewModel,
  selectCivicGridViewModel,
  selectExportViewModel
} from "../../lib/selectors/pceSelectors";
import { selectSummaryRailViewModel, type SummaryRailActionId } from "../../lib/selectors/selectSummaryRailViewModel";
import { selectQuickAnswers } from "../../lib/selectors/selectQuickAnswers";
import {
  createBlankSubjectProperty,
  isSubjectReadyForAnalysis,
  usePceAnalysis,
  type PceToast,
  type PceViewMode
} from "../../hooks/usePceAnalysis";
import type { PceAnalysisSnapshot } from "../../lib/pce/runPcePipeline";
import type { AdjustedComparable, CandidateImpact, PropertyCondition, PropertyType, ScoredComparable, SubjectProperty, ValuationDelta, ValuationRange } from "../../lib/types";
import type { CounterfactualCheck, EvidenceCourtPacket, EvidenceCourtResult } from "../../lib/review-intelligence-v2/types";

type ViewMode = PceViewMode;
type ToastState = PceToast;
type WorkflowStepId = "intake" | "sources" | "review" | "adjust" | "export";
type ReviewIntelligenceApiResponse = {
  result: EvidenceCourtResult;
  fallbackUsed: boolean;
  warnings: string[];
};

import { defaultMockSubject, propertyTypes, conditions, cities } from "../../lib/mockData";

const workflowNavItems: Array<{ id: WorkflowStepId; label: string; icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }> }> = [
  { id: "intake", label: "Intake", icon: HomeIcon },
  { id: "sources", label: "Sources", icon: ListChecks },
  { id: "review", label: "Review", icon: Layers3 },
  { id: "adjust", label: "Adjust", icon: Grid3X3 },
  { id: "export", label: "Export", icon: FileDown }
];

export default function Home() {
  const [state, dispatch] = usePceAnalysis();
  const [showForm, setShowForm] = useState(true);
  const [reportPrepared, setReportPrepared] = useState(false);
  const [adjustmentsLocked, setAdjustmentsLocked] = useState(false);
  const [readabilityMode, setReadabilityMode] = useState(false);
  const [reviewIntelligenceOpen, setReviewIntelligenceOpen] = useState(false);
  const [enhancedReviewIntelligenceState, setEnhancedReviewIntelligenceState] = useState<{ packetId: string; result: EvidenceCourtResult }>();
  const [workflowPulse, setWorkflowPulse] = useState<string>();
  const [demoRouteRequested, setDemoRouteRequested] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1");
  const workflowPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primaryExportActionRef = useRef<(() => void) | null>(null);
  const subject = state.subject;
  const canRunAnalysis = isSubjectReadyForAnalysis(subject);
  const subjectDisplayName = subject.address.trim() || "No property entered";
  const subjectDisplayMeta = canRunAnalysis
    ? "Ready for the source scan"
    : "Enter property details to unlock the source scan";
  const viewMode = state.activeView;
  const civicGrid = selectCivicGridViewModel(state);
  const adjustmentGrid = selectAdjustmentGridViewModel(state);
  const exportView = selectExportViewModel(state);
  const candidate = civicGrid.candidate;
  const reviewIntelligencePacket = useMemo<EvidenceCourtPacket | undefined>(
    () => state.analysisStarted ? buildEvidenceCourtPacket(state.snapshot) : undefined,
    [state.analysisStarted, state.snapshot]
  );
  const deterministicReviewIntelligenceResult = useMemo<EvidenceCourtResult | undefined>(
    () => state.analysisStarted ? runEvidenceCourt(state.snapshot) : undefined,
    [state.analysisStarted, state.snapshot]
  );
  const activeEnhancedReviewIntelligence = enhancedReviewIntelligenceState?.packetId === reviewIntelligencePacket?.packetId
    ? enhancedReviewIntelligenceState?.result
    : undefined;
  const reviewIntelligenceResult = activeEnhancedReviewIntelligence
    ? activeEnhancedReviewIntelligence
    : deterministicReviewIntelligenceResult;
  const demoAutoReviewVisible = demoRouteRequested && state.analysisStarted;
  const intakeVisible = showForm && !demoAutoReviewVisible;
  const counterfactualsByComparableId = useMemo<Record<string, CounterfactualCheck | undefined>>(
    () => Object.fromEntries((reviewIntelligenceResult?.counterfactuals ?? [])
      .filter((check) => Boolean(check.comparableId))
      .map((check) => [check.comparableId as string, check])),
    [reviewIntelligenceResult]
  );
  const workflowStep = getWorkflowStepId(viewMode, intakeVisible, state.analysisStarted);
  const reviewIntelligenceDrawerVisible = reviewIntelligenceOpen
    && state.analysisStarted
    && workflowStep === "review"
    && Boolean(reviewIntelligencePacket)
    && Boolean(deterministicReviewIntelligenceResult);
  const activeNavId = workflowStep;
  const candidateDrawerVisible = state.analysisStarted && !intakeVisible && (viewMode === "network" || viewMode === "discovery") && Boolean(state.newCandidateId) && Boolean(candidate);
  const subjectDirty = useMemo(
    () => state.analysisStarted && JSON.stringify(state.subject) !== JSON.stringify(state.snapshot.subject),
    [state.analysisStarted, state.snapshot.subject, state.subject]
  );
  const workflowStatus = getWorkflowStatus({
    analysisStarted: state.analysisStarted,
    canRunAnalysis,
    subjectDirty,
    adjustmentsLocked,
    workflowPulse,
    reportPrepared,
    workflowStep
  });
  const StatusIcon = workflowStatus.icon;
  const summaryRail = selectSummaryRailViewModel(state, {
    page: workflowStep,
    canRunAnalysis,
    adjustmentsLocked,
    reportPrepared,
    subjectDirty,
    reviewIntelligenceAvailable: Boolean(reviewIntelligenceResult)
  });
  const quickAnswers = selectQuickAnswers(state, {
    page: workflowStep,
    canRunAnalysis,
    adjustmentsLocked,
    reportPrepared,
    subjectDirty
  });

  useEffect(() => () => {
    if (workflowPulseTimer.current) {
      clearTimeout(workflowPulseTimer.current);
    }
  }, []);

  useEffect(() => {
    if (!demoRouteRequested || state.analysisStarted) {
      return;
    }
    dispatch({ type: "LOAD_DEMO_REVIEW" });
  }, [demoRouteRequested, dispatch, state.analysisStarted]);

  useEffect(() => {
    if (!reviewIntelligenceDrawerVisible || !reviewIntelligencePacket || !deterministicReviewIntelligenceResult) {
      return;
    }

    const lifecycleKey = reviewIntelligencePacket.packetId;
    dispatch({
      type: "APPEND_UI_AUDIT_EVENT",
      event: {
        id: `review-evidence-pack-built-${lifecycleKey}`,
        timestamp: reviewIntelligencePacket.generatedAt,
        type: "review_evidence_pack_built",
        source: "RAG evidence pack",
        status: "confirmed",
        summary: "Review evidence pack built from the current PCE-V2 snapshot."
      }
    });
    dispatch({
      type: "APPEND_UI_AUDIT_EVENT",
      event: {
        id: `review-context-retrieved-${lifecycleKey}`,
        timestamp: reviewIntelligencePacket.generatedAt,
        type: "review_context_retrieved",
        source: "RAG retriever",
        status: "confirmed",
        summary: "Retrieved focused review-set context from canonical packet facts."
      }
    });
    dispatch({
      type: "APPEND_UI_AUDIT_EVENT",
      event: {
        id: `review-insight-generated-${lifecycleKey}`,
        timestamp: reviewIntelligencePacket.generatedAt,
        type: "review_insight_generated",
        source: "Deterministic review intelligence",
        status: "ready",
        summary: "Generated a deterministic review insight from retrieved facts."
      }
    });
    dispatch({
      type: "APPEND_UI_AUDIT_EVENT",
      event: {
        id: `review-insight-verified-${lifecycleKey}`,
        timestamp: reviewIntelligencePacket.generatedAt,
        type: "review_insight_verified",
        source: "Verifier",
        status: deterministicReviewIntelligenceResult.verification.ok ? "confirmed" : "review",
        summary: deterministicReviewIntelligenceResult.verification.ok
          ? "Verified deterministic review insight against retrieved facts."
          : "Deterministic review insight raised verifier warnings."
      }
    });

    let cancelled = false;

    async function enhanceReviewIntelligence() {
      try {
        const response = await fetch("/api/review-intelligence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            snapshot: state.snapshot,
            intent: "review_set_summary"
          })
        });

        if (!response.ok) {
          if (!cancelled) {
            dispatch({
              type: "APPEND_UI_AUDIT_EVENT",
              event: {
                id: `review-insight-fallback-used-${lifecycleKey}`,
                timestamp: new Date().toISOString(),
                type: "review_insight_fallback_used",
                source: "Review Intelligence V2",
                status: "review",
                summary: `Optional review-intelligence enhancer returned ${response.status}. Deterministic fallback remained active.`
              }
            });
          }
          return;
        }

        const payload = await response.json() as ReviewIntelligenceApiResponse;
        if (cancelled) {
          return;
        }
        if (payload.result?.source === "llm_verified") {
          setEnhancedReviewIntelligenceState({
            packetId: lifecycleKey,
            result: payload.result
          });
          dispatch({
            type: "APPEND_UI_AUDIT_EVENT",
            event: {
              id: `review-insight-verified-llm-${lifecycleKey}`,
              timestamp: new Date().toISOString(),
              type: "review_insight_verified",
              source: "OpenAI enhancer",
              status: "confirmed",
              summary: "Optional LLM narrative passed verification and replaced the deterministic summary copy."
            }
          });
        }
        if (payload.fallbackUsed) {
          dispatch({
            type: "APPEND_UI_AUDIT_EVENT",
            event: {
              id: `review-insight-fallback-used-${lifecycleKey}`,
              timestamp: new Date().toISOString(),
              type: "review_insight_fallback_used",
              source: "Review Intelligence V2",
              status: "review",
              summary: "Optional LLM narrative failed verification or was unavailable. Deterministic fallback remained active."
            }
          });
        }
      } catch {
        if (!cancelled) {
          dispatch({
            type: "APPEND_UI_AUDIT_EVENT",
            event: {
              id: `review-insight-fallback-used-${lifecycleKey}`,
              timestamp: new Date().toISOString(),
              type: "review_insight_fallback_used",
              source: "Review Intelligence V2",
              status: "review",
              summary: "Optional LLM narrative request failed. Deterministic fallback remained active."
            }
          });
        }
      }
    }

    void enhanceReviewIntelligence();

    return () => {
      cancelled = true;
    };
  }, [
    deterministicReviewIntelligenceResult,
    dispatch,
    reviewIntelligenceDrawerVisible,
    reviewIntelligencePacket,
    state.snapshot
  ]);

  function update<K extends keyof SubjectProperty>(key: K, value: SubjectProperty[K]) {
    dispatch({ type: "UPDATE_SUBJECT", key, value });
    setReportPrepared(false);
    setAdjustmentsLocked(false);
  }

  function pulseWorkflowStatus(message: string) {
    if (workflowPulseTimer.current) {
      clearTimeout(workflowPulseTimer.current);
    }
    setWorkflowPulse(message);
    workflowPulseTimer.current = setTimeout(() => setWorkflowPulse(undefined), 1100);
  }

  function runAnalysis() {
    dispatch({ type: "RUN_ANALYSIS" });
    if (!canRunAnalysis) {
      setShowForm(true);
      return;
    }
    pulseWorkflowStatus("Running analysis");
    setShowForm(false);
    setReportPrepared(false);
    setAdjustmentsLocked(false);
    dispatch({ type: "SET_VIEW", view: "table" });
  }

  function goToNextStep() {
    if (!state.analysisStarted) {
      if (canRunAnalysis) {
        runAnalysis();
      } else {
        openSubjectIntake();
      }
      return;
    }
    if (workflowStep === "adjust") {
      prepareReport();
      return;
    }
    if (workflowStep === "export") {
      if (primaryExportActionRef.current) {
        primaryExportActionRef.current();
      } else {
        setReportPrepared(true);
        pulseWorkflowStatus("Export package generated");
      }
      return;
    }
    const nextStep: Record<WorkflowStepId, ViewMode> = {
      intake: "table",
      sources: "network",
      review: "adjustments",
      adjust: "report",
      export: "report"
    };
    const next = nextStep[workflowStep];
    if (next) {
      openWorkspaceView(next);
    }
  }

  function findMoreComparables() {
    if (!state.analysisStarted) {
      openSubjectIntake();
      return;
    }
    dispatch({ type: "FIND_MORE_COMPARABLES" });
  }

  function addCandidate() {
    dispatch({ type: "ADD_CANDIDATE_TO_ANALYSIS" });
    setReportPrepared(false);
    setAdjustmentsLocked(false);
  }

  function openSubjectIntake() {
    setDemoRouteRequested(false);
    setShowForm(true);
  }

  function openWorkspaceView(view: ViewMode) {
    if (!state.analysisStarted) {
      setShowForm(true);
      return;
    }
    setShowForm(false);
    dispatch({ type: "SET_VIEW", view });
  }

  function prepareReport() {
    if (!state.analysisStarted) {
      openSubjectIntake();
      return;
    }
    if (subjectDirty) {
      openSubjectIntake();
      return;
    }
    if (!adjustmentsLocked) {
      openWorkspaceView("adjustments");
      return;
    }
    setShowForm(false);
    dispatch({ type: "SET_VIEW", view: "report" });
  }

  function handleSummaryRailAction(actionId: SummaryRailActionId) {
    switch (actionId) {
      case "run-analysis":
        runAnalysis();
        return;
      case "open-sources":
        openWorkspaceView("table");
        return;
      case "open-review":
        openWorkspaceView("network");
        return;
      case "explain-review-set":
        if (reviewIntelligenceResult) {
          setShowForm(false);
          dispatch({ type: "SET_VIEW", view: "network" });
          setReviewIntelligenceOpen(true);
        } else {
          openWorkspaceView("network");
        }
        return;
      case "open-adjustments":
        openWorkspaceView("adjustments");
        return;
      case "lock-adjustments":
        if (state.analysisStarted) {
          setAdjustmentsLocked(true);
          pulseWorkflowStatus("Adjustments locked");
        }
        return;
      case "open-export":
        prepareReport();
        return;
      case "generate-export":
        if (subjectDirty) {
          openSubjectIntake();
          return;
        }
        if (!adjustmentsLocked) {
          openWorkspaceView("adjustments");
          return;
        }
        setShowForm(false);
        dispatch({ type: "SET_VIEW", view: "report" });
        if (primaryExportActionRef.current) {
          primaryExportActionRef.current();
        } else {
          setReportPrepared(true);
          pulseWorkflowStatus("Export package generated");
        }
        return;
    }
  }

  function loadExampleSubject() {
    setDemoRouteRequested(false);
    dispatch({ type: "LOAD_SUBJECT", subject: defaultMockSubject });
    setReportPrepared(false);
    setAdjustmentsLocked(false);
    setShowForm(true);
  }

  function resetSubject() {
    setDemoRouteRequested(false);
    dispatch({ type: "LOAD_SUBJECT", subject: createBlankSubjectProperty() });
    setReportPrepared(false);
    setAdjustmentsLocked(false);
    setShowForm(true);
    pulseWorkflowStatus("Property intake reset");
  }

  return (
    <main className={clsx("app-shell", readabilityMode && "readability-mode", state.toast && "has-toast")}>
      <aside className="left-rail" aria-label="Workspace navigation">
        <div className="brand-lockup">
          <div className="brand-icon" aria-hidden="true">
            <BrandMark />
          </div>
          <div className="brand-copy">
            <h1>KV CompLens</h1>
            <p>Property review</p>
          </div>
        </div>
        <button className="project-picker tooltip-target" type="button" onClick={openSubjectIntake} title="Open the property intake form." data-tooltip="Open the property intake form." data-tooltip-position="right">
          <span>Current Property</span>
          <strong>{subjectDisplayName}</strong>
          <small>{subjectDisplayMeta}</small>
        </button>
        <nav className="nav-list">
          {workflowNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeNavId;
            const disabled = item.id !== "intake" && (!state.analysisStarted || (item.id === "export" && !adjustmentsLocked));
            return (
              <button
                key={item.id}
                className={clsx("tooltip-target", active && "active", disabled && "disabled")}
                aria-current={active ? "page" : undefined}
                type="button"
                disabled={disabled}
                aria-disabled={disabled}
                title={disabled ? (item.id === "export" ? "Lock the adjustments before opening export." : "Enter subject details and run the initial scan first.") : `Open ${item.label}.`}
                data-tooltip={disabled ? (item.id === "export" ? "Lock the adjustments before opening export." : "Enter subject details and run the initial scan first.") : `Open ${item.label}.`}
                data-tooltip-position="right"
                onClick={() => item.id === "intake" ? openSubjectIntake() : openWorkspaceView(workflowStepToView(item.id))}
              >
                <Icon size={18} aria-hidden />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="rail-footer">
          <span className="data-chip">LOCAL ONLY</span>
          <span className="data-chip">SIMULATED HOME SALES</span>
          <small>{dataProvenanceLabel}</small>
          <small><Database size={13} /> {publicAssessmentSources.length} public assessment references documented.</small>
          <BuilderAttribution />
        </div>
      </aside>

      <section className="main-stage" aria-label="Property review workspace">
        <header className="stage-header">
          <div className="stage-title-copy">
            <h2>{titleForView(viewMode, intakeVisible)}</h2>
            {state.analysisStarted && <p>{subject.address || subjectDisplayName} / local demo snapshot</p>}
            <div className="stage-status-row" aria-live="polite">
              <span className={clsx("status-chip tooltip-target", workflowStatus.tone)} title={workflowStatus.detail} data-tooltip={workflowStatus.detail}>
                <StatusIcon size={14} aria-hidden />
                {workflowStatus.label}
              </span>
              <p>{workflowStatus.detail}</p>
            </div>
          </div>
          <div className="actions">
            <button className="find-action tooltip-target" type="button" onClick={findMoreComparables} disabled={!state.analysisStarted} title={!state.analysisStarted ? "Run the analysis first to find more comparable candidates." : "Surface another comparable candidate for analyst review."} data-tooltip={!state.analysisStarted ? "Run the analysis first to find more comparable candidates." : "Surface another comparable candidate for analyst review."}><Search size={17} /> Find More Comparables</button>
            {state.analysisStarted && workflowStep === "review" && reviewIntelligenceResult && (
              <ReviewIntelligenceV2Button
                attached={Boolean(state.reviewIntelligenceAttachment)}
                onClick={() => setReviewIntelligenceOpen(true)}
              />
            )}
            <button className="edit-action tooltip-target" type="button" onClick={() => setShowForm(true)} title="Return to intake and edit the current property details." data-tooltip="Return to intake and edit the current property details."><SlidersHorizontal size={17} /> Edit Property</button>
            <button className="tooltip-target" type="button" onClick={prepareReport} disabled={!state.analysisStarted || !adjustmentsLocked} title={!state.analysisStarted ? "Enter the property details and run the analysis first." : !adjustmentsLocked ? "Confirm the adjustments before exporting." : "Open the local export package screen."} data-tooltip={!state.analysisStarted ? "Enter the property details and run the analysis first." : !adjustmentsLocked ? "Confirm the adjustments before exporting." : "Open the local export package screen."}><FileDown size={17} /> Export</button>
            <button className={clsx("icon-action tooltip-target", readabilityMode && "active")} type="button" aria-pressed={readabilityMode} aria-label="Toggle readability mode" title="Toggle higher-contrast readability mode." data-tooltip="Toggle higher-contrast readability mode." onClick={() => setReadabilityMode((value) => !value)}><Eye size={18} /></button>
            <button className="icon-action tooltip-target" type="button" aria-label="More actions unavailable in demo mode" disabled title="More actions are unavailable in this local demo." data-tooltip="More actions are unavailable in this local demo."><MoreHorizontal size={18} /></button>
            <button className="primary-action tooltip-target" type="button" onClick={goToNextStep} disabled={(!canRunAnalysis && !state.analysisStarted) || (workflowStep === "adjust" && !adjustmentsLocked)} title={primaryActionCopy(workflowStep, state.analysisStarted, canRunAnalysis, adjustmentsLocked).tooltip} data-tooltip={primaryActionCopy(workflowStep, state.analysisStarted, canRunAnalysis, adjustmentsLocked).tooltip}>
              {!state.analysisStarted ? <RefreshCw size={17} /> : <ChevronRight size={17} />}
              {primaryActionCopy(workflowStep, state.analysisStarted, canRunAnalysis, adjustmentsLocked).label}
            </button>
          </div>
        </header>

        <WorkflowProgress viewModel={civicGrid.workflow} workflowStep={workflowStep} analysisStarted={state.analysisStarted} />
        <QuickAnswersPanel viewModel={quickAnswers} />
        {intakeVisible ? (
          <SubjectForm
            subject={subject}
            dirty={subjectDirty}
            canRunAnalysis={canRunAnalysis}
            analysisStarted={state.analysisStarted}
            update={update}
            runAnalysis={runAnalysis}
            loadExample={loadExampleSubject}
            resetSubject={resetSubject}
          />
        ) : (
          <>
            {viewMode === "network" && (
              <EvidenceBoard
                subject={civicGrid.subject}
                selectedComparables={civicGrid.selectedComparables}
                remainingCandidates={state.snapshot.remainingCandidates}
                activeComparableId={civicGrid.activeComparableId}
                newCandidateId={state.newCandidateId}
                valuation={state.snapshot.valuation}
                reviewEvidencePacket={reviewIntelligencePacket}
                counterfactualsByComparableId={counterfactualsByComparableId}
                onSelectComparable={(id) => dispatch({ type: "SELECT_COMPARABLE", id })}
                onFindCandidate={findMoreComparables}
                onRunAnalysis={runAnalysis}
              />
            )}
            {viewMode === "discovery" && <DiscoveryView subject={civicGrid.subject} ranked={civicGrid.rankedComparables} rejected={civicGrid.rejectedComparables} selectedIds={civicGrid.selectedIds} activeComparableId={state.activeComparableId} candidate={candidate} newCompId={state.newCandidateId} onSelect={(id) => dispatch({ type: "SELECT_COMPARABLE", id })} onFindMore={findMoreComparables} />}
            {viewMode === "table" && <SourceScanView snapshot={state.snapshot} onRunAnalysis={runAnalysis} />}
            {viewMode === "adjustments" && <AdjustmentView viewModel={adjustmentGrid} adjustmentsLocked={adjustmentsLocked} onSelect={(id) => dispatch({ type: "SELECT_COMPARABLE", id })} onExclude={(id) => { dispatch({ type: "EXCLUDE_COMPARABLE", id }); setReportPrepared(false); setAdjustmentsLocked(false); }} onLock={() => { setAdjustmentsLocked(true); }} />}
            {viewMode === "valuation" && <ValuationSummary snapshot={state.snapshot} newCompId={state.newCandidateId} />}
            {viewMode === "report" && <ReportReady viewModel={exportView} subject={state.snapshot.subject} snapshot={state.snapshot} reportPrepared={reportPrepared} subjectDirty={subjectDirty} adjustmentsLocked={adjustmentsLocked} reviewIntelligenceResult={reviewIntelligenceResult} primaryExportActionRef={primaryExportActionRef} onOpenIntake={openSubjectIntake} onOpenAdjustments={() => openWorkspaceView("adjustments")} onGenerate={() => { setReportPrepared(true); pulseWorkflowStatus("Export package generated"); }} />}
          </>
        )}

        <AnimatePresence>
          {candidateDrawerVisible && candidate && (
            <ComparableDrawer
              candidate={candidate}
              impact={civicGrid.candidateImpact}
              onClose={() => dispatch({ type: "DISMISS_CANDIDATE" })}
              onAdd={addCandidate}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state.toast && (
            <Toast
              key={`${state.toast.tone}-${state.toast.title}-${state.toast.detail}-${state.toast.delta ? "delta" : "simple"}`}
              toast={state.toast}
              onClose={() => dispatch({ type: "CLEAR_TOAST" })}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reviewIntelligenceDrawerVisible && reviewIntelligencePacket && reviewIntelligenceResult && (
            <ReviewIntelligenceV2Drawer
              packet={reviewIntelligencePacket}
              result={reviewIntelligenceResult}
              attached={Boolean(state.reviewIntelligenceAttachment)}
              onAddToMemo={() => {
                const attachment: ReviewIntelligenceAttachment = {
                  attachedAt: new Date().toISOString(),
                  context: reviewIntelligenceResult.context,
                  insight: reviewIntelligenceResult.insight,
                  source: reviewIntelligenceResult.source,
                  verification: reviewIntelligenceResult.verification
                };
                dispatch({ type: "ATTACH_REVIEW_INTELLIGENCE", attachment });
              }}
              onClose={() => setReviewIntelligenceOpen(false)}
            />
          )}
        </AnimatePresence>

      </section>

      <SummaryRail viewModel={summaryRail} onAction={handleSummaryRailAction} />
    </main>
  );
}

function titleForView(viewMode: ViewMode, showForm: boolean) {
  if (showForm) return "Property Intake";
  const titles: Record<ViewMode, string> = {
    network: "Review Comparables",
    discovery: "Review Comparables",
    table: "Source Scan",
    adjustments: "Adjustments",
    valuation: "Adjustments",
    report: "Export Package",
    memo: "Export Package",
    sources: "Source Scan"
  };
  return titles[viewMode];
}

function getWorkflowStepId(viewMode: ViewMode, showForm: boolean, analysisStarted: boolean): WorkflowStepId {
  if (!analysisStarted || showForm) {
    return "intake";
  }
  if (viewMode === "table") {
    return "sources";
  }
  if (viewMode === "network" || viewMode === "discovery") {
    return "review";
  }
  if (viewMode === "adjustments" || viewMode === "valuation") {
    return "adjust";
  }
  return "export";
}

function workflowStepToView(step: WorkflowStepId): ViewMode {
  const mapping: Record<WorkflowStepId, ViewMode> = {
    intake: "table",
    sources: "table",
    review: "network",
    adjust: "adjustments",
    export: "report"
  };
  return mapping[step];
}

function primaryActionCopy(workflowStep: WorkflowStepId, analysisStarted: boolean, canRunAnalysis: boolean, adjustmentsLocked: boolean) {
  if (!analysisStarted) {
    return canRunAnalysis
      ? { label: "Run Analysis", tooltip: "Run the local source scan and comparable review." }
      : { label: "Run Analysis", tooltip: "Fill in the property details first." };
  }
  if (workflowStep === "sources") {
    return { label: "Go to Review", tooltip: "Open the comparable review board." };
  }
  if (workflowStep === "review") {
    return { label: "Go to Adjustments", tooltip: "Open the adjustment review for the selected comparables." };
  }
  if (workflowStep === "adjust") {
    return adjustmentsLocked
      ? { label: "Go to Export", tooltip: "Open the local export package screen." }
      : { label: "Go to Export", tooltip: "Confirm and lock the adjustments before exporting." };
  }
  if (workflowStep === "export") {
    return { label: "Export Report", tooltip: "Generate the local demo export package." };
  }
  return { label: "Go to Sources", tooltip: "Open the source scan summary." };
}



function getWorkflowStatus({
  analysisStarted,
  canRunAnalysis,
  subjectDirty,
  adjustmentsLocked,
  workflowPulse,
  reportPrepared,
  workflowStep
}: {
  analysisStarted: boolean;
  canRunAnalysis: boolean;
  subjectDirty: boolean;
  adjustmentsLocked: boolean;
  workflowPulse?: string;
  reportPrepared: boolean;
  workflowStep: WorkflowStepId;
}) {
  if (workflowPulse) {
    return {
      label: workflowPulse,
      detail: "The system is refreshing the comparable review now.",
      tone: "review" as const,
      icon: RefreshCw
    };
  }
  if (!analysisStarted) {
    if (!canRunAnalysis) {
      return {
        label: "Waiting for property details",
        detail: "Fill in the property details to unlock the analysis.",
        tone: "review" as const,
        icon: HomeIcon
      };
    }
    return {
      label: "Ready for intake",
      detail: "The property details are complete. Run the analysis to move into the source scan.",
      tone: "confirmed" as const,
      icon: CheckCircle2
    };
  }
  if (subjectDirty) {
    return {
      label: "Validating details",
      detail: "You changed the property details. Rerun the analysis to refresh the review.",
      tone: "review" as const,
      icon: Info
    };
  }
  if (workflowStep === "sources") {
    return {
      label: "Source scan ready",
      detail: "Check the source summary before moving into comparable review.",
      tone: "review" as const,
      icon: ListChecks
    };
  }
  if (workflowStep === "review") {
    return {
      label: "Review comparables",
      detail: "Inspect the selected comparables and surface a stronger comp if needed.",
      tone: "review" as const,
      icon: Layers3
    };
  }
  if (workflowStep === "adjust") {
    return {
      label: adjustmentsLocked ? "Adjustments locked" : "Adjustments ready",
      detail: adjustmentsLocked
        ? "The current review set is locked and ready for export."
        : "Confirm the adjustments before opening export.",
      tone: adjustmentsLocked ? "confirmed" as const : "review" as const,
      icon: Grid3X3
    };
  }
  if (workflowStep === "export") {
    return {
      label: reportPrepared ? "Package generated" : "Ready to export",
      detail: reportPrepared
        ? "The export package is ready to download."
        : "Generate the final package from the current review set.",
      tone: "confirmed" as const,
      icon: PackageCheck
    };
  }
  return {
    label: "Ready to move forward",
    detail: "Comparables are loaded. Review them, then confirm adjustments before export.",
    tone: "confirmed" as const,
    icon: CheckCircle2
  };
}

function formatConfidenceLevel(level: string) {
  return level === "Review Required" ? "Review needed" : level;
}

function verdictLabelFromCode(value: "usable_with_review" | "needs_review" | "weak_packet") {
  if (value === "usable_with_review") return "Review set is usable";
  if (value === "weak_packet") return "Review set is weak";
  return "Review set needs analyst review";
}

function confidenceRingClass(score: number) {
  if (score >= 70) return "confidence-high-ring";
  if (score >= 60) return "confidence-balanced-ring";
  return "confidence-review-ring";
}

function SubjectForm({ subject, dirty, canRunAnalysis, analysisStarted, update, runAnalysis, loadExample, resetSubject }: { subject: SubjectProperty; dirty: boolean; canRunAnalysis: boolean; analysisStarted: boolean; update: <K extends keyof SubjectProperty>(key: K, value: SubjectProperty[K]) => void; runAnalysis: () => void; loadExample: () => void; resetSubject: () => void }) {
  const subjectTitle = subject.address.trim() || "No property entered";
  const locationLine = subject.city.trim()
    ? [subject.city, subject.province, subject.neighbourhood].filter(Boolean).join(" / ")
    : "Enter the property details to preview the home.";
  const numberFieldValue = (value: number) => (analysisStarted || value !== 0 ? value : "");
  const previewValue = (value: number) => (canRunAnalysis ? String(value) : "N/A");
  const checklistItems = canRunAnalysis
    ? [
        "Required property details are complete",
        "Ready for the source scan",
        "Everything stays local in this demo",
        "Example property remains optional"
      ]
    : [
        "Blank numeric fields stay empty until entered",
        "Enter the property details to unlock the source scan",
        "No value estimate appears yet",
        "Export stays locked until review"
      ];

  return (
    <section className="subject-intake-view">
      <div className="success-banner subject-intake-banner">
        <ShieldCheck size={34} />
        <div>
          <strong>Property details</strong>
          <p>Enter the property details before comparable or value results appear.</p>
        </div>
      </div>
      <div className="subject-intake-layout">
        <form className="subject-form-panel" onSubmit={(event) => { event.preventDefault(); runAnalysis(); }}>
          <div className="form-panel-head">
            <div>
              <h3>Property Details</h3>
              <p>All fields stay local. Run the analysis once the required property details are in place.</p>
            </div>
            <span
              className={clsx("status-chip tooltip-target", dirty ? "review" : canRunAnalysis ? "confirmed" : "review")}
              title={dirty ? "Property details changed after the last analysis." : canRunAnalysis ? "Required fields are complete." : "Complete the required property fields before running analysis."}
              data-tooltip={dirty ? "Property details changed after the last analysis." : canRunAnalysis ? "Required fields are complete." : "Complete the required property fields before running analysis."}
            >
              {dirty ? <Info size={14} /> : canRunAnalysis ? <CheckCircle2 size={14} /> : <Info size={14} />}
              {dirty ? "Changes need review" : canRunAnalysis ? "Ready for source scan" : "Waiting for details"}
            </span>
          </div>
          <div className="subject-grid">
            <Field label="Address" value={subject.address} onChange={(value) => update("address", value)} />
            <Field label="Review Name" value={subject.dealName ?? ""} onChange={(value) => update("dealName", value)} />
            <Field label="Client / Project" value={subject.borrowerType ?? ""} onChange={(value) => update("borrowerType", value)} />
            <Select label="City" value={subject.city} options={cities} onChange={(value) => update("city", value)} />
            <Field label="Province" value={subject.province ?? "AB"} onChange={(value) => update("province", value as "AB")} />
            <Field label="Review Date" type="date" value={subject.underwritingDate ?? ""} onChange={(value) => update("underwritingDate", value)} />
            <Field label="Neighbourhood" value={subject.neighbourhood} onChange={(value) => update("neighbourhood", value)} />
            <Select label="Property Type" value={subject.propertyType} options={propertyTypes} onChange={(value) => update("propertyType", value as PropertyType)} />
            <Field label="Year Built" type="number" value={numberFieldValue(subject.yearBuilt)} onChange={(value) => update("yearBuilt", Number(value))} />
            <Field label="Bedrooms" type="number" value={numberFieldValue(subject.bedrooms)} onChange={(value) => update("bedrooms", Number(value))} />
            <Field label="Bathrooms" type="number" step="0.5" value={numberFieldValue(subject.bathrooms)} onChange={(value) => update("bathrooms", Number(value))} />
            <Field label="Living Area Sqft" type="number" value={numberFieldValue(subject.livingAreaSqft)} onChange={(value) => update("livingAreaSqft", Number(value))} />
            <Field label="Lot Size Sqft" type="number" value={numberFieldValue(subject.lotSizeSqft)} onChange={(value) => update("lotSizeSqft", Number(value))} />
            <Field label="Parking Stalls" type="number" value={numberFieldValue(subject.parking)} onChange={(value) => update("parking", Number(value))} />
            <Select label="Condition" value={subject.condition} options={conditions} onChange={(value) => update("condition", value as PropertyCondition)} />
            <Field label="Target Price" type="number" value={analysisStarted || (subject.targetPriceHint ?? 0) !== 0 ? subject.targetPriceHint ?? "" : ""} onChange={(value) => update("targetPriceHint", value ? Number(value) : undefined)} />
            <Field label="Latitude" type="number" step="0.0001" value={numberFieldValue(subject.latitude)} onChange={(value) => update("latitude", Number(value))} />
            <Field label="Longitude" type="number" step="0.0001" value={numberFieldValue(subject.longitude)} onChange={(value) => update("longitude", Number(value))} />
          </div>
          <div className="form-actions subject-actions">
            <button className="reset-action tooltip-target" type="button" title="Clear the intake form and reset the current review." data-tooltip="Clear the intake form and reset the current review." onClick={resetSubject}><RotateCcw size={16} /> Reset</button>
            <button className="tooltip-target" type="button" title="Load a complete demo property so you can review the full workflow." data-tooltip="Load a complete demo property so you can review the full workflow." onClick={() => { update("address", "12345 109 St NW"); update("propertyType", "Detached"); update("city", "Edmonton"); loadExample(); }}>Use Example Property</button>
            <button className="primary-action tooltip-target" type="submit" disabled={!canRunAnalysis} title={!canRunAnalysis ? "Enter the property details first." : "Run the local source scan and comparable review."} data-tooltip={!canRunAnalysis ? "Enter the property details first." : "Run the local source scan and comparable review."}>Run Analysis</button>
          </div>
        </form>
        <aside className="subject-preview-stack">
          <section className="subject-preview-card">
            <div className="panel-head-row">
              <h3>Property Preview</h3>
              <span className={clsx("status-chip tooltip-target", canRunAnalysis ? "confirmed" : "review")} title={canRunAnalysis ? "The preview has enough details for analysis." : "The preview updates after required fields are complete."} data-tooltip={canRunAnalysis ? "The preview has enough details for analysis." : "The preview updates after required fields are complete."}><HomeIcon size={14} /> {canRunAnalysis ? "Ready for source scan" : "Waiting for details"}</span>
            </div>
            <PropertyThumbnail propertyType={subject.propertyType} seed={subject.address} isSubject />
            <h4>{subjectTitle}</h4>
            <p>{locationLine}</p>
            <div className="subject-stat-row">
              <Metric label="Beds" value={previewValue(subject.bedrooms)} />
              <Metric label="Baths" value={previewValue(subject.bathrooms)} />
              <Metric label="Sq Ft" value={canRunAnalysis ? subject.livingAreaSqft.toLocaleString() : "N/A"} />
            </div>
            <StatusChecklist items={checklistItems} />
          </section>
          <section className="subject-preview-card parcel-card">
            <div className="panel-head-row">
              <h3>Parcel Snapshot</h3>
              <span className="status-chip review tooltip-target" title={canRunAnalysis ? "Parcel details are local demo context only." : "Parcel details appear after intake is complete."} data-tooltip={canRunAnalysis ? "Parcel details are local demo context only." : "Parcel details appear after intake is complete."}><Info size={14} /> {canRunAnalysis ? "Demo only" : "Waiting for details"}</span>
            </div>
            <div className="parcel-diagram" aria-hidden="true">
              <span />
              <i />
            </div>
            <DeltaRow label="Lot size" value={canRunAnalysis ? `${subject.lotSizeSqft.toLocaleString()} sq ft` : "N/A"} />
            <DeltaRow label="Parking" value={canRunAnalysis ? `${subject.parking} stalls` : "N/A"} />
            <DeltaRow label="Condition" value={canRunAnalysis ? subject.condition : "Waiting for details"} />
            <DeltaRow label="Use" value={canRunAnalysis ? subject.intendedUse ?? "Review support" : "Waiting for details"} />
          </section>
        </aside>
      </div>
    </section>
  );
}

function WorkflowProgress({
  viewModel,
  workflowStep,
  analysisStarted
}: {
  viewModel: ReturnType<typeof selectCivicGridViewModel>["workflow"];
  workflowStep: WorkflowStepId;
  analysisStarted: boolean;
}) {
  const stepOrder: WorkflowStepId[] = ["intake", "sources", "review", "adjust", "export"];
  const currentIndex = stepOrder.indexOf(workflowStep);
  const steps = [
    {
      label: "Intake",
      short: "Intake",
      value: viewModel.subjectAddress,
      state: currentIndex === 0 ? "active" : analysisStarted ? "complete" : "active"
    },
    {
      label: "Sources",
      short: "Sources",
      value: analysisStarted ? viewModel.sourceSummary : "No sources checked yet",
      state: currentIndex === 1 ? "active" : currentIndex > 1 ? "complete" : analysisStarted ? "pending" : "pending"
    },
    {
      label: "Review",
      short: "Review",
      value: analysisStarted ? viewModel.candidateSummary : "No comparables ranked yet",
      state: currentIndex === 2 ? "active" : currentIndex > 2 ? "complete" : "pending"
    },
    {
      label: "Adjust",
      short: "Adjust",
      value: analysisStarted ? viewModel.adjustmentSummary : "No comparables confirmed yet",
      state: currentIndex === 3 ? "active" : currentIndex > 3 ? "complete" : "pending"
    },
    {
      label: "Export",
      short: "Export",
      value: analysisStarted ? viewModel.valueSummary : "Not ready yet",
      state: currentIndex === 4 ? "active" : currentIndex > 4 ? "complete" : "pending"
    }
  ] as const;

  return (
    <section className="workflow-strip" style={{ "--workflow-cols": steps.length } as CSSProperties} aria-label="Review workflow">
      {steps.map(({ label, short, value, state: stepState }, index) => (
        <div key={label} className={clsx("workflow-step tooltip-target", stepState)} title={`${label}: ${value}`} data-tooltip={`${label}: ${value}`}>
          <span>{index + 1}</span>
          <strong><b className="step-full">{label}</b><b className="step-short">{short}</b></strong>
          <small>{value}</small>
        </div>
      ))}
    </section>
  );
}

function ComparableDrawer({ candidate, impact, onClose, onAdd }: { candidate: ScoredComparable; impact?: CandidateImpact; onClose: () => void; onAdd: () => void }) {
  return (
    <motion.aside className="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section className="comp-drawer" initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ duration: 0.2 }}>
        <div className="drawer-head">
          <div>
            <span className="status-chip review">New comparable found</span>
            <h3>Review the comparable before adding it</h3>
          </div>
          <button aria-label="Close drawer" type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="drawer-hero">
          <PropertyThumbnail propertyType={candidate.propertyType} seed={candidate.address} isNew />
          <div>
            <h4>{candidate.address}</h4>
            <p>{candidate.city}, Alberta</p>
            <strong>{formatCurrency(candidate.salePrice)}</strong>
            <small>{candidate.distanceKm.toFixed(2)} km / Match {Math.round(candidate.totalScore)} / Chance {candidate.comparableProbabilityPercent}% / Strength {Math.round(candidate.energyQuality * 100)}%</small>
            <small>{candidate.sourceName ?? "Simulated home sales dataset"} / {candidate.daysSinceSale} days since sale</small>
          </div>
        </div>
        <h4>Why this comparable surfaced</h4>
        <ul className="check-list">
          {candidate.reasons?.map((reason) => <li key={reason}><CheckCircle2 size={17} /> {sentenceCase(reason)}</li>)}
          <li><CheckCircle2 size={17} /> Sold on {candidate.saleDate}, {candidate.daysSinceSale} days before the review date.</li>
          <li><CheckCircle2 size={17} /> Source: {candidate.sourceName ?? "Simulated home sales dataset"}.</li>
        </ul>
        {!!candidate.penalties?.length && (
          <>
            <h4>Review cautions</h4>
            <ul className="check-list caution-list">
              {candidate.penalties.map((penalty) => <li key={penalty}><Info size={17} /> {penalty}</li>)}
            </ul>
          </>
        )}
        <h4>Impact if added</h4>
        <div className="impact-grid">
          <Metric label="Confidence" value={impact ? formatSigned(impact.delta.confidenceDelta) + " pts" : "Pending"} />
          <Metric label="Midpoint" value={impact ? formatSignedCurrency(impact.delta.pointDelta) : "Pending"} />
          <Metric label="Range width" value={impact ? formatSignedCurrency(impact.delta.rangeWidthDelta) : "Pending"} />
          <Metric label="Comparable count" value={impact ? formatSigned(impact.delta.compCountDelta) : "Pending"} />
          <Metric label="Review impact" value={impact ? formatReviewImpact(impact.marginalInformationGain) : "Pending"} />
          <Metric label="Review depth" value={impact ? formatSigned(impact.deltaEffectiveSampleSize) : "Pending"} />
          <Metric label="Evidence mix" value={impact ? formatEvidenceMix(impact.deltaEntropy) : "Pending"} />
          <Metric label="Risk change" value={impact ? formatSigned(impact.riskChange) : "Pending"} />
          <Metric label="Result" value={impact ? (impact.delta.rangeNarrowed ? "Narrows range" : "Expands range") : "Pending"} />
        </div>
        <div className="drawer-actions">
          <button type="button" onClick={onClose}>Dismiss</button>
          <button className="primary-action" type="button" onClick={onAdd}>Add to analysis</button>
        </div>
      </motion.section>
    </motion.aside>
  );
}

function DiscoveryView({ subject, ranked, rejected, selectedIds, activeComparableId, candidate, newCompId, onSelect, onFindMore }: { subject: SubjectProperty; ranked: ScoredComparable[]; rejected: ScoredComparable[]; selectedIds: Set<string>; activeComparableId?: string; candidate?: ScoredComparable; newCompId?: string; onSelect: (id: string) => void; onFindMore: () => void }) {
  const topCandidates = ranked.filter((comp) => !selectedIds.has(comp.id)).slice(0, 8);
  const bestCandidate = candidate ?? topCandidates[0];
  return (
    <section className="discovery-layout">
      <div className="discovery-list">
        <div className="section-title"><h3>Top Comparable Matches</h3><button type="button" onClick={onFindMore}><Search size={16} /> Find More Comparables</button></div>
        {topCandidates.length ? topCandidates.map((comp, index) => (
          <button
            key={comp.id}
            type="button"
            className={clsx(
              "candidate-row",
              activeComparableId === comp.id && "selected",
              candidate?.id === comp.id && "candidate",
              newCompId === comp.id && "new-row"
            )}
            aria-pressed={activeComparableId === comp.id}
            onClick={() => onSelect(comp.id)}
          >
            <span>{index + 1}</span>
            <PropertyThumbnail propertyType={comp.propertyType} seed={comp.address} isNew={newCompId === comp.id} compact />
            <div><strong>{comp.address}</strong><small>{comp.city}, AB / {comp.distanceKm.toFixed(1)} km / sold {comp.daysSinceSale} days ago</small></div>
            <em>{`Score ${Math.round(comp.totalScore)}`}</em>
          </button>
        )) : <div className="empty-state">All of the strongest comparables are already selected. Find candidates to widen the review set.</div>}
        <div className="rejected-list">
          <strong>Excluded / lower-ranked comparables</strong>
          {rejected.slice(0, 4).map((comp) => <small key={comp.id}>{comp.address}: {comp.rejectionReason}</small>)}
        </div>
      </div>
      <div className="candidate-board" aria-label="Candidate discovery evidence board">
        <div className="candidate-board-subject">
          <span className="status-chip confirmed">Property</span>
          <PropertyThumbnail propertyType={subject.propertyType} seed={subject.address} isSubject />
          <strong>{subject.address}</strong>
          <small>{subject.neighbourhood} / {subject.propertyType}</small>
        </div>
        {topCandidates.length ? topCandidates.map((comp, index) => (
          <button
            key={comp.id}
            type="button"
            className={clsx("candidate-board-card", `candidate-board-card-${index + 1}`, bestCandidate?.id === comp.id && "best", activeComparableId === comp.id && "selected")}
            aria-pressed={activeComparableId === comp.id}
            onClick={() => onSelect(comp.id)}
          >
            <PropertyThumbnail propertyType={comp.propertyType} seed={comp.address} isNew={newCompId === comp.id} compact />
            <span>#{index + 1}</span>
            <strong>{comp.address}</strong>
            <small>{comp.distanceKm.toFixed(1)} km / Score {Math.round(comp.totalScore)}</small>
          </button>
        )) : <div className="candidate-board-empty">No new comparable cards to plot on the discovery board.</div>}
      </div>
      <div className="discovery-insight">
        <span className="status-chip review"><Star size={14} /> Best match found</span>
        <h3>{bestCandidate?.address ?? "No comparable available"}</h3>
        <p>{bestCandidate ? `${bestCandidate.address} improves coverage across similarity, timing, and location.` : "All of the strongest comparables are already in the selected set. Find candidates to widen coverage."}</p>
        {bestCandidate && <PropertyThumbnail propertyType={bestCandidate.propertyType} seed={bestCandidate.address} isNew={newCompId === bestCandidate.id} />}
        <Factor label="Best available match" value={bestCandidate ? `${Math.round(bestCandidate.totalScore)}/100 score` : "None"} state={bestCandidate ? "High" : "Review"} />
        <Factor label="Distance" value={bestCandidate ? `${bestCandidate.distanceKm.toFixed(1)} km` : "N/A"} state="Review" />
        <Factor label="Recency" value={bestCandidate ? `${bestCandidate.daysSinceSale} days since sale` : "N/A"} state={bestCandidate && !bestCandidate.riskFlags.includes("Stale sale date") ? "High" : "Review"} />
        <Factor label="Coverage" value={`${selectedIds.size} comparables selected`} state="High" />
        <button className="primary-action" type="button" onClick={onFindMore}><Target size={16} /> Surface strongest comparable</button>
      </div>
    </section>
  );
}

function SourceScanView({ snapshot, onRunAnalysis }: { snapshot: PceAnalysisSnapshot; onRunAnalysis: () => void }) {
  const scan = snapshot.sourceScan;
  const sources = [
    { name: "Municipal assessment", source: "City of Edmonton", records: scan.municipalAssessmentReferences, normalized: scan.assessmentRecordsMatched, unique: Math.max(1, scan.assessmentRecordsMatched - 2), reliability: 92, freshness: "2 days ago", icon: Database },
    { name: "Simulated home sales", source: "KV simulated dataset", records: scan.syntheticRecentSalesScanned, normalized: scan.syntheticRecentSalesMatched, unique: scan.candidatePoolCount, reliability: 86, freshness: "1 day ago", icon: FileSpreadsheet },
    { name: "Listing references", source: "Active listings", records: scan.listingStyleRecords, normalized: scan.listingRecordsMatched, unique: Math.max(1, scan.listingRecordsMatched - 3), reliability: 68, freshness: "6 hours ago", icon: FileText },
    { name: "Saved review history", source: "Local review history", records: scan.priorDealComparables, normalized: scan.priorDealCompsMatched, unique: scan.priorDealCompsMatched, reliability: 78, freshness: "5 days ago", icon: FolderArchive },
    { name: "Market trend context", source: "Public trend context", records: scan.marketTrendReferences, normalized: scan.marketTrendReferencesMatched, unique: scan.marketTrendReferencesMatched, reliability: 74, freshness: "3 days ago", icon: BarChart3 }
  ];
  const reviewSourceCount = sources.filter((source) => source.reliability < 75).length;

  return (
    <section className="source-scan-view" aria-label="Data check workspace">
      <div className="source-scan-head">
        <div>
          <h3>Data Check</h3>
          <p>Review, clean, and score local demo sources before comparables are ranked.</p>
        </div>
        <div className="scan-actions">
          <button className="primary-action" type="button" onClick={onRunAnalysis}><RefreshCw size={16} /> Run data check</button>
          <span className="status-chip confirmed"><CheckCircle2 size={14} /> Data check ready</span>
        </div>
      </div>
      <div className="source-pipeline" aria-label="Source scan pipeline">
        {["Collect", "Clean", "Score", "Review", "Remove duplicates"].map((step, index) => (
          <div key={step} className={clsx(index === 4 && "active")}>
            <CheckCircle2 size={18} />
            <strong>{step}</strong>
            <span>{index === 1 ? `${scan.recordsScanned.toLocaleString()} records` : index === 4 ? `${scan.candidatePoolCount.toLocaleString()} comps` : "Complete"}</span>
          </div>
        ))}
      </div>
      <div className="scan-metric-grid">
        <Metric label="Sources checked" value={String(scan.sourcesConsolidated)} />
        <Metric label="Records found" value={scan.recordsScanned.toLocaleString()} />
        <Metric label="Matches found" value={(scan.syntheticRecentSalesMatched + scan.assessmentRecordsMatched + scan.listingRecordsMatched).toLocaleString()} />
        <Metric label="Comparables to review" value={scan.candidatePoolCount.toLocaleString()} />
        <Metric label="Comparables selected" value={scan.selectedCompCount.toLocaleString()} />
      </div>
      <section className="scan-results-card">
        <div className="section-title">
          <h3>Source details</h3>
          <span className={clsx("status-chip", reviewSourceCount ? "review" : "confirmed")}>
            {reviewSourceCount ? <Info size={14} /> : <ClipboardCheck size={14} />}
            {reviewSourceCount ? `${reviewSourceCount} sources need review` : "All important sources look good"}
          </span>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Source</th><th>Records</th><th>Standardized</th><th>Distinct</th><th>Reliability</th><th>Recency</th><th>Status</th></tr></thead>
            <tbody>
              {sources.map((source) => {
                const Icon = source.icon;
                return (
                  <tr key={source.name}>
                    <td><div className="source-name-cell"><Icon size={18} /><div><strong>{source.name}</strong><small>{source.source}</small></div></div></td>
                    <td>{source.records.toLocaleString()}</td>
                    <td>{source.normalized.toLocaleString()}</td>
                    <td>{source.unique.toLocaleString()}</td>
                    <td><span className={clsx("reliability-bar", source.reliability < 75 && "review")}><i style={{ width: `${source.reliability}%` }} /></span><b>{source.reliability}</b></td>
                    <td>{source.freshness}</td>
                    <td><span className="status-chip confirmed"><CheckCircle2 size={13} /> Completed</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="source-mobile-list" aria-label="Source details compact">
          {sources.map((source) => {
            const Icon = source.icon;
            return (
              <article className="source-mobile-card" key={source.name}>
                <header>
                  <Icon size={18} />
                  <div>
                    <strong>{source.name}</strong>
                    <span>{source.source}</span>
                  </div>
                </header>
                <dl>
                  <div><dt>Records</dt><dd>{source.records.toLocaleString()}</dd></div>
                  <div><dt>Standardized</dt><dd>{source.normalized.toLocaleString()}</dd></div>
                  <div><dt>Distinct</dt><dd>{source.unique.toLocaleString()}</dd></div>
                  <div><dt>Reliability</dt><dd>{source.reliability}</dd></div>
                  <div><dt>Recency</dt><dd>{source.freshness}</dd></div>
                  <div><dt>Status</dt><dd><span className="status-chip confirmed"><CheckCircle2 size={13} /> Completed</span></dd></div>
                </dl>
              </article>
            );
          })}
        </div>
      </section>
      <div className="source-bottom-grid">
        <section className="insight-card source-quality-card">
          <h3>Source quality summary</h3>
          <div className="confidence-row">
            <div className="ring source-quality-ring" style={{ "--score": "302deg" } as CSSProperties}>84%</div>
            <div><strong>Good coverage</strong><p>Weighted by matched records and reliability.</p></div>
          </div>
          <DeltaRow label="Completeness" value="88%" />
          <DeltaRow label="Consistency" value="82%" />
          <DeltaRow label="Timeliness" value="90%" />
        </section>
        <section className="insight-card normalized-card">
          <h3>Standardized key fields</h3>
          <DeltaRow label="Address" value="99% coverage" />
          <DeltaRow label="Property type" value="100% coverage" />
          <DeltaRow label="Year built" value="96% coverage" />
          <DeltaRow label="Living area" value="94% coverage" />
          <DeltaRow label="Lot size" value="93% coverage" />
        </section>
        <section className="insight-card dedupe-card">
          <h3>Duplicate check</h3>
          <DeltaRow label="Exact matches" value={Math.round(scan.candidatePoolCount * 0.5).toLocaleString()} />
          <DeltaRow label="Probable matches" value={Math.round(scan.candidatePoolCount * 0.33).toLocaleString()} />
          <DeltaRow label="Possible matches" value={Math.round(scan.candidatePoolCount * 0.17).toLocaleString()} />
          <DeltaRow label="Unique candidates" value={`${scan.candidatePoolCount.toLocaleString()} / 100%`} />
        </section>
      </div>
      <p className="report-note">{scan.dataBoundaryNote}</p>
    </section>
  );
}

function AdjustmentView({ viewModel, adjustmentsLocked, onSelect, onExclude, onLock }: { viewModel: ReturnType<typeof selectAdjustmentGridViewModel>; adjustmentsLocked: boolean; onSelect: (id: string) => void; onExclude: (id: string) => void; onLock: () => void }) {
  const comps = viewModel.comps;
  const rows: Array<{ label: string; compValue: (comp: AdjustedComparable) => string; subjectValue?: string }> = [
    { label: "Price", compValue: (c) => formatCurrency(c.salePrice), subjectValue: "—" },
    { label: "Distance", compValue: (c) => `${c.distanceKm.toFixed(1)} km`, subjectValue: "Subject" },
    { label: "Beds", compValue: (c) => String(c.bedrooms), subjectValue: String(viewModel.subject.bedrooms) },
    { label: "Baths", compValue: (c) => String(c.bathrooms), subjectValue: String(viewModel.subject.bathrooms) },
    { label: "Sq Ft", compValue: (c) => c.livingAreaSqft.toLocaleString(), subjectValue: viewModel.subject.livingAreaSqft.toLocaleString() },
    { label: "Lot Size", compValue: (c) => c.lotSizeSqft.toLocaleString(), subjectValue: viewModel.subject.lotSizeSqft.toLocaleString() },
    { label: "Year Built", compValue: (c) => String(c.yearBuilt), subjectValue: String(viewModel.subject.yearBuilt) },
    { label: "Condition", compValue: (c) => c.condition, subjectValue: viewModel.subject.condition },
    { label: "Parking", compValue: (c) => String(c.parking), subjectValue: String(viewModel.subject.parking) },
    { label: "Time Adjustment", compValue: (c) => formatCurrency(c.adjustments.time), subjectValue: "—" },
    { label: "Location Adjustment", compValue: (c) => formatCurrency(c.adjustments.location), subjectValue: "—" },
    { label: "Lot Adjustment", compValue: (c) => formatCurrency(c.adjustments.lotSize), subjectValue: "—" },
    { label: "Outlier Adjustment", compValue: (c) => formatCurrency(c.adjustments.outlier), subjectValue: "—" },
    { label: "Adjustment Value", compValue: (c) => formatCurrency(c.adjustments.total), subjectValue: "—" },
    { label: "Adjusted Price", compValue: (c) => formatCurrency(c.adjustedValue), subjectValue: "—" }
  ];
  const adjustmentRawGetters: Partial<Record<string, (comp: AdjustedComparable) => number>> = {
    "Time Adjustment": (comp) => comp.adjustments.time,
    "Location Adjustment": (comp) => comp.adjustments.location,
    "Lot Adjustment": (comp) => comp.adjustments.lotSize,
    "Outlier Adjustment": (comp) => comp.adjustments.outlier,
    "Adjustment Value": (comp) => comp.adjustments.total,
  };
  return (
    <section className="adjustment-shell">
      <div className="adjustment-card">
        <div className="success-banner"><CheckCircle2 size={34} /><div><strong>Adjustments ready</strong><p>Adjustments are transparent and reviewable. The system proposes them, and the analyst confirms them before export.</p></div></div>
        <div className="adjustment-comp-strip" style={{ "--comp-strip-cols": comps.length + 1 } as CSSProperties} aria-label="Selected comparable adjustment set">
          <article className="adjustment-strip-subject">
            <span>Property</span>
            <PropertyThumbnail propertyType={viewModel.subject.propertyType} seed={viewModel.subject.address} isSubject compact />
            <strong>{viewModel.subject.address}</strong>
            <small>{viewModel.subject.neighbourhood} / {formatCurrency(viewModel.valuation.pointEstimate)}</small>
          </article>
          {comps.map((comp, index) => (
            <button
              className={clsx("adjustment-strip-comp", viewModel.activeComparableId === comp.id && "active", viewModel.newCandidateId === comp.id && "new-column")}
              key={comp.id}
              type="button"
              onClick={() => onSelect(comp.id)}
            >
              <span>Comp {index + 1}</span>
              <PropertyThumbnail propertyType={comp.propertyType} seed={comp.address} compact />
              <strong>{comp.address}</strong>
              <small>{formatCurrency(comp.salePrice)} / Adj. {formatCurrency(comp.adjustedValue)}</small>
            </button>
          ))}
        </div>
        <div className="adjustment-grid" role="grid" aria-label="Comparable Adjustments" style={{ "--cols": comps.length + 2 } as CSSProperties}>
          <div className="grid-head" role="columnheader"><span>Property</span><strong>Attributes</strong></div>
          <div className="grid-head subject-head" role="columnheader"><span>Subject</span><strong>{viewModel.subject.address}</strong></div>
          {comps.map((comp, index) => (
            <div key={comp.id} className={clsx("grid-head", viewModel.activeComparableId === comp.id && "selected", viewModel.newCandidateId === comp.id && "new-column")} role="columnheader">
              <button type="button" onClick={() => onSelect(comp.id)}>
                <span>{viewModel.newCandidateId === comp.id ? "New comp" : `Comp ${index + 1}`}</span><strong>{comp.address}</strong>
              </button>
              <button className="table-action" type="button" onClick={() => onExclude(comp.id)} disabled={adjustmentsLocked} title={adjustmentsLocked ? "Unlock the review set before removing a comparable." : undefined}>Exclude</button>
            </div>
          ))}
          {rows.map(({ label, compValue, subjectValue }) => {
            const rawGetter = adjustmentRawGetters[label];
            const isAdjustedPrice = label === "Adjusted Price";
            return (
              <div className={clsx("grid-row", isAdjustedPrice && "grid-row-final")} key={label} role="row">
                <div role="rowheader">{label}</div>
                <div className="subject-cell" role="gridcell">{subjectValue}</div>
                {comps.map((comp) => {
                  const raw = rawGetter?.(comp);
                  return (
                    <div
                      key={comp.id}
                      role="gridcell"
                      className={clsx(
                        raw !== undefined && raw < 0 && "adj-negative",
                        raw !== undefined && raw > 0 && "adj-positive"
                      )}
                    >
                      {raw !== undefined && raw > 0 ? `+${compValue(comp)}` : compValue(comp)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="adjustment-mobile-list" aria-label="Comparable adjustments compact">
          <article className="adjustment-mobile-card subject">
            <header>
              <div>
                <span>Subject</span>
                <strong>{viewModel.subject.address}</strong>
              </div>
            </header>
            <dl>
              {rows.map(({ label, subjectValue }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{subjectValue}</dd>
                </div>
              ))}
            </dl>
          </article>
          {comps.map((comp, index) => (
            <article className={clsx("adjustment-mobile-card", viewModel.activeComparableId === comp.id && "selected", viewModel.newCandidateId === comp.id && "new-column")} key={comp.id}>
              <header>
                <button type="button" onClick={() => onSelect(comp.id)}>
                  <span>{viewModel.newCandidateId === comp.id ? "New comp" : `Comp ${index + 1}`}</span>
                  <strong>{comp.address}</strong>
                </button>
                <button className="table-action" type="button" onClick={() => onExclude(comp.id)} disabled={adjustmentsLocked} title={adjustmentsLocked ? "Unlock the review set before removing a comparable." : undefined}>Exclude</button>
              </header>
              <dl>
                {rows.map(({ label, compValue }) => {
                  const raw = adjustmentRawGetters[label]?.(comp);
                  return (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd className={clsx(
                        raw !== undefined && raw < 0 && "adj-negative",
                        raw !== undefined && raw > 0 && "adj-positive"
                      )}>
                        {raw !== undefined && raw > 0 ? `+${compValue(comp)}` : compValue(comp)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </article>
          ))}
        </div>
      </div>
      <ImpactPanel delta={viewModel.valuationDelta} valuation={viewModel.valuation} locked={adjustmentsLocked} onLock={onLock} />
    </section>
  );
}

function ImpactPanel({ delta, valuation, locked, onLock }: { delta?: ValuationDelta; valuation: ValuationRange; locked: boolean; onLock: () => void }) {
  return (
    <aside className="impact-panel">
      <h3>Impact on value range</h3>
      <Metric label="Current range" value={`${formatCurrency(valuation.lowEstimate)} - ${formatCurrency(valuation.highEstimate)}`} />
      <Metric label="Basis" value="Adjusted comparable sales" />
      <Metric label="Midpoint change" value={delta ? formatSignedCurrency(delta.pointDelta) : "Baseline"} />
      <Metric label="Confidence change" value={delta ? `${formatSigned(delta.confidenceDelta)} pts` : "Baseline"} />
      <Metric label="Range width" value={delta ? (delta.rangeNarrowed ? "Narrowed" : "Expanded") : "Baseline"} />
      <Metric label="Review impact" value={delta?.marginalInformationGain ? formatReviewImpact(delta.marginalInformationGain) : "Baseline"} />
      <Metric label="Review method" value="Adjusted comparable sales" />
      <button className={clsx("primary-action", locked && "locked-action")} type="button" onClick={onLock} disabled={locked} aria-disabled={locked}><Lock size={16} /> {locked ? "Adjustments Locked" : "Confirm and Lock"}</button>
      <div className="impact-note"><RefreshCw size={16} /> The value range updates automatically when the comparable set changes.</div>
    </aside>
  );
}

function ValuationSummary({ snapshot, newCompId }: { snapshot: PceAnalysisSnapshot; newCompId?: string }) {
  const delta = snapshot.valuationDelta;
  return (
    <section className="valuation-summary">
      <div className="summary-hero">
        <div>
          <span className="card-label">Estimated value</span>
          <strong>{formatCurrency(snapshot.valuation.pointEstimate)}</strong>
          <p>Derived from adjusted comparable sales, not a guess.</p>
        </div>
        <div className="confidence-row">
          <div className={clsx("ring", confidenceRingClass(snapshot.valuation.confidenceScore))} style={{ "--score": `${Math.round(snapshot.valuation.confidenceScore * 3.6)}deg` } as CSSProperties}>{Math.round(snapshot.valuation.confidenceScore)}%</div>
          <div><h3>{formatConfidenceLevel(snapshot.valuation.confidenceLevel)} confidence</h3><p>{snapshot.valuation.confidenceRationale}</p></div>
        </div>
      </div>
      <div className="improvement-chips">
        <span className={delta ? "confirmed" : "neutral"}>{delta ? <CheckCircle2 size={16} /> : <Info size={16} />} {delta ? `${formatSigned(delta.compCountDelta)} comparable count change` : "Baseline comparable set"}</span>
        <span className={delta ? "confirmed" : "neutral"}>{delta ? <CheckCircle2 size={16} /> : <Info size={16} />} {delta ? `${formatSigned(delta.confidenceDelta)} confidence pts` : "No prior confidence delta"}</span>
        <span><CheckCircle2 size={16} /> Review depth {snapshot.valuation.effectiveSampleSize}</span>
        <span><CheckCircle2 size={16} /> Cross-platform estimate {formatCurrency(snapshot.valuation.modelFusion.finalEstimate)}</span>
        <span><CheckCircle2 size={16} /> Average match {snapshot.valuation.averageSimilarity}/100</span>
      </div>
      <div className="summary-grid">
        <section className="insight-card">
          <h3>{delta ? "What changed after the new comparable?" : "Baseline review"}</h3>
          <DeltaRow label="Estimated value" value={delta ? formatSignedCurrency(delta.pointDelta) : "Baseline"} />
          <DeltaRow label="Value Range" value={delta ? formatSignedCurrency(delta.rangeWidthDelta) : "Baseline"} />
          <DeltaRow label="Confidence Score" value={delta ? `${formatSigned(delta.confidenceDelta)} pts` : "Baseline"} />
          <DeltaRow label="Comparable Count" value={delta ? formatSigned(delta.compCountDelta) : "Baseline"} />
          <DeltaRow label="Review Depth" value={delta?.effectiveSampleSizeDelta ? formatSigned(delta.effectiveSampleSizeDelta) : "Baseline"} />
          <DeltaRow label="Evidence Mix" value={delta?.entropyDelta ? formatEvidenceMix(delta.entropyDelta) : "Baseline"} />
          <DeltaRow label="Review Impact" value={delta?.marginalInformationGain ? formatReviewImpact(delta.marginalInformationGain) : "Baseline"} />
        </section>
        <section className="insight-card">
          <h3>Estimate blend</h3>
          <DeltaRow label="System estimate" value={formatCurrency(snapshot.valuation.modelFusion.finalEstimate)} />
          {snapshot.valuation.modelFusion.modelWeights.map((model) => (
            <DeltaRow key={model.id} label={model.label.replace("Model", "")} value={`${Math.round(model.weight * 100)}% weight`} />
          ))}
        </section>
        <section className="insight-card">
          <h3>Comparables in the review set</h3>
          {snapshot.valuation.adjustedComparables.map((comp) => (
            <div className="summary-comp" key={comp.id}>
              <span>{newCompId === comp.id ? "New" : "Included"}</span>
              <strong>{comp.address}</strong>
            <em>{formatCurrency(comp.adjustedValue)} / Score {Math.round(comp.totalScore)}</em>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}

type ExportActionId = "full-report" | "pdf" | "docx" | "csv" | "json" | "zip" | "print" | "copy";

function ReportReady({
  viewModel,
  subject,
  snapshot,
  reportPrepared,
  subjectDirty,
  adjustmentsLocked,
  reviewIntelligenceResult,
  primaryExportActionRef,
  onOpenIntake,
  onOpenAdjustments,
  onGenerate
}: {
  viewModel: ReturnType<typeof selectExportViewModel>;
  subject: SubjectProperty;
  snapshot: PceAnalysisSnapshot;
  reportPrepared: boolean;
  subjectDirty: boolean;
  adjustmentsLocked: boolean;
  reviewIntelligenceResult?: EvidenceCourtResult;
  primaryExportActionRef: MutableRefObject<(() => void) | null>;
  onOpenIntake: () => void;
  onOpenAdjustments: () => void;
  onGenerate: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const [exportProgress, setExportProgress] = useState<string[]>([]);
  const [exportRunResult, setExportRunResult] = useState<ExportRunResult>();
  const [activeExportAction, setActiveExportAction] = useState<ExportActionId>();
  const [showCopyFallback, setShowCopyFallback] = useState(false);
  const sections = [
    "Executive Summary",
    "Comparable Summary",
    "Adjustment Grid",
    "Value Reconciliation",
    "Review Intelligence V2",
    "Review Activity",
    "Assumptions and Limits"
  ];
  const activeReviewIntelligence = viewModel.reviewIntelligenceAttachment?.insight ?? reviewIntelligenceResult?.insight;
  const activeReviewIntelligenceSource = viewModel.reviewIntelligenceAttachment?.source ?? reviewIntelligenceResult?.source;
  const exportPacket = useMemo(
    () => buildExportPacket(snapshot, {
      reviewIntelligenceAttachment: viewModel.reviewIntelligenceAttachment,
      auditEvents: viewModel.auditEvents,
      preparedBy: subject.analystName
    }),
    [snapshot, subject.analystName, viewModel.auditEvents, viewModel.reviewIntelligenceAttachment]
  );
  const fileNames = createExportFileNames(exportPacket);
  const heading = subjectDirty
    ? "Review update required"
    : adjustmentsLocked
      ? (reportPrepared ? "Export prepared" : "Ready to export")
      : "Adjustments need confirmation";
  const detail = subjectDirty
    ? "Property details changed after the last review. Rerun the analysis before exporting."
    : adjustmentsLocked
      ? (reportPrepared ? "The export package is prepared and ready to download." : "The review is locked and ready to export as a local demo package.")
      : "Confirm the adjustments before generating the final package.";
  const ctaLabel = subjectDirty
    ? "Return to Property Details"
    : adjustmentsLocked
      ? (reportPrepared ? "Regenerate export" : "Generate export")
      : "Go to Adjustments";

  const runnableExportActions: Record<Exclude<ExportActionId, "print" | "copy">, { requested: ExportOptions["requested"]; includeFallbacks: boolean; label: string }> = {
    "full-report": { requested: ["pdf", "docx"], includeFallbacks: true, label: "full report package" },
    pdf: { requested: ["pdf"], includeFallbacks: false, label: "PDF report" },
    docx: { requested: ["docx"], includeFallbacks: false, label: "Word DOCX" },
    csv: { requested: ["csv"], includeFallbacks: false, label: "CSV comparable set" },
    json: { requested: ["json"], includeFallbacks: false, label: "audit JSON" },
    zip: { requested: ["zip"], includeFallbacks: false, label: "full evidence ZIP" }
  };

  function simulationFlags() {
    const params = new URLSearchParams(window.location.search);
    return {
      failPdf: process.env.NODE_ENV !== "production" && params.get("failPdf") === "1",
      failDocx: process.env.NODE_ENV !== "production" && params.get("failDocx") === "1",
      failDownloads: process.env.NODE_ENV !== "production" && params.get("failDownloads") === "1"
    };
  }

  async function handleGenerate(action: ExportActionId = "full-report") {
    if (subjectDirty) {
      onOpenIntake();
      return;
    }
    if (!adjustmentsLocked) {
      onOpenAdjustments();
      return;
    }
    try {
      setIsGenerating(true);
      setActiveExportAction(action);
      setExportError(undefined);
      setExportRunResult(undefined);
      setShowCopyFallback(action === "copy");
      setExportProgress([]);

      if (action === "copy") {
        setExportProgress(["Copy report fallback opened"]);
        onGenerate();
        return;
      }

      if (action === "print") {
        setExportProgress(["Opening print-ready report"]);
        const printResult = openPrintReport(exportPacket);
        setExportRunResult({
          ok: printResult.ok,
          requested: ["html"],
          completed: printResult.ok ? [printResult] : [],
          failed: printResult.ok ? [] : [printResult],
          fallbackUsed: true,
          recommendedNextAction: printResult.ok ? "none" : "retry"
        });
        if (!printResult.ok) {
          throw new Error(printResult.error ?? "Print view could not be opened.");
        }
        onGenerate();
        return;
      }

      const actionConfig = runnableExportActions[action];
      setExportProgress([`Starting ${actionConfig.label}`]);
      const result = await runExport(exportPacket, {
        requested: actionConfig.requested,
        includeFallbacks: actionConfig.includeFallbacks,
        simulate: simulationFlags(),
        onProgress: (message) => setExportProgress((current) => [...current, message])
      });
      setExportRunResult(result);
      if (!result.ok) {
        setShowCopyFallback(true);
        throw new Error("Automatic downloads were blocked. Use the copy report fallback below.");
      }
      onGenerate();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsGenerating(false);
      setActiveExportAction(undefined);
    }
  }

  useEffect(() => {
    primaryExportActionRef.current = () => {
      void handleGenerate("full-report");
    };

    return () => {
      if (primaryExportActionRef.current) {
        primaryExportActionRef.current = null;
      }
    };
  });

  const exportFormatCards: Array<{
    id: ExportActionId;
    icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
    title: string;
    detail: string;
  }> = [
    { id: "pdf", icon: FileText, title: "PDF Report", detail: "Primary renderer with print fallback" },
    { id: "docx", icon: FileText, title: "Word DOCX", detail: "DOCX with .doc/.rtf fallback" },
    { id: "csv", icon: FileSpreadsheet, title: "CSV comparable set", detail: "Selected comparables and adjustments" },
    { id: "json", icon: Database, title: "Audit JSON", detail: "Packet facts and audit events" },
    { id: "zip", icon: FolderArchive, title: "Full evidence ZIP", detail: "HTML, Markdown, JSON, CSV, audit" },
    { id: "copy", icon: ClipboardCheck, title: "Copy report fallback", detail: "Markdown text if downloads are blocked" }
  ];
  const exportDisabledReason = subjectDirty
    ? "Return to Property Details before exporting."
    : !adjustmentsLocked
      ? "Confirm the adjustments before exporting."
      : undefined;

  return (
    <section className="report-ready-view export-workspace">
      <div className="report-ready">
        <CheckCircle2 size={42} />
        <div><h3>{heading}</h3><p>{detail}</p></div>
      </div>
      <div className="report-metrics">
        <Metric label="Estimated value" value={viewModel.pointEstimate} />
        <Metric label="Estimated range" value={viewModel.valueRange} />
        <Metric label="Confidence" value={viewModel.confidence} />
        <Metric label="Comparables included" value={viewModel.includedCompCount} />
      </div>
      <section className="insight-card export-control-card export-control-card-primary" aria-label="Export actions">
        <div className="export-command-header">
          <div>
            <span className="section-eyebrow">Export formats</span>
            <h3>Generate usable report artifacts</h3>
            <p>Choose one direct format or run the full resilient package. PDF/DOCX failures fall through to print, Word-compatible, ZIP, JSON, CSV, and copyable report paths.</p>
          </div>
          <div className="export-command-actions">
            <button
              className="primary-action export-primary-button"
              type="button"
              onClick={() => handleGenerate("full-report")}
              disabled={isGenerating}
              title={exportDisabledReason}
            >
              <PackageCheck size={18} /> {isGenerating && activeExportAction === "full-report" ? "Generating..." : ctaLabel}
            </button>
            <button
              className="export-link-button"
              type="button"
              onClick={() => handleGenerate("print")}
              disabled={isGenerating || Boolean(exportDisabledReason)}
            >
              <Printer size={16} /> Print view
            </button>
          </div>
        </div>
        {exportDisabledReason && (
          <div className="export-blocked-note">
            <Lock size={15} aria-hidden />
            <span>{exportDisabledReason}</span>
          </div>
        )}
        <div className="export-format-grid export-format-grid-compact">
          {exportFormatCards.map((card) => (
            <ExportFormatCard
              key={card.id}
              icon={card.icon}
              title={card.title}
              detail={card.detail}
              active={activeExportAction === card.id}
              disabled={isGenerating || Boolean(exportDisabledReason)}
              onClick={() => handleGenerate(card.id)}
            />
          ))}
        </div>
        {(exportProgress.length > 0 || exportRunResult || exportError) && (
          <div className="export-status-panel" aria-live="polite">
            <div className="export-progress-list export-progress-list-compact">
              {exportProgress.slice(-4).map((step, index) => (
                <div key={`${step}-${index}`}>
                  <CheckCircle2 size={16} aria-hidden />
                  <span>{step}</span>
                </div>
              ))}
            </div>
            {exportRunResult && (
              <div className="export-result-grid export-result-grid-compact">
                {exportRunResult.completed.slice(0, 4).map((result) => (
                  <div className="export-result-row confirmed" key={`${result.method}-${result.filename ?? result.format}`}>
                    <strong>{result.method}</strong>
                    <span>{result.filename ?? "Download started"}</span>
                  </div>
                ))}
                {exportRunResult.failed.slice(0, 3).map((result) => (
                  <div className="export-result-row review" key={`${result.method}-${result.filename ?? result.format}-${result.error}`}>
                    <strong>{result.method} failed</strong>
                    <span>{result.error ?? "Fallback used"}</span>
                  </div>
                ))}
              </div>
            )}
            {exportError && <p className="report-note export-error-note">{exportError}</p>}
          </div>
        )}
        <details className="export-supporting-details">
          <summary>File names and included sections</summary>
          <div className="export-supporting-grid">
            <div className="export-section">
              <h3>File details</h3>
              <Metric label="PDF" value={fileNames.pdf} />
              <Metric label="DOCX" value={fileNames.docx} />
              <Metric label="ZIP" value={fileNames.zip} />
            </div>
            <div className="export-section">
              <h3>Included sections</h3>
              <div className="export-check-list export-check-list-compact">
                {sections.map((section) => (
                  <div key={section}>
                    <SquareCheck size={16} aria-hidden />
                    <span>{section}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>
        {(showCopyFallback || exportRunResult?.failed.length) ? <CopyReportFallback packet={exportPacket} /> : null}
      </section>
      <section className="insight-card">
        <h3>Export notes</h3>
        <DeltaRow label="Use" value="Review support only" />
        <DeltaRow label="Decisioning" value="Not a credit decision" />
        <DeltaRow label="Valuation" value="Not an appraisal" />
        <DeltaRow label="Review" value="Analyst approval required" />
        <DeltaRow label="Data" value="Synthetic/public-style demo data." />
      </section>
      <section className="insight-card">
        <h3>Comparables included</h3>
        {viewModel.adjustedComparables.length ? viewModel.adjustedComparables.map((comp, index) => (
          <div className="report-row" key={comp.id}>
            <span>{index + 1}</span>
            <strong>{comp.address}</strong>
            <em>{viewModel.newCandidateId === comp.id ? "Newly added" : "Included"} / {comp.distanceKm.toFixed(1)} km / Score {Math.round(comp.totalScore)}</em>
          </div>
        )) : (
          <div className="zero-state-note">No comparables are included yet.</div>
        )}
      </section>
      <section className="insight-card audit-packet-card">
        <h3>Review Intelligence V2</h3>
        {activeReviewIntelligence ? (
          <>
            <div className="review-intel-highlight-grid">
              <div className="review-intel-highlight verdict">
                <span>Verdict</span>
                <strong>{verdictLabelFromCode(activeReviewIntelligence.verdict)}</strong>
                <small>{viewModel.reviewIntelligenceAttached ? "Attached to memo/export" : "Needs memo attachment"}</small>
              </div>
              <div className="review-intel-highlight">
                <span>Strongest comp</span>
                <strong>{activeReviewIntelligence.strongestComparable?.address ?? "Unavailable"}</strong>
                <small>Primary support anchor</small>
              </div>
              <div className="review-intel-highlight caution">
                <span>Weakest comp</span>
                <strong>{activeReviewIntelligence.weakestComparable?.address ?? "Unavailable"}</strong>
                <small>Check before export</small>
              </div>
            </div>
            <div className="review-intel-status-strip">
              <span><CheckCircle2 size={14} aria-hidden /> {viewModel.reviewIntelligenceAttachment ? "Verified and attached" : "Verified summary available"}</span>
              <span>{activeReviewIntelligenceSource === "llm_verified" ? "Verified LLM narrative" : "Deterministic fallback"}</span>
            </div>
            <p className="report-note review-intel-summary">{activeReviewIntelligence.memoReadySummary}</p>
            <div className="report-limitations">
              {activeReviewIntelligence.limitations.slice(0, 3).map((limitation) => (
                <div className="report-limitations-item" key={limitation}>
                  <Info size={14} aria-hidden />
                  <span>{limitation}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <DeltaRow label="Review method" value="Cross-platform evidence model" />
            <DeltaRow label="Audit boundary" value="Analyst review required" />
          </>
        )}
      </section>
      <ExportMemoSnapshot packet={exportPacket} />
      <p className="report-note">Exports include the review path, selected comparables, adjustments, memo, audit activity, and attached review intelligence when explicitly added to the memo. Local demo only.</p>
    </section>
  );
}

function ExportMemoSnapshot({ packet }: { packet: ExportPacket }) {
  const subject = packet.subject;
  const valuation = packet.valuation;
  const sourceScan = packet.sourceScan;
  const reviewSummary = packet.reviewIntelligence?.memoReadySummary;
  const compactReviewSummary = reviewSummary && reviewSummary.length > 210
    ? `${reviewSummary.slice(0, 207).trim()}...`
    : reviewSummary;
  const bullets = [
    `${subject.address}, ${subject.city}, ${subject.province} is reviewed as a ${subject.propertyType} with ${subject.beds} beds, ${subject.baths} baths, and ${subject.livingAreaSqft.toLocaleString()} sqft.`,
    `Estimated range is ${formatCurrency(valuation.lowEstimate)} to ${formatCurrency(valuation.highEstimate)} with current estimate ${formatCurrency(valuation.midpointEstimate)} and ${Math.round(valuation.confidenceScore)}% ${valuation.confidenceLabel} confidence.`,
    `${sourceScan.sourcesChecked} sources, ${sourceScan.recordsFound ?? 0} demo records, ${sourceScan.comparablesRanked ?? packet.comparables.length} candidates ranked, and ${sourceScan.comparablesSelected} comparables selected for review.`,
    compactReviewSummary
      ? `Review Intelligence V2: ${compactReviewSummary}`
      : "Review support only: not live MLS, not an appraisal, not a credit decision, and analyst review required."
  ].map((bullet) => bullet.replace(/\s+/g, " ").trim());

  return (
    <section className="export-memo-snapshot" aria-label="Property review memo snapshot">
      <div>
        <span className="section-eyebrow">Memo snapshot</span>
        <h3>Property review memo</h3>
      </div>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}

function ExportFormatCard({
  icon: Icon,
  title,
  detail,
  active,
  disabled,
  onClick
}: {
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  title: string;
  detail: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx("export-format-card", active && "active")}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${title}: ${detail}`}
    >
      <Icon size={17} aria-hidden />
      <strong>{title}</strong>
      <small>{detail}</small>
    </button>
  );
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 48 48" role="presentation" focusable="false">
      <defs>
        <linearGradient id="brandMarkBg" x1="8" x2="40" y1="6" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#132239" />
          <stop offset="1" stopColor="#09111d" />
        </linearGradient>
        <linearGradient id="brandMarkStroke" x1="13" x2="38" y1="12" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#79bcff" />
          <stop offset="0.55" stopColor="#45a3ff" />
          <stop offset="1" stopColor="#1769ff" />
        </linearGradient>
        <radialGradient id="brandMarkGlow" cx="0" cy="0" r="1" gradientTransform="translate(34 13) rotate(90) scale(12)" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(69, 163, 255, 0.95)" />
          <stop offset="1" stopColor="rgba(69, 163, 255, 0)" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="12" fill="url(#brandMarkBg)" stroke="rgba(138, 180, 232, 0.28)" />
      <path d="M11 18L24 10L37 18" stroke="rgba(121, 188, 255, 0.52)" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M15 12V36M15 24L25.5 13.5M15 24L25 33.5M28.5 14L33.5 32L38 14" stroke="url(#brandMarkStroke)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4" />
      <path d="M14 36H34.5" stroke="rgba(121, 188, 255, 0.38)" strokeLinecap="round" strokeWidth="2" />
      <circle cx="34.5" cy="13.5" r="6.4" fill="url(#brandMarkGlow)" />
      <circle cx="34.5" cy="13.5" r="2.5" fill="#d7ecff" opacity="0.92" />
    </svg>
  );
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  const shouldReduceMotion = useReducedMotion();
  const durationMs = toast.delta ? 7600 : toast.tone === "review" ? 6400 : 5400;
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingMsRef = useRef(durationMs);
  const startedAtRef = useRef(0);
  const onCloseRef = useRef(onClose);
  const Icon = toast.delta ? Target : toast.tone === "review" ? Info : CheckCircle2;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    remainingMsRef.current = durationMs;
    startedAtRef.current = Date.now();
    timeoutRef.current = setTimeout(() => onCloseRef.current(), durationMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [durationMs, toast.detail, toast.title, toast.tone, toast.delta]);

  function clearAutoDismiss() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function pauseAutoDismiss() {
    if (paused) return;
    clearAutoDismiss();
    remainingMsRef.current = Math.max(0, remainingMsRef.current - (Date.now() - startedAtRef.current));
    setPaused(true);
  }

  function resumeAutoDismiss() {
    if (!paused) return;
    setPaused(false);
    startedAtRef.current = Date.now();
    timeoutRef.current = setTimeout(() => onCloseRef.current(), remainingMsRef.current);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      resumeAutoDismiss();
    }
  }

  return (
    <motion.div
      className={clsx("toast", toast.tone, toast.delta && "gameplay-toast", paused && "is-paused")}
      data-tone={toast.tone}
      role="status"
      aria-live="polite"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98, filter: "blur(3px)" }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985, filter: "blur(2px)" }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={pauseAutoDismiss}
      onMouseLeave={resumeAutoDismiss}
      onFocus={pauseAutoDismiss}
      onBlur={handleBlur}
      style={{ "--toast-duration": `${durationMs}ms` } as CSSProperties}
    >
      <span className="toast-icon" aria-hidden>
        <Icon size={19} />
      </span>
      <div className="toast-copy">
        <div className="toast-heading-row">
          <strong>{toast.title}</strong>
          <span className="toast-lifetime">{paused ? "Paused" : "Auto-dismiss"}</span>
        </div>
        {toast.delta ? (
          <div className="gameplay-stats">
            <p>Review impact: {formatReviewImpact(toast.delta.marginalInformationGain ?? 0)}</p>
            <p>Confidence: {(toast.delta.confidenceDelta ?? 0) > 0 ? "+" : ""}{(toast.delta.confidenceDelta ?? 0).toFixed(1)} pts</p>
            <p>Review depth: {(toast.delta.effectiveSampleSizeDelta ?? 0) > 0 ? "+" : ""}{(toast.delta.effectiveSampleSizeDelta ?? 0).toFixed(1)}</p>
            <p>Range width: {(toast.delta.rangeWidthDelta ?? 0) < 0 ? "-" : "+"}${Math.abs(toast.delta.rangeWidthDelta ?? 0).toLocaleString()}</p>
            <p>Risk: {(toast.delta.riskSeverityDelta ?? 0) === 0 ? "unchanged" : ((toast.delta.riskSeverityDelta ?? 0) > 0 ? "+" : "") + (toast.delta.riskSeverityDelta ?? 0)}</p>
          </div>
        ) : (
          <p>{toast.detail}</p>
        )}
      </div>
      <button aria-label="Dismiss notification" type="button" onClick={onClose}><X size={18} /></button>
      <span className="toast-progress" aria-hidden><span /></span>
    </motion.div>
  );
}

function Field({ label, value, onChange, type = "text", step }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; step?: string }) {
  return <label>{label}<input type={type} step={step} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function Factor({ label, value, state }: { label: string; value: string; state: "High" | "Review" }) {
  const isHigh = state === "High";
  return (
    <div className="factor-row">
      <div><strong>{label}</strong><span>{value}</span></div>
      <em className={isHigh ? "high" : "review"}>{isHigh ? <CheckCircle2 size={13} /> : <Info size={13} />}{isHigh ? "Strong" : "Needs review"}</em>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric-row"><span>{label}</span><strong>{value}</strong></div>;
}

function DeltaRow({ label, value }: { label: string; value: string }) {
  return <div className="delta-row"><span>{label}</span><strong>{value}</strong></div>;
}

function StatusChecklist({ items }: { items: string[] }) {
  return (
    <ul className="status-list">
      {items.map((item) => (
        <li key={item}><CheckCircle2 size={15} /><span>{item}</span></li>
      ))}
    </ul>
  );
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(Math.round(value)).toLocaleString()}`;
}

function formatSignedCurrency(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function formatReviewImpact(value: number) {
  if (value > 0.25) return "Improves review";
  if (value < -0.25) return "Needs review";
  return "Neutral";
}

function formatEvidenceMix(value: number) {
  if (value > 0.03) return "More balanced";
  if (value < -0.03) return "Less balanced";
  return "Stable";
}
