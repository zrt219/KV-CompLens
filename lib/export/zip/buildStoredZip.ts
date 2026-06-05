type ZipEntry = {
  name: string;
  bytes: Uint8Array;
};

export function buildStoredZip(entries: ZipEntry[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const crc = crc32(entry.bytes);
    const localHeader = concatUint8Arrays([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc),
      u32(entry.bytes.length), u32(entry.bytes.length), u16(nameBytes.length), u16(0), nameBytes
    ]);

    localParts.push(localHeader, entry.bytes);

    const centralHeader = concatUint8Arrays([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc),
      u32(entry.bytes.length), u32(entry.bytes.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + entry.bytes.length;
  }

  const centralDirectory = concatUint8Arrays(centralParts);
  const endRecord = concatUint8Arrays([
    u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
    u32(centralDirectory.length), u32(offset), u16(0)
  ]);

  return concatUint8Arrays([...localParts, centralDirectory, endRecord]);
}

export function toUint8Array(content: string | Uint8Array | ArrayBuffer | BlobPart) {
  if (typeof content === "string") return new TextEncoder().encode(content);
  if (content instanceof ArrayBuffer) return new Uint8Array(content);
  if (content instanceof Uint8Array) return content;
  return new TextEncoder().encode(String(content));
}

function concatUint8Arrays(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}

function u16(value: number) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function u32(value: number) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();
