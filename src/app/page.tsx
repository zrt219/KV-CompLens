"use client";

import { useMemo, useState } from "react";
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
  MapPinned,
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
import { dataProvenanceLabel, publicAssessmentSources } from "../../lib/provenance";
import { buildExportArtifact, downloadExportArtifact, exportArtifactOptions, type ExportArtifactType } from "../../lib/pce/exportPackage";
import {
  selectAdjustmentGridViewModel,
  selectCivicGridViewModel,
  selectExportViewModel,
  selectInsightsViewModel,
  selectMemoViewModel,
  usePceAnalysis,
  type PceToast,
  type PceViewMode
} from "../../hooks/usePceAnalysis";
import type { PceAnalysisSnapshot, PceAuditEvent } from "../../lib/pce/runPcePipeline";
import type { AdjustedComparable, CandidateImpact, PropertyCondition, PropertyType, ScoredComparable, SubjectProperty, ValuationDelta, ValuationRange } from "../../lib/types";

type ViewMode = PceViewMode;
type ToastState = PceToast;

const exampleSubject: SubjectProperty = {
  id: "SUBJ-EDM-001",
  address: "12345 109 St NW",
  city: "Edmonton",
  province: "AB",
  postalCode: "T5G 0A0",
  neighbourhood: "Central McDougall",
  propertyType: "Detached",
  yearBuilt: 2014,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2180,
  lotSizeSqft: 5800,
  parking: 2,
  latitude: 53.5828,
  longitude: -113.5082,
  condition: "Good",
  targetPriceHint: 690000,
  dealName: "Oakridge Builder Draw Review",
  borrowerType: "Home builder",
  underwritingDate: "2026-05-31",
  targetUnderwritingDate: "2026-05-31",
  intendedUse: "Residential construction lending",
  analystName: "Alex Carter"
};

const propertyTypes: PropertyType[] = ["Detached", "SemiDetached", "Townhouse", "Condo"];
const conditions: PropertyCondition[] = ["Poor", "Average", "Good", "Renovated", "New"];
const cities = ["Edmonton", "Calgary", "Airdrie", "Sherwood Park", "St. Albert"];

const navItems: Array<{ id: ViewMode | "subject"; label: string; icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }> }> = [
  { id: "subject", label: "Subject Intake", icon: HomeIcon },
  { id: "network", label: "Comparable Analysis", icon: Layers3 },
  { id: "discovery", label: "Comp Discovery", icon: MapPinned },
  { id: "table", label: "Source Scan", icon: ListChecks },
  { id: "adjustments", label: "Adjustment Review", icon: Grid3X3 },
  { id: "valuation", label: "Value Reconciliation", icon: BarChart3 },
  { id: "report", label: "Report Ready", icon: FileDown },
  { id: "memo", label: "Memo / Report", icon: FileText }
];

