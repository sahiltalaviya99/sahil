import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { search, INDEX_STATS, SAMPLE_SEARCHES } from '@/lib/search-index';
import { useScrollToSection } from '@/hooks/use-section-nav';
import { cn } from '@/lib/utils';

/**
 * BM25 search across this site's own content.
 *
 * Deliberately not a chatbot. This is Okapi BM25 — the ranking function behind
 * Lucene, Elastic and Postgres full-text search — running client-side, with the
 * per-term IDF and contribution exposed for every hit so the ranking is
 * inspectable instead of magic.
 *
 * A fake chat window answering from canned strings is exactly the sort of thing
 * this site exists not to be. A real ranking function whose arithmetic you can
 * check is the stronger claim.
 */
const KIND_LABEL: Record<string, string> = {
  project: 'project',
  experience: 'role',
  skill: 'skill',
  about: 'profile',
};

export const PortfolioSearch = () => {
  const [query, setQuery] = useState(SAMPLE_SEARCHES[0]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const scrollTo = useScrollToSection();

  // Pure and fast over 66 documents — no debounce or effect needed.
  const hits = useMemo(() => search(query, 8), [query]);
  const max = hits[0]?.score ?? 1;

  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/70 p-4 sm:p-5">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5 transition-colors focus-within:border-primary/50">
          <Search className="h-4 w-4 shrink-0 text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, roles and skills…"
            spellCheck={false}
            aria-label="Search this site"
            className="min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <span className="shrink-0 font-mono text-[0.6rem] text-muted-foreground/50">
            {hits.length} hit{hits.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {SAMPLE_SEARCHES.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className={cn(
                'rounded-full border px-2.5 py-1 font-mono text-[0.62rem] transition-colors',
                query === q
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-border/60">
        {hits.map((h) => (
          <li key={h.doc.id}>
            <div className="p-4 transition-colors hover:bg-primary/[0.03] sm:px-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <button
                  onClick={() => scrollTo(h.doc.section)}
                  className="min-w-0 text-left font-display text-sm font-semibold tracking-tight transition-colors hover:text-primary"
                >
                  {h.doc.title}
                </button>
                <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground/50">
                  {KIND_LABEL[h.doc.kind]}
                </span>
              </div>

              {/* Score bar, relative to the top hit. */}
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${Math.max(3, (h.score / max) * 100)}%` }}
                  />
                </div>
                <button
                  onClick={() => setExpanded(expanded === h.doc.id ? null : h.doc.id)}
                  className="shrink-0 font-mono text-[0.62rem] text-primary/80 transition-colors hover:text-primary"
                >
                  {h.score.toFixed(3)}
                </button>
              </div>

              <p className="mt-2 line-clamp-2 text-[0.78rem] leading-relaxed text-muted-foreground">
                {h.snippet}
              </p>

              {/* Why it ranked here — the part that makes this evidence. */}
              {expanded === h.doc.id && (
                <table className="mt-3 w-full border-collapse text-left font-mono text-[0.62rem]">
                  <thead>
                    <tr className="text-muted-foreground/50">
                      <th className="py-1 font-medium">term</th>
                      <th className="py-1 font-medium">tf</th>
                      <th className="py-1 font-medium">idf</th>
                      <th className="py-1 text-right font-medium">contribution</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {h.terms.map((t) => (
                      <tr key={t.term} className="border-t border-border/40">
                        <td className="py-1 text-foreground">{t.term}</td>
                        <td className="py-1">{t.tf}</td>
                        <td className="py-1">{t.idf.toFixed(3)}</td>
                        <td className="py-1 text-right text-primary/80">
                          {t.contribution.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </li>
        ))}

        {!hits.length && (
          <li className="p-8 text-center text-sm text-muted-foreground/60">
            Nothing matches “{query}”.
          </li>
        )}
      </ul>

      <p className="border-t border-border/60 px-4 py-3 font-mono text-[0.62rem] leading-relaxed text-muted-foreground/60 sm:px-5">
        Okapi BM25 · {INDEX_STATS.documents} documents · {INDEX_STATS.terms} unique terms ·
        avg length {INDEX_STATS.avgLength}. Click a score for the per-term breakdown. No
        LLM, no network — this is a ranking function, not a chatbot.
      </p>
    </div>
  );
};
