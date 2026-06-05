"use client";

import { useState } from "react";
import { renderReportHtml } from "../../lib/export/html/renderReportHtml";
import type { ExportPacket } from "../../lib/export/types";

export function PrintReportView() {
  const [html] = useState(() => {
    if (typeof sessionStorage === "undefined") return undefined;
    const raw = sessionStorage.getItem("kv-complens-print-export-packet");
    if (!raw) return undefined;
    const packet = JSON.parse(raw) as ExportPacket;
    return renderReportHtml(packet);
  });

  if (!html) {
    return (
      <main className="print-page">
        <h1>Print report unavailable</h1>
        <p>The print packet was not found. Return to Export Package and choose Open Print View again.</p>
      </main>
    );
  }

  return <iframe className="print-report-frame" title="KV CompLens print-ready report" srcDoc={html} />;
}