export default function Home() {
  const [state, dispatch] = usePceAnalysis(exampleSubject);
  const [showForm, setShowForm] = useState(false);
  const [reportPrepared, setReportPrepared] = useState(false);
  const [adjustmentsLocked, setAdjustmentsLocked] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [readabilityMode, setReadabilityMode] = useState(false);
  const subject = state.subject;
  const viewMode = state.activeView;
  const civicGrid = selectCivicGridViewModel(state);
  const insights = selectInsightsViewModel(state);
  const adjustmentGrid = selectAdjustmentGridViewModel(state);
  const memoView = selectMemoViewModel(state);
  const exportView = selectExportViewModel(state);
  const candidate = civicGrid.candidate;
  const activeNavId = showForm ? "subject" : viewMode;
  const candidateDrawerVisible = !showForm && (viewMode === "network" || viewMode === "discovery") && Boolean(state.newCandidateId) && Boolean(candidate);
  const subjectDirty = useMemo(
    () => JSON.stringify(state.subject) !== JSON.stringify(state.snapshot.subject),
    [state.snapshot.subject, state.subject]
  );

  function update<K extends keyof SubjectProperty>(key: K, value: SubjectProperty[K]) {
    dispatch({ type: "UPDATE_SUBJECT", key, value });
    setReportPrepared(false);
    setAdjustmentsLocked(false);
  }

  function runAnalysis() {
    dispatch({ type: "RUN_ANALYSIS" });
    setShowForm(false);
    setReportPrepared(false);
    setAdjustmentsLocked(false);
  }

  function goToNextStep() {
    if (showForm) {
      dispatch({ type: "RUN_ANALYSIS" });
      dispatch({ type: "SET_VIEW", view: "table" });
      setShowForm(false);
      setReportPrepared(false);
      setAdjustmentsLocked(false);
      return;
    }
    const nextView: Partial<Record<ViewMode, ViewMode>> = {
      network: "discovery",
      discovery: "table",
      table: "adjustments",
      adjustments: "valuation",
      valuation: "report",
      report: "memo"
    };
    const next = nextView[viewMode];
    if (next) {
      openWorkspaceView(next);
    }
  }

  function findMoreComparables() {
    if (showForm || (viewMode !== "network" && viewMode !== "discovery")) {
      setShowForm(false);
      dispatch({ type: "SET_VIEW", view: "discovery" });
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
    setShowForm(false);
    dispatch({ type: "SET_VIEW", view });
  }

  function prepareReport() {
    if (subjectDirty) {
      openSubjectIntake();
      return;
    }
    if (!adjustmentsLocked) {
      openWorkspaceView("report");
      return;
    }
    setExportOpen(true);
  }

  function loadExampleSubject() {
    dispatch({ type: "LOAD_SUBJECT", subject: exampleSubject });
    setReportPrepared(false);
    setAdjustmentsLocked(false);
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
            <p>Underwriting AI</p>
          </div>
        </div>
        <button className="project-picker" type="button" onClick={openSubjectIntake}>
          <span>Current Subject</span>
          <strong>{subject.address}</strong>
          <small>{subject.city} / {subject.propertyType}</small>
        </button>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeNavId;
            return (
              <button
                key={item.id}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
                type="button"
                onClick={() => item.id === "subject" ? openSubjectIntake() : openWorkspaceView(item.id)}
              >
                <Icon size={18} aria-hidden />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="rail-footer">
          <span className="data-chip">DEMO MODE</span>
          <span className="data-chip">LOCAL SYNTHETIC SALES</span>
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

      <section className="main-stage" aria-label="Comparable analysis workspace">
        <header className="stage-header">
          <div className="stage-title-copy">
            <h2>{titleForView(viewMode, showForm)}</h2>
            <p>{subject.dealName ?? subject.neighbourhood} / PCE-V2 local demo snapshot</p>
          </div>
          <div className="actions">
            <button className="find-action" type="button" onClick={findMoreComparables}><Search size={17} /> Find More Comparables</button>
            <button className="edit-action" type="button" onClick={() => setShowForm(true)}><SlidersHorizontal size={17} /> Edit Subject</button>
            <button type="button" onClick={prepareReport}><FileDown size={17} /> Export</button>
            <button className={clsx("icon-action", readabilityMode && "active")} type="button" aria-pressed={readabilityMode} aria-label="Toggle readability mode" onClick={() => setReadabilityMode((value) => !value)}><Eye size={18} /></button>
            <button className="icon-action" type="button" aria-label="More actions unavailable in demo mode" disabled title="More actions are unavailable in this local demo."><MoreHorizontal size={18} /></button>
            <button className="primary-action" type="button" onClick={goToNextStep}>Next step <ChevronRight size={17} /></button>
          </div>
        </header>

        {showForm ? (
          <SubjectForm subject={subject} dirty={subjectDirty} update={update} runAnalysis={runAnalysis} loadExample={loadExampleSubject} />
        ) : (
          <>
            <WorkflowProgress viewModel={civicGrid.workflow} activeView={viewMode} />
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
            {viewMode === "report" && <ReportReady viewModel={exportView} reportPrepared={reportPrepared} subjectDirty={subjectDirty} adjustmentsLocked={adjustmentsLocked} onExport={prepareReport} />}
            {viewMode === "memo" && <MemoView viewModel={memoView} />}
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

        <AnimatePresence>
          {exportOpen && (
            <ExportPackageModal
              viewModel={exportView}
              subject={state.snapshot.subject}
              snapshot={state.snapshot}
              onClose={() => setExportOpen(false)}
              onGenerate={() => {
                setReportPrepared(true);
                setExportOpen(false);
                dispatch({ type: "SET_VIEW", view: "report" });
              }}
            />
          )}
        </AnimatePresence>
      </section>

      <InsightsRail
        viewModel={insights}
        onReport={() => { setShowForm(false); dispatch({ type: "SET_VIEW", view: "report" }); }}
      />
    </main>
  );
}

function titleForView(viewMode: ViewMode, showForm: boolean) {
  if (showForm) return "Subject Intake";
  const titles: Record<ViewMode, string> = {
    network: "Comparable Analysis",
    discovery: "Comp Discovery",
    table: "Source Scan",
    adjustments: "Adjustment Review",
    valuation: "Value Reconciliation",
    report: "Report Ready",
    memo: "Underwriting Memo"
  };
  return titles[viewMode];
}

function SubjectForm({ subject, dirty, update, runAnalysis, loadExample }: { subject: SubjectProperty; dirty: boolean; update: <K extends keyof SubjectProperty>(key: K, value: SubjectProperty[K]) => void; runAnalysis: () => void; loadExample: () => void }) {
  return (
    <section className="subject-intake-view">
      <div className="success-banner subject-intake-banner">
        <ShieldCheck size={34} />
        <div>
          <strong>Subject property intake</strong>
          <p>The subject anchors source scan, candidate ranking, adjustments, value range, and analyst memo.</p>
        </div>
      </div>
      <div className="subject-intake-layout">
        <form className="subject-form-panel" onSubmit={(event) => { event.preventDefault(); runAnalysis(); }}>
          <div className="form-panel-head">
            <div>
              <h3>Property Details</h3>
              <p>All fields stay local to the deterministic demo snapshot.</p>
            </div>
            <span className={clsx("status-chip", dirty ? "review" : "confirmed")}>
              {dirty ? <Info size={14} /> : <CheckCircle2 size={14} />}
              {dirty ? "Edited / rerun required" : "Local fields loaded"}
            </span>
          </div>
          <div className="subject-grid">
            <Field label="Address" value={subject.address} onChange={(value) => update("address", value)} />
            <Field label="Deal Name" value={subject.dealName ?? ""} onChange={(value) => update("dealName", value)} />
            <Field label="Borrower / Project" value={subject.borrowerType ?? ""} onChange={(value) => update("borrowerType", value)} />
            <Select label="City" value={subject.city} options={cities} onChange={(value) => update("city", value)} />
            <Field label="Province" value={subject.province ?? "AB"} onChange={(value) => update("province", value as "AB")} />
            <Field label="Underwriting Date" type="date" value={subject.underwritingDate ?? ""} onChange={(value) => update("underwritingDate", value)} />
            <Field label="Neighbourhood" value={subject.neighbourhood} onChange={(value) => update("neighbourhood", value)} />
            <Select label="Property Type" value={subject.propertyType} options={propertyTypes} onChange={(value) => update("propertyType", value as PropertyType)} />
            <Field label="Year Built" type="number" value={subject.yearBuilt} onChange={(value) => update("yearBuilt", Number(value))} />
            <Field label="Bedrooms" type="number" value={subject.bedrooms} onChange={(value) => update("bedrooms", Number(value))} />
            <Field label="Bathrooms" type="number" step="0.5" value={subject.bathrooms} onChange={(value) => update("bathrooms", Number(value))} />
            <Field label="Living Area Sqft" type="number" value={subject.livingAreaSqft} onChange={(value) => update("livingAreaSqft", Number(value))} />
            <Field label="Lot Size Sqft" type="number" value={subject.lotSizeSqft} onChange={(value) => update("lotSizeSqft", Number(value))} />
            <Field label="Parking Stalls" type="number" value={subject.parking} onChange={(value) => update("parking", Number(value))} />
            <Select label="Condition" value={subject.condition} options={conditions} onChange={(value) => update("condition", value as PropertyCondition)} />
            <Field label="Target Price Hint" type="number" value={subject.targetPriceHint ?? ""} onChange={(value) => update("targetPriceHint", value ? Number(value) : undefined)} />
            <Field label="Latitude" type="number" step="0.0001" value={subject.latitude} onChange={(value) => update("latitude", Number(value))} />
            <Field label="Longitude" type="number" step="0.0001" value={subject.longitude} onChange={(value) => update("longitude", Number(value))} />
          </div>
          <div className="form-actions subject-actions">
            <button type="button" onClick={loadExample}>Load Example Property</button>
            <button className="primary-action" type="submit">Run Initial Scan</button>
          </div>
        </form>
        <aside className="subject-preview-stack">
          <section className="subject-preview-card">
            <div className="panel-head-row">
              <h3>Subject Preview</h3>
              <span className="status-chip confirmed"><HomeIcon size={14} /> Ready</span>
            </div>
            <PropertyThumbnail propertyType={subject.propertyType} seed={subject.address} isSubject />
            <h4>{subject.address}</h4>
            <p>{subject.city}, {subject.province} / {subject.neighbourhood}</p>
            <div className="subject-stat-row">
              <Metric label="Beds" value={String(subject.bedrooms)} />
              <Metric label="Baths" value={String(subject.bathrooms)} />
              <Metric label="Sq Ft" value={subject.livingAreaSqft.toLocaleString()} />
            </div>
            <StatusChecklist items={["Address loaded", "Property profile set", "Ready for local source scan", "Local demo boundary shown"]} />
          </section>
          <section className="subject-preview-card parcel-card">
            <div className="panel-head-row">
              <h3>Synthetic Parcel Overview</h3>
              <span className="status-chip review"><Info size={14} /> Demo</span>
            </div>
            <div className="parcel-diagram" aria-hidden="true">
              <span />
              <i />
            </div>
            <DeltaRow label="Lot size" value={`${subject.lotSizeSqft.toLocaleString()} sq ft`} />
            <DeltaRow label="Parking" value={`${subject.parking} stalls`} />
            <DeltaRow label="Condition" value={subject.condition} />
            <DeltaRow label="Use" value={subject.intendedUse ?? "Underwriting support"} />
          </section>
        </aside>
      </div>
    </section>
  );
}

function WorkflowProgress({ viewModel, activeView }: { viewModel: ReturnType<typeof selectCivicGridViewModel>["workflow"]; activeView: ViewMode }) {
  const steps = [
    { label: "Subject intake", short: "Subject", value: viewModel.subjectAddress },
    { label: "Comp analysis", short: "Analysis", value: viewModel.adjustmentSummary },
    { label: "Comp discovery", short: "Discovery", value: viewModel.candidateSummary },
    { label: "Source scan", short: "Source", value: viewModel.sourceSummary },
    { label: "Adjustment review", short: "Adjust", value: viewModel.adjustmentSummary },
    { label: "Value recon", short: "Value", value: viewModel.valueSummary },
    { label: activeView === "memo" ? "Memo / report" : "Report ready", short: activeView === "memo" ? "Memo" : "Report", value: activeView === "memo" ? "Review required" : "Export gate" }
  ];
  const activeIndexByView: Record<ViewMode, number> = {
    network: 1,
    discovery: 2,
    table: 3,
    adjustments: 4,
    valuation: 5,
    report: 6,
    memo: 6
  };
  const activeIndex = activeIndexByView[activeView];

  return (
    <section className="workflow-strip" style={{ "--workflow-cols": steps.length } as CSSProperties} aria-label="Comp-analysis workflow">
      {steps.map(({ label, short, value }, index) => (
        <div key={label} className={clsx(index < activeIndex && "complete", index === activeIndex && "active")}>
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
            <span className="status-chip review">New recent sale found</span>
            <h3>Review comparable before accepting</h3>
          </div>
          <button aria-label="Close drawer" type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="drawer-hero">
          <PropertyThumbnail propertyType={candidate.propertyType} seed={candidate.address} isNew />
          <div>
            <h4>{candidate.address}</h4>
            <p>{candidate.city}, Alberta</p>
            <strong>{formatCurrency(candidate.salePrice)}</strong>
            <small>{candidate.distanceKm.toFixed(2)} km / Match {Math.round(candidate.totalScore)} / P {candidate.comparableProbabilityPercent}% / Energy {Math.round(candidate.energyQuality * 100)}%</small>
            <small>{candidate.sourceName ?? "Synthetic recent sales dataset"} / {candidate.daysSinceSale} days since sale</small>
          </div>
        </div>
        <h4>Why this property was surfaced</h4>
        <ul className="check-list">
          {candidate.reasons?.map((reason) => <li key={reason}><CheckCircle2 size={17} /> {sentenceCase(reason)}</li>)}
          <li><CheckCircle2 size={17} /> Sold on {candidate.saleDate}, {candidate.daysSinceSale} days before underwriting date.</li>
          <li><CheckCircle2 size={17} /> Source: {candidate.sourceName ?? "Synthetic recent sales dataset"} ({candidate.sourceType ?? "SyntheticRecentSales"}).</li>
        </ul>
        {!!candidate.penalties?.length && (
          <>
            <h4>Analyst cautions</h4>
            <ul className="check-list caution-list">
              {candidate.penalties.map((penalty) => <li key={penalty}><Info size={17} /> {penalty}</li>)}
            </ul>
          </>
        )}
        <h4>Impact on analysis if added</h4>
        <div className="impact-grid">
          <Metric label="Confidence" value={impact ? formatSigned(impact.delta.confidenceDelta) + " pts" : "Pending"} />
          <Metric label="Midpoint" value={impact ? formatSignedCurrency(impact.delta.pointDelta) : "Pending"} />
          <Metric label="Range width" value={impact ? formatSignedCurrency(impact.delta.rangeWidthDelta) : "Pending"} />
          <Metric label="Comp count" value={impact ? formatSigned(impact.delta.compCountDelta) : "Pending"} />
          <Metric label="Information gain" value={impact ? impact.marginalInformationGain.toFixed(3) : "Pending"} />
          <Metric label="Effective sample" value={impact ? formatSigned(impact.deltaEffectiveSampleSize) : "Pending"} />
          <Metric label="Evidence balance" value={impact ? formatSigned(impact.deltaEntropy) : "Pending"} />
          <Metric label="Risk change" value={impact ? formatSigned(impact.riskChange) : "Pending"} />
          <Metric label="Effect" value={impact ? (impact.delta.rangeNarrowed ? "Narrows range" : "Expands range") : "Pending"} />
        </div>
        <div className="drawer-actions">
          <button type="button" onClick={onClose}>Dismiss</button>
          <button className="primary-action" type="button" onClick={onAdd}>Add to analysis</button>
        </div>
      </motion.section>
    </motion.aside>
  );
}

function InsightsRail({ viewModel, onReport }: { viewModel: ReturnType<typeof selectInsightsViewModel>; onReport: () => void }) {
  const selectedComp = viewModel.selectedComparable;
  return (
    <aside className="insights-rail" aria-label="Valuation insights">
      <div className="insights-head">
        <h2>Insights</h2>
        <span>LOCAL DEMO SNAPSHOT</span>
      </div>
      <section className="insight-card value-card">
        <span className="card-label">Estimated Value Range</span>
        <strong>{viewModel.valueRange}</strong>
        <p>Point estimate <b>{viewModel.pointEstimate}</b></p>
        <div className="range-track"><i /></div>
        <div className="range-labels"><span>{viewModel.lowEstimate}</span><span>{viewModel.highEstimate}</span></div>
      </section>
      <section className="insight-card confidence-card">
        <span className="card-label">Confidence Score</span>
        <div className="confidence-row">
            <div className="ring" style={{ "--score": `${viewModel.confidenceScore * 3.6}deg` } as CSSProperties}>{viewModel.confidenceScore}%</div>
          <div>
            <strong>{viewModel.confidenceLevel} Confidence</strong>
            <p>{viewModel.confidenceRationale}</p>
          </div>
        </div>
      </section>
      <section className="insight-card selected-card">
        <span className="card-label">Selected Comparable</span>
        {selectedComp && (
          <>
            <strong>{selectedComp.address}</strong>
            <p>{selectedComp.city} / {selectedComp.neighbourhood}</p>
            <div className="selected-risk"><Info size={15} /> {selectedComp.riskFlags[0] ?? "No material comp-quality flags for this comparable."}</div>
            <div className="selected-metrics">
              <Metric label="Score" value={`${selectedComp.totalScore}/100`} />
              <Metric label="Adjusted" value={formatCurrency(selectedComp.adjustedValue)} />
              <Metric label="Distance" value={`${selectedComp.distanceKm.toFixed(1)} km`} />
              <Metric label="Probability" value={`${selectedComp.comparableProbabilityPercent}%`} />
            </div>
          </>
        )}
      </section>
      <section className="insight-card">
        <span className="card-label">Key Match Factors</span>
        <Factor label="Location Proximity" value={viewModel.distanceRange} state="High" />
        <Factor label="Average Match" value={viewModel.averageMatch} state={viewModel.confidenceSupportsReview || viewModel.averageScore >= viewModel.valuation.averageSimilarity ? "High" : "Review"} />
        <Factor label="Evidence Probability" value={viewModel.averageComparableProbability} state={viewModel.valuation.normalizedRiskSeverity === 0 ? "High" : "Review"} />
        <Factor label="Effective Sample" value={viewModel.effectiveSampleSize} state={viewModel.valuationRiskFlags.has("Insufficient selected comps") ? "Review" : "High"} />
        <Factor label="Source Reliability" value={viewModel.averageSourceReliability} state={viewModel.valuation.averageSourceReliability >= viewModel.valuation.averageComparableProbability ? "High" : "Review"} />
        <Factor label="Value Spread" value={viewModel.valueSpread} state={viewModel.valuationRiskFlags.has("Wide adjusted-value spread") ? "Review" : "High"} />
      </section>
      <section className="insight-card">
        <span className="card-label">Source Scan Summary</span>
        <Metric label="Recent sales scanned" value={`${viewModel.sourceScan.syntheticRecentSalesScanned} synthetic records`} />
        <Metric label="Assessment references" value={`${viewModel.sourceScan.municipalAssessmentReferences} matched`} />
        <Metric label="Candidate pool" value={`${viewModel.sourceScan.candidatePoolCount} ranked / ${viewModel.sourceScan.rejectedCount} lower-ranked`} />
        <Metric label="Manual effort reduced" value={`Prototype estimate: ${viewModel.sourceScan.estimatedManualTimeSavedHours} hrs`} />
        <small>{viewModel.sourceScan.dataBoundaryNote}</small>
      </section>
      <section className="insight-card">
        <span className="card-label">Risk Flags</span>
        {viewModel.riskFlags.slice(0, 4).map((flag) => (
          <Factor key={flag} label={flag} value="Analyst review" state="Review" />
        ))}
      </section>
      <section className="insight-card">
        <span className="card-label">Recent Activity</span>
        <ActivityTimeline items={viewModel.auditEvents.slice(0, 6)} />
        <button className="rail-action" type="button" onClick={onReport}><FileDown size={16} /> Open report</button>
      </section>
    </aside>
  );
}

function DiscoveryView({ subject, ranked, rejected, selectedIds, activeComparableId, candidate, newCompId, onSelect, onFindMore }: { subject: SubjectProperty; ranked: ScoredComparable[]; rejected: ScoredComparable[]; selectedIds: Set<string>; activeComparableId?: string; candidate?: ScoredComparable; newCompId?: string; onSelect: (id: string) => void; onFindMore: () => void }) {
  const topCandidates = ranked.filter((comp) => !selectedIds.has(comp.id)).slice(0, 8);
  const bestCandidate = candidate ?? topCandidates[0];
  return (
    <section className="discovery-layout">
      <div className="discovery-list">
        <div className="section-title"><h3>Top Candidate Matches</h3><button type="button" onClick={onFindMore}><Search size={16} /> Find More</button></div>
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
        )) : <div className="empty-state">All top-ranked comparables are already selected. Surface more candidates to widen the review set.</div>}
        <div className="rejected-list">
          <strong>Excluded / lower-ranked candidates</strong>
          {rejected.slice(0, 4).map((comp) => <small key={comp.id}>{comp.address}: {comp.rejectionReason}</small>)}
        </div>
      </div>
      <div className="candidate-board" aria-label="Candidate discovery evidence board">
        <div className="candidate-board-subject">
          <span className="status-chip confirmed">Subject</span>
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
        )) : <div className="candidate-board-empty">No net-new candidate cards to plot on the discovery board.</div>}
      </div>
      <div className="discovery-insight">
        <span className="status-chip review"><Star size={14} /> Best opportunity identified</span>
        <h3>{bestCandidate?.address ?? "No candidate available"}</h3>
        <p>{bestCandidate ? `${bestCandidate.address} improves coverage across similarity, timing, and location.` : "All top-ranked comps are already in the selected set. Surface more candidates to widen coverage."}</p>
        {bestCandidate && <PropertyThumbnail propertyType={bestCandidate.propertyType} seed={bestCandidate.address} isNew={newCompId === bestCandidate.id} />}
        <Factor label="Best available match" value={bestCandidate ? `${Math.round(bestCandidate.totalScore)}/100 score` : "None"} state={bestCandidate ? "High" : "Review"} />
        <Factor label="Distance" value={bestCandidate ? `${bestCandidate.distanceKm.toFixed(1)} km` : "N/A"} state="Review" />
        <Factor label="Recency" value={bestCandidate ? `${bestCandidate.daysSinceSale} days since sale` : "N/A"} state={bestCandidate && !bestCandidate.riskFlags.includes("Stale sale date") ? "High" : "Review"} />
        <Factor label="Coverage" value={`${selectedIds.size} comps selected`} state="High" />
        <button className="primary-action" type="button" onClick={onFindMore}><Target size={16} /> Surface strongest candidate</button>
      </div>
    </section>
  );
}

function SourceScanView({ snapshot, onRunAnalysis }: { snapshot: PceAnalysisSnapshot; onRunAnalysis: () => void }) {
  const scan = snapshot.sourceScan;
  const sources = [
    { name: "Municipal Assessment", source: "City of Edmonton", records: scan.municipalAssessmentReferences, normalized: scan.assessmentRecordsMatched, unique: Math.max(1, scan.assessmentRecordsMatched - 2), reliability: 92, freshness: "2 days ago", icon: Database },
    { name: "Synthetic Sales", source: "KV Synthetic Engine", records: scan.syntheticRecentSalesScanned, normalized: scan.syntheticRecentSalesMatched, unique: scan.candidatePoolCount, reliability: 86, freshness: "1 day ago", icon: FileSpreadsheet },
    { name: "Listing References", source: "Active Listings", records: scan.listingStyleRecords, normalized: scan.listingRecordsMatched, unique: Math.max(1, scan.listingRecordsMatched - 3), reliability: 68, freshness: "6 hours ago", icon: FileText },
    { name: "Prior Deal Comparables", source: "Local underwriting memory", records: scan.priorDealComparables, normalized: scan.priorDealCompsMatched, unique: scan.priorDealCompsMatched, reliability: 78, freshness: "5 days ago", icon: FolderArchive },
    { name: "Market Trend References", source: "Public trend context", records: scan.marketTrendReferences, normalized: scan.marketTrendReferencesMatched, unique: scan.marketTrendReferencesMatched, reliability: 74, freshness: "3 days ago", icon: BarChart3 }
  ];
  const reviewSourceCount = sources.filter((source) => source.reliability < 75).length;

  return (
    <section className="source-scan-view">
      <div className="source-scan-head">
        <div>
          <h3>Source Scan</h3>
          <p>Ingest, normalize, deduplicate, and score local synthetic evidence before candidate ranking.</p>
        </div>
        <div className="scan-actions">
          <button className="primary-action" type="button" onClick={onRunAnalysis}><RefreshCw size={16} /> Scan now</button>
          <span className="status-chip confirmed"><CheckCircle2 size={14} /> Snapshot ready</span>
        </div>
      </div>
      <div className="source-pipeline" aria-label="Source scan pipeline">
        {["Connect", "Ingest", "Normalize", "Evaluate", "Deduplicate"].map((step, index) => (
          <div key={step} className={clsx(index === 4 && "active")}>
            <CheckCircle2 size={18} />
            <strong>{step}</strong>
            <span>{index === 1 ? `${scan.recordsScanned.toLocaleString()} records` : index === 4 ? `${scan.candidatePoolCount.toLocaleString()} candidates` : "Complete"}</span>
          </div>
        ))}
      </div>
      <div className="scan-metric-grid">
        <Metric label="Sources scanned" value={String(scan.sourcesConsolidated)} />
        <Metric label="Records found" value={scan.recordsScanned.toLocaleString()} />
        <Metric label="Matched records" value={(scan.syntheticRecentSalesMatched + scan.assessmentRecordsMatched + scan.listingRecordsMatched).toLocaleString()} />
        <Metric label="Candidate pool" value={scan.candidatePoolCount.toLocaleString()} />
        <Metric label="Selected comps" value={scan.selectedCompCount.toLocaleString()} />
      </div>
      <section className="scan-results-card">
        <div className="section-title">
          <h3>Source Results</h3>
          <span className={clsx("status-chip", reviewSourceCount ? "review" : "confirmed")}>
            {reviewSourceCount ? <Info size={14} /> : <ClipboardCheck size={14} />}
            {reviewSourceCount ? `${reviewSourceCount} sources need review` : "All critical sources healthy"}
          </span>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Source</th><th>Records Found</th><th>Normalized</th><th>Unique</th><th>Reliability</th><th>Freshness</th><th>Status</th></tr></thead>
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
          <h3>Source Quality Summary</h3>
          <div className="confidence-row">
            <div className="ring" style={{ "--score": "302deg" } as CSSProperties}>84%</div>
            <div><strong>High Quality</strong><p>Weighted by matched records and reliability.</p></div>
          </div>
          <DeltaRow label="Completeness" value="88%" />
          <DeltaRow label="Consistency" value="82%" />
          <DeltaRow label="Timeliness" value="90%" />
        </section>
        <section className="insight-card normalized-card">
          <h3>Normalized Key Fields</h3>
          <DeltaRow label="Address" value="99% coverage" />
          <DeltaRow label="Property type" value="100% coverage" />
          <DeltaRow label="Year built" value="96% coverage" />
          <DeltaRow label="Living area" value="94% coverage" />
          <DeltaRow label="Lot size" value="93% coverage" />
        </section>
        <section className="insight-card dedupe-card">
          <h3>Deduplication Results</h3>
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
  const rows: Array<[string, (comp: AdjustedComparable) => string]> = [
    ["Price", (comp) => formatCurrency(comp.salePrice)],
    ["Distance", (comp) => `${comp.distanceKm.toFixed(1)} km`],
    ["Beds", (comp) => String(comp.bedrooms)],
    ["Baths", (comp) => String(comp.bathrooms)],
    ["Sq Ft", (comp) => comp.livingAreaSqft.toLocaleString()],
    ["Lot Size", (comp) => comp.lotSizeSqft.toLocaleString()],
    ["Year Built", (comp) => String(comp.yearBuilt)],
    ["Condition", (comp) => comp.condition],
    ["Parking", (comp) => String(comp.parking)],
    ["Time Adjustment", (comp) => formatCurrency(comp.adjustments.time)],
    ["Location Adjustment", (comp) => formatCurrency(comp.adjustments.location)],
    ["Adjustment Value", (comp) => formatCurrency(comp.adjustments.total)],
    ["Lot Adjustment", (comp) => formatCurrency(comp.adjustments.lotSize)],
    ["Outlier Adjustment", (comp) => formatCurrency(comp.adjustments.outlier)],
    ["Adjusted Price", (comp) => formatCurrency(comp.adjustedValue)]
  ];
  return (
    <section className="adjustment-shell">
      <div className="adjustment-card">
        <div className="success-banner"><CheckCircle2 size={34} /><div><strong>Adjustment review ready</strong><p>Adjustments are transparent and reviewable. The system proposes adjustments; the analyst must confirm before final valuation.</p></div></div>
        <div className="adjustment-comp-strip" style={{ "--comp-strip-cols": comps.length + 1 } as CSSProperties} aria-label="Selected comparable adjustment set">
          <article className="adjustment-strip-subject">
            <span>Subject Property</span>
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
              <span>Comparable {index + 1}</span>
              <PropertyThumbnail propertyType={comp.propertyType} seed={comp.address} compact />
              <strong>{comp.address}</strong>
              <small>{formatCurrency(comp.salePrice)} / Adj. {formatCurrency(comp.adjustedValue)}</small>
            </button>
          ))}
        </div>
        <div className="adjustment-grid" style={{ "--cols": comps.length + 1 } as CSSProperties}>
          <div className="grid-head subject-head"><span>Subject</span><strong>{viewModel.subject.address}</strong></div>
          {comps.map((comp, index) => (
            <div key={comp.id} className={clsx("grid-head", viewModel.activeComparableId === comp.id && "selected", viewModel.newCandidateId === comp.id && "new-column")}>
              <button type="button" onClick={() => onSelect(comp.id)}>
                <span>{viewModel.newCandidateId === comp.id ? "New Comp" : `Comp ${index + 1}`}</span><strong>{comp.address}</strong>
              </button>
              <button className="table-action" type="button" onClick={() => onExclude(comp.id)} disabled={adjustmentsLocked} title={adjustmentsLocked ? "Unlock by changing the comparable set before excluding comps." : undefined}>Exclude</button>
            </div>
          ))}
          {rows.map(([label, getter]) => (
            <div className="grid-row" key={label}>
              <div>{label}</div>
              {comps.map((comp) => <div key={comp.id}>{getter(comp)}</div>)}
            </div>
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
      <h3>Impact on valuation</h3>
      <Metric label="Current range" value={`${formatCurrency(valuation.lowEstimate)} - ${formatCurrency(valuation.highEstimate)}`} />
      <Metric label="Basis" value="Adjusted comparable sale values" />
      <Metric label="Midpoint change" value={delta ? formatSignedCurrency(delta.pointDelta) : "Baseline"} />
      <Metric label="Confidence change" value={delta ? `${formatSigned(delta.confidenceDelta)} pts` : "Baseline"} />
      <Metric label="Range width" value={delta ? (delta.rangeNarrowed ? "Narrowed" : "Expanded") : "Baseline"} />
      <Metric label="Evidence gain" value={delta?.marginalInformationGain ? delta.marginalInformationGain.toFixed(3) : "Baseline"} />
      <Metric label="Range method" value="Residual-buffered posterior" />
      <button className={clsx("primary-action", locked && "locked-action")} type="button" onClick={onLock} disabled={locked} aria-disabled={locked}><Lock size={16} /> {locked ? "Adjustments Locked" : "Confirm and Lock Adjustments"}</button>
      <div className="impact-note"><RefreshCw size={16} /> Valuation updates automatically when the comparable set changes.</div>
    </aside>
  );
}

function ValuationSummary({ snapshot, newCompId }: { snapshot: PceAnalysisSnapshot; newCompId?: string }) {
  const delta = snapshot.valuationDelta;
  return (
    <section className="valuation-summary">
      <div className="summary-hero">
        <div>
          <span className="card-label">Estimated Value</span>
          <strong>{formatCurrency(snapshot.valuation.pointEstimate)}</strong>
          <p>Derived from adjusted comparable sale values, not a valuation oracle.</p>
        </div>
        <div className="confidence-row">
          <div className="ring" style={{ "--score": `${snapshot.valuation.confidenceScore * 3.6}deg` } as CSSProperties}>{snapshot.valuation.confidenceScore}%</div>
          <div><h3>{snapshot.valuation.confidenceLevel} Confidence</h3><p>{snapshot.valuation.confidenceRationale}</p></div>
        </div>
      </div>
      <div className="improvement-chips">
        <span className={delta ? "confirmed" : "neutral"}>{delta ? <CheckCircle2 size={16} /> : <Info size={16} />} {delta ? `${formatSigned(delta.compCountDelta)} comp count change` : "Baseline comp set"}</span>
        <span className={delta ? "confirmed" : "neutral"}>{delta ? <CheckCircle2 size={16} /> : <Info size={16} />} {delta ? `${formatSigned(delta.confidenceDelta)} confidence pts` : "No prior confidence delta"}</span>
        <span><CheckCircle2 size={16} /> Effective sample {snapshot.valuation.effectiveSampleSize}</span>
        <span><CheckCircle2 size={16} /> Model fusion {formatCurrency(snapshot.valuation.modelFusion.finalEstimate)}</span>
        <span><CheckCircle2 size={16} /> Average match {snapshot.valuation.averageSimilarity}/100</span>
      </div>
      <div className="summary-grid">
        <section className="insight-card">
          <h3>{delta ? "What changed after new comp?" : "Baseline reconciliation"}</h3>
          <DeltaRow label="Estimated Value" value={delta ? formatSignedCurrency(delta.pointDelta) : "Baseline"} />
          <DeltaRow label="Value Range" value={delta ? formatSignedCurrency(delta.rangeWidthDelta) : "Baseline"} />
          <DeltaRow label="Confidence Score" value={delta ? `${formatSigned(delta.confidenceDelta)} pts` : "Baseline"} />
          <DeltaRow label="Comp Count" value={delta ? formatSigned(delta.compCountDelta) : "Baseline"} />
          <DeltaRow label="Effective Sample" value={delta?.effectiveSampleSizeDelta ? formatSigned(delta.effectiveSampleSizeDelta) : "Baseline"} />
          <DeltaRow label="Evidence Balance" value={delta?.entropyDelta ? formatSigned(delta.entropyDelta) : "Baseline"} />
          <DeltaRow label="Information Gain" value={delta?.marginalInformationGain ? delta.marginalInformationGain.toFixed(3) : "Baseline"} />
        </section>
        <section className="insight-card">
          <h3>Model fusion diagnostics</h3>
          <DeltaRow label="Fusion estimate" value={formatCurrency(snapshot.valuation.modelFusion.finalEstimate)} />
          {snapshot.valuation.modelFusion.modelWeights.map((model) => (
            <DeltaRow key={model.id} label={model.label.replace("Model", "")} value={`${Math.round(model.weight * 100)}% weight`} />
          ))}
        </section>
        <section className="insight-card">
          <h3>Selected comparable support</h3>
          {snapshot.valuation.adjustedComparables.map((comp) => (
            <div className="summary-comp" key={comp.id}>
              <span>{newCompId === comp.id ? "New" : "Used"}</span>
              <strong>{comp.address}</strong>
              <em>{formatCurrency(comp.adjustedValue)} / Match {Math.round(comp.totalScore)}</em>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}

function ReportReady({
  viewModel,
  reportPrepared,
  subjectDirty,
  adjustmentsLocked,
  onExport
}: {
  viewModel: ReturnType<typeof selectExportViewModel>;
  reportPrepared: boolean;
  subjectDirty: boolean;
  adjustmentsLocked: boolean;
  onExport: () => void;
}) {
  const heading = subjectDirty
    ? "Analysis rerun required"
    : adjustmentsLocked
      ? (reportPrepared ? "Report Export Prepared" : "Report Ready")
      : "Adjustment confirmation required";
  const detail = subjectDirty
    ? "Subject fields changed after the last snapshot. Rerun analysis before exporting a report package."
    : adjustmentsLocked
      ? "Analysis is complete and ready to export as a demo packet."
      : "Confirm the selected comparable adjustments before exporting the report package.";
  const ctaLabel = subjectDirty
    ? "Return to Subject Intake"
    : adjustmentsLocked
      ? "Export Report"
      : "Go to Adjustment Review";
  return (
    <section className="report-ready-view">
      <div className="report-ready">
        <CheckCircle2 size={42} />
        <div><h3>{heading}</h3><p>{detail}</p></div>
      </div>
      <div className="report-metrics">
        <Metric label="Estimated value" value={viewModel.pointEstimate} />
        <Metric label="Estimated range" value={viewModel.valueRange} />
        <Metric label="Confidence" value={viewModel.confidence} />
        <Metric label="Comps included" value={viewModel.includedCompCount} />
      </div>
      <section className="insight-card">
        <h3>Underwriting Safety</h3>
        <DeltaRow label="Use" value="Underwriting support only" />
        <DeltaRow label="Decisioning" value="Not a credit decision" />
        <DeltaRow label="Valuation" value="Not an appraisal" />
        <DeltaRow label="Review" value="Analyst approval required" />
        <DeltaRow label="Data" value="Synthetic demo comps" />
      </section>
      <section className="insight-card">
        <h3>Comparables Included</h3>
        {viewModel.adjustedComparables.map((comp, index) => (
          <div className="report-row" key={comp.id}>
            <span>{index + 1}</span>
            <strong>{comp.address}</strong>
            <em>{viewModel.newCandidateId === comp.id ? "Newly added" : "Included"} / {comp.distanceKm.toFixed(1)} km / Match {Math.round(comp.totalScore)}</em>
          </div>
        ))}
      </section>
      <button className="export-button" type="button" onClick={onExport}><FileDown size={18} /> {ctaLabel}</button>
      <p className="report-note">Exports include methodology, selected comps, adjustments, audit events, and analyst-review notes. Demo mode only.</p>
    </section>
  );
}

function ExportPackageModal({
  viewModel,
  subject,
  snapshot,
  onClose,
  onGenerate
}: {
  viewModel: ReturnType<typeof selectExportViewModel>;
  subject: SubjectProperty;
  snapshot: PceAnalysisSnapshot;
  onClose: () => void;
  onGenerate: () => void;
}) {
  const [selectedExportType, setSelectedExportType] = useState<ExportArtifactType>("memo-pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const sections = [
    "Executive Summary",
    "Comparable Summary",
    "Adjustment Grid",
    "Value Reconciliation",
    "PCE Audit Events",
    "Assumptions and Limits"
  ];
  const artifact = useMemo(
    () => buildExportArtifact(selectedExportType, subject, snapshot),
    [selectedExportType, snapshot, subject]
  );

  async function handleGenerate() {
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
    <motion.aside className="export-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section className="export-modal" initial={{ opacity: 0, scale: 0.98, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 16 }} transition={{ duration: 0.18 }}>
        <div className="export-modal-head">
          <div>
            <h3>Export Package</h3>
            <p>Create a facts-only underwriting package from the current PCE snapshot.</p>
          </div>
          <button aria-label="Close export package" type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="export-modal-grid">
          <section className="export-section">
            <span className="export-step">1</span>
            <h4>Export Type</h4>
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
          </section>
          <section className="export-section">
            <span className="export-step">2</span>
            <h4>File Details</h4>
            <Metric label="File name" value={artifact.fileName} />
            <Metric label="Value range" value={viewModel.valueRange} />
            <Metric label="Confidence" value={viewModel.confidence} />
            <Metric label="Comparables" value={viewModel.includedCompCount} />
          </section>
          <section className="export-section export-section-wide">
            <span className="export-step">3</span>
            <h4>Included Sections</h4>
            <div className="export-check-list">
              {sections.map((section) => (
                <div key={section}>
                  <SquareCheck size={16} aria-hidden />
                  <span>{section}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="export-section export-section-wide export-generate">
            <span className="export-step">4</span>
            <div>
              <h4>Generate Package</h4>
              <p>Demo export package will be marked local synthetic data and analyst-review required.</p>
            </div>
            <button
              className="primary-action"
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <PackageCheck size={18} /> {isGenerating ? "Generating..." : "Generate Package"}
            </button>
            {exportError && <p className="report-note">{exportError}</p>}
          </section>
        </div>
      </motion.section>
    </motion.aside>
  );
}

function MemoView({ viewModel }: { viewModel: ReturnType<typeof selectMemoViewModel> }) {
  const sections = parseMemoSections(viewModel.memo);

  return (
    <section className="memo-workspace">
      <div className="report-ready"><CheckCircle2 size={38} /><div><h3>Memo Ready</h3><p>Generated from computed comparable facts only.</p></div></div>
      <div className="memo-reader" aria-label="Underwriting memo">
        {sections.map((section) => (
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
        ))}
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

function ActivityTimeline({ items }: { items: PceAuditEvent[] }) {
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
    <motion.div className={clsx("toast", toast.tone)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
      <CheckCircle2 size={24} />
      <div><strong>{toast.title}</strong><p>{toast.detail}</p></div>
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
      <em className={isHigh ? "high" : "review"}>{isHigh ? <CheckCircle2 size={13} /> : <Info size={13} />}{state}</em>
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
