import { buildStoredZip } from "../zip/buildStoredZip";
import type { ExportPacket } from "../types";
import { generateDocxDocument } from "./generateDocxDocument";

export async function generateDocxBlob(packet: ExportPacket, options: { fail?: boolean } = {}) {
  if (options.fail) {
    throw new Error("DOCX renderer failed by simulation flag.");
  }

  return new Blob([generateDocxBytes(packet)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

export function generateDocxBytes(packet: ExportPacket) {
  const encoder = new TextEncoder();
  return buildStoredZip([
    { name: "[Content_Types].xml", bytes: encoder.encode(contentTypesXml) },
    { name: "_rels/.rels", bytes: encoder.encode(rootRelsXml) },
    { name: "word/document.xml", bytes: encoder.encode(generateDocxDocument(packet)) },
    { name: "word/styles.xml", bytes: encoder.encode(stylesXml) }
  ]);
}

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>
</w:styles>`;
