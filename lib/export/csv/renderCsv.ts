import { escapeCsv } from "../safeText";
import type { ExportPacket } from "../types";

export function renderComparablesCsv(packet: ExportPacket) {
  const rows = [
    ["Rank", "Comparable ID", "Address", "Neighborhood", "Sale Price", "Adjusted Value", "Distance Km", "Match Score", "Comparable Probability", "Evidence Weight", "Included", "Risk Flags"],
    ...packet.comparables.map((comp) => [
      comp.rank,
      comp.id,
      comp.address,
      comp.neighborhood ?? "",
      comp.salePrice,
      comp.adjustedValue,
      comp.distanceKm.toFixed(1),
      comp.matchScore,
      `${comp.comparableProbability}%`,
      comp.evidenceWeight === undefined ? "" : `${comp.evidenceWeight}%`,
      comp.included ? "yes" : "no",
      comp.riskFlags.join("; ")
    ])
  ];
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function renderAdjustmentsCsv(packet: ExportPacket) {
  const rows = [
    ["Comparable ID", "Address", "Line Item", "Amount", "Rationale", "Adjusted Value"],
    ...packet.adjustments.flatMap((adjustment) =>
      adjustment.lineItems.map((line) => [
        adjustment.comparableId,
        adjustment.address,
        line.label,
        line.amount,
        line.rationale,
        adjustment.adjustedValue
      ])
    )
  ];
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function renderExportCsvSet(packet: ExportPacket) {
  return [
    "Comparable Set",
    renderComparablesCsv(packet),
    "",
    "Adjustment Set",
    renderAdjustmentsCsv(packet)
  ].join("\n");
}
