import { describe, expect, it, vi } from "vitest";
import { buildExportPacket } from "../lib/export/buildExportPacket";
import { runExport } from "../lib/export/runExport";
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

const packet = buildExportPacket(runPcePipeline({ subject, candidates: syntheticComparables, generatedAt: "2026-05-31T12:00:00.000Z" }));

describe("export fallback orchestrator", () => {
  it("continues when PDF generation fails and recommends print view", async () => {
    mockBrowserDownloads();
    const result = await runExport(packet, {
      requested: ["pdf"],
      includeFallbacks: true,
      simulate: { failPdf: true }
    });

    expect(result.ok).toBe(true);
    expect(result.failed.some((failure) => failure.format === "pdf")).toBe(true);
    expect(result.completed.some((completed) => completed.method === "print-ready-html")).toBe(true);
    expect(result.recommendedNextAction).toBe("open-print-view");
  });

  it("continues when DOCX generation fails and uses Word-compatible fallback", async () => {
    mockBrowserDownloads();
    const result = await runExport(packet, {
      requested: ["docx"],
      includeFallbacks: true,
      simulate: { failDocx: true }
    });

    expect(result.ok).toBe(true);
    expect(result.failed.some((failure) => failure.format === "docx")).toBe(true);
    expect(result.completed.some((completed) => completed.method.includes("word-compatible"))).toBe(true);
  });

  it("returns copyable Markdown fallback if downloads are blocked", async () => {
    mockBrowserDownloads();
    const result = await runExport(packet, {
      requested: ["pdf", "docx"],
      includeFallbacks: true,
      simulate: { failDownloads: true }
    });

    expect(result.ok).toBe(true);
    expect(result.completed.some((completed) => completed.method === "copyable-markdown-fallback")).toBe(true);
    expect(result.failed.length).toBeGreaterThan(0);
  });
});

function mockBrowserDownloads() {
  const anchor = {
    click: vi.fn(),
    remove: vi.fn(),
    style: {},
    set href(value: string) {
      void value;
    },
    set download(value: string) {
      void value;
    },
    set rel(value: string) {
      void value;
    }
  } as unknown as HTMLAnchorElement;

  vi.stubGlobal("document", {
    createElement: vi.fn(() => anchor),
    body: { appendChild: vi.fn() }
  });
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:test"),
    revokeObjectURL: vi.fn()
  });
  vi.stubGlobal("window", { open: vi.fn() });
  vi.stubGlobal("sessionStorage", { setItem: vi.fn() });
}
