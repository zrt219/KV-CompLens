import type { ExportPacket } from "./types";
import { sanitizeInline } from "./safeText";

export function createExportFileNames(packet: ExportPacket) {
  const base = packet.meta.fileBaseName || buildBaseName(packet);
  return {
    pdf: `${base}.pdf`,
    docx: `${base}.docx`,
    html: `${base}.html`,
    rtf: `${base}.rtf`,
    markdown: `${base}.md`,
    json: `${base}.json`,
    csv: `${base}-comparables.csv`,
    zip: `${base}.zip`
  };
}

export function buildBaseName(packet: ExportPacket) {
  return [
    "kv-complens",
    slugify(packet.subject.address),
    "review-package",
    packet.meta.generatedAt.slice(0, 10)
  ].filter(Boolean).join("-");
}

export function slugify(value: string) {
  return sanitizeInline(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}
