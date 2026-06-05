import { downloadTextFile } from "./download/downloadBlob";
import { renderExportCsvSet } from "./csv/renderCsv";
import { downloadDocx } from "./docx/downloadDocx";
import { createExportFileNames } from "./fileNaming";
import { openPrintReport } from "./html/openPrintReport";
import { renderReportHtml } from "./html/renderReportHtml";
import { renderMarkdownReport } from "./markdown/renderMarkdownReport";
import { downloadExportPackageZip } from "./package/downloadExportPackageZip";
import { downloadPdf } from "./pdf/downloadPdf";
import type { ExportOptions, ExportPacket, ExportResult, ExportRunResult } from "./types";
import { downloadWordFallback } from "./wordFallback/downloadWordFallback";

export async function runExport(packet: ExportPacket, options: ExportOptions): Promise<ExportRunResult> {
  const completed: ExportResult[] = [];
  const failed: ExportResult[] = [];
  let fallbackUsed = false;
  const names = createExportFileNames(packet);

  const progress = (message: string) => options.onProgress?.(message);
  progress("Building export packet");

  if (options.requested.includes("pdf")) {
    progress("Generating PDF");
    try {
      const result = await downloadPdf(packet, { fail: options.simulate?.failPdf, failDownloads: options.simulate?.failDownloads });
      if (!result.ok) throw new Error(result.error);
      completed.push(result);
    } catch (error) {
      failed.push({ ok: false, format: "pdf", method: "native-pdf", error: errorMessage(error), filename: names.pdf });
      fallbackUsed = true;
      const printResult = openPrintReport(packet);
      (printResult.ok ? completed : failed).push(printResult);
    }
  }

  if (options.requested.includes("docx")) {
    progress("Generating DOCX");
    try {
      const result = await downloadDocx(packet, { fail: options.simulate?.failDocx, failDownloads: options.simulate?.failDownloads });
      if (!result.ok) throw new Error(result.error);
      completed.push(result);
    } catch (error) {
      failed.push({ ok: false, format: "docx", method: "native-docx", error: errorMessage(error), filename: names.docx });
      fallbackUsed = true;
      const fallback = await downloadWordFallback(packet, { failDownloads: options.simulate?.failDownloads });
      (fallback.ok ? completed : failed).push(fallback);
    }
  }

  progress("Preparing fallback package");
  if (options.requested.includes("html")) {
    const result = await downloadTextFile(renderReportHtml(packet), names.html, "text/html;charset=utf-8", { format: "html", method: "report-html", fail: options.simulate?.failDownloads });
    (result.ok ? completed : failed).push(result);
  }

  if (options.requested.includes("json")) {
    const result = await downloadTextFile(JSON.stringify(packet, null, 2), names.json, "application/json;charset=utf-8", { format: "json", method: "report-json", fail: options.simulate?.failDownloads });
    (result.ok ? completed : failed).push(result);
  }

  if (options.requested.includes("csv")) {
    const result = await downloadTextFile(renderExportCsvSet(packet), names.csv, "text/csv;charset=utf-8", { format: "csv", method: "comparables-adjustments-csv", fail: options.simulate?.failDownloads });
    (result.ok ? completed : failed).push(result);
  }

  if (options.includeFallbacks || options.requested.includes("zip") || failed.length > 0) {
    const result = await downloadExportPackageZip(packet, { failDownloads: options.simulate?.failDownloads });
    (result.ok ? completed : failed).push(result);
    fallbackUsed = fallbackUsed || result.ok;
  }

  if (completed.length === 0 || options.simulate?.failDownloads) {
    const markdown = await downloadTextFile(renderMarkdownReport(packet), names.markdown, "text/markdown;charset=utf-8", { format: "markdown", method: "copyable-markdown-fallback", fail: false });
    completed.push(markdown);
    fallbackUsed = true;
  }

  progress("Download started");

  return {
    ok: completed.length > 0,
    requested: options.requested,
    completed,
    failed,
    fallbackUsed,
    recommendedNextAction: completed.some((result) => result.method === "print-ready-html")
      ? "open-print-view"
      : failed.length > 0
        ? "download-zip-package"
        : "none"
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Export failed.";
}
