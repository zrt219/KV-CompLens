import { formatCurrency } from "../format";
import type { PceAnalysisSnapshot } from "./runPcePipeline";
import type { SubjectProperty } from "../types";

export type ExportArtifactType =
  | "memo-pdf"
  | "comparables-csv"
  | "adjustments-pdf"
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
  content: string | Uint8Array;
};

const exportArtifactOptions: ExportArtifactOption[] = [
  { id: "memo-pdf", label: "PDF Underwriting Memo", description: "Recommended" },
  { id: "comparables-csv", label: "CSV Comparable Set", description: "Available from snapshot" },
  { id: "adjustments-pdf", label: "PDF Adjustment Appendix", description: "Available from snapshot" },
  { id: "snapshot-md", label: "MD Snapshot Memo", description: "Available from snapshot" },
  { id: "audit-txt", label: "TXT Audit Log", description: "Available from snapshot" },
  { id: "evidence-zip", label: "ZIP Evidence Package", description: "Available from snapshot" }
];

export { exportArtifactOptions };

export function buildExportArtifact(type: ExportArtifactType, subject: SubjectProperty, snapshot: PceAnalysisSnapshot): ExportArtifact {
  const baseName = buildBaseFileName(subject, snapshot.generatedAt);

  switch (type) {
    case "memo-pdf":
      return {
        fileName: `${baseName}_Underwriting_Memo.pdf`,
        mimeType: "application/pdf",
        content: buildSimplePdf(buildMemoPdfLines(subject, snapshot))
      };
    case "comparables-csv":
      return {
        fileName: `${baseName}_Comparable_Set.csv`,
        mimeType: "text/csv;charset=utf-8",
        content: buildComparableCsv(snapshot)
      };
    case "adjustments-pdf":
      return {
        fileName: `${baseName}_Adjustment_Appendix.pdf`,
        mimeType: "application/pdf",
        content: buildSimplePdf(buildAdjustmentAppendixLines(subject, snapshot))
      };
    case "snapshot-md":
      return {
        fileName: `${baseName}_Snapshot_Memo.md`,
        mimeType: "text/markdown;charset=utf-8",
        content: buildSnapshotMarkdown(subject, snapshot)
      };
    case "audit-txt":
      return {
        fileName: `${baseName}_Audit_Log.txt`,
        mimeType: "text/plain;charset=utf-8",
        content: buildAuditLogText(subject, snapshot)
      };
    case "evidence-zip":
      return {
        fileName: `${baseName}_Evidence_Package.zip`,
        mimeType: "application/zip",
        content: buildEvidenceZip(subject, snapshot)
      };
  }
}

