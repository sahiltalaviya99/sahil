import { projects } from '@/content/projects';
import { experience } from '@/content/experience';
import { coreStack, skillGroups, levelValue } from '@/content/skills';

/**
 * A small SQL engine over this site's own content.
 *
 * Same rule as the terminal filesystem and the API console: the tables are
 * *generated* from the content modules, never hand-authored. Add a project to
 * content/projects.ts and it is queryable here immediately. A console whose
 * data drifts from the page it sits on is worse than no console.
 *
 * Supports a real subset — SELECT (columns, *, COUNT(*)), FROM, WHERE with
 * AND/OR, LIKE, GROUP BY, ORDER BY and LIMIT. It is deliberately not a full
 * parser: no JOINs, no subqueries, no parenthesised predicates. Anything
 * outside the subset returns a Postgres-shaped error rather than pretending.
 */

export type ColType = 'text' | 'int' | 'bool';
export type Column = { name: string; type: ColType };
export type Value = string | number | boolean | null;
export type Row = Record<string, Value>;
export type Table = { name: string; note: string; columns: Column[]; rows: Row[] };

/** Flatten the grouped skills into one queryable relation. */
const skillRows: Row[] = [
  ...coreStack.map((s) => ({
    name: s.name,
    group: 'core stack',
    level: s.level,
    score: levelValue[s.level],
  })),
  ...skillGroups.flatMap((g) =>
    g.skills.map((s) => ({
      name: s.name,
      group: g.label,
      level: s.level,
      score: levelValue[s.level],
    })),
  ),
];

export const TABLES: Table[] = [
  {
    name: 'projects',
    note: 'Every project on this site, ERP systems included.',
    columns: [
      { name: 'id', type: 'text' },
      { name: 'title', type: 'text' },
      { name: 'client', type: 'text' },
      { name: 'year', type: 'int' },
      { name: 'kind', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'featured', type: 'bool' },
      { name: 'has_demo', type: 'bool' },
      { name: 'stack', type: 'text' },
      { name: 'outcome', type: 'text' },
    ],
    rows: projects.map((p) => ({
      id: p.id,
      title: p.title,
      client: p.client ?? null,
      year: Number(p.year) || 0,
      kind: p.kind,
      status: p.status,
      featured: !!p.featured,
      // The ERPs genuinely have no public URL — this column tells the truth
      // about that rather than hiding it.
      has_demo: !!p.demo,
      stack: p.tags.join(', '),
      outcome: p.outcome,
    })),
  },
  {
    name: 'experience',
    note: 'Roles and education, most recent first.',
    columns: [
      { name: 'id', type: 'text' },
      { name: 'title', type: 'text' },
      { name: 'org', type: 'text' },
      { name: 'period', type: 'text' },
      { name: 'type', type: 'text' },
      { name: 'current', type: 'bool' },
    ],
    rows: experience.map((e) => ({
      id: e.id,
      title: e.title,
      org: e.org,
      period: e.period,
      type: e.type,
      current: !!e.current,
    })),
  },
  {
    name: 'skills',
    note: 'Flattened from the grouped skill data.',
    columns: [
      { name: 'name', type: 'text' },
      { name: 'group', type: 'text' },
      { name: 'level', type: 'text' },
      { name: 'score', type: 'int' },
    ],
    rows: skillRows,
  },
];

export type QueryResult = {
  columns: string[];
  rows: Value[][];
  /** Milliseconds, actually measured. */
  ms: number;
  notice: string;
};

export class SqlError extends Error {
  hint?: string;
  constructor(message: string, hint?: string) {
    super(message);
    this.name = 'SqlError';
    this.hint = hint;
  }
}

type Condition = { col: string; op: string; value: Value; join: 'AND' | 'OR' };

const OPS = ['>=', '<=', '!=', '<>', '=', '>', '<'];

/** Strip a quoted literal, or coerce a bare token to number/bool/null. */
const parseLiteral = (raw: string): Value => {
  const t = raw.trim();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  const low = t.toLowerCase();
  if (low === 'true') return true;
  if (low === 'false') return false;
  if (low === 'null') return null;
  const n = Number(t);
  if (!Number.isNaN(n) && t !== '') return n;
  return t;
};

