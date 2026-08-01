import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bot,
  Clock,
  Database,
  Filter,
  Mail,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
  Webhook,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { easeOutExpo } from '@/lib/motion';

/* -------------------------------------------------------------------------- */

type NodeKind = 'trigger' | 'action';

type NodeDef = {
  id: string;
  label: string;
  sub: string;
  kind: NodeKind;
  icon: LucideIcon;
  /** What this step prints to the run log. */
  log: (payload: Record<string, unknown>) => { message: string; payload: Record<string, unknown> };
};

const TRIGGERS: NodeDef[] = [
  {
    id: 'webhook',
    label: 'Webhook',
    sub: 'POST /orders',
    kind: 'trigger',
    icon: Webhook,
    log: () => ({
      message: 'Received POST /orders — 1 item',
      payload: { orderId: 'ORD-4417', customer: 'Acme Ltd', total: 18400, currency: 'INR' },
    }),
  },
  {
    id: 'cron',
    label: 'Schedule',
    sub: 'Every day 09:00',
    kind: 'trigger',
    icon: Clock,
    log: () => ({
      message: 'Cron fired — daily 09:00 IST',
      payload: { window: 'last_24h', records: 37 },
    }),
  },
];

const ACTIONS: NodeDef[] = [
  {
    id: 'fetch',
    label: 'Fetch Data',
    sub: 'HTTP request',
    kind: 'action',
    icon: Database,
    log: (p) => ({
      message: 'GET /api/customers/acme → 200 in 84ms',
      payload: { ...p, tier: 'enterprise', terms: 'NET30' },
    }),
  },
  {
    id: 'filter',
    label: 'Filter',
    sub: 'total > 10000',
    kind: 'action',
    icon: Filter,
    log: (p) => ({
      message: 'Condition passed — routing to approval branch',
      payload: { ...p, requiresApproval: true },
    }),
  },
  {
    id: 'agent',
    label: 'AI Agent',
    sub: 'Summarise + classify',
    kind: 'action',
    icon: Bot,
    log: (p) => ({
      message: 'LLM call → classified as "priority restock", summary generated',
      payload: { ...p, category: 'priority-restock', confidence: 0.94 },
    }),
  },
  {
    id: 'transform',
    label: 'Transform',
    sub: 'Map to invoice',
    kind: 'action',
    icon: Shuffle,
    log: (p) => ({
      message: 'Mapped order → invoice schema',
      payload: { invoiceNo: 'INV-2026-0881', lineItems: 3, ...p },
    }),
  },
  {
    id: 'email',
    label: 'Send Email',
    sub: 'Notify owner',
    kind: 'action',
    icon: Mail,
    log: (p) => ({ message: 'Email queued to ops@acme.example', payload: p }),
  },
  {
    id: 'store',
    label: 'Update DB',
    sub: 'PostgreSQL',
    kind: 'action',
    icon: Database,
    log: (p) => ({ message: 'UPDATE orders SET status=$1 — 1 row affected', payload: p }),
  },
];

const ALL = [...TRIGGERS, ...ACTIONS];

const DEFAULT_CHAIN = ['webhook', 'fetch', 'agent', 'transform', 'store'];

type LogEntry = { step: string; message: string; payload: Record<string, unknown> };

/* -------------------------------------------------------------------------- */

/**
 * A workflow builder visitors actually operate.
 *
 * Sahil's pitch is automation, so letting someone assemble a chain and watch it
 * execute argues it far harder than a screenshot of a canvas sitting still.
 *
 * Click-to-add rather than drag-and-drop: it works identically on touch, needs
 * no pointer-capture handling, and demonstrates the same idea.
 */
