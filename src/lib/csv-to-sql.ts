/**
 * CSV → inferred schema → PostgreSQL DDL.
 *
 * This is the ERP onboarding job in miniature: a client hands over a
 * spreadsheet, and the first real task is working out what the columns actually
 * are before anything can be modelled. Type inference, nullability, key
 * candidates and identifier sanitising are all the parts that bite in practice.
 *
 * Runs entirely client-side — nothing is uploaded anywhere.
 */

export type SqlType =
  | 'integer'
  | 'bigint'
  | 'numeric'
  | 'boolean'
  | 'date'
  | 'timestamptz'
  | 'uuid'
  | 'text';

export type ColumnProfile = {
  /** Header exactly as it appeared. */
  source: string;
  /** Sanitised, snake_cased, collision-free identifier. */
  name: string;
  type: SqlType;
  nullable: boolean;
  /** Every non-empty value distinct — a primary-key candidate. */
  unique: boolean;
  maxLength: number;
  blanks: number;
  /** Up to three real values, for the profile table. */
  samples: string[];
};

export type ParseResult = {
  columns: ColumnProfile[];
  rows: string[][];
  rowCount: number;
  delimiter: string;
  /** Rows whose field count didn't match the header. */
  ragged: number;
};

/* ------------------------------------------------------------------ */
/*  Parsing                                                            */
/* ------------------------------------------------------------------ */

/** Pick the delimiter that yields the most consistent field count. */
export const sniffDelimiter = (text: string): string => {
  const sample = text.split(/\r?\n/).slice(0, 8).filter(Boolean);
  if (!sample.length) return ',';

  let best = ',';
  let bestScore = -1;
  for (const d of [',', ';', '\t', '|']) {
    const counts = sample.map((line) => splitLine(line, d).length);
    const first = counts[0];
    if (first < 2) continue;
    // Reward many fields, punish rows that disagree about how many there are.
    const consistent = counts.filter((c) => c === first).length / counts.length;
    const score = first * consistent;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
};

/**
 * RFC4180-ish line splitter: honours double quotes and "" escapes.
 * Written by hand rather than pulling in a CSV dependency for one demo.
 */
export const splitLine = (line: string, delimiter: string): string[] => {
  const out: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(field.trim());
      field = '';
    } else {
      field += ch;
    }
  }
  out.push(field.trim());
  return out;
};

/* ------------------------------------------------------------------ */
/*  Inference                                                          */
/* ------------------------------------------------------------------ */

const INT_RE = /^[-+]?\d+$/;
const NUM_RE = /^[-+]?(\d+\.?\d*|\.\d+)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TS_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOOL = new Set(['true', 'false', 'yes', 'no', 't', 'f', 'y', 'n', '0', '1']);

const INT32_MAX = 2147483647;

/** Widest type that every supplied value satisfies. */
export const inferType = (values: string[]): SqlType => {
  const vals = values.filter((v) => v !== '');
  if (!vals.length) return 'text';

  if (vals.every((v) => UUID_RE.test(v))) return 'uuid';
  if (vals.every((v) => TS_RE.test(v))) return 'timestamptz';
  if (vals.every((v) => DATE_RE.test(v))) return 'date';

  if (vals.every((v) => INT_RE.test(v))) {
    // "0"/"1" columns are only boolean if that's *all* they contain, and the
    // caller has more context than we do — treat them as numbers, which is the
    // safer default for quantities and flags alike.
    const overflow = vals.some((v) => Math.abs(Number(v)) > INT32_MAX);
    return overflow ? 'bigint' : 'integer';
  }
  if (vals.every((v) => NUM_RE.test(v))) return 'numeric';

  // Bare 0/1 already matched INT_RE above, so this only catches word forms.
  if (vals.every((v) => BOOL.has(v.toLowerCase()) && !INT_RE.test(v))) return 'boolean';

  return 'text';
};

const RESERVED = new Set([
  'select', 'from', 'where', 'table', 'order', 'group', 'user', 'default',
  'primary', 'key', 'index', 'column', 'check', 'references', 'end', 'all',
]);

/** Header text → a safe, unique snake_case identifier. */
export const toIdentifier = (raw: string, taken: Set<string>): string => {
  let s = raw
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!s) s = 'column';
  if (/^\d/.test(s)) s = `c_${s}`; // identifiers can't lead with a digit
  if (RESERVED.has(s)) s = `${s}_col`;

  // De-duplicate: two headers that sanitise the same would otherwise collide.
  let name = s;
  let n = 2;
  while (taken.has(name)) name = `${s}_${n++}`;
  taken.add(name);
  return name;
};

