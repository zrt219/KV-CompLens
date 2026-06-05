import React from "react";
import clsx from "clsx";
import Image from "next/image";
import {
  CheckCircle2,
  Lock,
  ChevronDown,
  Info,
  MapPin,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Button } from "../ui/Button";
import { formatCurrency } from "../../../lib/agent";
import type { selectAdjustmentGridViewModel } from "../../../lib/selectors/pceSelectors";

export function AdjustmentView({
  viewModel,
  adjustmentsLocked,
  onLock
}: {
  viewModel: ReturnType<typeof selectAdjustmentGridViewModel>;
  adjustmentsLocked: boolean;
  onSelect: (id: string) => void;
  onExclude: (id: string) => void;
  onLock: () => void;
}) {
  const comps = viewModel.comps;
  const activeComp = comps.find((c) => c.id === viewModel.activeComparableId) || comps[0];

  if (!activeComp) return null;

  const differences = [
    { label: "Location", subj: viewModel.subject.neighbourhood, comp: activeComp.neighbourhood, diff: "Different sub-market", adj: activeComp.adjustments.location, exp: "Sub-market premium" },
    { label: "Condition", subj: viewModel.subject.condition, comp: activeComp.condition, diff: "Superior", adj: activeComp.adjustments.condition || 0, exp: "Recent renovation" },
    { label: "Age", subj: viewModel.subject.yearBuilt, comp: activeComp.yearBuilt, diff: `${viewModel.subject.yearBuilt - activeComp.yearBuilt} yrs`, adj: 0, exp: "Minimal depreciation" },
    { label: "Living Area", subj: `${viewModel.subject.livingAreaSqft.toLocaleString()} Sq Ft`, comp: `${activeComp.livingAreaSqft.toLocaleString()} Sq Ft`, diff: `${activeComp.livingAreaSqft - viewModel.subject.livingAreaSqft} Sq Ft`, adj: activeComp.adjustments.squareFootage || 0, exp: "$120 / SqFt" },
    { label: "Lot Size", subj: `${viewModel.subject.lotSizeSqft.toLocaleString()} Sq Ft`, comp: `${activeComp.lotSizeSqft.toLocaleString()} Sq Ft`, diff: `${activeComp.lotSizeSqft - viewModel.subject.lotSizeSqft} Sq Ft`, adj: activeComp.adjustments.lotSize || 0, exp: "$15 / SqFt" },
    { label: "Amenities", subj: "Standard", comp: "Premium", diff: "Finished Basement", adj: 15000, exp: "Estimated value" },
    { label: "Parking", subj: "Double Attached", comp: "Single Detached", diff: "-1 Bay, Detached", adj: -10000, exp: "Market standard" }
  ];

  return (
    <div className="workspace-view flex-1 bg-[var(--surface-sunken)] p-6 overflow-hidden flex gap-6">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Adjustment Review</h2>
          {adjustmentsLocked ? (
            <span className="status-chip confirmed bg-green-50 text-green-700 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm border border-green-100">
              <Lock size={14} /> Adjustments locked
            </span>
          ) : (
            <Button variant="primary" onClick={onLock} className="px-4 py-2">
              <CheckCircle2 size={16} className="mr-2" /> Confirm adjustments
            </Button>
          )}
        </div>

        {/* Selected Comparable Card */}
        <section className="bg-white rounded-xl border border-[var(--border-soft)] p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[12px] text-blue-600 font-semibold uppercase tracking-wider mb-1">Selected Comparable</div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{activeComp.address}</h3>
              <div className="text-[13px] text-[var(--text-muted)] flex items-center gap-2 mt-1">
                <MapPin size={14} /> {activeComp.distanceKm.toFixed(1)} km away • Sold {activeComp.saleDate ? new Date(activeComp.saleDate).toLocaleDateString() : "Recently"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[12px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Sale Price</div>
              <div className="text-xl font-semibold text-[var(--text-primary)]">{formatCurrency(activeComp.salePrice)}</div>
              <div className="text-[13px] text-rose-500 mt-1">{formatCurrency(activeComp.salePrice - viewModel.valuation.pointEstimate)} vs Subject</div>
            </div>
          </div>
        </section>

        {/* Adjustment Grid Details */}
        <section className="bg-white rounded-xl border border-[var(--border-soft)] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[var(--border-soft)] flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-[var(--text-primary)]">Adjustment Grid</h3>
            <span className="text-[12px] text-[var(--text-muted)] flex items-center gap-1"><Info size={14}/> Displaying automated reasoning</span>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead className="text-[11px] text-[var(--text-tertiary)] uppercase bg-white">
              <tr>
                <th className="font-semibold px-4 py-3 border-b border-[var(--border-soft)] w-[15%]">Feature</th>
                <th className="font-semibold px-4 py-3 border-b border-[var(--border-soft)] w-[15%]">Subject</th>
                <th className="font-semibold px-4 py-3 border-b border-[var(--border-soft)] w-[15%]">Comparable</th>
                <th className="font-semibold px-4 py-3 border-b border-[var(--border-soft)] w-[20%]">Difference</th>
                <th className="font-semibold px-4 py-3 border-b border-[var(--border-soft)] w-[15%] text-right">Adjustment</th>
                <th className="font-semibold px-4 py-3 border-b border-[var(--border-soft)] w-[20%]">Explanation</th>
              </tr>
            </thead>
            <tbody>
              {differences.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{row.label}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{row.subj}</td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">{row.comp}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{row.diff}</td>
                  <td className={clsx("px-4 py-3 text-right font-medium", row.adj > 0 ? "text-green-600" : row.adj < 0 ? "text-rose-600" : "text-[var(--text-muted)]")}>
                    {row.adj > 0 ? `+${formatCurrency(row.adj)}` : row.adj < 0 ? formatCurrency(row.adj) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-between border border-[var(--border-soft)] rounded bg-white px-2 py-1 text-[12px] cursor-pointer hover:border-blue-300">
                      <span className="text-[var(--text-muted)] truncate">{row.exp}</span>
                      <ChevronDown size={14} className="text-[var(--text-tertiary)] flex-shrink-0" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Side by side comparison */}
        <section className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[var(--border-soft)] shadow-sm p-5 flex gap-4">
            <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden shrink-0">
              <Image
                src="/property-placeholders/detached-dusk.png"
                alt=""
                width={96}
                height={96}
                className="h-full w-full object-cover opacity-50"
              />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Subject</div>
              <div className="text-lg font-semibold text-[var(--text-primary)] mb-1">{formatCurrency(viewModel.valuation.pointEstimate)}</div>
              <div className="text-[12px] text-[var(--text-muted)]">Estimated Value</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-[var(--border-soft)] shadow-sm p-5 flex gap-4 border-l-4 border-l-blue-500">
            <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden shrink-0">
              <Image
                src="/property-placeholders/detached-dusk.png"
                alt=""
                width={96}
                height={96}
                className="h-full w-full object-cover opacity-50"
              />
            </div>
            <div className="flex-1 flex flex-col justify-center relative">
              <div className="text-[12px] text-blue-600 uppercase tracking-wider mb-1 font-semibold">Adjusted Comparable</div>
              <div className="text-lg font-semibold text-[var(--text-primary)] mb-1">{formatCurrency(activeComp.adjustedValue)}</div>
              <div className="text-[12px] text-green-600 flex items-center gap-1"><TrendingUp size={12}/> +{formatCurrency(activeComp.adjustments.total)} Net Adjustments</div>
              
              <div className="absolute top-0 right-0 text-right">
                 <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Difference</div>
                 <div className={clsx("text-sm font-semibold", activeComp.adjustedValue - viewModel.valuation.pointEstimate > 0 ? "text-rose-500" : "text-green-500")}>
                   {formatCurrency(activeComp.adjustedValue - viewModel.valuation.pointEstimate)}
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reasonings */}
        <section className="bg-white rounded-xl border border-[var(--border-soft)] shadow-sm p-5">
           <h3 className="font-semibold text-[var(--text-primary)] mb-4">Adjustment Reasoning</h3>
           <div className="flex gap-2 mb-4">
             <Button variant="ghost" className="text-[12px] bg-blue-50 text-blue-700 border border-blue-200">Balanced (Auto)</Button>
             <Button variant="ghost" className="text-[12px] text-[var(--text-muted)] border border-[var(--border-soft)]">Conservative</Button>
             <Button variant="ghost" className="text-[12px] text-[var(--text-muted)] border border-[var(--border-soft)]">Aggressive</Button>
           </div>
           <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
             The automated adjustment review applied a balanced approach to this comparable. The primary review driver is <strong className="text-[var(--text-primary)]">Location</strong>, accounting for a $20,000 premium due to the subject being in a superior sub-market tier. The <strong className="text-[var(--text-primary)]">Condition</strong> adjustment of $15,000 reflects the subject&apos;s recent kitchen modernization which this comparable lacks.
           </p>
        </section>
      </div>

      {/* Right Rail */}
      <aside className="w-[320px] bg-white rounded-xl border border-[var(--border-soft)] shadow-sm flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-[var(--border-soft)] bg-slate-50/50">
          <h3 className="font-semibold text-[var(--text-primary)]">Review Summary</h3>
        </div>
        
        <div className="p-5 space-y-6">
          <div className="text-center">
            <div className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Adjusted Value</div>
            <div className="text-3xl font-semibold text-blue-600">{formatCurrency(activeComp.adjustedValue)}</div>
          </div>

          <div>
            <div className="flex justify-between text-[12px] mb-2">
              <span className="text-[var(--text-muted)]">Evidence Weight</span>
              <span className="font-semibold text-[var(--text-primary)]">82%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-[82%]" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full border-4 border-green-500 border-t-green-100 flex items-center justify-center">
              <span className="text-sm font-bold">72%</span>
            </div>
            <div>
              <div className="font-semibold text-[13px] text-[var(--text-primary)]">Comparable Probability</div>
              <div className="text-[11px] text-[var(--text-muted)] leading-tight mt-1">High likelihood of being selected by an appraiser.</div>
            </div>
          </div>

          <div>
             <div className="text-[12px] text-[var(--text-primary)] font-semibold mb-3">Influence on Final Estimate</div>
             <div className="flex h-4 rounded-full overflow-hidden">
                <div className="bg-blue-500 w-[24%]" title="This Comp (24%)" />
                <div className="bg-slate-200 w-[76%]" title="Other Comps (76%)" />
             </div>
             <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                <span>This Comp (24%)</span>
                <span>Others (76%)</span>
             </div>
          </div>

          <div>
             <div className="text-[12px] text-[var(--text-primary)] font-semibold mb-3">Top Positives</div>
             <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-50 text-green-700 text-[11px] rounded border border-green-100 flex items-center gap-1"><TrendingUp size={10}/> Location</span>
                <span className="px-2 py-1 bg-green-50 text-green-700 text-[11px] rounded border border-green-100 flex items-center gap-1"><TrendingUp size={10}/> Condition</span>
             </div>
          </div>

          <div>
             <div className="text-[12px] text-[var(--text-primary)] font-semibold mb-3">Top Penalties</div>
             <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-rose-50 text-rose-700 text-[11px] rounded border border-rose-100 flex items-center gap-1"><TrendingDown size={10}/> Parking</span>
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border-soft)] mt-auto text-center">
          <Button variant="ghost" className="text-[12px] text-blue-600 w-full justify-center">View All Comparables</Button>
        </div>
      </aside>

    </div>
  );
}
