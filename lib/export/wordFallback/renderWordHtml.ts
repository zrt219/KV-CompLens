import { renderReportHtml } from "../html/renderReportHtml";
import type { ExportPacket } from "../types";

export function renderWordHtml(packet: ExportPacket) {
  return renderReportHtml(packet).replace("<html lang=\"en\">", "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>");
}
