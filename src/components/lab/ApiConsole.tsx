import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

import { projects } from '@/content/projects';
import { experience } from '@/content/experience';
import { coreStack, skillGroups, levelValue } from '@/content/skills';
import { site, stats } from '@/content/site';
import { cn } from '@/lib/utils';

/**
 * A REST console over the site's own content.
 *
 * The handlers below read the same modules the rest of the page renders, so
 * `GET /api/projects` returns the actual project list — same trick as the
 * terminal's virtual filesystem. Nothing is a hand-written fixture that could
 * drift.
 */

type Endpoint = {
  method: 'GET';
  path: string;
  describe: string;
  handler: () => unknown;
};

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/profile',
    describe: 'Identity and availability',
    handler: () => ({
      name: site.name,
      role: site.role,
      company: site.company,
      location: site.location,
      available: site.available,
      email: site.email,
    }),
  },
  {
    method: 'GET',
    path: '/api/stats',
    describe: 'Headline numbers',
    handler: () => stats.map((s) => ({ value: s.value, suffix: s.suffix, label: s.label })),
  },
  {
    method: 'GET',
    path: '/api/projects',
    describe: `All ${projects.length} projects`,
    handler: () =>
      projects.map((p) => ({
        id: p.id,
        title: p.title,
        client: p.client ?? null,
        kind: p.kind,
        status: p.status,
        year: p.year,
        tags: p.tags,
      })),
  },
  {
    method: 'GET',
    path: '/api/projects?kind=erp',
    describe: 'Filtered — ERP systems only',
    handler: () =>
      projects
        .filter((p) => p.kind === 'erp')
        .map((p) => ({
          id: p.id,
          title: p.title,
          client: p.client ?? null,
          role: p.role,
          outcome: p.outcome,
          stack: p.tags,
        })),
  },
  {
    method: 'GET',
    path: '/api/experience',
    describe: 'Roles and education',
    handler: () =>
      experience.map((e) => ({
        id: e.id,
        title: e.title,
        org: e.org,
        period: e.period,
        type: e.type,
        current: e.current ?? false,
        skills: e.skills,
      })),
  },
  {
    method: 'GET',
    path: '/api/skills',
    describe: 'Core stack and groups',
    handler: () => ({
      core: coreStack.map((s) => ({ name: s.name, level: s.level, score: levelValue[s.level] })),
      groups: skillGroups.map((g) => ({ id: g.id, label: g.label, count: g.skills.length })),
    }),
  },
];

/** Minimal JSON syntax highlighting — no highlighter dependency needed. */
const highlight = (json: string) =>
  json.split('\n').map((line, i) => {
    const parts = line.split(/("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+\.?\d*)/g);
    return (
      <div key={i}>
        {parts.map((part, j) => {
          if (!part) return null;
          if (/^"(?:\\.|[^"\\])*"\s*:$/.test(part))
            return (
              <span key={j} className="text-primary">
                {part}
              </span>
            );
          if (/^"/.test(part))
            return (
              <span key={j} className="text-foreground/85">
                {part}
              </span>
            );
          if (/^(true|false|null)$/.test(part))
            return (
              <span key={j} className="text-signal">
                {part}
              </span>
            );
          if (/^-?\d/.test(part))
            return (
              <span key={j} className="text-signal">
                {part}
              </span>
            );
          return (
            <span key={j} className="text-muted-foreground">
              {part}
            </span>
          );
        })}
      </div>
    );
  });

export const ApiConsole = () => {
  const [selected, setSelected] = useState(ENDPOINTS[2]);
  const [response, setResponse] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ ms: number; bytes: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const send = () => {
    setLoading(true);
    setResponse(null);

    // Small artificial delay so the request/response cycle is legible. The
    // data itself is real — this is latency theatre, not fake data.
    const latency = 60 + Math.round(Math.random() * 90);

    setTimeout(() => {
      const body = JSON.stringify(selected.handler(), null, 2);
      setResponse(body);
      setMeta({ ms: latency, bytes: new Blob([body]).size });
      setLoading(false);
    }, latency);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[19rem_1fr]">
      {/* Endpoint list */}
      <div className="surface min-w-0 p-4">
        <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
          endpoints
        </p>
        <ul className="space-y-1.5">
          {ENDPOINTS.map((e) => (
            <li key={e.path}>
              <button
                onClick={() => {
                  setSelected(e);
                  setResponse(null);
                  setMeta(null);
                }}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                  selected.path === e.path
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-border bg-elevated/60 hover:border-primary/25',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[0.55rem] font-bold text-primary">
                    {e.method}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[0.68rem] text-foreground">
                    {e.path}
                  </span>
                </span>
                <span className="mt-1 block truncate text-[0.62rem] text-muted-foreground">
                  {e.describe}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Request / response */}
      <div className="min-w-0 space-y-4">
        <div className="surface overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
            <span className="shrink-0 rounded bg-primary/15 px-2 py-0.5 font-mono text-[0.6rem] font-bold text-primary">
              GET
            </span>
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
              {selected.path}
            </code>
            <button
              onClick={send}
              disabled={loading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-mono text-[0.62rem] uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary-hi disabled:opacity-50"
            >
              <Play className="h-3 w-3" />
              {loading ? 'Sending…' : 'Send'}
            </button>
          </div>

          {/* Status bar */}
          {meta && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border bg-elevated/40 px-4 py-2 font-mono text-[0.62rem]"
            >
              <span className="text-primary">200 OK</span>
              <span className="text-muted-foreground">{meta.ms} ms</span>
              <span className="text-muted-foreground">{meta.bytes} B</span>
              <span className="text-muted-foreground">application/json</span>
            </motion.div>
          )}

          <div className="no-scrollbar h-[22rem] overflow-auto bg-background/50 p-4 font-mono text-[0.66rem] leading-relaxed">
            {!response && !loading && (
              <p className="text-muted-foreground/60">
                Press Send to issue the request…
              </p>
            )}
            {loading && <p className="text-muted-foreground">Awaiting response…</p>}
            {response && <div className="whitespace-pre">{highlight(response)}</div>}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          These responses are generated from the same content modules the rest of this page
          renders — <code className="font-mono text-primary">/api/projects</code> returns the
          actual project list, not a fixture.
        </p>
      </div>
    </div>
  );
};
