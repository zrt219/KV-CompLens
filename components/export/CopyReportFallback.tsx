"use client";

import { useState } from "react";
import { Copy, Printer, FileJson } from "lucide-react";
import { renderMarkdownReport } from "../../lib/export/markdown/renderMarkdownReport";
import { downloadTextFile } from "../../lib/export/download/downloadBlob";
import { openPrintReport } from "../../lib/export/html/openPrintReport";
import { createExportFileNames } from "../../lib/export/fileNaming";
import type { ExportPacket } from "../../lib/export/types";

type CopyReportFallbackProps = {
  packet: ExportPacket;
};

export function CopyReportFallback({ packet }: CopyReportFallbackProps) {
  const [copied, setCopied] = useState(false);
  const markdown = renderMarkdownReport(packet);
  const names = createExportFileNames(packet);

  async function copyReportText() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
  }

  return (
    <section className="copy-report-fallback">
      <div>
        <h3>Copy Report Fallback</h3>
        <p>If browser downloads are blocked, copy the Markdown report or open the print view.</p>
      </div>
      <div className="copy-report-actions">
        <button type="button" onClick={copyReportText}><Copy size={16} /> {copied ? "Report text copied" : "Copy report text"}</button>
        <button type="button" onClick={() => openPrintReport(packet)}><Printer size={16} /> Open print view</button>
        <button type="button" onClick={() => downloadTextFile(JSON.stringify(packet, null, 2), names.json, "application/json;charset=utf-8", { format: "json", method: "manual-json-fallback" })}><FileJson size={16} /> Download JSON</button>
      </div>
      <textarea readOnly value={markdown} aria-label="Copyable Markdown report" />
    </section>
  );
}
