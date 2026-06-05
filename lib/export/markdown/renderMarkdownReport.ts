import { formatCurrency } from "../../format";
import { assertNoPrivateReasoning, sanitizeInline } from "../safeText";
import type { ExportPacket } from "../types";

export function renderMarkdownReport(packet: ExportPacket) {
  const lines = [
    `# ${packet.meta.reportTitle}`,
    "",
    "**Review support only. Not an appraisal. Not a credit decision. Not live MLS data. Analyst review required.**",
    "",
    "## Subject",
    `- Address: ${packet.subject.address}, ${packet.subject.city}, ${packet.subject.province}`,
    `- Property type: ${packet.subject.propertyType}`,
    `- Size: ${packet.subject.beds} bed, ${packet.subject.baths} bath, ${packet.subject.livingAreaSqft} sq ft`,
    "",
    "## Value Range",
    `- Estimated range: ${formatCurrency(packet.valuation.lowEstimate)} to ${formatCurrency(packet.valuation.highEstimate)}`,
    `- Current estimate: ${formatCurrency(packet.valuation.midpointEstimate)}`,
    `- Confidence: ${packet.valuation.confidenceScore}% ${packet.valuation.confidenceLabel}`,
    "",
    "## Source Scan Summary",
    `- Sources checked: ${packet.sourceScan.sourcesChecked}`,
    `- Records found: ${packet.sourceScan.recordsFound ?? "N/A"}`,
    `- Comparables ranked: ${packet.sourceScan.comparablesRanked ?? "N/A"}`,
    `- Comparables selected: ${packet.sourceScan.comparablesSelected}`,
    `- Data boundary: ${packet.sourceScan.dataBoundaryNote}`,
    "",
    "## Comparables Included",
    "| Rank | Address | Sale Price | Adjusted Value | Distance | Probability |",
    "| --- | --- | --- | --- | --- | --- |",
    ...packet.comparables.map((comp) =>
      `| ${comp.rank} | ${comp.address} | ${formatCurrency(comp.salePrice)} | ${formatCurrency(comp.adjustedValue)} | ${comp.distanceKm.toFixed(1)} km | ${comp.comparableProbability}% |`
    ),
    "",
    "## Adjustment Summary",
    ...packet.adjustments.map((adjustment) =>
      `- ${adjustment.address}: ${formatSignedCurrency(adjustment.totalAdjustment)} net adjustment, ${formatCurrency(adjustment.adjustedValue)} adjusted value.`
    ),
    ...(packet.reviewIntelligence ? [
      "",
      "## Review Intelligence V2",
      `- Title: ${packet.reviewIntelligence.title}`,
      `- Verdict: ${packet.reviewIntelligence.verdict}`,
      `- Strongest comparable: ${packet.reviewIntelligence.strongestComparable}`,
      `- Weakest comparable: ${packet.reviewIntelligence.weakestComparable}`,
      `- Verification: ${packet.reviewIntelligence.verificationStatus}`,
      `- Source: ${packet.reviewIntelligence.source}`,
      `- Summary: ${packet.reviewIntelligence.memoReadySummary}`
    ] : []),
    "",
    "## Limitations",
    ...packet.limitations.map((limitation) => `- ${limitation}`),
    "",
    "## Audit Summary",
    ...packet.auditEvents.map((event) => `- ${event.timestamp}: ${event.action} by ${event.actor}. ${event.summary}`)
  ];
  const content = lines.map(sanitizeInlinePreservingMarkdown).join("\n");
  assertNoPrivateReasoning(content);
  return content;
}

function formatSignedCurrency(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function sanitizeInlinePreservingMarkdown(value: string) {
  return value.split("|").map(sanitizeInline).join("|");
}