export function downloadExportArtifact(artifact: ExportArtifact) {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("Browser download APIs are unavailable in this environment.");
  }

  const blobPart = typeof artifact.content === "string"
    ? artifact.content
    : artifact.content.slice().buffer;
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
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function buildComparableCsv(snapshot: PceAnalysisSnapshot) {
  const header = [
    "Comparable ID",
    "Address",
    "Neighbourhood",
    "City",
    "Sale Date",
    "Sale Price",
    "Adjusted Value",
    "Distance Km",
    "Match Score",
    "Comparable Probability",
    "Evidence Weight",
    "Risk Flags"
  ];

  const rows = snapshot.valuation.adjustedComparables.map((comp) => [
    comp.id,
    comp.address,
    comp.neighbourhood,
    comp.city,
    comp.saleDate,
    String(comp.salePrice),
    String(comp.adjustedValue),
    comp.distanceKm.toFixed(1),
    String(Math.round(comp.totalScore)),
    `${Math.round(comp.comparableProbability * 100)}%`,
    `${Math.round((comp.normalizedEvidenceWeight ?? comp.evidenceWeight) * 100)}%`,
    comp.riskFlags.join("; ")
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function buildSnapshotMarkdown(subject: SubjectProperty, snapshot: PceAnalysisSnapshot) {
  const selectedRows = snapshot.valuation.adjustedComparables.map((comp, index) =>
    `| ${index + 1} | ${comp.address} | ${formatCurrency(comp.salePrice)} | ${formatCurrency(comp.adjustedValue)} | ${comp.distanceKm.toFixed(1)} km | ${Math.round(comp.totalScore)} |`
  ).join("\n");

  const auditRows = snapshot.auditEvents.map((event) =>
    `- ${event.timestamp} | ${event.type} | ${event.status.toUpperCase()} | ${event.summary}`
  ).join("\n");

  return [
    "# KV CompLens Snapshot Memo",
    "",
    "> DEMO MODE ONLY. Local synthetic sales calibrated against public assessment content. Analyst review required.",
    "",
    "## Subject",
    `- Address: ${subject.address}, ${subject.city}, ${subject.province ?? "AB"}`,
    `- Property type: ${subject.propertyType}`,
    `- Living area: ${subject.livingAreaSqft} sq ft`,
    `- Lot size: ${subject.lotSizeSqft} sq ft`,
    `- Condition: ${subject.condition}`,
    "",
    "## Valuation",
    `- Value range: ${formatCurrency(snapshot.valuation.lowEstimate)} to ${formatCurrency(snapshot.valuation.highEstimate)}`,
    `- Point estimate: ${formatCurrency(snapshot.valuation.pointEstimate)}`,
    `- Confidence: ${snapshot.valuation.confidenceScore}% ${snapshot.valuation.confidenceLevel}`,
    `- Effective sample size: ${snapshot.valuation.effectiveSampleSize}`,
    "",
    "## Selected Comparables",
    "| # | Address | Sale Price | Adjusted Value | Distance | Match |",
    "| --- | --- | --- | --- | --- | --- |",
    selectedRows,
    "",
    "## Source Scan",
    `- Sources consolidated: ${snapshot.sourceScan.sourcesConsolidated}`,
    `- Records scanned: ${snapshot.sourceScan.recordsScanned}`,
    `- Candidate pool: ${snapshot.sourceScan.candidatePoolCount}`,
    `- Selected comps: ${snapshot.sourceScan.selectedCompCount}`,
    "",
    "## Memo",
    ...sanitizeMultiline(snapshot.memo).split("\n"),
    "",
    "## Audit Events",
    auditRows
  ].join("\n");
}

function buildAuditLogText(subject: SubjectProperty, snapshot: PceAnalysisSnapshot) {
  return [
    "KV CompLens PCE Audit Log",
    "DEMO MODE ONLY - Local synthetic evidence. Analyst review required.",
    "",
    `Subject: ${subject.address}, ${subject.city}, ${subject.province ?? "AB"}`,
    `Generated at: ${snapshot.generatedAt}`,
    `Point estimate: ${formatCurrency(snapshot.valuation.pointEstimate)}`,
    `Confidence: ${snapshot.valuation.confidenceScore}% ${snapshot.valuation.confidenceLevel}`,
    "",
    ...snapshot.auditEvents.map((event) =>
      `[${event.timestamp}] ${event.type.toUpperCase()} | ${event.status.toUpperCase()} | ${event.source} | ${sanitizeInline(event.summary)}`
    )
  ].join("\n");
}

function buildMemoPdfLines(subject: SubjectProperty, snapshot: PceAnalysisSnapshot) {
  return [
    "KV CompLens - Underwriting Memo",
    "DEMO MODE ONLY - Local synthetic evidence. Analyst review required.",
    "",
    `Generated: ${snapshot.generatedAt}`,
    `Subject: ${subject.address}, ${subject.city}, ${subject.province ?? "AB"}`,
    `Property: ${subject.propertyType} | ${subject.bedrooms} bed | ${subject.bathrooms} bath | ${subject.livingAreaSqft} sq ft`,
    "",
    `Estimated value range: ${formatCurrency(snapshot.valuation.lowEstimate)} to ${formatCurrency(snapshot.valuation.highEstimate)}`,
    `Point estimate: ${formatCurrency(snapshot.valuation.pointEstimate)}`,
    `Confidence: ${snapshot.valuation.confidenceScore}% ${snapshot.valuation.confidenceLevel}`,
    `Effective sample size: ${snapshot.valuation.effectiveSampleSize}`,
    "",
    "Selected comparables:",
    ...snapshot.valuation.adjustedComparables.flatMap((comp, index) => [
      `${index + 1}. ${comp.address} | sale ${formatCurrency(comp.salePrice)} | adjusted ${formatCurrency(comp.adjustedValue)} | ${comp.distanceKm.toFixed(1)} km | match ${Math.round(comp.totalScore)}`,
      `   Evidence weight ${Math.round((comp.normalizedEvidenceWeight ?? comp.evidenceWeight) * 100)}% | probability ${Math.round(comp.comparableProbability * 100)}%`
    ]),
    "",
    "Underwriting memo:",
    ...sanitizeMultiline(snapshot.memo).split("\n")
  ];
}

function buildAdjustmentAppendixLines(subject: SubjectProperty, snapshot: PceAnalysisSnapshot) {
  return [
    "KV CompLens - Adjustment Appendix",
    "DEMO MODE ONLY - Local synthetic evidence. Analyst review required.",
    "",
    `Generated: ${snapshot.generatedAt}`,
    `Subject: ${subject.address}, ${subject.city}, ${subject.province ?? "AB"}`,
    `Point estimate: ${formatCurrency(snapshot.valuation.pointEstimate)}`,
    "",
    ...snapshot.valuation.adjustedComparables.flatMap((comp, index) => [
      `Comparable ${index + 1}: ${comp.address}`,
      `Sale price ${formatCurrency(comp.salePrice)} | Adjusted value ${formatCurrency(comp.adjustedValue)} | Distance ${comp.distanceKm.toFixed(1)} km | Match ${Math.round(comp.totalScore)}`,
      ...comp.adjustmentLines.map((line) =>
        `- ${line.label}: ${formatSignedCurrency(line.amount)} | ${sanitizeInline(line.rationale)}`
      ),
      `Net adjustment: ${formatSignedCurrency(comp.adjustments.total)}`,
      ""
    ])
  ];
}

function buildEvidenceZip(subject: SubjectProperty, snapshot: PceAnalysisSnapshot) {
  const entries = [
    buildExportArtifact("memo-pdf", subject, snapshot),
    buildExportArtifact("comparables-csv", subject, snapshot),
    buildExportArtifact("adjustments-pdf", subject, snapshot),
    buildExportArtifact("snapshot-md", subject, snapshot),
    buildExportArtifact("audit-txt", subject, snapshot)
  ].map((artifact) => ({
    name: artifact.fileName,
    bytes: toUint8Array(artifact.content)
  }));

  return buildStoredZip(entries);
}

function buildBaseFileName(subject: SubjectProperty, generatedAt: string) {
  return `${slugify(subject.address)}_PCE_${generatedAt.slice(0, 10)}`;
}

function slugify(value: string) {
  return sanitizeInline(value)
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function escapeCsv(value: string) {
  const normalized = sanitizeInline(value);
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }
  return normalized;
}

function sanitizeMultiline(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(sanitizeInline)
    .join("\n");
}

function sanitizeInline(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, (char) => {
      const replacements: Record<string, string> = {
        "\t": " ",
        "\n": " ",
        "\r": " ",
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201C": "\"",
        "\u201D": "\"",
        "\u2022": "-",
        "\u2026": "..."
      };
      return replacements[char] ?? "?";
    })
    .replace(/\s+/g, " ")
    .trim();
}

function buildSimplePdf(lines: string[]) {
  const pageHeight = 792;
  const leftMargin = 48;
  const topMargin = 744;
  const lineHeight = 16;
  const maxLinesPerPage = 42;
  const pages = chunk(lines.map(sanitizeInline), maxLinesPerPage).map((pageLines) =>
    pageLines.map((line, index) => {
      const y = topMargin - (index * lineHeight);
      return `BT /F1 11 Tf 1 0 0 1 ${leftMargin} ${y} Tm (${escapePdfText(line)}) Tj ET`;
    }).join("\n")
  );

  const objects: string[] = [];
  const pageObjectIds: number[] = [];
  let nextObjectId = 4;

  for (const content of pages) {
    const pageObjectId = nextObjectId;
    const contentObjectId = nextObjectId + 1;
    pageObjectIds.push(pageObjectId);
    objects[pageObjectId - 1] = `${pageObjectId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>\nendobj`;
    objects[contentObjectId - 1] = `${contentObjectId} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`;
    nextObjectId += 2;
  }

  objects[0] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj";
  objects[1] = `2 0 obj\n<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>\nendobj`;
  objects[2] = "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj";

  const body = objects.filter(Boolean);
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of body) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${body.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${body.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups.length ? groups : [[]];
}

function toUint8Array(content: string | Uint8Array) {
  return typeof content === "string" ? new TextEncoder().encode(content) : content;
}

function buildStoredZip(entries: Array<{ name: string; bytes: Uint8Array }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const crc = crc32(entry.bytes);
    const localHeader = concatUint8Arrays([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(entry.bytes.length),
      u32(entry.bytes.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes
    ]);

    localParts.push(localHeader, entry.bytes);

    const centralHeader = concatUint8Arrays([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(entry.bytes.length),
      u32(entry.bytes.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + entry.bytes.length;
  }

  const centralDirectory = concatUint8Arrays(centralParts);
  const endRecord = concatUint8Arrays([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0)
  ]);

  return concatUint8Arrays([...localParts, centralDirectory, endRecord]);
}

function concatUint8Arrays(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}

function u16(value: number) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function u32(value: number) {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  ]);
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function formatSignedCurrency(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}
