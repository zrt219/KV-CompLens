import { downloadBlob } from "../download/downloadBlob";
import { createExportFileNames } from "../fileNaming";
import type { ExportPacket } from "../types";
import { generateExportPackageZip } from "./generateExportPackageZip";

export async function downloadExportPackageZip(packet: ExportPacket, options: { failDownloads?: boolean } = {}) {
  const zip = await generateExportPackageZip(packet);
  return downloadBlob(zip, createExportFileNames(packet).zip, {
    format: "zip",
    method: "evidence-package-zip",
    fail: options.failDownloads
  });
}
