import { renderAdjustmentsCsv, renderComparablesCsv } from "../csv/renderCsv";
import { createExportFileNames } from "../fileNaming";
import { renderReportHtml } from "../html/renderReportHtml";
import { renderMarkdownReport } from "../markdown/renderMarkdownReport";
import { renderRtf } from "../wordFallback/renderRtf";
import { renderWordHtml } from "../wordFallback/renderWordHtml";
import { buildStoredZip } from "../zip/buildStoredZip";
import type { ExportPacket } from "../types";

type OptionalBinaries = {
  pdf?: Blob;
  docx?: Blob;
};

export async function generateExportPackageZip(packet: ExportPacket, binaries: OptionalBinaries = {}) {
  const encoder = new TextEncoder();
  const files = createExportFileNames(packet);
  const entries: Array<{ name: string; bytes: Uint8Array }> = [
    { name: "report.html", bytes: encoder.encode(renderReportHtml(packet)) },
    { name: "report.md", bytes: encoder.encode(renderMarkdownReport(packet)) },
    { name: "report.json", bytes: encoder.encode(JSON.stringify(packet, null, 2)) },
    { name: "comparables.csv", bytes: encoder.encode(renderComparablesCsv(packet)) },
    { name: "adjustments.csv", bytes: encoder.encode(renderAdjustmentsCsv(packet)) },
    { name: "audit.json", bytes: encoder.encode(JSON.stringify(packet.auditEvents, null, 2)) },
    { name: "limitations.txt", bytes: encoder.encode(packet.limitations.join("\n")) },
    { name: "README.txt", bytes: encoder.encode(readmeText) },
    { name: files.docx.replace(/\.docx$/, ".doc"), bytes: encoder.encode(renderWordHtml(packet)) },
    { name: files.rtf, bytes: encoder.encode(renderRtf(packet)) }
  ];

  if (packet.reviewIntelligence) {
    entries.push(
      { name: "review_intelligence_summary.md", bytes: encoder.encode(renderReviewIntelligenceMarkdown(packet)) },
      { name: "review_intelligence_summary.json", bytes: encoder.encode(JSON.stringify(packet.reviewIntelligence, null, 2)) }
    );
  }

  if (binaries.pdf) entries.push({ name: "report.pdf", bytes: new Uint8Array(await binaries.pdf.arrayBuffer()) });
  if (binaries.docx) entries.push({ name: "report.docx", bytes: new Uint8Array(await binaries.docx.arrayBuffer()) });

  return new Blob([buildStoredZip(entries)], { type: "application/zip" });
}

const readmeText = "PDF/DOCX generation may vary by browser. This package includes HTML, Markdown, JSON, CSV, and audit fallbacks so the review data remains accessible.";

function renderReviewIntelligenceMarkdown(packet: ExportPacket) {
  if (!packet.reviewIntelligence) {
    return "";
  }
  return [
    `# ${packet.reviewIntelligence.title}`,
    "",
    `- Verdict: ${packet.reviewIntelligence.verdict}`,
    `- Strongest comparable: ${packet.reviewIntelligence.strongestComparable}`,
    `- Weakest comparable: ${packet.reviewIntelligence.weakestComparable}`,
    `- Verification: ${packet.reviewIntelligence.verificationStatus}`,
    `- Source: ${packet.reviewIntelligence.source}`,
    "",
    packet.reviewIntelligence.memoReadySummary,
    "",
    "## Limitations",
    ...packet.reviewIntelligence.limitations.map((item) => `- ${item}`)
  ].join("\n");
}
