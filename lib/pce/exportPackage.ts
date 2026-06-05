import type { PceAnalysisSnapshot } from "./runPcePipeline";
import type { PceAuditEvent } from "./runPcePipeline";
import type { ReviewIntelligenceAttachment } from "../review-intelligence/types";
import type { SubjectProperty } from "../types";
import { buildExportPacket } from "../export/buildExportPacket";
import { createExportFileNames } from "../export/fileNaming";
import { renderReportHtml } from "../export/html/renderReportHtml";
import { renderMarkdownReport } from "../export/markdown/renderMarkdownReport";
import { renderComparablesCsv, renderAdjustmentsCsv } from "../export/csv/renderCsv";
import { renderWordHtml } from "../export/wordFallback/renderWordHtml";
import { generatePdfArrayBuffer } from "../export/pdf/generatePdfBlob";
import { generateDocxBytes } from "../export/docx/generateDocxBlob";
import { buildStoredZip as buildCanonicalStoredZip } from "../export/zip/buildStoredZip";
import type { ExportPacket } from "../export/types";

export type ExportArtifactType =
  | "memo-pdf"
  | "memo-doc"
  | "comparables-csv"
  | "adjustments-pdf"
  | "adjustments-doc"
  | "snapshot-md"
  | "audit-txt"
  | "evidence-zip";

export type ExportArtifactOption = {
  id: ExportArtifactType;
  label: string;
  description: string;
};

export type ExportArtifact = {
  fileName: string;
  mimeType: string;
  content: string | Uint8Array | ArrayBuffer;
};

export type ExportArtifactBuildOptions = {
  includeReviewIntelligence?: boolean;
  auditEvents?: PceAuditEvent[];
  reviewIntelligenceAttachment?: ReviewIntelligenceAttachment;
};

export const exportArtifactOptions: ExportArtifactOption[] = [
  { id: "memo-pdf", label: "PDF Summary", description: "Executive format" },
  { id: "memo-doc", label: "Word Summary", description: "Native DOC format" },
  { id: "comparables-csv", label: "CSV Comparable List", description: "Spreadsheet ready" },
  { id: "adjustments-pdf", label: "PDF Adjustment Notes", description: "Appendix format" },
  { id: "adjustments-doc", label: "Word Adjustment Notes", description: "Native DOC format" },
  { id: "snapshot-md", label: "Markdown Summary", description: "Raw rich text" },
  { id: "audit-txt", label: "Text Activity Log", description: "Raw logs" },
  { id: "evidence-zip", label: "ZIP Review Package", description: "Complete packet" }
];

export function isExportReady(snapshot: PceAnalysisSnapshot) {
  return snapshot.analysisStatus === "complete" && !snapshot.isZeroState && snapshot.valuation.includedCompCount > 0;
}

function assertExportReady(snapshot: PceAnalysisSnapshot) {
  if (!isExportReady(snapshot)) {
    throw new Error("Analysis must run before exporting a review package.");
  }
}

export function buildExportArtifact(
  type: ExportArtifactType,
  subject: SubjectProperty,
  snapshot: PceAnalysisSnapshot,
  options: ExportArtifactBuildOptions = {}
): ExportArtifact {
  assertExportReady(snapshot);
  const auditEvents = options.auditEvents ?? snapshot.auditEvents;
  const packet = buildExportPacket(snapshot, {
    includeReviewIntelligence: options.includeReviewIntelligence,
    reviewIntelligenceAttachment: options.reviewIntelligenceAttachment,
    auditEvents,
    preparedBy: subject.analystName
  });
  const names = createExportFileNames(packet);

  switch (type) {
    case "memo-pdf":
      return {
        fileName: names.pdf,
        mimeType: "application/pdf",
        content: generatePdfArrayBuffer(packet)
      };
    case "memo-doc":
      return {
        fileName: names.docx,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        content: generateDocxBytes(packet)
      };
    case "adjustments-doc":
      return {
        fileName: names.docx.replace(/\.docx$/, "-word-compatible.doc"),
        mimeType: "application/msword",
        content: renderWordHtml(packet)
      };
    case "comparables-csv":
      return {
        fileName: names.csv,
        mimeType: "text/csv;charset=utf-8",
        content: renderComparablesCsv(packet)
      };
    case "adjustments-pdf":
      return {
        fileName: names.pdf.replace(/\.pdf$/, "-adjustments.pdf"),
        mimeType: "application/pdf",
        content: generatePdfArrayBuffer(packet)
      };
    case "snapshot-md":
      return {
        fileName: names.markdown,
        mimeType: "text/markdown;charset=utf-8",
        content: renderMarkdownReport(packet)
      };
    case "audit-txt":
      return {
        fileName: names.json.replace(/\.json$/, "-audit.txt"),
        mimeType: "text/plain;charset=utf-8",
        content: [
          "KV CompLens Review Activity Log",
          "Review support only. Not an appraisal. Not a credit decision. Not live MLS data. Analyst review required.",
          "",
          ...packet.auditEvents.map((event) => `[${event.timestamp}] ${event.action.toUpperCase()} | ${event.actor} | ${event.summary}`)
        ].join("\n")
      };
    case "evidence-zip":
      return {
        fileName: names.zip,
        mimeType: "application/zip",
        content: buildCanonicalEvidenceZip(packet)
      };
  }
}

export function downloadExportArtifact(artifact: ExportArtifact) {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("Browser download APIs are unavailable in this environment.");
  }

  const blobPart = typeof artifact.content === "string"
    ? artifact.content
    : (artifact.content instanceof ArrayBuffer ? artifact.content : artifact.content.slice().buffer);
  const blob = new Blob([blobPart], { type: artifact.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = artifact.fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function buildCanonicalEvidenceZip(packet: ExportPacket) {
  const encoder = new TextEncoder();
  const entries = [
    { name: "report.html", bytes: encoder.encode(renderReportHtml(packet)) },
    { name: "report.md", bytes: encoder.encode(renderMarkdownReport(packet)) },
    { name: "report.json", bytes: encoder.encode(JSON.stringify(packet, null, 2)) },
    { name: "comparables.csv", bytes: encoder.encode(renderComparablesCsv(packet)) },
    { name: "adjustments.csv", bytes: encoder.encode(renderAdjustmentsCsv(packet)) },
    { name: "audit.json", bytes: encoder.encode(JSON.stringify(packet.auditEvents, null, 2)) },
    { name: "limitations.txt", bytes: encoder.encode(packet.limitations.join("\n")) },
    {
      name: "README.txt",
      bytes: encoder.encode("PDF/DOCX generation may vary by browser. This package includes HTML, Markdown, JSON, CSV, and audit fallbacks so the review data remains accessible.")
    }
  ];

  if (packet.reviewIntelligence) {
    entries.push(
      { name: "review_intelligence_summary.md", bytes: encoder.encode(renderReviewIntelligenceMarkdown(packet)) },
      { name: "review_intelligence_summary.json", bytes: encoder.encode(JSON.stringify(packet.reviewIntelligence, null, 2)) }
    );
  }

  return buildCanonicalStoredZip(entries);
}

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