export const parseCsv = (text: string): ParseResult => {
  // The BOM written as an escape, not the literal character - Excel prefixes
  // CSVs with a BOM, and a raw one in the source is invisible and lint-flagged.
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '');
  if (lines.length < 2) {
    throw new Error('Need a header row and at least one data row.');
  }

  const delimiter = sniffDelimiter(text);
  const headers = splitLine(lines[0], delimiter);
  const rawRows = lines.slice(1).map((l) => splitLine(l, delimiter));

  const ragged = rawRows.filter((r) => r.length !== headers.length).length;
  // Pad or trim so downstream indexing is always safe.
  const rows = rawRows.map((r) =>
    r.length === headers.length
      ? r
      : Array.from({ length: headers.length }, (_, i) => r[i] ?? ''),
  );

  const taken = new Set<string>();
  const columns = headers.map((header, i) => {
    const values = rows.map((r) => r[i] ?? '');
    const nonEmpty = values.filter((v) => v !== '');
    const distinct = new Set(nonEmpty);

    return {
      source: header,
      name: toIdentifier(header, taken),
      type: inferType(values),
      nullable: nonEmpty.length !== values.length,
      unique: nonEmpty.length > 0 && distinct.size === nonEmpty.length,
      maxLength: nonEmpty.reduce((m, v) => Math.max(m, v.length), 0),
      blanks: values.length - nonEmpty.length,
      samples: [...distinct].slice(0, 3),
    } satisfies ColumnProfile;
  });

  return { columns, rows, rowCount: rows.length, delimiter, ragged };
};

/* ------------------------------------------------------------------ */
/*  Generation                                                         */
/* ------------------------------------------------------------------ */

const quote = (v: string) => `'${v.replace(/'/g, "''")}'`;

const literal = (value: string, type: SqlType) => {
  if (value === '') return 'NULL';
  if (type === 'integer' || type === 'bigint' || type === 'numeric') return value;
  if (type === 'boolean') {
    return ['true', 'yes', 't', 'y', '1'].includes(value.toLowerCase()) ? 'TRUE' : 'FALSE';
  }
  return quote(value);
};

/** Column names that suggest an identifier rather than a coincidentally-distinct value. */
const KEYISH = /(^|_)(id|ref|code|sku|uuid|number|no|key|email)$/;

/**
 * Pick a primary key: a unique, non-null column that plausibly *is* a key.
 *
 * The name test matters. In a small sample every order date and every quantity
 * can be distinct by chance, and promoting one of those to the primary key
 * produces a schema that breaks on the second import. Only identifier-shaped
 * names, or failing that a text/uuid column, are eligible.
 */
export const pickPrimaryKey = (columns: ColumnProfile[]): ColumnProfile | null => {
  const candidates = columns.filter((c) => c.unique && !c.nullable);
  if (!candidates.length) return null;
  return (
    candidates.find((c) => c.name === 'id') ??
    candidates.find((c) => KEYISH.test(c.name)) ??
    candidates.find((c) => c.type === 'uuid') ??
    candidates.find((c) => c.type === 'text') ??
    null
  );
};

export const generateSql = (
  table: string,
  result: ParseResult,
  { insertLimit = 5 }: { insertLimit?: number } = {},
): string => {
  const tableName = toIdentifier(table || 'imported_table', new Set());
  const pk = pickPrimaryKey(result.columns);
  const pad = Math.max(...result.columns.map((c) => c.name.length));

  const defs = result.columns.map((c) => {
    const parts = [`  ${c.name.padEnd(pad)} ${c.type}`];
    if (c === pk) parts.push('PRIMARY KEY');
    else if (!c.nullable) parts.push('NOT NULL');
    return parts.join(' ');
  });

  /**
   * Distinct-in-sample is NOT a uniqueness constraint, and emitting `UNIQUE`
   * off the back of it is how you ship a schema that rejects the second
   * import. Five rows of order dates being distinct says nothing. They're
   * reported as candidates instead, for a human to decide on.
   */
  const uniqueCandidates = result.columns.filter((c) => c !== pk && c.unique && !c.nullable);

  const lines = [
    `-- Inferred from ${result.rowCount} row${result.rowCount === 1 ? '' : 's'}`,
    `-- Delimiter: ${result.delimiter === '\t' ? '\\t' : result.delimiter}`,
    ...(pk ? [] : ['-- No identifier-shaped unique column found — add a surrogate key.']),
    `CREATE TABLE ${tableName} (`,
    defs.join(',\n'),
    ');',
    '',
    ...(uniqueCandidates.length
      ? [
          `-- Distinct across all ${result.rowCount} sampled rows, but that's a sample, not a`,
          `-- guarantee — confirm before adding UNIQUE: ${uniqueCandidates.map((c) => c.name).join(', ')}`,
          '',
        ]
      : []),
  ];

  const shown = result.rows.slice(0, insertLimit);
  if (shown.length) {
    lines.push(
      `INSERT INTO ${tableName} (${result.columns.map((c) => c.name).join(', ')}) VALUES`,
    );
    lines.push(
      shown
        .map(
          (row) =>
            `  (${result.columns.map((c, i) => literal(row[i] ?? '', c.type)).join(', ')})`,
        )
        .join(',\n') + ';',
    );
    if (result.rowCount > shown.length) {
      lines.push('', `-- … ${result.rowCount - shown.length} more rows omitted`);
    }
  }

  return lines.join('\n');
};

/** Preloaded so the panel does something before anyone finds a file. */
export const SAMPLE_CSV = `order_ref,Customer Name,order date,qty,unit price,is paid,notes
AWX-1001,Sample Industries,2026-03-04,120,44.50,yes,Bulk candle order
AWX-1002,Northwind Retail,2026-03-06,40,51.00,no,
AWX-1003,Sample Industries,2026-03-11,8,120.75,yes,Rush
AWX-1004,Harbour Traders,2026-03-14,250,39.90,no,Quarterly restock
AWX-1005,Northwind Retail,2026-04-02,60,51.00,yes,`;
