import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bed,
  Box,
  Calendar,
  ChartNoAxesColumn,
  Factory,
  FileText,
  Gauge,
  Info,
  Layers,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { demoFor, type ErpDemo } from '@/content/erp-demo';
import { cn } from '@/lib/utils';
import { easeOutExpo } from '@/lib/motion';

const icons: Record<string, LucideIcon> = {
  gauge: Gauge,
  calendar: Calendar,
  users: Users,
  bed: Bed,
  receipt: Receipt,
  chart: ChartNoAxesColumn,
  file: FileText,
  box: Box,
  wrench: Wrench,
  truck: Truck,
  factory: Factory,
  layers: Layers,
  cart: ShoppingCart,
};

/** Status → tone. Anything unmatched stays neutral. */
const tone = (value: string) => {
  const v = value.toLowerCase();
  if (/(progress|consult|pouring|dispatched|production)/.test(v)) return 'text-primary';
  if (/(critical|low|review|breakdown)/.test(v)) return 'text-destructive';
  if (/(closed|stable|approved|checked in)/.test(v)) return 'text-foreground';
  return 'text-muted-foreground';
};

const DemoBody = ({ demo }: { demo: ErpDemo }) => {
  const [active, setActive] = useState(demo.modules[0].id);

  return (
    <div className="grid lg:grid-cols-[13rem_1fr]">
      {/* ---- Module sidebar ---- */}
      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-elevated/40 p-2 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:p-3">
        {demo.modules.map((m) => {
          const Icon = icons[m.icon] ?? Gauge;
          return (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors lg:w-full',
                active === m.id
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{m.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ---- Workspace ---- */}
      <div className="min-w-0 p-4 sm:p-5">
        {/* KPI tiles */}
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr))]">
          {demo.kpis.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: easeOutExpo }}
              className="min-w-0 rounded-xl border border-border bg-elevated/60 p-3"
            >
              <p className="truncate text-[0.62rem] text-muted-foreground">{k.label}</p>
              <p className="mt-1 font-display text-xl font-bold tracking-tight">{k.value}</p>
              {k.delta && (
                <p
                  className={cn(
                    'mt-0.5 flex items-center gap-1 font-mono text-[0.58rem]',
                    k.up ? 'text-primary' : 'text-destructive',
                  )}
                >
                  {k.up ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  {k.delta}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          {/* Data table — scrolls inside its own pane, never the page. */}
          <div className="min-w-0 rounded-xl border border-border bg-elevated/40">
            <p className="border-b border-border px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-muted-foreground">
              {demo.table.title}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70">
                    {demo.table.columns.map((c) => (
                      <th
                        key={c.key}
                        className={cn(
                          'whitespace-nowrap px-4 py-2.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-muted-foreground/70',
                          c.align === 'right' && 'text-right',
                        )}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {demo.table.rows.map((row, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      className="border-b border-border/40 transition-colors last:border-0 hover:bg-white/[0.02]"
                    >
                      {demo.table.columns.map((c) => (
                        <td
                          key={c.key}
                          className={cn(
                            'whitespace-nowrap px-4 py-2.5',
                            c.align === 'right' && 'text-right font-mono',
                            c.key === 'status' ? tone(row[c.key]) : 'text-foreground/85',
                          )}
                        >
                          {row[c.key]}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side panel */}
          <div className="min-w-0 rounded-xl border border-border bg-elevated/40">
            <p className="border-b border-border px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-muted-foreground">
              {demo.panel.title}
            </p>
            <ul className="divide-y divide-border/40">
              {demo.panel.items.map((item, i) => (
                <motion.li
                  key={item.primary}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs text-foreground">{item.primary}</span>
                    <span className="block truncate text-[0.62rem] text-muted-foreground">
                      {item.secondary}
                    </span>
                  </span>
                  <span className="chip shrink-0">{item.tag}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Sanitised ERP demo.
 *
 * The three ERPs are internal systems with no public URL and no screenshots, so
 * until now there was nothing for a visitor to look at. This shows the *shape*
 * of what was built — module structure, record layouts, the flows — using
 * entirely invented data.
 *
 * Every value comes from content/erp-demo.ts and is a deliberate placeholder
 * ("Patient A-1042", "Sample Industries"). It is labelled as sample data in the
 * header and again in the footer, because a demo a visitor could mistake for
 * real client data is a liability, not a portfolio piece.
 */
export const ErpDemoDialog = ({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const demo = projectId ? demoFor(projectId) : undefined;

  return (
    <Dialog open={open && !!demo} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] w-[min(96vw,72rem)] max-w-none overflow-y-auto rounded-2xl border-border bg-elevated p-0">
        {demo && (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-border bg-elevated/95 px-4 py-3.5 backdrop-blur sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
                <div className="min-w-0">
                  <DialogTitle className="truncate font-display text-base font-bold tracking-tight sm:text-lg">
                    {demo.name}
                  </DialogTitle>
                  <p className="mt-0.5 truncate font-mono text-[0.62rem] text-muted-foreground">
                    {demo.industry}
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-signal">
                  <Info className="h-3 w-3" />
                  Sample data
                </span>
              </div>
            </div>

            <DemoBody demo={demo} />

            {/* Footer disclaimer — stated twice on purpose. */}
            <div className="border-t border-border px-4 py-3 sm:px-5">
              <p className="text-[0.68rem] leading-relaxed text-muted-foreground">
                Illustrative interface only. Every record shown is invented — no client, patient or
                order data from the live system appears here. The production ERP is internal and
                not publicly reachable.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
