import { useMemo, useRef, useState } from 'react';
import { Check, Copy, FileUp, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { SAMPLE_CSV, generateSql, parseCsv, pickPrimaryKey } from '@/lib/csv-to-sql';
import { cn } from '@/lib/utils';

/**
 * CSV in, inferred PostgreSQL schema out.
 *
 * This is the ERP onboarding job in miniature: a client hands over a
 * spreadsheet and the first real task is working out what the columns actually
 * are. Type inference, nullability, key candidates and identifier sanitising
 * are the parts that bite in practice, so they're what this shows.
 *
 * Everything runs in the browser — the file never leaves the machine.
 */

const TYPE_TONE: Record<string, string> = {
  integer: 'text-primary',
  bigint: 'text-primary',
  numeric: 'text-primary',
  boolean: 'text-signal',
  date: 'text-signal',
  timestamptz: 'text-signal',
  uuid: 'text-signal',
  text: 'text-muted-foreground',
};

export const CsvToSql = () => {
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [tableName, setTableName] = useState('orders');
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => {
    try {
      return { result: parseCsv(csv), error: null as string | null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : 'Could not parse that.' };
    }
  }, [csv]);

  const sql = useMemo(
    () => (parsed.result ? generateSql(tableName, parsed.result) : ''),
    [parsed.result, tableName],
  );

  const pk = parsed.result ? pickPrimaryKey(parsed.result.columns) : null;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    // 2MB is generous for a schema sample and keeps the main thread responsive.
    if (file.size > 2_000_000) {
      toast.error('That file is over 2MB — a few hundred rows is plenty to infer from.');
      return;
    }
    setCsv(await file.text());
    setTableName(file.name.replace(/\.[^.]+$/, '') || 'imported_table');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      toast.success('SQL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Clipboard is blocked — select the SQL and copy it manually.');
    }
  };

  return (
    <div className="surface overflow-hidden">
      {/* Input */}
      <div className="border-b border-border/70 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            Table
          </label>
          <input
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            spellCheck={false}
            aria-label="Table name"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs outline-none transition-colors focus:border-primary/50 sm:max-w-[14rem]"
          />

          <button onClick={() => fileRef.current?.click()} className="btn-ghost px-3 py-1.5 text-xs">
            <FileUp className="h-3 w-3" />
            Load a CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="hidden"
          />
          <button
            onClick={() => {
              setCsv(SAMPLE_CSV);
              setTableName('orders');
            }}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          spellCheck={false}
          rows={6}
          aria-label="CSV input"
          className="w-full resize-y rounded-xl border border-border bg-background p-3 font-mono text-[0.7rem] leading-relaxed outline-none transition-colors focus:border-primary/50"
        />

        <p className="mt-2 font-mono text-[0.6rem] text-muted-foreground/50">
          Parsed in your browser — nothing is uploaded.
        </p>
      </div>

      {parsed.error && (
        <p className="border-b border-destructive/40 bg-destructive/[0.07] px-4 py-3 font-mono text-xs text-destructive sm:px-5">
          {parsed.error}
        </p>
      )}

      {parsed.result && (
        <>
          {/* Column profile */}
          <div className="p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground/60">
              <span className="text-primary/80">
                {parsed.result.columns.length} columns · {parsed.result.rowCount} rows
              </span>
              <span>
                delimiter “{parsed.result.delimiter === '\t' ? '\\t' : parsed.result.delimiter}”
              </span>
              {parsed.result.ragged > 0 && (
                <span className="text-destructive">
                  {parsed.result.ragged} ragged row
                  {parsed.result.ragged === 1 ? '' : 's'} padded
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-max border-collapse text-left font-mono text-[0.68rem]">
                <thead>
                  <tr className="border-b border-border bg-elevated/60 text-muted-foreground">
                    <th className="px-3 py-2 font-medium">source header</th>
                    <th className="px-3 py-2 font-medium">column</th>
                    <th className="px-3 py-2 font-medium">type</th>
                    <th className="px-3 py-2 font-medium">null</th>
                    <th className="px-3 py-2 font-medium">distinct</th>
                    <th className="px-3 py-2 font-medium">sample</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.result.columns.map((c) => (
                    <tr key={c.name} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-1.5 text-muted-foreground/60">{c.source}</td>
                      <td className="px-3 py-1.5">
                        <span className="text-foreground">{c.name}</span>
                        {c === pk && (
                          <span className="ml-1.5 text-[0.58rem] text-signal">PK</span>
                        )}
                      </td>
                      <td className={cn('px-3 py-1.5', TYPE_TONE[c.type])}>{c.type}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {c.nullable ? `${c.blanks} blank` : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {c.unique ? 'all' : '—'}
                      </td>
                      <td
                        className="max-w-[14rem] truncate px-3 py-1.5 text-muted-foreground/70"
                        title={c.samples.join(' · ')}
                      >
                        {c.samples.join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generated DDL */}
          <div className="border-t border-border/70 p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                Generated PostgreSQL
              </p>
              <button onClick={copy} className="btn-ghost px-3 py-1.5 text-xs">
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-primary" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <pre className="max-h-80 overflow-auto rounded-xl border border-border bg-background p-3.5 font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
              {sql}
            </pre>

            <p className="mt-3 text-[0.7rem] leading-relaxed text-muted-foreground/60">
              Distinct-in-sample is reported but never emitted as a <code>UNIQUE</code>{' '}
              constraint — five rows of order dates being distinct says nothing, and asserting
              it is how you ship a schema that rejects the second import.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
