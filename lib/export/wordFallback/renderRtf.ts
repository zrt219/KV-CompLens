import { formatCurrency } from "../../format";
import { assertNoPrivateReasoning, sanitizeInline } from "../safeText";
import type { ExportPacket } from "../types";

export function renderRtf(packet: ExportPacket) {
  const content = [
    rtfHeading(packet.meta.reportTitle),
    rtfText("Review support only. Not an appraisal. Not a credit decision. Not live MLS data. Analyst review required."),
    rtfHeading("Subject Summary"),
    rtfText(`${packet.subject.address}, ${packet.subject.city}, ${packet.subject.province}`),
    rtfText(`${packet.subject.propertyType}; ${packet.subject.beds} bed; ${packet.subject.baths} bath; ${packet.subject.livingAreaSqft} sq ft`),
    rtfHeading("Value Range"),
    rtfText(`${formatCurrency(packet.valuation.lowEstimate)} to ${formatCurrency(packet.valuation.highEstimate)}; current estimate ${formatCurrency(packet.valuation.midpointEstimate)}; confidence ${packet.valuation.confidenceScore}% ${packet.valuation.confidenceLabel}`),
    rtfHeading("Comparables"),
    ...packet.comparables.map((comp) => rtfText(`${comp.rank}. ${comp.address}: ${formatCurrency(comp.adjustedValue)} adjusted; ${comp.distanceKm.toFixed(1)} km; ${comp.comparableProbability}% probability.`)),
    rtfHeading("Limitations"),
    ...packet.limitations.map(rtfText),
    rtfHeading("Audit Summary"),
    ...packet.auditEvents.map((event) => rtfText(`${event.timestamp}: ${event.action}; ${event.summary}`))
  ].join("");
  const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs22 ${content}}`;
  assertNoPrivateReasoning(rtf);
  return rtf;
}

function rtfHeading(value: string) {
  return `\\par\\b\\fs30 ${escapeRtf(value)}\\b0\\fs22\\par `;
}

function rtfText(value: string) {
  return `${escapeRtf(value)}\\par `;
}

function escapeRtf(value: string) {
  return sanitizeInline(value).replace(/[\\{}]/g, "\\$&");
}
