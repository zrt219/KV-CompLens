export function sanitizeInline(value: unknown) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, (char) => {
      const replacements: Record<string, string> = {
        "\t": " ",
        "\n": " ",
        "\r": " ",
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201C": "\"",
        "\u201D": "\"",
        "\u2022": "-",
        "\u2026": "..."
      };
      return replacements[char] ?? "?";
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeMultiline(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(sanitizeInline)
    .join("\n");
}

export function escapeHtml(value: unknown) {
  return sanitizeInline(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeCsv(value: unknown) {
  const normalized = sanitizeInline(value);
  return /[",\n]/.test(normalized) ? `"${normalized.replace(/"/g, "\"\"")}"` : normalized;
}

export function assertNoPrivateReasoning(content: string) {
  if (/agent reasoning trace|chain-of-thought/i.test(content)) {
    throw new Error("Export content contains restricted reasoning trace wording.");
  }
}
