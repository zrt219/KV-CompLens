import type { ExportPacket, ExportResult } from "../types";

export function persistPrintPacket(packet: ExportPacket) {
  if (typeof sessionStorage === "undefined") return false;
  sessionStorage.setItem("kv-complens-print-export-packet", JSON.stringify(packet));
  return true;
}

export function openPrintReport(packet: ExportPacket): ExportResult {
  const persisted = persistPrintPacket(packet);
  if (typeof window !== "undefined" && persisted) {
    window.open("/export/print", "_blank", "noopener,noreferrer");
    return { ok: true, format: "html", method: "print-ready-html", filename: "print-view" };
  }
  return { ok: false, format: "html", method: "print-ready-html", error: "Print route storage is unavailable." };
}
