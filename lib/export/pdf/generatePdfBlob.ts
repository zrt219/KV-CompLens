import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "../../format";
import type { ExportPacket } from "../types";

export async function generatePdfBlob(packet: ExportPacket, options: { fail?: boolean } = {}) {
  if (options.fail) {
    throw new Error("PDF renderer failed by simulation flag.");
  }

  return new Blob([generatePdfArrayBuffer(packet)], { type: "application/pdf" });
}

export function generatePdfArrayBuffer(packet: ExportPacket) {
  try {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(packet.meta.reportTitle, 14, 20);
    doc.setFontSize(9);
    doc.text("Review support only. Not an appraisal. Not a credit decision. Not live MLS data. Analyst review required.", 14, 27);
    doc.text(`Generated: ${packet.meta.generatedAt}`, 14, 33);

    doc.setFontSize(13);
    doc.text("Subject Summary", 14, 45);
    doc.setFontSize(10);
    doc.text(`${packet.subject.address}, ${packet.subject.city}, ${packet.subject.province}`, 14, 51);
    doc.text(`${packet.subject.propertyType} | ${packet.subject.beds} bed | ${packet.subject.baths} bath | ${packet.subject.livingAreaSqft} sq ft`, 14, 57);

    autoTable(doc, {
      startY: 66,
      head: [["Metric", "Value"]],
      body: [
        ["Estimated value range", `${formatCurrency(packet.valuation.lowEstimate)} to ${formatCurrency(packet.valuation.highEstimate)}`],
        ["Current estimate", formatCurrency(packet.valuation.midpointEstimate)],
        ["Confidence", `${packet.valuation.confidenceScore}% ${packet.valuation.confidenceLabel}`],
        ["Sources checked", String(packet.sourceScan.sourcesChecked)],
        ["Comparables selected", String(packet.sourceScan.comparablesSelected)]
      ],
      theme: "striped",
      headStyles: { fillColor: [32, 78, 132] }
    });

    let finalY = readAutoTableY(doc) + 10;
    doc.setFontSize(13);
    doc.text("Comparables Included", 14, finalY);
    autoTable(doc, {
      startY: finalY + 4,
      head: [["#", "Address", "Sale", "Adjusted", "Distance", "Probability"]],
      body: packet.comparables.map((comp) => [
        comp.rank,
        comp.address,
        formatCurrency(comp.salePrice),
        formatCurrency(comp.adjustedValue),
        `${comp.distanceKm.toFixed(1)} km`,
        `${comp.comparableProbability}%`
      ]),
      styles: { fontSize: 8 },
      theme: "striped",
      headStyles: { fillColor: [32, 78, 132] }
    });

    finalY = readAutoTableY(doc) + 10;
    if (finalY > 245) {
      doc.addPage();
      finalY = 20;
    }
    doc.setFontSize(13);
    doc.text("Limitations", 14, finalY);
    doc.setFontSize(9);
    const limitationLines = doc.splitTextToSize(packet.limitations.join(" | "), 180);
    doc.text(limitationLines, 14, finalY + 6);

    if (packet.reviewIntelligence) {
      const riY = finalY + limitationLines.length * 5 + 12;
      if (riY > 250) {
        doc.addPage();
        finalY = 20;
      } else {
        finalY = riY;
      }
      doc.setFontSize(13);
      doc.text("Review Intelligence V2", 14, finalY);
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(packet.reviewIntelligence.memoReadySummary, 180), 14, finalY + 6);
    }

    return doc.output("arraybuffer");
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "PDF renderer failed.");
  }
}

function readAutoTableY(doc: jsPDF) {
  return (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 100;
}