/** SQL LIKE → RegExp. % is any run, _ is any single character. */
const likeToRegExp = (pattern: string) => {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace(/%/g, '.*').replace(/_/g, '.')}$`, 'i');
};

const compare = (left: Value, op: string, right: Value): boolean => {
  if (op === 'LIKE') return likeToRegExp(String(right ?? '')).test(String(left ?? ''));
  if (op === '=') return String(left).toLowerCase() === String(right).toLowerCase();
  if (op === '!=' || op === '<>') return String(left).toLowerCase() !== String(right).toLowerCase();

  const ln = typeof left === 'number' ? left : Number(left);
  const rn = typeof right === 'number' ? right : Number(right);
  if (Number.isNaN(ln) || Number.isNaN(rn)) return false;
  if (op === '>') return ln > rn;
  if (op === '<') return ln < rn;
  if (op === '>=') return ln >= rn;
  if (op === '<=') return ln <= rn;
  return false;
};

/** Find a top-level keyword's index, case-insensitively, outside quotes. */
const clauseIndex = (sql: string, keyword: string) => {
  const re = new RegExp(`\\b${keyword}\\b`, 'i');
  const m = re.exec(sql);
  return m ? m.index : -1;
};

export const runQuery = (input: string): QueryResult => {
  const started = performance.now();
  const sql = input.trim().replace(/;+\s*$/, '');
  if (!sql) throw new SqlError('empty query');

  // A couple of conveniences that behave like psql rather than failing.
  if (/^\s*(show\s+tables|\\dt)\s*$/i.test(sql)) {
    return {
      columns: ['table', 'rows', 'note'],
      rows: TABLES.map((t) => [t.name, t.rows.length, t.note]),
      ms: performance.now() - started,
      notice: `${TABLES.length} relations`,
    };
  }

  if (!/^\s*select\b/i.test(sql)) {
    throw new SqlError(
      'only SELECT is supported',
      'This console is read-only. Try: SELECT * FROM projects LIMIT 5',
    );
  }

  // --- split into clauses -------------------------------------------------
  const iFrom = clauseIndex(sql, 'FROM');
  if (iFrom < 0) throw new SqlError('syntax error: expected FROM');

  const selectList = sql.slice('select'.length, iFrom).trim();
  let rest = sql.slice(iFrom + 'from'.length).trim();

  const cut = (keyword: string) => {
    const i = clauseIndex(rest, keyword);
    if (i < 0) return null;
    const tail = rest.slice(i + keyword.length).trim();
    rest = rest.slice(0, i).trim();
    return tail;
  };

  // Cut from the back so each keyword's own text isn't swallowed by a later one.
  const limitPart = cut('LIMIT');
  const orderPart = cut('ORDER BY');
  const groupPart = cut('GROUP BY');
  const wherePart = cut('WHERE');
  const tableName = rest.trim().replace(/["']/g, '');

  const table = TABLES.find((t) => t.name.toLowerCase() === tableName.toLowerCase());
  if (!table) {
    throw new SqlError(
      `relation "${tableName}" does not exist`,
      `Available: ${TABLES.map((t) => t.name).join(', ')}`,
    );
  }

  const colNames = table.columns.map((c) => c.name);
  const requireCol = (name: string) => {
    const found = colNames.find((c) => c.toLowerCase() === name.toLowerCase());
    if (!found) {
      throw new SqlError(
        `column "${name}" does not exist`,
        `${table.name} has: ${colNames.join(', ')}`,
      );
    }
    return found;
  };

  // --- WHERE --------------------------------------------------------------
  let rows = table.rows;
  if (wherePart) {
    const conditions: Condition[] = [];
    // No parenthesised predicates — split on top-level AND / OR only.
    const parts = wherePart.split(/\s+(AND|OR)\s+/i);
    for (let i = 0; i < parts.length; i += 2) {
      const clause = parts[i].trim();
      const join = (i === 0 ? 'AND' : parts[i - 1].toUpperCase()) as 'AND' | 'OR';

      const likeMatch = /^(\S+)\s+like\s+(.+)$/i.exec(clause);
      if (likeMatch) {
        conditions.push({
          col: requireCol(likeMatch[1]),
          op: 'LIKE',
          value: parseLiteral(likeMatch[2]),
          join,
        });
        continue;
      }

      const op = OPS.find((o) => clause.includes(o));
      if (!op) throw new SqlError(`syntax error in WHERE near "${clause}"`);
      const [rawCol, ...rawVal] = clause.split(op);
      conditions.push({
        col: requireCol(rawCol.trim()),
        op,
        value: parseLiteral(rawVal.join(op).trim()),
        join,
      });
    }

    rows = rows.filter((row) =>
      conditions.reduce<boolean>((acc, c, i) => {
        const hit = compare(row[c.col], c.op, c.value);
        if (i === 0) return hit;
        return c.join === 'OR' ? acc || hit : acc && hit;
      }, true),
    );
  }

  // --- SELECT list --------------------------------------------------------
  const wantsCount = /count\s*\(\s*\*\s*\)/i.test(selectList);
  const plainCols = selectList
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !/count\s*\(/i.test(s));

  // --- GROUP BY -----------------------------------------------------------
  if (groupPart) {
    const groupCol = requireCol(groupPart.trim());
    const buckets = new Map<string, number>();
    for (const row of rows) {
      const key = String(row[groupCol] ?? '∅');
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    let out = [...buckets.entries()].map(([k, n]) => [k, n] as Value[]);

    if (orderPart) {
      const desc = /\bdesc\b/i.test(orderPart);
      const byCount = /count/i.test(orderPart);
      out.sort((a, b) => {
        const x = byCount ? (a[1] as number) : String(a[0]);
        const y = byCount ? (b[1] as number) : String(b[0]);
        const cmp = typeof x === 'number' ? (x as number) - (y as number) : String(x).localeCompare(String(y));
        return desc ? -cmp : cmp;
      });
    }
    if (limitPart) out = out.slice(0, Math.max(0, parseInt(limitPart, 10) || 0));

    return {
      columns: [groupCol, 'count'],
      rows: out,
      ms: performance.now() - started,
      notice: `${out.length} group${out.length === 1 ? '' : 's'}`,
    };
  }

  // --- COUNT(*) with no grouping -----------------------------------------
  if (wantsCount && plainCols.length === 0) {
    return {
      columns: ['count'],
      rows: [[rows.length]],
      ms: performance.now() - started,
      notice: '1 row',
    };
  }

  // --- ORDER BY -----------------------------------------------------------
  if (orderPart) {
    const desc = /\bdesc\b/i.test(orderPart);
    const orderCol = requireCol(orderPart.replace(/\b(asc|desc)\b/i, '').trim());
    rows = [...rows].sort((a, b) => {
      const x = a[orderCol];
      const y = b[orderCol];
      const cmp =
        typeof x === 'number' && typeof y === 'number'
          ? x - y
          : String(x ?? '').localeCompare(String(y ?? ''));
      return desc ? -cmp : cmp;
    });
  }

  // --- projection + LIMIT -------------------------------------------------
  const outCols = selectList.trim() === '*' ? colNames : plainCols.map(requireCol);
  if (outCols.length === 0) {
    throw new SqlError('syntax error: no columns selected', `Try: SELECT * FROM ${table.name}`);
  }
  let projected = rows.map((r) => outCols.map((c) => r[c]));
  if (limitPart) {
    const n = parseInt(limitPart, 10);
    if (Number.isNaN(n)) throw new SqlError(`syntax error: LIMIT expects a number`);
    projected = projected.slice(0, Math.max(0, n));
  }

  return {
    columns: outCols,
    rows: projected,
    ms: performance.now() - started,
    notice: `${projected.length} row${projected.length === 1 ? '' : 's'}`,
  };
};

/** Shown as clickable chips — each one runs and returns something interesting. */
export const SAMPLE_QUERIES = [
  "SELECT title, client, year FROM projects WHERE kind = 'erp'",
  'SELECT kind, COUNT(*) FROM projects GROUP BY kind ORDER BY count DESC',
  'SELECT title, status FROM projects WHERE has_demo = false',
  "SELECT name, level, score FROM skills WHERE score >= 78 ORDER BY score DESC",
  "SELECT title, org FROM experience WHERE type = 'work'",
  "SELECT * FROM projects WHERE stack LIKE '%PostgreSQL%'",
  'SHOW TABLES',
];
