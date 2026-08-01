import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { site } from '@/content/site';
import { easeOutExpo } from '@/lib/motion';
import { safeGet, safeSet } from '@/lib/safe-storage';

const STAGES = ['filesystem', 'content modules', 'automation layer', 'interface'];

/**
 * Intro sequence.
 *
 * Runs once per browser session (sessionStorage), not once per page load —
 * replaying it every time someone navigates back would go from "considered" to
 * "obstructive" fast. Skipped entirely under reduced motion.
 *
 * It also does real work for the perceived-quality budget: the fonts are
 * variable and self-hosted, so this covers the moment they swap in rather than
 * letting the visitor watch it.
 */
const SESSION_KEY = 'st_intro_seen';

export const Preloader = () => {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduce) return;
    // safeGet, not sessionStorage directly — a browser with site data blocked
    // throws on the property access, and a throw here unmounts the whole app.
    if (safeGet(SESSION_KEY)) return;

    setVisible(true);
    document.body.style.overflow = 'hidden';

    const DURATION = 1500;
    const start = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      // Ease-out so it decelerates into 100 instead of hitting it flat.
      setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const done = setTimeout(() => {
      safeSet(SESSION_KEY, '1');
      setVisible(false);
      document.body.style.overflow = '';
    }, DURATION + 320);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
      document.body.style.overflow = '';
    };
  }, [reduce]);

  const stage = STAGES[Math.min(Math.floor(progress / 26), STAGES.length - 1)];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.85, ease: easeOutExpo }}
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-background px-6 py-8 sm:px-10 sm:py-12"
        >
          {/* Top: identity */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="flex items-center gap-2.5"
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-display text-lg font-bold tracking-tight">
              {site.shortName}
              <span className="text-primary">.</span>
            </span>
          </motion.div>

          {/* Middle: counter */}
          <div className="flex flex-1 items-center">
            <div className="w-full">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-muted-foreground"
              >
                Initialising {stage}
              </motion.p>

              <div className="flex items-end justify-between gap-6">
                <span className="font-display text-[clamp(4rem,18vw,11rem)] font-bold leading-none tracking-[-0.05em] text-foreground">
                  {String(progress).padStart(3, '0')}
                </span>
                <span className="pb-2 font-mono text-sm text-primary sm:pb-4 sm:text-base">%</span>
              </div>
            </div>
          </div>

          {/* Bottom: progress rule */}
          <div>
            <div className="h-px w-full bg-border">
              <motion.div
                className="h-full origin-left bg-primary"
                style={{ scaleX: progress / 100 }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                {site.role}
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground/50">
                {site.location}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
