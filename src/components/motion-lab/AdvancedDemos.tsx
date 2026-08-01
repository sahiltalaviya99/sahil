import { useEffect, useRef, useState } from 'react';

import { automationCount } from '@/content/automations';
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
  type MotionValue,
} from 'framer-motion';
import {
  Boxes,
  Database,
  GitBranch,
  Rocket,
  Terminal as TerminalIcon,
  Undo2,
  Workflow as WorkflowIcon,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * The harder half of the motion kit.
 *
 * Everything here runs on motion values rather than React state — the whole
 * point of the group. A dock that re-renders twelve items on every pointermove,
 * or a drag handler that calls setState per frame, will hold 60fps in a demo
 * and fall over the moment it sits inside a real page. `useMotionValue` writes
 * straight to the element and never touches the render cycle.
 */

/* ========================================================================== */
/*  1. Magnifying dock                                                        */
/* ========================================================================== */

const DOCK = [TerminalIcon, Database, WorkflowIcon, GitBranch, Boxes, Rocket];

const DockItem = ({ mouseX, icon: Icon }: { mouseX: MotionValue<number>; icon: typeof Boxes }) => {
  const ref = useRef<HTMLDivElement>(null);

  // Distance from the pointer to this item's centre, recomputed from the live
  // rect — reading layout here rather than caching it is what keeps the dock
  // correct when the row wraps or the panel resizes.
  const distance = useTransform(mouseX, (v) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return Infinity;
    return v - (box.left + box.width / 2);
  });

  const target = useTransform(distance, [-130, 0, 130], [38, 68, 38], { clamp: true });
  // The spring is the effect. Driving width directly from distance tracks the
  // pointer exactly and feels like a slider, not a dock.
  const size = useSpring(target, { stiffness: 320, damping: 20, mass: 0.35 });

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      className="flex shrink-0 items-end justify-center rounded-xl border border-border bg-elevated"
    >
      <Icon className="mb-2 h-4 w-4 text-primary" />
    </motion.div>
  );
};

export const Dock = () => {
  // Infinity parks every item at rest without a second "is the pointer here"
  // state — the transform range already clamps.
  const mouseX = useMotionValue(Infinity);

  return (
    <div
      onPointerMove={(e) => mouseX.set(e.clientX)}
      onPointerLeave={() => mouseX.set(Infinity)}
      className="flex h-[4.75rem] items-end gap-2 rounded-2xl border border-border bg-elevated/40 px-3 pb-2"
    >
      {DOCK.map((Icon, i) => (
        <DockItem key={i} mouseX={mouseX} icon={Icon} />
      ))}
    </div>
  );
};

/* ========================================================================== */
/*  2. Tilt card with specular glare                                          */
/* ========================================================================== */

