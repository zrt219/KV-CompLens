import { describe, expect, it } from "vitest";
import { syntheticComparables } from "../lib/mockData";
import { buildExportArtifact, exportArtifactOptions } from "../lib/pce/exportPackage";
import { createZeroPceSnapshot, runPcePipeline } from "../lib/pce/runPcePipeline";
import type { SubjectProperty } from "../lib/types";

const subject: SubjectProperty = {
  id: "SUBJ-EXPORT-001",
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
  condition: "Good",
  targetPriceHint: 690000,
  underwritingDate: "2026-05-31"
};

const snapshot = runPcePipeline({
  subject,
  candidates: syntheticComparables,
  generatedAt: "2026-06-01T00:00:00.000Z"
});

describe("exportPackage", () => {
  it("defines all eight export artifact options", () => {
    expect(exportArtifactOptions.map((option) => option.id)).toEqual([
      "memo-pdf",
      "memo-doc",
      "comparables-csv",
      "adjustments-pdf",
      "adjustments-doc",
      "snapshot-md",
      "audit-txt",
      "evidence-zip"
    ]);
  });

  it("uses canonical resilience-layer export filenames", () => {
    expect(buildExportArtifact("memo-pdf", subject, snapshot).fileName).toBe(
      "kv-complens-12345-109-st-nw-review-package-2026-06-01.pdf"
    );
    expect(buildExportArtifact("comparables-csv", subject, snapshot).fileName).toBe(
      "kv-complens-12345-109-st-nw-review-package-2026-06-01-comparables.csv"
    );
    expect(buildExportArtifact("adjustments-pdf", subject, snapshot).fileName).toBe(
      "kv-complens-12345-109-st-nw-review-package-2026-06-01-adjustments.pdf"
    );
    expect(buildExportArtifact("snapshot-md", subject, snapshot).fileName).toBe(
      "kv-complens-12345-109-st-nw-review-package-2026-06-01.md"
    );
    expect(buildExportArtifact("audit-txt", subject, snapshot).fileName).toBe(
      "kv-complens-12345-109-st-nw-review-package-2026-06-01-audit.txt"
    );
    expect(buildExportArtifact("evidence-zip", subject, snapshot).fileName).toBe(
      "kv-complens-12345-109-st-nw-review-package-2026-06-01.zip"
    );
  });

  it("builds a working memo pdf artifact", () => {
    const artifact = buildExportArtifact("memo-pdf", subject, snapshot);
    const uint8 = artifact.content instanceof ArrayBuffer ? new Uint8Array(artifact.content) : artifact.content as Uint8Array;

    expect(artifact.fileName.endsWith(".pdf")).toBe(true);
    expect(artifact.mimeType).toBe("application/pdf");
    expect(uint8.length).toBeGreaterThan(100);
    expect(uint8[0]).toBe(37); // %
    expect(uint8[1]).toBe(80); // P
    expect(uint8[2]).toBe(68); // D
    expect(uint8[3]).toBe(70); // F
  });

  it("builds a csv comparable set", () => {
    const artifact = buildExportArtifact("comparables-csv", subject, snapshot);

    expect(artifact.fileName.endsWith(".csv")).toBe(true);
    expect(typeof artifact.content).toBe("string");
    expect(artifact.content).toContain("Comparable ID,Address,Neighborhood");
    expect(artifact.content).toContain(snapshot.valuation.adjustedComparables[0].address);
  });

  it("builds markdown and txt exports from snapshot facts", () => {
    const markdown = buildExportArtifact("snapshot-md", subject, snapshot);
    const auditLog = buildExportArtifact("audit-txt", subject, snapshot);
    const markdownContent = markdown.content as string;
    const auditLogContent = auditLog.content as string;

    expect(markdown.fileName.endsWith(".md")).toBe(true);
    expect(markdownContent).toContain("# KV CompLens Review Package");
    expect(markdownContent).toContain("Not an appraisal");
    expect(markdownContent).not.toMatch(/equations|coefficients|derivations|posterior|variance|entropy|model fusion/i);
    expect(markdownContent).toContain(snapshot.selectedComparables[0].address);
    expect(auditLog.fileName.endsWith(".txt")).toBe(true);
    expect(auditLogContent).toContain("KV CompLens Review Activity Log");
    expect(auditLogContent).toContain(snapshot.auditEvents[0].summary);
  });

  it("builds a zip package that includes every underlying export", () => {
    const artifact = buildExportArtifact("evidence-zip", subject, snapshot);
    const zipText = new TextDecoder().decode(artifact.content as Uint8Array);

    expect(artifact.fileName.endsWith(".zip")).toBe(true);
    expect(artifact.mimeType).toBe("application/zip");
    expect(zipText.startsWith("PK")).toBe(true);
    expect(zipText).toContain("report.html");
    expect(zipText).toContain("report.md");
    expect(zipText).toContain("report.json");
    expect(zipText).toContain("comparables.csv");
    expect(zipText).toContain("adjustments.csv");
    expect(zipText).toContain("audit.json");
    expect(zipText).toContain("limitations.txt");
  });

  it("rejects idle zero-state snapshots", () => {
    const idleSnapshot = createZeroPceSnapshot(subject, "2026-06-01T00:00:00.000Z");

    expect(() => buildExportArtifact("memo-pdf", subject, idleSnapshot)).toThrow("Analysis must run before exporting a review package.");
  });
});
