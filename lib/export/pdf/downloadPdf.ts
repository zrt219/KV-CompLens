import { createExportFileNames } from "../fileNaming";
import { downloadBlob } from "../download/downloadBlob";
import type { ExportPacket } from "../types";
import { generatePdfBlob } from "./generatePdfBlob";

export async function downloadPdf(packet: ExportPacket, options: { fail?: boolean; failDownloads?: boolean } = {}) {
  const blob = await generatePdfBlob(packet, { fail: options.fail });
  return downloadBlob(blob, createExportFileNames(packet).pdf, { format: "pdf", method: "native-pdf", fail: options.failDownloads });
}
