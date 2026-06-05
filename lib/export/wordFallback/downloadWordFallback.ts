import { createExportFileNames } from "../fileNaming";
import { downloadTextFile } from "../download/downloadBlob";
import type { ExportPacket, ExportResult } from "../types";
import { renderRtf } from "./renderRtf";
import { renderWordHtml } from "./renderWordHtml";

export async function downloadWordFallback(packet: ExportPacket, options: { failDownloads?: boolean; failWordHtml?: boolean; failRtf?: boolean } = {}): Promise<ExportResult> {
  const names = createExportFileNames(packet);

  if (!options.failWordHtml) {
    const result = await downloadTextFile(renderWordHtml(packet), names.docx.replace(/\.docx$/, ".doc"), "application/msword;charset=utf-8", {
      format: "docx",
      method: "word-compatible-html-fallback",
      fail: options.failDownloads
    });
    if (result.ok) return result;
  }

  if (!options.failRtf) {
    return downloadTextFile(renderRtf(packet), names.rtf, "application/rtf;charset=utf-8", {
      format: "rtf",
      method: "rtf-word-fallback",
      fail: options.failDownloads
    });
  }

  return {
    ok: false,
    format: "rtf",
    method: "word-fallback",
    error: "Word-compatible HTML and RTF fallback generation failed."
  };
}
