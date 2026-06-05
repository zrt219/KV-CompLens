import { formatCurrency } from "../../format";
import { assertNoPrivateReasoning, escapeHtml } from "../safeText";
import type { ExportPacket } from "../types";

export function renderReportHtml(packet: ExportPacket) {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(packet.meta.reportTitle)}</title>
  <style>
    body { margin: 0; background: #f7f7f8; color: #111827; font-family: Arial, sans-serif; line-height: 1.45; }
    .print-page { max-width: 8.5in; margin: 24px auto; padding: 0.55in; background: white; border: 1px solid #d8dee8; box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08); }
    h1 { margin: 0 0 8px; font-size: 28px; }
    h2 { margin: 24px 0 8px; font-size: 17px; }
    p { margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #d8dee8; padding: 7px; text-align: left; vertical-align: top; }
    th { background: #eef4ff; }
    .notice { border: 1px solid #b45309; background: #fff7ed; padding: 10px; border-radius: 8px; font-weight: 700; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 14px 0; }
    .metric { border: 1px solid #d8dee8; border-radius: 8px; padding: 10px; }
    .metric span { display: block; color: #475569; font-size: 12px; font-weight: 700; }
    .metric strong { display: block; margin-top: 3px; font-size: 18px; }
    @media print {
      body { background: white; }
      .no-print { display: none !important; }
      .print-page { width: 100%; margin: 0; box-shadow: none; border: none; padding: 0; }
      @page { size: letter; margin: 0.6in; }
    }
  </style>
</head>
<body>
  <main class="print-page">
    <h1>${escapeHtml(packet.meta.reportTitle)}</h1>
    <p>${escapeHtml(packet.subject.address)}, ${escapeHtml(packet.subject.city)}, ${escapeHtml(packet.subject.province)}</p>
    <div class="notice">Review support only. Not an appraisal. Not a credit decision. Not live MLS data. Analyst review required.</div>
    <section class="metrics">
      <div class="metric"><span>Estimated range</span><strong>${formatCurrency(packet.valuation.lowEstimate)} - ${formatCurrency(packet.valuation.highEstimate)}</strong></div>
      <div class="metric"><span>Current estimate</span><strong>${formatCurrency(packet.valuation.midpointEstimate)}</strong></div>
      <div class="metric"><span>Confidence</span><strong>${packet.valuation.confidenceScore}% ${escapeHtml(packet.valuation.confidenceLabel)}</strong></div>
    </section>
    ${subjectSection(packet)}
    ${sourceSection(packet)}
    ${comparablesSection(packet)}
    ${adjustmentsSection(packet)}
    ${reviewIntelligenceSection(packet)}
    ${limitationsSection(packet)}
    ${auditSection(packet)}
  </main>
</body>
</html>`;
  assertNoPrivateReasoning(html);
  return html;
}

function subjectSection(packet: ExportPacket) {
  return `<section><h2>Subject Summary</h2><table><tbody>
    <tr><th>Property type</th><td>${escapeHtml(packet.subject.propertyType)}</td></tr>
    <tr><th>Neighborhood</th><td>${escapeHtml(packet.subject.neighborhood ?? "N/A")}</td></tr>
    <tr><th>Size</th><td>${packet.subject.beds} bed, ${packet.subject.baths} bath, ${packet.subject.livingAreaSqft} sq ft</td></tr>
    <tr><th>Condition</th><td>${escapeHtml(packet.subject.condition ?? "N/A")}</td></tr>
  </tbody></table></section>`;
}

function sourceSection(packet: ExportPacket) {
  return `<section><h2>Source Scan Summary</h2><table><tbody>
    <tr><th>Sources checked</th><td>${packet.sourceScan.sourcesChecked}</td></tr>
    <tr><th>Records found</th><td>${packet.sourceScan.recordsFound ?? "N/A"}</td></tr>
    <tr><th>Comparables ranked</th><td>${packet.sourceScan.comparablesRanked ?? "N/A"}</td></tr>
    <tr><th>Comparables selected</th><td>${packet.sourceScan.comparablesSelected}</td></tr>
    <tr><th>Data boundary</th><td>${escapeHtml(packet.sourceScan.dataBoundaryNote)}</td></tr>
  </tbody></table></section>`;
}

function comparablesSection(packet: ExportPacket) {
  return `<section><h2>Comparables Included</h2><table><thead><tr><th>#</th><th>Address</th><th>Sale</th><th>Adjusted</th><th>Distance</th><th>Probability</th></tr></thead><tbody>
    ${packet.comparables.map((comp) => `<tr><td>${comp.rank}</td><td>${escapeHtml(comp.address)}</td><td>${formatCurrency(comp.salePrice)}</td><td>${formatCurrency(comp.adjustedValue)}</td><td>${comp.distanceKm.toFixed(1)} km</td><td>${comp.comparableProbability}%</td></tr>`).join("")}
  </tbody></table></section>`;
}

function adjustmentsSection(packet: ExportPacket) {
  return `<section><h2>Adjustment Summary</h2><table><thead><tr><th>Comparable</th><th>Net adjustment</th><th>Adjusted value</th></tr></thead><tbody>
    ${packet.adjustments.map((adjustment) => `<tr><td>${escapeHtml(adjustment.address)}</td><td>${formatCurrency(adjustment.totalAdjustment)}</td><td>${formatCurrency(adjustment.adjustedValue)}</td></tr>`).join("")}
  </tbody></table></section>`;
}

function reviewIntelligenceSection(packet: ExportPacket) {
  if (!packet.reviewIntelligence) return "";
  return `<section><h2>Review Intelligence</h2>
    <p><strong>Title:</strong> ${escapeHtml(packet.reviewIntelligence.title)}</p>
    <p><strong>Verdict:</strong> ${escapeHtml(packet.reviewIntelligence.verdict)}</p>
    <p><strong>Strongest comparable:</strong> ${escapeHtml(packet.reviewIntelligence.strongestComparable)}</p>
    <p><strong>Weakest comparable:</strong> ${escapeHtml(packet.reviewIntelligence.weakestComparable)}</p>
    <p><strong>Verification:</strong> ${escapeHtml(packet.reviewIntelligence.verificationStatus)}</p>
    <p><strong>Source:</strong> ${escapeHtml(packet.reviewIntelligence.source)}</p>
    <p>${escapeHtml(packet.reviewIntelligence.memoReadySummary)}</p>
  </section>`;
}

function limitationsSection(packet: ExportPacket) {
  return `<section><h2>Limitations</h2><ul>${packet.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
}

function auditSection(packet: ExportPacket) {
  return `<section><h2>Audit Summary</h2><table><thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Summary</th></tr></thead><tbody>
    ${packet.auditEvents.map((event) => `<tr><td>${escapeHtml(event.timestamp)}</td><td>${escapeHtml(event.action)}</td><td>${escapeHtml(event.actor)}</td><td>${escapeHtml(event.summary)}</td></tr>`).join("")}
  </tbody></table></section>`;
}
