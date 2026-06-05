import { formatCurrency } from "../../format";
import { escapeHtml } from "../safeText";
import type { ExportPacket } from "../types";

export function generateDocxDocument(packet: ExportPacket) {
  const paragraphs = [
    heading(packet.meta.reportTitle),
    paragraph("Review support only. Not an appraisal. Not a credit decision. Not live MLS data. Analyst review required."),
    heading("Subject Details"),
    paragraph(`${packet.subject.address}, ${packet.subject.city}, ${packet.subject.province}`),
    paragraph(`${packet.subject.propertyType}; ${packet.subject.beds} bed; ${packet.subject.baths} bath; ${packet.subject.livingAreaSqft} sq ft`),
    heading("Value Range"),
    paragraph(`${formatCurrency(packet.valuation.lowEstimate)} to ${formatCurrency(packet.valuation.highEstimate)}; current estimate ${formatCurrency(packet.valuation.midpointEstimate)}; confidence ${packet.valuation.confidenceScore}% ${packet.valuation.confidenceLabel}`),
    heading("Source Scan Summary"),
    paragraph(`${packet.sourceScan.sourcesChecked} sources checked; ${packet.sourceScan.comparablesSelected} comparables selected. ${packet.sourceScan.dataBoundaryNote}`),
    heading("Comparables Included"),
    ...packet.comparables.map((comp) => paragraph(`${comp.rank}. ${comp.address}: ${formatCurrency(comp.adjustedValue)} adjusted value; ${comp.distanceKm.toFixed(1)} km; ${comp.comparableProbability}% comparable probability.`)),
    heading("Adjustment Summary"),
    ...packet.adjustments.map((adjustment) => paragraph(`${adjustment.address}: ${formatCurrency(adjustment.totalAdjustment)} net adjustment; ${formatCurrency(adjustment.adjustedValue)} adjusted value.`)),
    ...(packet.reviewIntelligence ? [heading("Review Intelligence V2"), paragraph(packet.reviewIntelligence.memoReadySummary)] : []),
    heading("Limitations"),
    ...packet.limitations.map(paragraph),
    heading("Audit Summary"),
    ...packet.auditEvents.map((event) => paragraph(`${event.timestamp}: ${event.action}; ${event.summary}`))
  ];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphs.join("")}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="864" w:right="864" w:bottom="864" w:left="864"/></w:sectPr></w:body>
</w:document>`;
}

function heading(value: string) {
  return `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(value)}</w:t></w:r></w:p>`;
}

function paragraph(value: string) {
  return `<w:p><w:r><w:t>${escapeXml(value)}</w:t></w:r></w:p>`;
}

function escapeXml(value: string) {
  return escapeHtml(value);
}
