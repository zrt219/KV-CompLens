"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Layers3,
  ListChecks,
  Lock,
  MoreHorizontal,
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
import { formatCurrency } from "../../lib/agent";
import { createAssistantContext, type AssistantDraft } from "../../lib/assistant";
import { dataProvenanceLabel, publicAssessmentSources } from "../../lib/provenance";
import { tutorialIntro, tutorialSteps } from "../../lib/tutorial";
import { buildExportArtifact, downloadExportArtifact, exportArtifactOptions, type ExportArtifactType } from "../../lib/pce/exportPackage";
import {
  selectAdjustmentGridViewModel,
  selectCivicGridViewModel,
  selectExportViewModel,
  selectInsightsViewModel,
  selectMemoViewModel
} from "../../lib/selectors/pceSelectors";
import {
  isSubjectReadyForAnalysis,
  usePceAnalysis,
  type PceToast,
  type PceViewMode
} from "../../hooks/usePceAnalysis";
import type { PceAnalysisSnapshot, PceAuditEvent } from "../../lib/pce/runPcePipeline";
import type { AdjustedComparable, CandidateImpact, PropertyCondition, PropertyType, ScoredComparable, SubjectProperty, ValuationDelta, ValuationRange } from "../../lib/types";

type ViewMode = PceViewMode;
type ToastState = PceToast;
type WorkflowStepId = "intake" | "sources" | "review" | "adjust" | "export";

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
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [workflowPulse, setWorkflowPulse] = useState<string>();
  const workflowPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subject = state.subject;
  const canRunAnalysis = isSubjectReadyForAnalysis(subject);
  const subjectDisplayName = subject.address.trim() || "No property entered";
  const subjectDisplayMeta = canRunAnalysis
    ? "Ready for the source scan"
    : "Enter property details to unlock the source scan";
  const viewMode = state.activeView;
  const civicGrid = selectCivicGridViewModel(state);
  const insights = selectInsightsViewModel(state);
  const adjustmentGrid = selectAdjustmentGridViewModel(state);
  const memoView = selectMemoViewModel(state);
  const exportView = selectExportViewModel(state);
  const candidate = civicGrid.candidate;
  const workflowStep = getWorkflowStepId(viewMode, showForm, state.analysisStarted);
  const activeNavId = workflowStep;
  const candidateDrawerVisible = state.analysisStarted && !showForm && (viewMode === "network" || viewMode === "discovery") && Boolean(state.newCandidateId) && Boolean(candidate);
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

  useEffect(() => () => {
    if (workflowPulseTimer.current) {
      clearTimeout(workflowPulseTimer.current);
    }
  }, []);

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
    const nextStep: Record<WorkflowStepId, ViewMode | "subject"> = {
      intake: "subject",
      sources: "network",
      review: "adjustments",
      adjust: "report",
      export: "report"
    };
    if (workflowStep === "adjust" || workflowStep === "export") {
      prepareReport();
      return;
    }
    const next = nextStep[workflowStep];
    if (next === "subject") {
      openSubjectIntake();
      return;
    }
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

  function loadExampleSubject() {
    dispatch({ type: "LOAD_SUBJECT", subject: defaultMockSubject });
    setReportPrepared(false);
    setAdjustmentsLocked(false);
    setShowForm(true);
  }

  return (
    <main className={clsx("app-shell", readabilityMode && "readability-mode")}>
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
        <button className="project-picker" type="button" onClick={openSubjectIntake}>
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
                className={clsx(active && "active", disabled && "disabled")}
                aria-current={active ? "page" : undefined}
                type="button"
                disabled={disabled}
                aria-disabled={disabled}
                title={disabled ? (item.id === "export" ? "Lock the adjustments before opening export." : "Enter subject details and run the initial scan first.") : undefined}
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
          <a className="github-link" href="https://github.com/zrt219/KV-CompLens" target="_blank" rel="noreferrer">
            <FileText size={14} aria-hidden />
            <span className="github-link-copy">
              <small>Repository</small>
              <strong>zrt219/KV-CompLens</strong>
            </span>
          </a>
        </div>
      </aside>

      <section className="main-stage" aria-label="Property review workspace">
        <header className="stage-header">
          <div className="stage-title-copy">
            <h2>{titleForView(viewMode, showForm)}</h2>
            {state.analysisStarted && <p>{subject.address || subjectDisplayName} / local demo snapshot</p>}
            <div className="stage-status-row" aria-live="polite">
              <span className={clsx("status-chip", workflowStatus.tone)}>
                <StatusIcon size={14} aria-hidden />
                {workflowStatus.label}
              </span>
              <p>{workflowStatus.detail}</p>
            </div>
          </div>
          <div className="actions">
            <button className="find-action" type="button" onClick={findMoreComparables} disabled={!state.analysisStarted} title={!state.analysisStarted ? "Run the analysis first to find more homes." : undefined}><Search size={17} /> Find More Homes</button>
            <button className="edit-action" type="button" onClick={() => setShowForm(true)}><SlidersHorizontal size={17} /> Edit Property</button>
            <button type="button" onClick={prepareReport} disabled={!state.analysisStarted || !adjustmentsLocked} title={!state.analysisStarted ? "Enter the property details and run the analysis first." : !adjustmentsLocked ? "Confirm the adjustments before exporting." : undefined}><FileDown size={17} /> Export</button>
            <button className={clsx("icon-action", readabilityMode && "active")} type="button" aria-pressed={readabilityMode} aria-label="Toggle readability mode" onClick={() => setReadabilityMode((value) => !value)}><Eye size={18} /></button>
            <button className="icon-action" type="button" aria-label="More actions unavailable in demo mode" disabled title="More actions are unavailable in this local demo."><MoreHorizontal size={18} /></button>
            <button className="primary-action" type="button" onClick={goToNextStep} disabled={!canRunAnalysis && !state.analysisStarted} title={!canRunAnalysis && !state.analysisStarted ? "Fill in the property details first." : undefined}>
              {!state.analysisStarted ? <RefreshCw size={17} /> : <ChevronRight size={17} />}
              {state.analysisStarted ? "Next Step" : "Run Analysis"}
            </button>
          </div>
        </header>

        <WorkflowProgress viewModel={civicGrid.workflow} workflowStep={workflowStep} analysisStarted={state.analysisStarted} />
        {showForm ? (
          <SubjectForm
            subject={subject}
            dirty={subjectDirty}
            canRunAnalysis={canRunAnalysis}
            analysisStarted={state.analysisStarted}
            tutorialOpen={tutorialOpen}
            onToggleTutorial={() => setTutorialOpen((value) => !value)}
            update={update}
            runAnalysis={runAnalysis}
            loadExample={loadExampleSubject}
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
                onSelectComparable={(id) => dispatch({ type: "SELECT_COMPARABLE", id })}
                onFindCandidate={findMoreComparables}
                onRunAnalysis={runAnalysis}
              />
            )}
            {viewMode === "discovery" && <DiscoveryView subject={civicGrid.subject} ranked={civicGrid.rankedComparables} rejected={civicGrid.rejectedComparables} selectedIds={civicGrid.selectedIds} activeComparableId={state.activeComparableId} candidate={candidate} newCompId={state.newCandidateId} onSelect={(id) => dispatch({ type: "SELECT_COMPARABLE", id })} onFindMore={findMoreComparables} />}
            {viewMode === "table" && <SourceScanView snapshot={state.snapshot} onRunAnalysis={runAnalysis} />}
            {viewMode === "adjustments" && <AdjustmentView viewModel={adjustmentGrid} adjustmentsLocked={adjustmentsLocked} onSelect={(id) => dispatch({ type: "SELECT_COMPARABLE", id })} onExclude={(id) => { dispatch({ type: "EXCLUDE_COMPARABLE", id }); setReportPrepared(false); setAdjustmentsLocked(false); }} onLock={() => { setAdjustmentsLocked(true); }} />}
            {viewMode === "valuation" && <ValuationSummary snapshot={state.snapshot} newCompId={state.newCandidateId} />}
            {viewMode === "report" && <ReportReady viewModel={exportView} memoView={memoView} subject={state.snapshot.subject} snapshot={state.snapshot} reportPrepared={reportPrepared} subjectDirty={subjectDirty} adjustmentsLocked={adjustmentsLocked} onOpenIntake={openSubjectIntake} onOpenAdjustments={() => openWorkspaceView("adjustments")} onGenerate={() => { setReportPrepared(true); pulseWorkflowStatus("Export package generated"); }} />}
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
          {state.toast && <Toast toast={state.toast} onClose={() => dispatch({ type: "CLEAR_TOAST" })} />}
        </AnimatePresence>

      </section>

      <InsightsRail
        viewModel={insights}
        analysisStarted={state.analysisStarted}
        onReport={() => { setShowForm(false); dispatch({ type: "SET_VIEW", view: "report" }); }}
      />
    </main>
  );
}

