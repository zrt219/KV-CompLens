import type { ExportPacket, ExportResult } from "../types";

export const PRINT_PACKET_SESSION_KEY = "kv-complens-print-export-packet";
export const PRINT_PACKET_LOCAL_KEY = "kv-complens-print-export-packet-shared";

export function persistPrintPacket(packet: ExportPacket) {
  const raw = JSON.stringify(packet);
  let persisted = false;

  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(PRINT_PACKET_SESSION_KEY, raw);
      persisted = true;
    }
  } catch {
    // Ignore storage failures and fall through to localStorage.
  }

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(PRINT_PACKET_LOCAL_KEY, raw);
      persisted = true;
    }
  } catch {
    // Ignore storage failures and report failure below if nothing persisted.
  }

  return persisted;
}

export function openPrintReport(packet: ExportPacket): ExportResult {
  const persisted = persistPrintPacket(packet);
  if (typeof window !== "undefined" && persisted) {
    const printWindow = window.open("/export/print", "_blank", "noopener,noreferrer");
    if (!printWindow && typeof window.location?.assign === "function") {
      window.location.assign("/export/print");
    }
    return { ok: true, format: "html", method: "print-ready-html", filename: "print-view" };
  }
  return { ok: false, format: "html", method: "print-ready-html", error: "Print route storage is unavailable." };
}
