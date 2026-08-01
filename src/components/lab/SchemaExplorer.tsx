import { useMemo, useState } from 'react';
import { KeyRound, Link2, Table2 } from 'lucide-react';

import { erpSchema, relationships, DOMAIN_LABELS, type SchemaTable } from '@/content/erp-schema';
import { cn } from '@/lib/utils';

/**
 * The hospital ERP's data model, made inspectable.
 *
 * The ERPs have no public URL and no screenshots, so this answers "what did you
 * actually build?" with the thing that actually matters for a business system:
 * the schema. Pick a table, see its columns, and every relationship it takes
 * part in lights up in both directions.
 *
 * Structure is representative; every value is invented, same rule as
 * content/erp-demo.ts. Labelled as such in the header and the footer.
 */
export const SchemaExplorer = () => {
  const [selected, setSelected] = useState('appointments');
  const table = erpSchema.find((t) => t.name === selected) ?? erpSchema[0];

  /** Both directions: what this table points at, and what points back at it. */
  const links = useMemo(() => {
    const outgoing = relationships.filter((r) => r.from === selected);
    const incoming = relationships.filter((r) => r.to === selected);
    return { outgoing, incoming, related: new Set([...outgoing.map((r) => r.to), ...incoming.map((r) => r.from)]) };
  }, [selected]);

  const grouped = useMemo(() => {
    const map = new Map<SchemaTable['domain'], SchemaTable[]>();
    for (const t of erpSchema) {
      const list = map.get(t.domain);
      if (list) list.push(t);
      else map.set(t.domain, [t]);
    }
    return [...map.entries()];
  }, []);

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-elevated/40 px-4 py-3">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          Adorn Hospital ERP · data model
        </p>
        <span className="chip-primary">Sample data</span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        {/* -------- Table index -------- */}
        <aside className="border-b border-border/70 bg-elevated/20 p-3 lg:border-b-0 lg:border-r">
          {grouped.map(([domain, tables]) => (
            <div key={domain} className="mb-3 last:mb-0">
              <p className="px-2 pb-1.5 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground/50">
                {DOMAIN_LABELS[domain]}
              </p>
              <ul className="space-y-0.5">
                {tables.map((t) => {
                  const isActive = t.name === selected;
                  const isRelated = links.related.has(t.name);
                  return (
                    <li key={t.name}>
                      <button
                        onClick={() => setSelected(t.name)}
                        className={cn(
                          'flex min-h-10 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-xs transition-colors',
                          isActive
                            ? 'bg-primary/15 text-primary'
                            : isRelated
                              // Related tables stay legible while the rest recede —
                              // this is the relationship view, not decoration.
                              ? 'text-foreground hover:bg-primary/5'
                              : 'text-muted-foreground/50 hover:bg-primary/5 hover:text-foreground',
                        )}
                      >
                        <Table2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{t.name}</span>
                        {isRelated && !isActive && (
                          <Link2 className="ml-auto h-3 w-3 shrink-0 text-primary/60" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* -------- Detail -------- */}
        <div className="min-w-0 p-4 sm:p-5">
          <h3 className="font-display text-xl font-bold tracking-tight">
            {table.label}
            <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
              {table.name}
            </span>
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {table.summary}
          </p>
          <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground/50">
            {table.scale}
          </p>

          {/* Columns */}
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-max border-collapse text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border bg-elevated/60 text-muted-foreground">
                  <th className="px-3 py-2 font-medium">column</th>
                  <th className="px-3 py-2 font-medium">type</th>
                  <th className="px-3 py-2 font-medium">notes</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((c) => (
                  <tr key={c.name} className="border-b border-border/50 last:border-0">
                    <td className="whitespace-nowrap px-3 py-1.5">
                      <span className="flex items-center gap-1.5">
                        {c.kind === 'pk' && <KeyRound className="h-3 w-3 shrink-0 text-signal" />}
                        {c.kind === 'fk' && <Link2 className="h-3 w-3 shrink-0 text-primary" />}
                        <span className={c.kind === 'plain' ? 'ml-[1.125rem] text-foreground' : 'text-foreground'}>
                          {c.name}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-primary/80">
                      {c.type}
                      {c.nullable && <span className="ml-1 text-muted-foreground/50">?</span>}
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {c.references ? (
                        <button
                          onClick={() => setSelected(c.references!.split('.')[0])}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          → {c.references}
                        </button>
                      ) : (
                        (c.note ?? '')
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Relationships, both directions */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground/60">
                References ({links.outgoing.length})
              </p>
              {links.outgoing.length ? (
                <ul className="space-y-1">
                  {links.outgoing.map((r) => (
                    <li key={`${r.fromColumn}-${r.to}`}>
                      <button
                        onClick={() => setSelected(r.to)}
                        className="font-mono text-[0.68rem] text-muted-foreground transition-colors hover:text-primary"
                      >
                        {r.fromColumn} <span className="text-primary/60">→</span> {r.to}.{r.toColumn}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-mono text-[0.68rem] text-muted-foreground/40">none</p>
              )}
            </div>

            <div>
              <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground/60">
                Referenced by ({links.incoming.length})
              </p>
              {links.incoming.length ? (
                <ul className="space-y-1">
                  {links.incoming.map((r) => (
                    <li key={`${r.from}-${r.fromColumn}`}>
                      <button
                        onClick={() => setSelected(r.from)}
                        className="font-mono text-[0.68rem] text-muted-foreground transition-colors hover:text-primary"
                      >
                        {r.from}.{r.fromColumn} <span className="text-primary/60">→</span>{' '}
                        {r.toColumn}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-mono text-[0.68rem] text-muted-foreground/40">none</p>
              )}
            </div>
          </div>

          <p className="mt-6 border-t border-border/60 pt-3 text-[0.7rem] leading-relaxed text-muted-foreground/60">
            Structure is representative of the real system. Every table name, column
            and figure shown here is invented — no client or patient data appears on
            this site.
          </p>
        </div>
      </div>
    </div>
  );
};