export const WorkflowPlayground = () => {
  const [chain, setChain] = useState<string[]>(DEFAULT_CHAIN);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [log, setLog] = useState<LogEntry[]>([]);
  const reduce = useReducedMotion();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const nodeById = (id: string) => ALL.find((n) => n.id === id)!;

  const add = (id: string) => {
    if (running) return;
    const def = nodeById(id);
    setChain((c) => {
      // Only one trigger, and it must lead.
      if (def.kind === 'trigger') return [id, ...c.filter((x) => nodeById(x).kind !== 'trigger')];
      return [...c, id];
    });
  };

  const removeAt = (i: number) => {
    if (running) return;
    setChain((c) => c.filter((_, idx) => idx !== i));
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    setRunning(false);
    setActiveStep(-1);
    setLog([]);
    setChain(DEFAULT_CHAIN);
  };

  const run = useCallback(() => {
    if (running || !chain.length) return;

    timers.current.forEach(clearTimeout);
    setLog([]);
    setRunning(true);
    setActiveStep(-1);

    const stepMs = reduce ? 0 : 620;
    let payload: Record<string, unknown> = {};

    chain.forEach((id, i) => {
      timers.current.push(
        setTimeout(() => {
          const def = nodeById(id);
          const result = def.log(payload);
          payload = result.payload;
          setActiveStep(i);
          setLog((l) => [...l, { step: def.label, message: result.message, payload }]);
        }, i * stepMs),
      );
    });

    timers.current.push(
      setTimeout(
        () => {
          setRunning(false);
          setActiveStep(chain.length);
          setLog((l) => [
            ...l,
            {
              step: 'done',
              message: `Execution finished — ${chain.length} nodes, 0 errors`,
              payload: {},
            },
          ]);
        },
        chain.length * stepMs + 200,
      ),
    );
  }, [chain, running, reduce]);

  const hasTrigger = chain.some((id) => nodeById(id).kind === 'trigger');

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      {/* ---------------- Canvas ---------------- */}
      <div className="min-w-0 space-y-4">
        <div className="surface min-h-[16rem] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
              canvas · {chain.length} node{chain.length === 1 ? '' : 's'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
              <button
                onClick={run}
                disabled={running || !chain.length || !hasTrigger}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-mono text-[0.62rem] uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary-hi disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play className="h-3 w-3" />
                {running ? 'Running…' : 'Run'}
              </button>
            </div>
          </div>

          {!chain.length && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Empty canvas — add a trigger to start.
            </p>
          )}

          {!!chain.length && !hasTrigger && (
            <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              A workflow needs a trigger before it can run.
            </p>
          )}

          {/* Chain. Wraps rather than scrolling, so it holds at 360px. */}
          <ol className="flex flex-wrap items-stretch gap-2">
            <AnimatePresence initial={false}>
              {chain.map((id, i) => {
                const def = nodeById(id);
                const Icon = def.icon;
                const isActive = running && activeStep === i;
                const hasRun = activeStep > i || (!running && activeStep >= chain.length);

                return (
                  <motion.li
                    key={`${id}-${i}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.28, ease: easeOutExpo }}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={cn(
                        'group relative w-[6.5rem] rounded-xl border p-2.5 transition-colors duration-300 sm:w-28',
                        isActive
                          ? 'border-primary bg-primary/15'
                          : hasRun
                            ? 'border-primary/30 bg-elevated'
                            : 'border-border bg-elevated',
                      )}
                      style={
                        isActive
                          ? { boxShadow: '0 0 24px -6px hsl(var(--primary) / 0.6)' }
                          : undefined
                      }
                    >
                      <Icon
                        className={cn(
                          'mb-1.5 h-4 w-4 transition-colors',
                          isActive || hasRun ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                      <p className="truncate text-[0.68rem] font-medium">{def.label}</p>
                      <p className="truncate font-mono text-[0.55rem] text-muted-foreground">
                        {def.sub}
                      </p>

                      {!running && (
                        <button
                          onClick={() => removeAt(i)}
                          aria-label={`Remove ${def.label}`}
                          className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-border bg-background text-muted-foreground opacity-0 transition-all hover:border-destructive/50 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>

                    {i < chain.length - 1 && (
                      <div className="relative h-px w-4 shrink-0 bg-border">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-primary"
                          animate={{ width: hasRun || isActive ? '100%' : '0%' }}
                          transition={{ duration: reduce ? 0 : 0.4 }}
                        />
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        </div>

        {/* ---------------- Run log ---------------- */}
        <div className="surface overflow-hidden">
          <div className="border-b border-border px-4 py-2.5">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
              execution log
            </span>
          </div>

          <div className="no-scrollbar h-52 overflow-y-auto bg-background/50 p-4 font-mono text-[0.68rem] leading-relaxed">
            {!log.length && (
              <p className="text-muted-foreground/60">
                Press Run to execute the workflow…
              </p>
            )}

            {log.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="mb-2"
              >
                <p className={cn(entry.step === 'done' ? 'text-primary' : 'text-foreground')}>
                  <span className="text-muted-foreground">
                    [{String(i + 1).padStart(2, '0')}]
                  </span>{' '}
                  <span className="text-primary">{entry.step}</span>{' '}
                  <span className="text-muted-foreground">{entry.message}</span>
                </p>
                {!!Object.keys(entry.payload).length && (
                  <pre className="mt-1 whitespace-pre-wrap break-all pl-9 text-[0.62rem] text-muted-foreground/60">
                    {JSON.stringify(entry.payload)}
                  </pre>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- Node palette ---------------- */}
      <div className="min-w-0 space-y-4">
        {[
          { title: 'Triggers', nodes: TRIGGERS },
          { title: 'Actions', nodes: ACTIONS },
        ].map((group) => (
          <div key={group.title} className="surface p-4">
            <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
              {group.title}
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
              {group.nodes.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => add(n.id)}
                    disabled={running}
                    className="group flex w-full items-center gap-2.5 rounded-lg border border-border bg-elevated/60 px-3 py-2 text-left transition-colors hover:border-primary/40 disabled:opacity-40"
                  >
                    <n.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.72rem] font-medium">{n.label}</span>
                      <span className="block truncate font-mono text-[0.55rem] text-muted-foreground">
                        {n.sub}
                      </span>
                    </span>
                    <Plus className="h-3 w-3 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
