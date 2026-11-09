// Pure helpers (no DB dependency) used to bring an OLD database up to the current schema.
export interface ParsedTable {
  name: string;
  create: string;                       // full CREATE TABLE IF NOT EXISTS statement
  createNoFk: string;                   // same statement without FOREIGN KEY lines (fallback)
  columns: { name: string; def: string }[]; // non-primary-key column definitions
}

export function splitSql(sql: string): string[] {
  return sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')
    .split(';').map(s => s.trim()).filter(Boolean);
}

export function parseTables(sql: string): ParsedTable[] {
  const out: ParsedTable[] = [];
  for (const st of splitSql(sql)) {
    if (!/^CREATE TABLE IF NOT EXISTS/i.test(st)) continue;
    const name = /`([^`]+)`/.exec(st)?.[1];
    if (!name) continue;
    const lines = st.split('\n');
    const columns: { name: string; def: string }[] = [];
    for (const line of lines) {
      const m = /^\s+`([^`]+)`\s+(.*?),?\s*$/.exec(line);
      if (!m) continue;
      if (/AUTO_INCREMENT|PRIMARY KEY/i.test(m[2])) continue;
      columns.push({ name: m[1], def: m[2] });
    }
    // drop FOREIGN KEY lines, and fix the comma left on the line before the closing paren
    const kept = lines.filter(l => !/^\s*FOREIGN KEY/i.test(l));
    const createNoFk = kept.join('\n').replace(/,(\s*\n\s*\)\s*ENGINE)/i, '$1');
    out.push({ name, create: st, createNoFk, columns });
  }
  return out;
}

export function missingColumns(t: ParsedTable, have: Set<string>) {
  return t.columns.filter(c => !have.has(c.name.toLowerCase()));
}