function titleForView(viewMode: ViewMode, showForm: boolean) {
  if (showForm) return "Property Intake";
  const titles: Record<ViewMode, string> = {
    network: "Review Homes",
    discovery: "Review Homes",
    table: "Source Scan",
    adjustments: "Adjustments",
    valuation: "Adjustments",
    report: "Export Package",
    memo: "Export Package"
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
      detail: "The system is refreshing the home review now.",
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
      detail: "Check the source summary before moving into home review.",
      tone: "review" as const,
      icon: ListChecks
    };
  }
  if (workflowStep === "review") {
    return {
      label: "Review homes",
      detail: "Inspect the selected homes and surface a stronger comp if needed.",
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
    detail: "Homes are loaded. Review them, then confirm adjustments before export.",
    tone: "confirmed" as const,
    icon: CheckCircle2
  };
}

function formatConfidenceLevel(level: string) {
  return level === "Review Required" ? "Review needed" : level;
}

function SubjectForm({ subject, dirty, canRunAnalysis, analysisStarted, tutorialOpen, onToggleTutorial, update, runAnalysis, loadExample }: { subject: SubjectProperty; dirty: boolean; canRunAnalysis: boolean; analysisStarted: boolean; tutorialOpen: boolean; onToggleTutorial: () => void; update: <K extends keyof SubjectProperty>(key: K, value: SubjectProperty[K]) => void; runAnalysis: () => void; loadExample: () => void }) {
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
      <section className="tutorial-panel" aria-labelledby="tutorial-title">
        <div className="tutorial-panel-head">
          <div>
            <span className="card-label">Quick tutorial</span>
            <h3 id="tutorial-title">How to use KV CompLens</h3>
            <p>{tutorialIntro}</p>
          </div>
          <button
            className="tutorial-toggle"
            type="button"
            aria-expanded={tutorialOpen}
            aria-controls="tutorial-steps"
            onClick={onToggleTutorial}
          >
            {tutorialOpen ? "Hide walkthrough" : "Show walkthrough"}
          </button>
        </div>
        {tutorialOpen ? (
          <div className="tutorial-steps" id="tutorial-steps">
            {tutorialSteps.map((step, index) => {
              const Icon = tutorialStepIcons[step.id] ?? Info;
              return (
                <article key={step.id} className="tutorial-step">
                  <div className="tutorial-step-head">
                    <span className="tutorial-step-index">{index + 1}</span>
                    <Icon size={16} aria-hidden />
                  </div>
                  <h4>{step.title}</h4>
                  <p>{step.detail}</p>
                  <small>{step.note}</small>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="tutorial-collapsed">
            <p>Tutorial hidden. Use the button above to show the walkthrough again.</p>
          </div>
        )}
      </section>
      <div className="success-banner subject-intake-banner">
        <ShieldCheck size={34} />
        <div>
          <strong>Property details</strong>
          <p>Enter the property details before homes or value results appear.</p>
        </div>
      </div>
      <div className="subject-intake-layout">
        <form className="subject-form-panel" onSubmit={(event) => { event.preventDefault(); runAnalysis(); }}>
          <div className="form-panel-head">
            <div>
              <h3>Property Details</h3>
              <p>All fields stay local. Run the analysis once the required property details are in place.</p>
            </div>
            <span className={clsx("status-chip", dirty ? "review" : canRunAnalysis ? "confirmed" : "review")}>
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
            <button type="button" onClick={() => { update("address", "12345 109 St NW"); update("propertyType", "Detached"); update("city", "Edmonton"); loadExample(); }}>Use Example Property</button>
            <button className="primary-action" type="submit" disabled={!canRunAnalysis} title={!canRunAnalysis ? "Enter the property details first." : undefined}>Run Analysis</button>
          </div>
        </form>
        <aside className="subject-preview-stack">
          <section className="subject-preview-card">
            <div className="panel-head-row">
              <h3>Property Preview</h3>
              <span className={clsx("status-chip", canRunAnalysis ? "confirmed" : "review")}><HomeIcon size={14} /> {canRunAnalysis ? "Ready for source scan" : "Waiting for details"}</span>
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
              <span className="status-chip review"><Info size={14} /> {canRunAnalysis ? "Demo only" : "Waiting for details"}</span>
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

const tutorialStepIcons: Record<string, ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  "enter-details": ClipboardCheck,
  "run-analysis": RefreshCw,
  "source-scan": ListChecks,
  "review-homes": Target,
  "confirm-export": FileDown
};

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
      value: analysisStarted ? viewModel.candidateSummary : "No homes ranked yet",
      state: currentIndex === 2 ? "active" : currentIndex > 2 ? "complete" : "pending"
    },
    {
      label: "Adjust",
      short: "Adjust",
      value: analysisStarted ? viewModel.adjustmentSummary : "No homes confirmed yet",
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
        <div key={label} className={clsx("workflow-step", stepState)}>
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
            <span className="status-chip review">New home found</span>
            <h3>Review the home before adding it</h3>
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
        <h4>Why this home surfaced</h4>
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
          <Metric label="Home count" value={impact ? formatSigned(impact.delta.compCountDelta) : "Pending"} />
          <Metric label="Information gain" value={impact ? impact.marginalInformationGain.toFixed(3) : "Pending"} />
          <Metric label="Effective sample" value={impact ? formatSigned(impact.deltaEffectiveSampleSize) : "Pending"} />
          <Metric label="Evidence balance" value={impact ? formatSigned(impact.deltaEntropy) : "Pending"} />
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

function InsightsRail({
  viewModel,
  analysisStarted,
  onReport
}: {
  viewModel: ReturnType<typeof selectInsightsViewModel>;
  analysisStarted: boolean;
  onReport: () => void;
}) {
  const selectedComp = viewModel.selectedComparable;
  return (
    <aside className="insights-rail" aria-label="Valuation insights">
      <div className="insights-head">
        <h2>Review Summary</h2>
        <span>{analysisStarted ? "LOCAL ONLY" : "WAITING FOR DETAILS"}</span>
      </div>
      {!analysisStarted ? (
        <>
          <section className="insight-card value-card">
            <span className="card-label">Value range</span>
            <strong>Awaiting analysis</strong>
            <div className="zero-state-note" style={{ marginTop: 12 }}>No value estimate appears until the subject is reviewed.</div>
          </section>
          <section className="insight-card confidence-card">
            <span className="card-label">Confidence</span>
            <div className="confidence-row">
              <div className="ring" style={{ "--score": "0deg" } as CSSProperties}>N/A</div>
              <div>
                <strong>Waiting for property details</strong>
                <p>Confidence appears after the review set is built.</p>
              </div>
            </div>
          </section>
          <section className="insight-card selected-card">
            <span className="card-label">Selected home</span>
            <div className="zero-state-note">No home selected yet. Run the analysis to populate the review set.</div>
          </section>
          <section className="insight-card">
            <span className="card-label">Why these homes fit</span>
            <div className="zero-state-note">Run the analysis to see how the selected homes compare.</div>
          </section>
          <section className="insight-card">
            <span className="card-label">Source check summary</span>
            <div className="zero-state-note">Source counts appear after the analysis runs.</div>
            <small>{viewModel.sourceScan.dataBoundaryNote}</small>
          </section>
          <section className="insight-card">
            <span className="card-label">Review flags</span>
            <div className="zero-state-note">No review flags yet. They appear after the analysis runs.</div>
          </section>
          <section className="insight-card">
            <span className="card-label">Recent updates</span>
            <ActivityTimeline items={[]} emptyMessage="Waiting for the analysis to start." />
            <button className="rail-action" type="button" onClick={onReport} disabled title="Run the analysis first to open the export preview."><FileDown size={16} /> Open export preview</button>
          </section>
        </>
      ) : (
        <>
      <section className="insight-card value-card">
        <span className="card-label">{analysisStarted ? "Estimated value range" : "Waiting for property details"}</span>
        <strong>{viewModel.valueRange}</strong>
        <p>{analysisStarted ? <>Current estimate <b>{viewModel.pointEstimate}</b></> : "Enter the property details and run the analysis to see the value range."}</p>
        <div className="range-track"><i /></div>
        <div className="range-labels"><span>{viewModel.lowEstimate}</span><span>{viewModel.highEstimate}</span></div>
      </section>
      <section className="insight-card confidence-card">
        <span className="card-label">Confidence</span>
        <div className="confidence-row">
          <div className="ring" style={{ "--score": `${Math.round(viewModel.confidenceScore * 3.6)}deg` } as CSSProperties}>{Math.round(viewModel.confidenceScore)}%</div>
          <div>
            <strong>{analysisStarted ? `${viewModel.confidenceLevel} confidence` : "Waiting for property details"}</strong>
            <p>{viewModel.confidenceRationale}</p>
          </div>
        </div>
      </section>
      <section className="insight-card selected-card">
        <span className="card-label">Selected home</span>
        {selectedComp && (
          <>
            <strong>{selectedComp.address}</strong>
            <p>{selectedComp.city} / {selectedComp.neighbourhood}</p>
            <div className="selected-risk"><Info size={15} /> {selectedComp.riskFlags[0] ?? "No major review flags for this home."}</div>
            <div className="selected-metrics">
              <Metric label="Score" value={`${selectedComp.totalScore}/100`} />
              <Metric label="Adjusted" value={formatCurrency(selectedComp.adjustedValue)} />
              <Metric label="Distance" value={`${selectedComp.distanceKm.toFixed(1)} km`} />
              <Metric label="Match chance" value={`${selectedComp.comparableProbabilityPercent}%`} />
            </div>
          </>
        )}
        {!selectedComp && (
          <div className="zero-state-note">
            No home selected yet. Run the analysis to populate the review set.
          </div>
        )}
      </section>
      <section className="insight-card">
        <span className="card-label">Why these homes fit</span>
        <Factor label="Location fit" value={viewModel.distanceRange} state={analysisStarted ? "High" : "Review"} />
        <Factor label="Average Match" value={viewModel.averageMatch} state={analysisStarted && (viewModel.confidenceSupportsReview || viewModel.averageScore >= viewModel.valuation.averageSimilarity) ? "High" : "Review"} />
        <Factor label="Match chance" value={viewModel.averageComparableProbability} state={analysisStarted && viewModel.valuation.normalizedRiskSeverity === 0 ? "High" : "Review"} />
        <Factor label="Review size" value={viewModel.effectiveSampleSize} state={analysisStarted && !viewModel.valuationRiskFlags.has("Not enough homes selected.") ? "High" : "Review"} />
        <Factor label="Source quality" value={viewModel.averageSourceReliability} state={analysisStarted && viewModel.valuation.averageSourceReliability >= viewModel.valuation.averageComparableProbability ? "High" : "Review"} />
        <Factor label="Value range width" value={viewModel.valueSpread} state={analysisStarted && !viewModel.valuationRiskFlags.has("Wide adjusted-value spread") ? "High" : "Review"} />
      </section>
      <section className="insight-card">
        <span className="card-label">Source check summary</span>
        <Metric label="Homes scanned" value={`${viewModel.sourceScan.syntheticRecentSalesScanned} simulated records`} />
        <Metric label="Public records matched" value={`${viewModel.sourceScan.municipalAssessmentReferences} matched`} />
        <Metric label="Homes to review" value={`${viewModel.sourceScan.candidatePoolCount} ranked / ${viewModel.sourceScan.rejectedCount} lower-ranked`} />
        <Metric label="Estimated time saved" value={`${viewModel.sourceScan.estimatedManualTimeSavedHours} hrs`} />
        <small>{viewModel.sourceScan.dataBoundaryNote}</small>
      </section>
      <section className="insight-card">
        <span className="card-label">Review flags</span>
        {viewModel.riskFlags.length ? viewModel.riskFlags.slice(0, 4).map((flag) => (
          <Factor key={flag} label={flag} value="Analyst review" state="Review" />
        )) : (
          <div className="zero-state-note">No review flags yet. They appear after the analysis runs.</div>
        )}
      </section>
      <section className="insight-card">
        <span className="card-label">Recent updates</span>
        <ActivityTimeline
          items={viewModel.auditEvents.slice(0, 6)}
          emptyMessage={analysisStarted ? "No recent updates yet." : "Waiting for the analysis to start."}
        />
        <button className="rail-action" type="button" onClick={onReport} disabled={!analysisStarted} title={!analysisStarted ? "Run the analysis first to open the export preview." : undefined}><FileDown size={16} /> Open export preview</button>
      </section>
        </>
      )}
    </aside>
  );
}

function DiscoveryView({ subject, ranked, rejected, selectedIds, activeComparableId, candidate, newCompId, onSelect, onFindMore }: { subject: SubjectProperty; ranked: ScoredComparable[]; rejected: ScoredComparable[]; selectedIds: Set<string>; activeComparableId?: string; candidate?: ScoredComparable; newCompId?: string; onSelect: (id: string) => void; onFindMore: () => void }) {
  const topCandidates = ranked.filter((comp) => !selectedIds.has(comp.id)).slice(0, 8);
  const bestCandidate = candidate ?? topCandidates[0];
  return (
    <section className="discovery-layout">
      <div className="discovery-list">
        <div className="section-title"><h3>Top Home Matches</h3><button type="button" onClick={onFindMore}><Search size={16} /> Find More Homes</button></div>
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
        )) : <div className="empty-state">All of the strongest homes are already selected. Find more homes to widen the review set.</div>}
        <div className="rejected-list">
          <strong>Excluded / lower-ranked homes</strong>
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
        )) : <div className="candidate-board-empty">No new home cards to plot on the discovery board.</div>}
      </div>
      <div className="discovery-insight">
        <span className="status-chip review"><Star size={14} /> Best match found</span>
        <h3>{bestCandidate?.address ?? "No home available"}</h3>
        <p>{bestCandidate ? `${bestCandidate.address} improves coverage across similarity, timing, and location.` : "All of the strongest homes are already in the selected set. Find more homes to widen coverage."}</p>
        {bestCandidate && <PropertyThumbnail propertyType={bestCandidate.propertyType} seed={bestCandidate.address} isNew={newCompId === bestCandidate.id} />}
        <Factor label="Best available match" value={bestCandidate ? `${Math.round(bestCandidate.totalScore)}/100 score` : "None"} state={bestCandidate ? "High" : "Review"} />
        <Factor label="Distance" value={bestCandidate ? `${bestCandidate.distanceKm.toFixed(1)} km` : "N/A"} state="Review" />
        <Factor label="Recency" value={bestCandidate ? `${bestCandidate.daysSinceSale} days since sale` : "N/A"} state={bestCandidate && !bestCandidate.riskFlags.includes("Stale sale date") ? "High" : "Review"} />
        <Factor label="Coverage" value={`${selectedIds.size} homes selected`} state="High" />
        <button className="primary-action" type="button" onClick={onFindMore}><Target size={16} /> Surface strongest home</button>
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
          <p>Review, clean, and score local demo sources before homes are ranked.</p>
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
            <span>{index === 1 ? `${scan.recordsScanned.toLocaleString()} records` : index === 4 ? `${scan.candidatePoolCount.toLocaleString()} homes` : "Complete"}</span>
          </div>
        ))}
      </div>
      <div className="scan-metric-grid">
        <Metric label="Sources checked" value={String(scan.sourcesConsolidated)} />
        <Metric label="Records found" value={scan.recordsScanned.toLocaleString()} />
        <Metric label="Matches found" value={(scan.syntheticRecentSalesMatched + scan.assessmentRecordsMatched + scan.listingRecordsMatched).toLocaleString()} />
        <Metric label="Homes to review" value={scan.candidatePoolCount.toLocaleString()} />
        <Metric label="Homes selected" value={scan.selectedCompCount.toLocaleString()} />
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
      </section>
      <div className="source-bottom-grid">
        <section className="insight-card source-quality-card">
          <h3>Source quality summary</h3>
          <div className="confidence-row">
            <div className="ring" style={{ "--score": "302deg" } as CSSProperties}>84%</div>
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
        <div className="adjustment-comp-strip" style={{ "--comp-strip-cols": comps.length + 1 } as CSSProperties} aria-label="Selected home adjustment set">
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
              <span>Home {index + 1}</span>
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
                <span>{viewModel.newCandidateId === comp.id ? "New home" : `Home ${index + 1}`}</span><strong>{comp.address}</strong>
              </button>
              <button className="table-action" type="button" onClick={() => onExclude(comp.id)} disabled={adjustmentsLocked} title={adjustmentsLocked ? "Unlock the review set before removing a home." : undefined}>Exclude</button>
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
      <Metric label="Basis" value="Adjusted home sales" />
      <Metric label="Midpoint change" value={delta ? formatSignedCurrency(delta.pointDelta) : "Baseline"} />
      <Metric label="Confidence change" value={delta ? `${formatSigned(delta.confidenceDelta)} pts` : "Baseline"} />
      <Metric label="Range width" value={delta ? (delta.rangeNarrowed ? "Narrowed" : "Expanded") : "Baseline"} />
      <Metric label="Evidence gain" value={delta?.marginalInformationGain ? delta.marginalInformationGain.toFixed(3) : "Baseline"} />
      <Metric label="Range method" value="Adjusted home sales" />
      <button className={clsx("primary-action", locked && "locked-action")} type="button" onClick={onLock} disabled={locked} aria-disabled={locked}><Lock size={16} /> {locked ? "Adjustments Locked" : "Confirm and Lock"}</button>
      <div className="impact-note"><RefreshCw size={16} /> The value range updates automatically when the home set changes.</div>
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
          <p>Derived from adjusted home sales, not a guess.</p>
        </div>
        <div className="confidence-row">
          <div className="ring" style={{ "--score": `${Math.round(snapshot.valuation.confidenceScore * 3.6)}deg` } as CSSProperties}>{Math.round(snapshot.valuation.confidenceScore)}%</div>
          <div><h3>{formatConfidenceLevel(snapshot.valuation.confidenceLevel)} confidence</h3><p>{snapshot.valuation.confidenceRationale}</p></div>
        </div>
      </div>
      <div className="improvement-chips">
        <span className={delta ? "confirmed" : "neutral"}>{delta ? <CheckCircle2 size={16} /> : <Info size={16} />} {delta ? `${formatSigned(delta.compCountDelta)} home count change` : "Baseline home set"}</span>
        <span className={delta ? "confirmed" : "neutral"}>{delta ? <CheckCircle2 size={16} /> : <Info size={16} />} {delta ? `${formatSigned(delta.confidenceDelta)} confidence pts` : "No prior confidence delta"}</span>
        <span><CheckCircle2 size={16} /> Effective sample {snapshot.valuation.effectiveSampleSize}</span>
        <span><CheckCircle2 size={16} /> Model fusion {formatCurrency(snapshot.valuation.modelFusion.finalEstimate)}</span>
        <span><CheckCircle2 size={16} /> Average match {snapshot.valuation.averageSimilarity}/100</span>
      </div>
      <div className="summary-grid">
        <section className="insight-card">
          <h3>{delta ? "What changed after the new home?" : "Baseline review"}</h3>
          <DeltaRow label="Estimated value" value={delta ? formatSignedCurrency(delta.pointDelta) : "Baseline"} />
          <DeltaRow label="Value Range" value={delta ? formatSignedCurrency(delta.rangeWidthDelta) : "Baseline"} />
          <DeltaRow label="Confidence Score" value={delta ? `${formatSigned(delta.confidenceDelta)} pts` : "Baseline"} />
          <DeltaRow label="Home Count" value={delta ? formatSigned(delta.compCountDelta) : "Baseline"} />
          <DeltaRow label="Effective Sample" value={delta?.effectiveSampleSizeDelta ? formatSigned(delta.effectiveSampleSizeDelta) : "Baseline"} />
          <DeltaRow label="Evidence Balance" value={delta?.entropyDelta ? formatSigned(delta.entropyDelta) : "Baseline"} />
          <DeltaRow label="Information Gain" value={delta?.marginalInformationGain ? delta.marginalInformationGain.toFixed(3) : "Baseline"} />
        </section>
        <section className="insight-card">
          <h3>Estimate blend</h3>
          <DeltaRow label="Blend estimate" value={formatCurrency(snapshot.valuation.modelFusion.finalEstimate)} />
          {snapshot.valuation.modelFusion.modelWeights.map((model) => (
            <DeltaRow key={model.id} label={model.label.replace("Model", "")} value={`${Math.round(model.weight * 100)}% weight`} />
          ))}
        </section>
        <section className="insight-card">
          <h3>Homes in the review set</h3>
          {snapshot.valuation.adjustedComparables.map((comp) => (
            <div className="summary-comp" key={comp.id}>
              <span>{newCompId === comp.id ? "New" : "Included"}</span>
              <strong>{comp.address}</strong>
              <em>{formatCurrency(comp.adjustedValue)} / Match {Math.round(comp.totalScore)}</em>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}

function AssistantDraftPanel({ subject, snapshot }: { subject: SubjectProperty; snapshot: PceAnalysisSnapshot }) {
  const [draft, setDraft] = useState<AssistantDraft>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const requestKey = `${subject.address}|${subject.city}|${snapshot.generatedAt}|${snapshot.valuation.includedCompCount}|${snapshot.valuation.pointEstimate}`;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadDraft() {
      try {
        setLoading(true);
        setError(undefined);
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(createAssistantContext(subject, snapshot))
        });

        if (!response.ok) {
          throw new Error(`Assistant request failed with status ${response.status}.`);
        }

        const nextDraft = await response.json() as AssistantDraft;
        if (active) {
          setDraft(nextDraft);
        }
      } catch (err) {
        if (!controller.signal.aborted && active) {
          setError(err instanceof Error ? err.message : "Assistant draft unavailable.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDraft();

    return () => {
      active = false;
      controller.abort();
    };
  }, [requestKey, snapshot, subject]);

  if (loading && !draft) {
    return <div className="assistant-empty">Drafting the trace against the current review set.</div>;
  }

  const currentDraft = draft;

  if (!currentDraft) {
    return <div className="assistant-empty">{error ?? "Assistant draft unavailable."}</div>;
  }

  const sourceLabel = currentDraft.source === "openai" ? "MODEL ASSISTED" : "LOCAL FALLBACK";

  return (
    <div className="assistant-panel">
      <div className="assistant-panel-head">
        <span className={clsx("status-chip", currentDraft.source === "openai" ? "confirmed" : "review")}>{sourceLabel}</span>
        <small>{currentDraft.model}</small>
      </div>
      <p>{currentDraft.summary}</p>
      <div className="assistant-trace">
        {currentDraft.trace.map((step) => (
          <article className={clsx("assistant-trace-step", step.state)} key={step.label}>
            <span>{step.label}</span>
            <strong>{step.detail}</strong>
          </article>
        ))}
      </div>
      <div className="assistant-bullets">
        {currentDraft.memoBullets.map((bullet) => (
          <div key={bullet}>
            <SquareCheck size={14} aria-hidden />
            <span>{bullet}</span>
          </div>
        ))}
      </div>
      <div className="assistant-recommendation">
        <strong>Recommendation</strong>
        <p>{currentDraft.recommendation}</p>
      </div>
      <div className="assistant-question">
        <strong>Reviewer question</strong>
        <p>{currentDraft.question}</p>
      </div>
      {currentDraft.missingFields.length ? (
        <div className="assistant-missing">
          <strong>Missing intake fields</strong>
          <p>{currentDraft.missingFields.join(", ")}</p>
        </div>
      ) : (
        <div className="assistant-missing">
          <strong>Missing intake fields</strong>
          <p>No missing fields flagged for this review snapshot.</p>
        </div>
      )}
      {error && <p className="assistant-error">{error}</p>}
    </div>
  );
}

function ReportReady({
  viewModel,
  memoView,
  subject,
  snapshot,
  reportPrepared,
  subjectDirty,
  adjustmentsLocked,
  onOpenIntake,
  onOpenAdjustments,
  onGenerate
}: {
  viewModel: ReturnType<typeof selectExportViewModel>;
  memoView: ReturnType<typeof selectMemoViewModel>;
  subject: SubjectProperty;
  snapshot: PceAnalysisSnapshot;
  reportPrepared: boolean;
  subjectDirty: boolean;
  adjustmentsLocked: boolean;
  onOpenIntake: () => void;
  onOpenAdjustments: () => void;
  onGenerate: () => void;
}) {
  const [selectedExportType, setSelectedExportType] = useState<ExportArtifactType>("memo-pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const sections = [
    "Executive Summary",
    "Home Summary",
    "Adjustment Grid",
    "Value Reconciliation",
    "Review Activity",
    "Assumptions and Limits"
  ];
  const artifact = useMemo(
    () => buildExportArtifact(selectedExportType, subject, snapshot),
    [selectedExportType, snapshot, subject]
  );
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

  async function handleGenerate() {
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
      setExportError(undefined);

      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedExportType,
          subject,
          snapshot
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}.`);
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      downloadExportArtifact({
        fileName: artifact.fileName,
        mimeType: response.headers.get("content-type") ?? artifact.mimeType,
        content: bytes
      });
      onGenerate();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsGenerating(false);
    }
  }

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
        <Metric label="Homes included" value={viewModel.includedCompCount} />
      </div>
      <section className="insight-card">
        <h3>Export notes</h3>
        <DeltaRow label="Use" value="Review support only" />
        <DeltaRow label="Decisioning" value="Not a credit decision" />
        <DeltaRow label="Valuation" value="Not an appraisal" />
        <DeltaRow label="Review" value="Analyst approval required" />
        <DeltaRow label="Data" value="Simulated home sales" />
      </section>
      <section className="insight-card">
        <h3>Homes included</h3>
        {viewModel.adjustedComparables.length ? viewModel.adjustedComparables.map((comp, index) => (
          <div className="report-row" key={comp.id}>
            <span>{index + 1}</span>
            <strong>{comp.address}</strong>
            <em>{viewModel.newCandidateId === comp.id ? "Newly added" : "Included"} / {comp.distanceKm.toFixed(1)} km / Match {Math.round(comp.totalScore)}</em>
          </div>
        )) : (
          <div className="zero-state-note">No homes are included yet.</div>
        )}
      </section>
      <section className="insight-card assistant-card">
        <details className="assistant-trace-collapsible">
          <summary className="assistant-trace-summary">
            <span className="card-label">Agent reasoning trace</span>
            <span className="trace-toggle-label">Show / hide</span>
          </summary>
          <AssistantDraftPanel subject={subject} snapshot={snapshot} />
        </details>
      </section>
      <MemoView viewModel={memoView} embedded />
      <section className="insight-card export-control-card">
        <div className="export-section export-section-wide">
          <h3>Format</h3>
          <div className="export-type-grid">
            {exportArtifactOptions.map((option) => (
              <button
                className={clsx("export-type-card", selectedExportType === option.id && "selected")}
                type="button"
                key={option.id}
                onClick={() => setSelectedExportType(option.id)}
              >
                <FileDown size={17} aria-hidden />
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="export-section">
          <h3>File details</h3>
          <Metric label="File name" value={artifact.fileName} />
          <Metric label="Value range" value={viewModel.valueRange} />
          <Metric label="Confidence" value={viewModel.confidence} />
          <Metric label="Homes" value={viewModel.includedCompCount} />
        </div>
        <div className="export-section export-section-wide">
          <h3>Included sections</h3>
          <div className="export-check-list">
            {sections.map((section) => (
              <div key={section}>
                <SquareCheck size={16} aria-hidden />
                <span>{section}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="export-section export-section-wide export-generate">
          <div>
            <h3>Generate export</h3>
            <p>This export will be marked local only, simulated data, and analyst review required.</p>
          </div>
          <button
            className="primary-action"
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <PackageCheck size={18} /> {isGenerating ? "Generating..." : ctaLabel}
          </button>
          {exportError && <p className="report-note">{exportError}</p>}
        </div>
      </section>
      <p className="report-note">Exports include the review path, selected homes, adjustments, activity, memo, and analyst notes. Local demo only.</p>
    </section>
  );
}

function MemoView({ viewModel, embedded = false }: { viewModel: ReturnType<typeof selectMemoViewModel>; embedded?: boolean }) {
  const sections = parseMemoSections(viewModel.memo);

  return (
    <section className={clsx("memo-workspace", embedded && "memo-workspace-embedded")}>
      {!embedded && <div className="report-ready"><CheckCircle2 size={38} /><div><h3>Summary ready</h3><p>Built from the current review data only.</p></div></div>}
      <div className="memo-reader" aria-label="Property review memo">
        {sections.length ? sections.map((section) => (
          <article className="memo-section-card" key={section.heading}>
            <h3>{section.heading}</h3>
            {section.items.length ? (
              <ul>
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
            )}
          </article>
        )) : (
          <div className="empty-state">Run the analysis to generate the summary.</div>
        )}
      </div>
    </section>
  );
}

function parseMemoSections(memo: string) {
  const blocks = memo.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const sections: Array<{ heading: string; paragraphs: string[]; items: string[] }> = [];

  for (let index = 0; index < blocks.length; index += 2) {
    const heading = blocks[index] ?? `Memo Section ${Math.floor(index / 2) + 1}`;
    const body = blocks[index + 1] ?? "";
    const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
    const items = lines
      .filter((line) => /^-\s+|^\d+\.\s+/.test(line))
      .map((line) => line.replace(/^(?:-\s+|\d+\.\s+)/, ""));

    sections.push({
      heading,
      paragraphs: items.length ? [] : [body],
      items
    });
  }

  return sections;
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

function ActivityTimeline({ items, emptyMessage = "No activity yet." }: { items: PceAuditEvent[]; emptyMessage?: string }) {
  if (!items.length) {
    return <div className="activity-empty">{emptyMessage}</div>;
  }
  return (
    <div className="activity-list">
      {items.map((item) => (
        <div className={clsx("activity-item", item.status)} key={item.id}>
          <span>{item.status === "confirmed" ? "Confirmed" : item.status === "ready" ? "Ready" : "Review"}</span>
          <div><strong>{item.type.replace("_", " ")}</strong><small>{item.summary}</small></div>
          <em>{new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</em>
        </div>
      ))}
    </div>
  );
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  return (
    <motion.div className={clsx("toast", toast.tone, toast.delta && "gameplay-toast")} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
      {!toast.delta && <CheckCircle2 size={24} />}
      <div>
        <strong>{toast.title}</strong>
        {toast.delta ? (
          <div className="gameplay-stats">
            <p>Information gain: {(toast.delta.marginalInformationGain ?? 0) > 0 ? "+" : ""}{(toast.delta.marginalInformationGain ?? 0).toFixed(1)}</p>
            <p>Confidence: {(toast.delta.confidenceDelta ?? 0) > 0 ? "+" : ""}{(toast.delta.confidenceDelta ?? 0).toFixed(1)} pts</p>
            <p>Effective comps: {(toast.delta.effectiveSampleSizeDelta ?? 0) > 0 ? "+" : ""}{(toast.delta.effectiveSampleSizeDelta ?? 0).toFixed(1)}</p>
            <p>Range width: {(toast.delta.rangeWidthDelta ?? 0) < 0 ? "-" : "+"}${Math.abs(toast.delta.rangeWidthDelta ?? 0).toLocaleString()}</p>
            <p>Risk: {(toast.delta.riskSeverityDelta ?? 0) === 0 ? "unchanged" : ((toast.delta.riskSeverityDelta ?? 0) > 0 ? "+" : "") + (toast.delta.riskSeverityDelta ?? 0)}</p>
          </div>
        ) : (
          <p>{toast.detail}</p>
        )}
      </div>
      <button aria-label="Dismiss notification" type="button" onClick={onClose}><X size={18} /></button>
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
