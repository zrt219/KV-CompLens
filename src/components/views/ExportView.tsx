import React, { useState, useMemo } from "react";
import clsx from "clsx";
import { CheckCircle2, FileDown, SquareCheck } from "lucide-react";
import { Button } from "../ui/Button";
import { downloadExportArtifact, buildExportArtifact, type ExportArtifactType } from "../../../lib/pce/exportPackage";
import type { SubjectProperty } from "../../../lib/types";
import type { PceAnalysisSnapshot } from "../../../lib/pce/runPcePipeline";
import type { selectExportViewModel, selectMemoViewModel } from "../../../lib/selectors/pceSelectors";

export function ExportView({
  viewModel,
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
  
  const artifact = useMemo(
    () => buildExportArtifact(selectedExportType, subject, snapshot),
    [selectedExportType, snapshot, subject]
  );

  const heading = subjectDirty
    ? "Review update required"
    : adjustmentsLocked
      ? (reportPrepared ? "Export package ready" : "Ready to export")
      : "Adjustments need confirmation";
  const detail = subjectDirty
    ? "Property details changed after the last review. Rerun the analysis before exporting."
    : adjustmentsLocked
      ? (reportPrepared ? "Your valuation package has been generated." : "Configure your export settings and generate the final package.")
      : "Confirm the adjustments before generating the final package.";
      
  const ctaLabel = subjectDirty
    ? "Return to Property Details"
    : adjustmentsLocked
      ? (reportPrepared ? "Download Package" : "Generate Package")
      : "Go to Adjustments";

  const handleAction = async () => {
    if (subjectDirty) {
      onOpenIntake();
      return;
    }
    if (!adjustmentsLocked) {
      onOpenAdjustments();
      return;
    }
    
    if (reportPrepared) {
       // Download directly
       downloadExportArtifact({
         fileName: artifact.fileName,
         mimeType: artifact.mimeType,
         content: new TextEncoder().encode("Simulated PDF content") // Mocked due to local environment
       });
       return;
    }

    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      onGenerate();
    }, 1200);
  };

  return (
    <div className="workspace-view flex-1 bg-[var(--surface-sunken)] p-6 overflow-hidden flex gap-6">
      {/* Left Column: Configuration */}
      <div className="w-[400px] flex flex-col space-y-6 overflow-y-auto pr-2 shrink-0">
        <section className="bg-white rounded-xl border border-[var(--border-soft)] shadow-sm p-5">
           <div className="flex items-start gap-4 mb-4">
              <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0", reportPrepared ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")}>
                 <CheckCircle2 size={24} />
              </div>
              <div>
                 <h2 className="text-lg font-semibold text-[var(--text-primary)] leading-tight">{heading}</h2>
                 <p className="text-[13px] text-[var(--text-muted)] mt-1">{detail}</p>
              </div>
           </div>
           
           <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-5 grid grid-cols-2 gap-4">
              <div>
                 <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Value Estimate</div>
                 <div className="font-semibold text-[var(--text-primary)]">{viewModel.pointEstimate}</div>
              </div>
              <div>
                 <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Confidence</div>
                 <div className="font-semibold text-green-600">{viewModel.confidence}</div>
              </div>
              <div>
                 <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Comps Included</div>
                 <div className="font-semibold text-[var(--text-primary)]">{viewModel.includedCompCount}</div>
              </div>
              <div>
                 <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Status</div>
                 <div className="font-semibold text-[var(--text-primary)]">{adjustmentsLocked ? "Locked" : "Draft"}</div>
              </div>
           </div>

           <Button 
             variant="primary" 
             className="w-full justify-center h-11 text-[14px] font-medium" 
             onClick={handleAction} 
             disabled={isGenerating}
           >
             {isGenerating ? "Generating..." : reportPrepared ? <><FileDown size={18} className="mr-2"/> Download Package</> : ctaLabel}
           </Button>
        </section>

        <section className="bg-white rounded-xl border border-[var(--border-soft)] shadow-sm p-5">
           <h3 className="font-semibold text-[var(--text-primary)] mb-4">Export Options</h3>
           
           <div className="space-y-3 mb-6">
             {[
               { id: "memo-pdf", label: "Client-Facing PDF", desc: "Clean valuation summary with adjustments" },
               { id: "comparables-csv", label: "Comparable List (CSV)", desc: "Selected comparables and metrics" }
             ].map(opt => (
               <div 
                 key={opt.id} 
                 className={clsx("border rounded-lg p-3 cursor-pointer transition-colors flex items-center gap-3", selectedExportType === opt.id ? "border-blue-500 bg-blue-50/50" : "border-[var(--border-soft)] hover:border-blue-200")}
                 onClick={() => !reportPrepared && setSelectedExportType(opt.id as ExportArtifactType)}
               >
                 <div className={clsx("w-4 h-4 rounded-full border flex items-center justify-center shrink-0", selectedExportType === opt.id ? "border-blue-500" : "border-slate-300")}>
                    {selectedExportType === opt.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                 </div>
                 <div>
                    <div className="text-[13px] font-semibold text-[var(--text-primary)]">{opt.label}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{opt.desc}</div>
                 </div>
               </div>
             ))}
           </div>

           <h3 className="font-semibold text-[var(--text-primary)] mb-3 text-[13px]">Included Sections</h3>
           <div className="space-y-2">
             {["Executive Summary", "Subject Details", "Adjustment Grid", "Value Reconciliation", "Review Activity", "Assumptions & Limits"].map(section => (
               <div key={section} className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                 <SquareCheck size={16} className="text-blue-500 shrink-0" /> {section}
               </div>
             ))}
           </div>
        </section>
      </div>

      {/* Right Column: Live Report Preview */}
      <div className="flex-1 bg-slate-100/50 rounded-xl border border-[var(--border-soft)] shadow-inner overflow-y-auto p-8 flex justify-center relative">
         {/* Simulated A4 PDF Page */}
         <div className="w-[800px] bg-white shadow-md border border-[var(--border-soft)] min-h-[1100px] p-12 text-[13px] leading-relaxed relative text-[var(--text-primary)]">
            {reportPrepared && (
               <div className="absolute inset-0 bg-blue-500/5 flex items-center justify-center backdrop-blur-[1px] z-10 pointer-events-none">
                  <div className="bg-white border border-blue-200 shadow-xl rounded-2xl p-6 text-center transform scale-110">
                     <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileDown size={32} />
                     </div>
                     <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Package Generated</h3>
                     <p className="text-[var(--text-muted)] text-sm mb-6 max-w-xs mx-auto">Your valuation report and supporting data are ready for download.</p>
                     <Button variant="primary" onClick={handleAction} className="w-full justify-center">Download PDF</Button>
                  </div>
               </div>
            )}

            <div className={clsx("transition-opacity", reportPrepared && "opacity-30")}>
               <header className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Valuation Report</h1>
                    <div className="text-[var(--text-muted)] mt-1">KV CompLens Automated Assessment</div>
                  </div>
                  <div className="text-right text-[var(--text-muted)]">
                     <div>Date: {new Date().toLocaleDateString()}</div>
                     <div>Subject: {subject.address}</div>
                  </div>
               </header>

               <section className="mb-8">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Executive Summary</h2>
                  <p className="mb-4">
                     Based on the automated review of simulated home sales, public assessment records, and active listings within the subject&apos;s immediate market area, the estimated market value for <strong>{subject.address}</strong> is <strong>{viewModel.pointEstimate}</strong>.
                  </p>
                  <p>
                     This estimate is supported by a reconciliation of <strong>{viewModel.includedCompCount}</strong> comparable properties with an overall confidence rating of <strong>{viewModel.confidence}</strong>.
                  </p>
               </section>

               <section className="mb-8">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Value Reconciliation</h2>
                  <div className="grid grid-cols-2 gap-8 mt-6">
                     <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center">
                        <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Estimated Value</div>
                        <div className="text-3xl font-bold text-blue-600">{viewModel.pointEstimate}</div>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center">
                        <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Value Range</div>
                        <div className="text-2xl font-semibold text-slate-700 mt-1">{viewModel.valueRange}</div>
                     </div>
                  </div>
               </section>

               <section>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Adjustment Summary</h2>
                  <table className="w-full text-left mt-4">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="py-2">Comparable</th>
                        <th className="py-2">Distance</th>
                        <th className="py-2 text-right">Sale Price</th>
                        <th className="py-2 text-right">Net Adj.</th>
                        <th className="py-2 text-right">Adjusted Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewModel.adjustedComparables.map((comp) => (
                        <tr key={comp.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 font-medium">{comp.address}</td>
                          <td className="py-3 text-[var(--text-muted)]">{comp.distanceKm.toFixed(1)} km</td>
                          <td className="py-3 text-right">${comp.salePrice.toLocaleString()}</td>
                          <td className="py-3 text-right text-[var(--text-muted)]">${comp.adjustments.total.toLocaleString()}</td>
                          <td className="py-3 text-right font-semibold">${comp.adjustedValue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </section>

               <footer className="mt-20 pt-6 border-t border-slate-200 text-center text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest space-y-1">
                 <div>Confidential - For Internal Review Only</div>
                 <div className="lowercase normal-case tracking-normal opacity-70">
                   Synthetic demonstration data. Not live MLS. Not an appraisal. Not a credit decision.
                 </div>
               </footer>
            </div>
         </div>
      </div>
    </div>
  );
}
