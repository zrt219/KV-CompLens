import React from "react";
import {
  ShieldCheck,
  Activity
} from "lucide-react";
import { Button } from "../ui/Button";

export function SourcesRightRail() {
  return (
    <aside className="insight-rail border-l border-[var(--border-soft)] bg-white h-full overflow-y-auto">
      <div className="insight-rail-scroll space-y-6 p-6">
        <section className="insight-card">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Source Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <Metric label="Total Sources" value="5" />
            <Metric label="Connected" value="5" />
            <Metric label="Healthy" value="5" />
            <Metric label="Total Records" value="5,798" />
          </div>
        </section>

        <section className="insight-card">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Data Quality</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full border-8 border-green-500 border-t-green-100 flex items-center justify-center">
              <span className="text-lg font-bold">93%</span>
            </div>
            <div className="text-[12px] text-[var(--text-muted)] leading-relaxed">
              Overall quality score is <strong className="text-green-600">High</strong>. Records exhibit strong normalization and cross-validation integrity.
            </div>
          </div>
        </section>

        <section className="insight-card">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-blue-500" />
            <h3 className="font-semibold text-[var(--text-primary)]">Scan Confidence</h3>
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed mb-4">
            <strong className="text-[var(--text-primary)]">High</strong> - Strong source alignment detected. The model has high confidence in the 68 candidates retrieved for final review scoring.
          </p>
        </section>

        <section className="insight-card flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-blue-500" />
            <h3 className="font-semibold text-[var(--text-primary)]">Recent Updates</h3>
          </div>
          <div className="space-y-4">
            {[
              { text: "System automatically refreshed Permit & Zoning boundaries based on newly published open data.", time: "2h ago" },
              { text: "Land Registry detected 14 new closed sales in the broader market area.", time: "5h ago" },
              { text: "Source sync configuration was updated by Admin.", time: "Yesterday" }
            ].map((feed, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-[var(--text-primary)] leading-tight">{feed.text}</p>
                  <span className="text-[10px] text-[var(--text-tertiary)]">{feed.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="ghost" className="text-[12px] text-blue-600">View activity log</Button>
          </div>
        </section>
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      <strong className="mt-1 block text-[16px] font-bold text-[var(--text-primary)]">{value}</strong>
    </div>
  );
}
