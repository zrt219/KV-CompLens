import { createExportFileNames } from "../fileNaming";
import { downloadBlob } from "../download/downloadBlob";
import type { ExportPacket } from "../types";
import { generateDocxBlob } from "./generateDocxBlob";

export async function downloadDocx(packet: ExportPacket, options: { fail?: boolean; failDownloads?: boolean } = {}) {
  const blob = await generateDocxBlob(packet, { fail: options.fail });
  return downloadBlob(blob, createExportFileNames(packet).docx, { format: "docx", method: "native-docx", fail: options.failDownloads });
}
