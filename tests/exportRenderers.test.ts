import { describe, expect, it } from "vitest";
import { buildExportPacket } from "../lib/export/buildExportPacket";
import { renderComparablesCsv } from "../lib/export/csv/renderCsv";
import { generateDocxBlob } from "../lib/export/docx/generateDocxBlob";
import { renderReportHtml } from "../lib/export/html/renderReportHtml";
import { renderMarkdownReport } from "../lib/export/markdown/renderMarkdownReport";
import { generateExportPackageZip } from "../lib/export/package/generateExportPackageZip";
import { generatePdfBlob } from "../lib/export/pdf/generatePdfBlob";
import { renderRtf } from "../lib/export/wordFallback/renderRtf";
import { syntheticComparables } from "../lib/mockData";
import { runPcePipeline } from "../lib/pce/runPcePipeline";
import type { SubjectProperty } from "../lib/types";

const subject: SubjectProperty = {
  address: "12345 109 St NW",
  city: "Edmonton",
  province: "AB",
  postalCode: "T5G 0A0",
  neighbourhood: "Central McDougall",
  propertyType: "Detached",
  yearBuilt: 2014,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2180,
  lotSizeSqft: 5800,
  parking: 2,
  latitude: 53.5828,
  longitude: -113.5082,
  condition: "Good"
};

const packet = buildExportPacket(runPcePipeline({ subject, candidates: syntheticComparables, generatedAt: "2026-05-31T12:00:00.000Z" }), { includeReviewIntelligence: true });

describe("export renderers", () => {
  it("generates PDF and DOCX blobs", async () => {
    const pdf = await generatePdfBlob(packet);
    const docx = await generateDocxBlob(packet);

    expect(pdf.type).toBe("application/pdf");
    expect(pdf.size).toBeGreaterThan(100);
    expect(docx.type).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(docx.size).toBeGreaterThan(100);
  });

  it("renders HTML, RTF, Markdown, CSV, and limitations", () => {
    const html = renderReportHtml(packet);
    const rtf = renderRtf(packet);
    const markdown = renderMarkdownReport(packet);
    const csv = renderComparablesCsv(packet);

    for (const content of [html, rtf, markdown]) {
      expect(content).toContain("Not an appraisal");
      expect(content).toContain("Not a credit decision");
      expect(content).not.toMatch(/Agent Reasoning Trace|chain-of-thought/i);
    }
    expect(html).toContain(packet.subject.address);
    expect(rtf).toContain(packet.subject.address);
    expect(markdown).toContain("Value Range");
    expect(csv).toContain("Comparable ID,Address");
  });

  it("builds a ZIP package with text and audit fallbacks", async () => {
    const zip = await generateExportPackageZip(packet);
    const text = new TextDecoder().decode(await zip.arrayBuffer());

    expect(text.startsWith("PK")).toBe(true);
    expect(text).toContain("report.html");
    expect(text).toContain("report.md");
    expect(text).toContain("report.json");
    expect(text).toContain("comparables.csv");
    expect(text).toContain("audit.json");
    expect(text).toContain("limitations.txt");
    expect(text).toContain("README.txt");
  });
});
