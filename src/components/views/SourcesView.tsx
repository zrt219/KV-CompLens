import React from "react";
import clsx from "clsx";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Settings,
  Info,
  MoreHorizontal
} from "lucide-react";
import { Button } from "../ui/Button";

export function SourcesView() {
  return (
    <div className="workspace-view flex-1 bg-[var(--surface-sunken)] p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Cards */}
        <div className="grid grid-cols-[1fr_300px] gap-6">
          
          <section className="bg-white rounded-xl border border-[var(--border-soft)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[var(--text-primary)]">Source Scan Progress</h3>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <div className="w-8 h-4 bg-blue-100 rounded-full relative"><div className="absolute right-1 top-1 w-2 h-2 bg-blue-500 rounded-full"></div></div>
                Auto refresh
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: "Municipal Assessment", percent: 100 },
                { label: "Land Registry", percent: 100 },
                { label: "Open Data / Sales", percent: 100 },
                { label: "Permits & Zoning", percent: 100 },
                { label: "Public Assessments", percent: 100 }
              ].map((src) => (
                <div key={src.label} className="space-y-2">
                  <div className="text-center">
                    <Database size={20} className="mx-auto mb-2 text-slate-400" />
                    <div className="text-[11px] text-[var(--text-muted)] leading-tight h-8 flex items-center justify-center">{src.label}</div>
                  </div>
                  <div className="text-sm font-semibold">{src.percent}%</div>
                  <div className="text-[10px] text-[var(--text-tertiary)] mb-2">Records found</div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${src.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-[12px] text-[var(--text-tertiary)] flex items-center gap-1.5">
              <Clock size={12} /> Last scan completed: Today at 10:42 AM MDT
            </div>
          </section>

          <section className="bg-white rounded-xl border border-[var(--border-soft)] p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Connected Source Overview</h3>
              <Button variant="ghost" className="text-[11px] h-6 px-2 text-[var(--text-muted)] border border-[var(--border-soft)]">Manage</Button>
            </div>
            <div className="flex justify-between items-end flex-1 pb-4">
              <div>
                <div className="text-2xl font-semibold text-blue-600">5 / 5</div>
                <div className="text-[11px] text-[var(--text-muted)]">Sources connected</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-green-600">100%</div>
                <div className="text-[11px] text-[var(--text-muted)]">Successful scans</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-rose-500">0</div>
                <div className="text-[11px] text-[var(--text-muted)]">Errors</div>
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--border-soft)] flex items-center justify-between">
              <div className="text-[11px] text-[var(--text-tertiary)]">
                Next automated scan<br/>
                <span className="text-[var(--text-muted)]">May 2, 2026 at 02:00 AM MDT</span>
              </div>
              <Button variant="ghost" className="text-[11px] h-6 px-2 text-blue-600 border border-blue-100 bg-blue-50">
                <Settings size={12} className="mr-1"/> Scan settings
              </Button>
            </div>
          </section>

        </div>

        {/* Middle Cards */}
        <div className="grid grid-cols-[1fr_300px] gap-6">
          <section className="bg-white rounded-xl border border-[var(--border-soft)] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[var(--border-soft)] flex justify-between items-center">
              <h3 className="font-semibold text-[var(--text-primary)]">Connected Sources</h3>
            </div>
            <table className="w-full text-left text-[13px]">
              <thead className="text-[11px] text-[var(--text-tertiary)] bg-slate-50/50">
                <tr>
                  <th className="font-medium px-5 py-3 border-b border-[var(--border-soft)]">Source</th>
                  <th className="font-medium px-5 py-3 border-b border-[var(--border-soft)]">Records Found</th>
                  <th className="font-medium px-5 py-3 border-b border-[var(--border-soft)]">Reliability</th>
                  <th className="font-medium px-5 py-3 border-b border-[var(--border-soft)]">Last Refreshed</th>
                  <th className="font-medium px-5 py-3 border-b border-[var(--border-soft)]">Status</th>
                  <th className="font-medium px-5 py-3 border-b border-[var(--border-soft)]"></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Municipal Assessment", badge: "Primary", records: "1,284", rel: "High", time: "Today at 10:42 AM", status: "Healthy" },
                  { name: "Land Registry", records: "1,136", rel: "High", time: "Today at 10:41 AM", status: "Healthy" },
                  { name: "Open Data / Sales", records: "2,358", rel: "Medium", time: "Today at 10:39 AM", status: "Healthy" },
                  { name: "Permits & Zoning", records: "642", rel: "Medium", time: "Today at 10:38 AM", status: "Healthy" },
                  { name: "Public Assessments", records: "386", rel: "High", time: "Today at 10:37 AM", status: "Healthy" }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-[var(--text-primary)] flex items-center gap-2">
                      <Database size={14} className="text-[var(--text-tertiary)]" />
                      {row.name}
                      {row.badge && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{row.badge}</span>}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">{row.records}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={clsx("w-1.5 h-1.5 rounded-full", row.rel === "High" ? "bg-green-500" : "bg-amber-500")} />
                        <span className="text-[12px] text-[var(--text-muted)]">{row.rel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-[var(--text-muted)]">{row.time}</td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">{row.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" className="h-6 w-6 p-0 text-[var(--text-tertiary)]"><MoreHorizontal size={14} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 text-center border-t border-[var(--border-soft)]">
              <Button variant="ghost" className="text-[12px] text-blue-600">View all source details →</Button>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-[var(--border-soft)] p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Public Assessment References</h3>
              <span className="text-[12px] text-blue-600 cursor-pointer">View all (3)</span>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
                <span>Reference</span>
                <span className="w-16">Reliability</span>
                <span className="w-20 text-right">Refreshed</span>
              </div>
              {[
                { name: "Edmonton 2025 Assessment Roll", rel: "High", time: "Apr 30, 2026" },
                { name: "Edmonton 2024 Assessment Roll", rel: "High", time: "Apr 22, 2025" },
                { name: "Sturgeon County 2025 Assessment Roll", rel: "Medium", time: "Apr 28, 2026" }
              ].map((ref, i) => (
                <div key={i} className="flex justify-between items-center text-[12px] border-b border-[var(--border-soft)] last:border-0 pb-3 last:pb-0">
                  <div className="text-[var(--text-primary)] flex-1 pr-2 truncate">{ref.name}</div>
                  <div className={clsx("w-16 px-1.5 py-0.5 rounded text-[10px] text-center border", ref.rel === "High" ? "bg-green-50 text-green-700 border-green-100" : "bg-amber-50 text-amber-700 border-amber-100")}>{ref.rel}</div>
                  <div className="w-20 text-right text-[var(--text-muted)]">{ref.time}</div>
                </div>
              ))}
            </div>
            <div className="pt-4 text-center mt-auto">
               <Button variant="ghost" className="text-[12px] text-blue-600">Manage references →</Button>
            </div>
          </section>
        </div>

      
        {/* Bottom Cards */}
        <div className="grid grid-cols-[300px_1fr_350px] gap-6">
          <section className="bg-white rounded-xl border border-[var(--border-soft)] p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Candidate Source Checks</h3>
              <Info size={14} className="text-[var(--text-tertiary)]" />
            </div>
            <div className="flex items-center gap-6 my-auto">
              {/* Fake Donut Chart */}
              <div className="relative w-24 h-24 rounded-full border-8 border-green-500 border-t-amber-400 border-l-rose-500 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold">68</div>
                  <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Total</div>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> <span className="text-[var(--text-muted)]">Passed</span></div>
                  <span className="font-semibold">54</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400" /> <span className="text-[var(--text-muted)]">Review</span></div>
                  <span className="font-semibold">10</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> <span className="text-[var(--text-muted)]">Failed</span></div>
                  <span className="font-semibold">4</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-[var(--border-soft)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Scan Logs</h3>
              <span className="text-[12px] text-blue-600 cursor-pointer">View all logs</span>
            </div>
            <div className="space-y-3">
              {[
                { log: "Full source scan completed", time: "Today at 10:42 AM MDT" },
                { log: "Public assessments synced", time: "Today at 10:41 AM MDT" },
                { log: "Land registry scan completed", time: "Today at 10:41 AM MDT" },
                { log: "Permits & zoning scan completed", time: "Today at 10:38 AM MDT" },
                { log: "Open data / sales scan completed", time: "Today at 10:39 AM MDT" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[12px] pb-2 border-b border-[var(--border-soft)] last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-[var(--text-primary)]">
                    <CheckCircle2 size={14} className="text-green-500" /> {item.log}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--text-muted)]">{item.time}</span>
                    <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px]">Success</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-[var(--border-soft)] p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Candidate Queue</h3>
              <span className="text-[12px] text-blue-600 cursor-pointer">View queue</span>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { addr: "12351 110 St NW", sqft: "1,842", stat: "Preparing" },
                { addr: "10923 124 St NW", sqft: "1,960", stat: "Preparing" },
                { addr: "11204 115 St NW", sqft: "1,755", stat: "Preparing" },
                { addr: "11832 107 St NW", sqft: "1,588", stat: "Preparing" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[12px] border-b border-[var(--border-soft)] last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-8 overflow-hidden rounded bg-slate-200 object-cover">
                      <Image
                        src="/property-placeholders/detached-dusk.png"
                        alt=""
                        width={32}
                        height={24}
                        className="h-full w-full object-cover opacity-50"
                      />
                    </div>
                    <div>
                      <div className="text-[var(--text-primary)] font-medium">{item.addr}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Detached • {item.sqft} Sq Ft</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <RefreshCw size={12} className="animate-spin" /> <span className="text-[10px]">{item.stat}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      
      {/* Right Rail overlay mock - We should place this in the actual layout but for the mockup fidelity we add it absolutely or via flex */}
    </div>
  );
}
