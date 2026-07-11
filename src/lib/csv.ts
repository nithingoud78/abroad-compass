// Tiny dependency-free CSV helpers. RFC-4180-ish: quotes, escaped quotes,
// commas inside quoted cells. Good enough for our small import/export flows.

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns?: (keyof T)[]): string {
  if (rows.length === 0) return "";
  const cols = (columns ?? (Object.keys(rows[0]) as (keyof T)[])) as string[];
  const head = cols.map(escape).join(",");
  const body = rows.map((r) => cols.map((c) => escape(r[c as keyof T])).join(",")).join("\n");
  return `${head}\n${body}`;
}

function escape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function fromCsv(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === "\n" && !inQuotes) {
      lines.push(cur);
      cur = "";
    } else if (ch === "\r") {
      /* skip */
    } else {
      cur += ch;
    }
  }
  if (cur.length) lines.push(cur);
  if (lines.length === 0) return [];

  const parseRow = (line: string): string[] => {
    const out: string[] = [];
    let cell = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = !q;
      } else if (ch === "," && !q) {
        out.push(cell);
        cell = "";
      } else cell += ch;
    }
    out.push(cell);
    return out;
  };

  const header = parseRow(lines[0]);
  return lines
    .slice(1)
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const cells = parseRow(line);
      const row: Record<string, string> = {};
      header.forEach((h, i) => {
        row[h] = cells[i] ?? "";
      });
      return row;
    });
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