export const TiltCard = () => {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const spring = { stiffness: 260, damping: 22, mass: 0.4 };
  const rotateX = useSpring(useTransform(y, [0, 1], [11, -11]), spring);
  const rotateY = useSpring(useTransform(x, [0, 1], [-14, 14]), spring);

  // The highlight tracks the pointer independently of the tilt, which is what
  // sells it as a light source rather than a texture painted on the card.
  const gx = useTransform(x, (v) => `${v * 100}%`);
  const gy = useTransform(y, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, hsl(var(--primary) / 0.22), transparent 55%)`;

  return (
    <motion.div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="relative w-[15rem] overflow-hidden rounded-2xl border border-border bg-elevated p-5"
    >
      <motion.div style={{ background: glare }} className="pointer-events-none absolute inset-0" />
      <p className="relative font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
        Hospital ERP
      </p>
      <p className="relative mt-2 font-display text-lg font-bold tracking-tight">14 modules</p>
      <p className="relative mt-1 text-xs text-muted-foreground">Appointments to discharge</p>
    </motion.div>
  );
};

/* ========================================================================== */
/*  3. Swipe deck                                                             */
/* ========================================================================== */

const DECK = [
  { id: 'a', title: 'Sahaj Cooling', body: 'Orders, dispatch, stock' },
  { id: 'b', title: 'Adorn Clinic', body: 'Appointments and billing' },
  { id: 'c', title: 'Awax Studio', body: 'Projects and invoicing' },
];

const SwipeCard = ({ card, onGone }: { card: (typeof DECK)[number]; onGone: () => void }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 180], [-16, 16]);
  const opacity = useTransform(x, [-180, -60, 0, 60, 180], [0, 1, 1, 1, 0]);

  return (
    <motion.div
      drag="x"
      style={{ x, rotate, opacity }}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        // Velocity, not just displacement. A quick flick that only travels 40px
        // is unmistakably a dismissal, and requiring the full distance every
        // time makes the deck feel like it is resisting you.
        if (Math.abs(info.offset.x) > 110 || Math.abs(info.velocity.x) > 550) onGone();
      }}
      className="absolute inset-x-0 top-0 cursor-grab rounded-2xl border border-border bg-elevated p-5 active:cursor-grabbing"
    >
      <p className="font-display text-sm font-semibold tracking-tight">{card.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{card.body}</p>
    </motion.div>
  );
};

export const SwipeDeck = () => {
  const [deck, setDeck] = useState(DECK);
  const top = deck[0];

  return (
    <div className="flex w-full max-w-[15rem] flex-col items-center gap-3">
      <div className="relative h-[5.75rem] w-full">
        {/* Rendered back to front so the top card is last in the DOM and needs
            no z-index bookkeeping. */}
        {deck
          .slice(0, 3)
          .reverse()
          .map((c, i, arr) => {
            const depth = arr.length - 1 - i;
            return c.id === top?.id ? (
              <SwipeCard key={c.id} card={c} onGone={() => setDeck((d) => d.slice(1))} />
            ) : (
              <motion.div
                key={c.id}
                animate={{ y: depth * 8, scale: 1 - depth * 0.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute inset-x-0 top-0 rounded-2xl border border-border bg-elevated p-5"
              >
                <p className="font-display text-sm font-semibold tracking-tight">{c.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.body}</p>
              </motion.div>
            );
          })}
        {!deck.length && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
            Deck empty
          </div>
        )}
      </div>

      <button onClick={() => setDeck(DECK)} className="btn-ghost px-3 py-1.5 text-xs">
        <Undo2 className="h-3 w-3" />
        Reset
      </button>
    </div>
  );
};

/* ========================================================================== */
/*  4. Shared-element expand                                                  */
/* ========================================================================== */

const CELLS = [
  { id: 'erp', label: 'ERP', body: 'Three internal systems, built end to end.' },
  { id: 'auto', label: 'Automation', body: `${automationCount} n8n agents in production.` },
  { id: 'web', label: 'Web', body: 'Front end, API, database, deployment.' },
  { id: 'ai', label: 'AI', body: 'Retrieval, generation, evaluation.' },
];

export const SharedExpand = () => {
  const [open, setOpen] = useState<string | null>(null);
  const cell = CELLS.find((c) => c.id === open);

  // Escape has to work, or an overlay with no visible close is a trap for
  // keyboard users — the click-outside is not enough on its own.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative w-full max-w-[16rem]">
      <div className="grid grid-cols-2 gap-2">
        {CELLS.map((c) => (
          <motion.button
            key={c.id}
            layoutId={`cell-${c.id}`}
            onClick={() => setOpen(c.id)}
            className="rounded-xl border border-border bg-elevated px-3 py-4 text-left"
          >
            <motion.p layoutId={`label-${c.id}`} className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-primary">
              {c.label}
            </motion.p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {cell && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(null)}
              className="absolute inset-0 z-10 rounded-xl bg-background/70 backdrop-blur-sm"
            />
            {/* Same layoutId as the tile: framer measures both and interpolates
                between them, so it is literally the same element travelling. */}
            <motion.div
              layoutId={`cell-${cell.id}`}
              className="absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 rounded-xl border border-primary/30 bg-elevated p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <motion.p layoutId={`label-${cell.id}`} className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-primary">
                  {cell.label}
                </motion.p>
                <button onClick={() => setOpen(null)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.12 } }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                className="mt-2 text-xs leading-relaxed text-muted-foreground"
              >
                {cell.body}
              </motion.p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ========================================================================== */
/*  5. Scroll-velocity marquee                                                */
/* ========================================================================== */

const MARQUEE = 'ERP · Automation · Retrieval · Schema design · Deployment · ';

export const VelocityMarquee = () => {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Raw velocity is spiky enough to look like a fault. The spring is what turns
  // it into something that reads as momentum.
  const smooth = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [-1600, 0, 1600], [-4, 1, 4], { clamp: false });

  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = 2.4 * (delta / 1000) * direction.current;
    // Scrolling backwards reverses the marquee. Without this it keeps drifting
    // one way and merely changes speed, which reads as a glitch rather than as
    // a response to the scroll.
    if (factor.get() < 0) direction.current = -1;
    else if (factor.get() > 0) direction.current = 1;
    move += move * Math.abs(factor.get());
    // wrap() over one repetition's width in percent — the row is duplicated
    // four times so there is always a copy covering the gap.
    baseX.set(wrap(-25, 0, baseX.get() + move));
  });

  const x = useTransform(baseX, (v) => `${v}%`);

  return (
    <div className="mask-fade-x w-full overflow-hidden">
      <motion.div style={{ x }} className="flex w-max whitespace-nowrap font-display text-lg font-semibold tracking-tight">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className={i % 2 ? 'text-primary' : 'text-muted-foreground'}>
            {MARQUEE}
          </span>
        ))}
      </motion.div>
      <p className="mt-3 text-center font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground/50">
        Scroll the page
      </p>
    </div>
  );
};

/* ========================================================================== */
/*  6. Scroll-linked word reveal                                              */
/* ========================================================================== */

const COPY =
  'Claims are cheap on a portfolio. These are the things you can actually run.';

const Word = ({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) => {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.28em] inline-block">
      {word}
    </motion.span>
  );
};

export const ScrollWords = () => {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = COPY.split(' ');

  // offset ends at 'end 0.55' rather than 'end start': the sentence should be
  // fully lit while it is still comfortably on screen, not at the instant it
  // leaves.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'end 0.55'] });

  return (
    <p
      ref={ref}
      className={cn('max-w-[18rem] text-center font-display text-lg font-semibold leading-snug tracking-tight')}
    >
      {words.map((w, i) => (
        <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
      ))}
    </p>
  );
};
