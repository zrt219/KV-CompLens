"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  PRINT_PACKET_LOCAL_KEY,
  PRINT_PACKET_SESSION_KEY
} from "../../lib/export/html/openPrintReport";
import { renderReportHtml } from "../../lib/export/html/renderReportHtml";
import type { ExportPacket } from "../../lib/export/types";

export function PrintReportView() {
  const isClient = useSyncExternalStore(
    subscribeToClientReady,
    getClientSnapshot,
    getServerSnapshot
  );
  const html = useMemo(() => {
    if (!isClient) return undefined;

    let raw: string | null = null;

    try {
      raw = sessionStorage.getItem(PRINT_PACKET_SESSION_KEY);
    } catch {
      raw = null;
    }

    if (!raw) {
      try {
        raw = localStorage.getItem(PRINT_PACKET_LOCAL_KEY);
      } catch {
        raw = null;
      }
    }

    if (!raw) return undefined;
    const packet = JSON.parse(raw) as ExportPacket;
    return renderReportHtml(packet);
  }, [isClient]);

  if (!isClient) {
    return (
      <main className="print-page">
        <h1>Loading print report</h1>
        <p>Preparing the print-ready report packet.</p>
      </main>
    );
  }

  if (!html) {
    return (
      <main className="print-page">
        <h1>Print report unavailable</h1>
        <p>The print packet was not found. Return to Export Package and choose Open Print View again.</p>
      </main>
    );
  }

  return <iframe className="print-report-frame" title="KV CompLens print-ready report" srcDoc={html} />;
}

function subscribeToClientReady(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const id = window.setTimeout(callback, 0);
  return () => window.clearTimeout(id);
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}
