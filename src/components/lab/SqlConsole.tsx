import { useState } from 'react';
import { Database, Play, TableProperties } from 'lucide-react';

import { runQuery, SqlError, TABLES, SAMPLE_QUERIES, type QueryResult } from '@/lib/sql-engine';
import { cn } from '@/lib/utils';

/**
 * A read-only SQL console over this site's own content.
 *
 * Same contract as the API console and the terminal filesystem: the relations
 * are generated from the content modules, so a result here can never disagree
 * with what the page renders. The latency is not simulated — the millisecond
 * figure under the results is measured, and it is genuinely sub-millisecond
 * because the whole dataset is already in memory.
 *
 * The parser is a real subset (SELECT / WHERE / AND / OR / LIKE / GROUP BY /
 * ORDER BY / LIMIT / COUNT). Anything outside it raises a Postgres-shaped
 * error instead of quietly returning something wrong.
 */
export const SqlConsole = () => {
  const [sql, setSql] = useState(SAMPLE_QUERIES[0]);
  // Lazy initialiser, not an effect: the first query is pure and synchronous,
  // so the panel can render its result on the very first paint instead of
  // flashing an empty slate.
  const [result, setResult] = useState<QueryResult | null>(() => {
    try {
      return runQuery(SAMPLE_QUERIES[0]);
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const [openTable, setOpenTable] = useState<string | null>('projects');

  const execute = (query: string = sql) => {
    try {
      setResult(runQuery(query));
      setError(null);
    } catch (e) {
      setResult(null);
      setError(
        e instanceof SqlError
          ? { message: e.message, hint: e.hint }
          : { message: e instanceof Error ? e.message : 'unknown error' },
      );
    }
  };

  const run = (query: string) => {
    setSql(query);
    execute(query);
  };

  return (
    <div className="surface overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        {/* ---------------- Schema ---------------- */}
        <aside className="border-b border-border/70 bg-elevated/40 p-4 lg:border-b-0 lg:border-r">
          <p className="mb-3 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            <Database className="h-3.5 w-3.5 text-primary" />
            Schema
          </p>

          <ul className="space-y-1">
            {TABLES.map((t) => (
              <li key={t.name}>
                <button
                  onClick={() => setOpenTable(openTable === t.name ? null : t.name)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-primary/10"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <TableProperties className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    <span className="truncate font-mono text-xs">{t.name}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[0.6rem] text-muted-foreground">
                    {t.rows.length}
                  </span>
                </button>

                {openTable === t.name && (
                  <ul className="mb-2 ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                    {t.columns.map((c) => (
                      <li
                        key={c.name}
                        className="flex items-baseline justify-between gap-2 font-mono text-[0.65rem]"
                      >
                        <button
                          onClick={() => run(`SELECT ${c.name} FROM ${t.name} LIMIT 10`)}
                          className="truncate text-muted-foreground transition-colors hover:text-primary"
                        >
                          {c.name}
                        </button>
                        <span className="shrink-0 text-muted-foreground/40">{c.type}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-4 border-t border-border/70 pt-3 text-[0.7rem] leading-relaxed text-muted-foreground/70">
            Generated from the same content modules the page renders — the tables
            can&apos;t drift from the site.
          </p>
        </aside>

        {/* ---------------- Console ---------------- */}
        <div className="min-w-0 p-4 sm:p-5">
          <label htmlFor="sql-input" className="sr-only">
            SQL query
          </label>
          <textarea
            id="sql-input"
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => {
              // Enter runs; Shift+Enter makes a newline. Ctrl/Cmd+Enter runs too,
              // because that's what every SQL client trains you to press.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                execute();
              }
            }}
            spellCheck={false}
            rows={3}
            className="w-full resize-y rounded-xl border border-border bg-background p-3 font-mono text-xs leading-relaxed text-foreground outline-none transition-colors focus:border-primary/50 sm:text-[0.8rem]"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => execute()} className="btn-primary px-4 py-2 text-sm">
              <Play className="h-3.5 w-3.5" />
              Run
            </button>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground/60">
              Enter to run · Shift+Enter for newline
            </span>
          </div>

          {/* Sample queries */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {SAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => run(q)}
                title={q}
                className={cn(
                  'max-w-full truncate rounded-full border px-2.5 py-1 font-mono text-[0.62rem] transition-colors',
                  sql === q
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                {q.length > 46 ? `${q.slice(0, 46)}…` : q}
              </button>
            ))}
          </div>

          {/* ---------------- Output ---------------- */}
          <div className="mt-4">
            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/[0.07] p-3.5 font-mono text-xs">
                <p className="text-destructive">ERROR: {error.message}</p>
                {error.hint && <p className="mt-1.5 text-muted-foreground">HINT: {error.hint}</p>}
              </div>
            )}

            {result && !error && (
              <>
                {/* Wide result sets scroll inside this pane, never the page. */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-max border-collapse text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border bg-elevated/60">
                        {result.columns.map((c) => (
                          <th
                            key={c}
                            className="whitespace-nowrap px-3 py-2 font-medium text-primary"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-border/50 transition-colors last:border-0 hover:bg-primary/[0.04]"
                        >
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="max-w-[22rem] truncate px-3 py-1.5 text-muted-foreground"
                              title={cell === null ? 'NULL' : String(cell)}
                            >
                              {cell === null ? (
                                <span className="text-muted-foreground/40">NULL</span>
                              ) : typeof cell === 'boolean' ? (
                                <span className={cell ? 'text-primary' : 'text-muted-foreground/60'}>
                                  {String(cell)}
                                </span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {result.rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={result.columns.length}
                            className="px-3 py-4 text-center text-muted-foreground/60"
                          >
                            (0 rows)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="mt-2 font-mono text-[0.62rem] text-muted-foreground/60">
                  {result.notice} · {result.ms.toFixed(2)} ms
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
