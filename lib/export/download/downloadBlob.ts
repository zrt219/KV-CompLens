import type { ExportFormat, ExportResult } from "../types";

type DownloadBlobOptions = {
  format: ExportFormat;
  method: string;
  fail?: boolean;
};

export async function downloadBlob(blob: Blob, filename: string, options: DownloadBlobOptions): Promise<ExportResult> {
  if (options.fail) {
    return {
      ok: false,
      format: options.format,
      method: options.method,
      filename,
      error: "Download blocked by simulation flag."
    };
  }

  if (typeof document === "undefined" || typeof URL === "undefined") {
    return {
      ok: false,
      format: options.format,
      method: options.method,
      filename,
      error: "Browser download APIs are unavailable."
    };
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  return {
    ok: true,
    format: options.format,
    method: options.method,
    filename
  };
}

export function downloadTextFile(content: string, filename: string, mimeType: string, options: Omit<DownloadBlobOptions, "format"> & { format?: ExportFormat }) {
  return downloadBlob(new Blob([content], { type: mimeType }), filename, {
    format: options.format ?? "html",
    method: options.method,
    fail: options.fail
  });
}
