import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bell, ChevronDown, Minus, Plus, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Six component-level interactions. Same rule as the buttons: framer-motion and
 * CSS only, no animation dependency, and each carries the one detail that
 * separates a considered version from a first draft.
 */

/* -------------------------------------------------------------------------- */
/*  1. Odometer                                                               */
/* -------------------------------------------------------------------------- */

const Digit = ({ value, dir }: { value: string; dir: 1 | -1 }) => (
  <span className="relative inline-block h-[1.1em] w-[0.62em] overflow-hidden align-top">
    <AnimatePresence initial={false}>
      <motion.span
        key={value}
        initial={{ y: dir > 0 ? '-100%' : '100%' }}
        animate={{ y: '0%' }}
        exit={{ y: dir > 0 ? '100%' : '-100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="absolute inset-0 flex items-center justify-center tabular-nums"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </span>
);

export const Odometer = () => {
  const [value, setValue] = useState(1204);
  const [dir, setDir] = useState<1 | -1>(1);

  const bump = (by: number) => {
    setDir(by > 0 ? 1 : -1);
    setValue((v) => Math.max(0, v + by));
  };

  // Padded to a fixed width so the row doesn't reflow when it crosses 1000 —
  // digits sliding while the whole number also shifts sideways reads as a bug.
  const digits = String(value).padStart(5, '0').split('');

  return (
    <div className="flex items-center gap-4">
      <button onClick={() => bump(-137)} className="btn-ghost h-9 w-9 justify-center p-0" aria-label="Decrease">
        <Minus className="h-4 w-4" />
      </button>
      <p className="font-display text-4xl font-bold tracking-tight text-primary">
        {/* Keyed per slot, so only the digits that actually changed animate. */}
        {digits.map((d, i) => (
          <Digit key={i} value={d} dir={dir} />
        ))}
      </p>
      <button onClick={() => bump(137)} className="btn-ghost h-9 w-9 justify-center p-0" aria-label="Increase">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  2. Shared-layout tabs                                                     */
/* -------------------------------------------------------------------------- */

const TABS = ['Overview', 'Schema', 'Runs', 'Logs'];

export const SharedTabs = () => {
  const [active, setActive] = useState(TABS[0]);

  return (
    <div className="flex flex-wrap gap-1 rounded-full border border-border bg-elevated/60 p-1">
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => setActive(t)}
          className={cn(
            'relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
            active === t ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {/* One element that moves, not four that cross-fade. The eye tracks a
              travelling object; four fades read as a flicker. */}
          {active === t && (
            <motion.span
              layoutId="motion-lab-tab"
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            />
          )}
          <span className="relative">{t}</span>
        </button>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  3. Collapsing toast stack                                                 */
/* -------------------------------------------------------------------------- */

type Note = { id: number; text: string };

const NOTE_TEXT = ['Workflow deployed', 'Invoice #4021 synced', 'Backup complete', 'Nightly import finished'];

export const ToastStack = () => {
  const [notes, setNotes] = useState<Note[]>([
    { id: 2, text: NOTE_TEXT[2] },
    { id: 1, text: NOTE_TEXT[1] },
    { id: 0, text: NOTE_TEXT[0] },
  ]);
  const [open, setOpen] = useState(false);
  const seq = useRef(3);

  const push = () => {
    // Both reads happen outside the updater — StrictMode runs updaters twice,
    // and a ref advanced inside one produces duplicate keys.
    const id = seq.current++;
    setNotes((n) => [{ id, text: NOTE_TEXT[id % NOTE_TEXT.length] }, ...n].slice(0, 4));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button onClick={push} className="btn-ghost px-4 py-2 text-xs">
        <Bell className="h-3.5 w-3.5" />
        Notify
      </button>

      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="relative h-[5.5rem] w-full max-w-[17rem]"
      >
        <AnimatePresence initial={false}>
          {notes.map((n, i) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: -18, scale: 0.9 }}
              animate={{
                opacity: i > 2 ? 0 : 1,
                // Collapsed: each card peeks 9px below and is scaled down, so
                // depth is legible without reading four lines of text at once.
                y: open ? i * 42 : i * 9,
                scale: open ? 1 : 1 - i * 0.05,
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              style={{ zIndex: notes.length - i }}
              className="absolute inset-x-0 top-0 rounded-xl border border-border bg-elevated px-3.5 py-2.5 text-xs text-foreground shadow-lg"
            >
              {n.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground/50">
        Hover to expand
      </p>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  4. Skeleton → content                                                     */
/* -------------------------------------------------------------------------- */

export const SkeletonSwap = () => {
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const reload = useCallback(() => {
    setLoading(true);
    timer.current = setTimeout(() => setLoading(false), 1400);
  }, []);

  useEffect(() => {
    reload();
    return () => clearTimeout(timer.current);
  }, [reload]);

  return (
    <div className="w-full max-w-[19rem]">
      <div className="surface p-4">
        {loading ? (
          // Bar heights are the rendered line-heights of the three lines they
          // stand in for (17px for text-sm, 15px for text-xs), and the gap is
          // the same. A skeleton whose geometry doesn't match makes the swap
          // land as a jump, which is worse than showing a spinner.
          <div className="space-y-2.5">
            <div className="h-[17px] w-1/2 animate-pulse rounded bg-border" />
            <div className="h-[15px] w-full animate-pulse rounded bg-border/70" />
            <div className="h-[15px] w-3/5 animate-pulse rounded bg-border/70" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="space-y-2.5"
          >
            <p className="text-sm font-semibold text-foreground">Adorn Clinic</p>
            <p className="text-xs text-muted-foreground">Appointments, billing, inventory</p>
            <p className="text-xs text-muted-foreground">Internal · 2025</p>
          </motion.div>
        )}
      </div>
      <button onClick={reload} className="btn-ghost mt-3 px-3 py-1.5 text-xs">
        <RefreshCw className="h-3 w-3" />
        Reload
      </button>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  5. Accordion                                                              */
/* -------------------------------------------------------------------------- */

const ROWS = [
  { q: 'What runs the animation?', a: 'framer-motion and CSS. Nothing on this page pulls in an animation library.' },
  { q: 'Does it respect reduced motion?', a: 'Yes — useReducedMotion() collapses movement to opacity, everywhere.' },
  { q: 'Can I copy it?', a: 'That is what the code toggle on each tile is for.' },
];

export const Accordion = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="w-full max-w-[21rem] divide-y divide-border/70 overflow-hidden rounded-xl border border-border">
      {ROWS.map((r, i) => (
        <div key={r.q}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left text-xs font-medium text-foreground"
          >
            {r.q}
            <ChevronDown
              className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300', open === i && 'rotate-180')}
            />
          </button>
          {/* height: 'auto' animates fine — but only with overflow hidden on the
              wrapper, or the copy spills out over the row below mid-transition. */}
          <motion.div
            initial={false}
            animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="px-3.5 pb-3 text-xs leading-relaxed text-muted-foreground">{r.a}</p>
          </motion.div>
        </div>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  6. Scramble                                                               */
/* -------------------------------------------------------------------------- */

const NOISE = '!<>-_\\/[]{}=+*^?#________';
const TARGET = 'Automation Engineer';

export const Scramble = () => {
  const reduce = useReducedMotion();
  const [text, setText] = useState(TARGET);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (reduce) {
      setText(TARGET);
      return;
    }
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      setText(
        TARGET.split('')
          .map((ch, i) =>
            // Each character settles at its own frame, so the string resolves
            // left to right instead of snapping all at once.
            frame > i * 1.6 + 6 || ch === ' ' ? ch : NOISE[(frame * 7 + i * 13) % NOISE.length],
          )
          .join(''),
      );
      if (frame > TARGET.length * 1.6 + 6) clearInterval(id);
    }, 32);
    return () => clearInterval(id);
  }, [run, reduce]);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="min-h-[1.75rem] font-mono text-lg font-medium tracking-tight text-primary">{text}</p>
      <button onClick={() => setRun((r) => r + 1)} className="btn-ghost px-4 py-2 text-xs">
        <RefreshCw className="h-3 w-3" />
        Scramble
      </button>
    </div>
  );
};
