import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Loader2, Send } from 'lucide-react';

import Magnet from '@/components/reactbits/Magnet';

/**
 * Six button interactions, hand-built on framer-motion and CSS.
 *
 * Nothing here is imported from an animation library — the point of the exhibit
 * is that these are ~15 lines each, so pulling a dependency in for them costs
 * more than writing them. Each one carries the detail that makes it read as
 * deliberate rather than as "a transition was added".
 */

/* -------------------------------------------------------------------------- */
/*  1. Magnetic                                                               */
/* -------------------------------------------------------------------------- */

export const MagneticButton = () => (
  // Reuses the site's own Magnet wrapper rather than re-deriving it here.
  <Magnet padding={80} magnetStrength={4}>
    <button className="btn-primary px-6 py-2.5 text-sm">Pull me</button>
  </Magnet>
);

/* -------------------------------------------------------------------------- */
/*  2. Sheen sweep                                                            */
/* -------------------------------------------------------------------------- */

export const SheenButton = () => (
  <button className="group relative overflow-hidden rounded-full border border-border bg-elevated px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40">
    <span className="relative z-10">Hover me</span>
    {/* Skewed, so the highlight reads as a light source crossing a surface
        rather than a rectangle sliding past. */}
    <span
      aria-hidden
      className="absolute inset-y-0 -left-full w-1/2 -skew-x-[20deg] bg-gradient-to-r from-transparent via-primary/25 to-transparent transition-[left] duration-700 ease-out group-hover:left-[150%]"
    />
  </button>
);

/* -------------------------------------------------------------------------- */
/*  3. Ripple                                                                 */
/* -------------------------------------------------------------------------- */

type Ripple = { id: number; x: number; y: number; size: number };

export const RippleButton = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const seq = useRef(0);

  const spawn = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    // Diameter must reach the furthest corner from the click, or the ripple
    // visibly stops short on a wide button.
    const size =
      2 * Math.hypot(Math.max(e.clientX - r.left, r.right - e.clientX), Math.max(e.clientY - r.top, r.bottom - e.clientY));
    // id is taken outside the updater: StrictMode invokes updaters twice, and a
    // ref bumped inside one silently burns an id every click.
    const id = seq.current++;
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top, size }]);
  };

  return (
    <button
      onPointerDown={spawn}
      className="relative overflow-hidden rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
    >
      <span className="relative z-10">Click anywhere</span>
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          aria-hidden
          initial={{ scale: 0, opacity: 0.45 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          // Removed on completion — an unbounded array of finished ripples is a
          // slow leak on a button someone keeps mashing.
          onAnimationComplete={() => setRipples((rs) => rs.filter((x) => x.id !== r.id))}
          style={{ left: r.x - r.size / 2, top: r.y - r.size / 2, width: r.size, height: r.size }}
          className="pointer-events-none absolute rounded-full bg-primary-foreground"
        />
      ))}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/*  4. Border beam                                                            */
/* -------------------------------------------------------------------------- */

export const BeamButton = () => (
  <button className="relative overflow-hidden rounded-full p-px">
    {/* A conic gradient spun behind the button, with the face laid on top —
        the visible 1px is whatever the gradient leaves uncovered. Cheaper than
        animating a border, and it runs on the compositor. */}
    <span
      aria-hidden
      className="absolute inset-[-120%] animate-[spin_3.5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0%,hsl(var(--primary))_10%,transparent_28%)]"
    />
    <span className="relative flex items-center gap-2 rounded-full bg-background px-6 py-2.5 text-sm font-medium text-foreground">
      Always running
    </span>
  </button>
);

/* -------------------------------------------------------------------------- */
/*  5. Stateful submit                                                        */
/* -------------------------------------------------------------------------- */

type SubmitState = 'idle' | 'loading' | 'done';

const SUBMIT_LABEL: Record<SubmitState, { icon: typeof Send; text: string }> = {
  idle: { icon: Send, text: 'Send it' },
  loading: { icon: Loader2, text: 'Sending' },
  done: { icon: Check, text: 'Sent' },
};

export const SubmitButton = () => {
  const [state, setState] = useState<SubmitState>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const go = () => {
    if (state !== 'idle') return;
    setState('loading');
    timers.current.push(setTimeout(() => setState('done'), 1100));
    timers.current.push(setTimeout(() => setState('idle'), 2600));
  };

  const { icon: Icon, text } = SUBMIT_LABEL[state];

  return (
    <motion.button
      layout
      onClick={go}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className={
        state === 'done'
          ? 'flex items-center gap-2 rounded-full bg-primary/15 px-6 py-2.5 text-sm font-medium text-primary'
          : 'btn-primary px-6 py-2.5 text-sm'
      }
    >
      {/* mode="wait" matters: overlapping the two labels during the swap makes
          the width bounce, because layout measures both at once. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Icon className={state === 'loading' ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {text}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};

/* -------------------------------------------------------------------------- */
/*  6. Arrow relay                                                            */
/* -------------------------------------------------------------------------- */

export const ArrowButton = () => (
  <button className="btn-ghost group px-6 py-2.5 text-sm">
    Read the case
    {/* Two arrows in a clipped 1em box: one leaves right, the other arrives
        from the left. One arrow that just translates leaves an empty slot. */}
    <span aria-hidden className="relative block h-4 w-4 overflow-hidden">
      <ArrowRight className="absolute inset-0 h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-5" />
      <ArrowRight className="absolute inset-0 h-4 w-4 -translate-x-5 transition-transform duration-300 ease-out group-hover:translate-x-0" />
    </span>
  </button>
);

/* -------------------------------------------------------------------------- */
/*  7. Hold to confirm                                                        */
/* -------------------------------------------------------------------------- */

export const HoldButton = () => {
  const reduce = useReducedMotion();
  const [held, setHeld] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    if (confirmed) return;
    setHeld(true);
    timer.current = setTimeout(() => {
      setConfirmed(true);
      setHeld(false);
      timer.current = setTimeout(() => setConfirmed(false), 1600);
    }, 900);
  };

  const cancel = () => {
    if (!held) return;
    clearTimeout(timer.current);
    setHeld(false);
  };

  return (
    <button
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      className="relative select-none overflow-hidden rounded-full border border-destructive/40 bg-destructive/[0.07] px-6 py-2.5 text-sm font-medium text-destructive"
    >
      {/* The fill IS the timer — releasing early cancels both, so the control
          can't claim progress it isn't making. */}
      <motion.span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-destructive/20"
        animate={{ width: held ? '100%' : '0%' }}
        transition={{ duration: held && !reduce ? 0.9 : 0.18, ease: 'linear' }}
      />
      <span className="relative">{confirmed ? 'Deleted' : 'Hold to delete'}</span>
    </button>
  );
};
