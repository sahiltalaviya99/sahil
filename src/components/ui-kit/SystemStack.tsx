import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { systemLayers } from '@/content/site';
import { easeOutExpo, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * The About section's visual, in place of a portrait.
 *
 * It draws the actual argument the section makes — that one person covers the
 * whole vertical — as a connected stack of layers. The spine draws downward as
 * it enters view and each layer lights up behind it, so the animation reads as
 * "this connects all the way through" rather than as decoration.
 */
export const SystemStack = ({ className }: { className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, viewportOnce);

  /** Seconds. Layer n lights up as the spine reaches it. */
  const stepDelay = 0.14;

  return (
    <div ref={ref} className={cn('surface relative overflow-hidden', className)}>
      {/* Window chrome — reads as an editor/terminal without pretending to be
          a real screenshot. */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
        </div>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
          system / end-to-end
        </p>
      </div>

      <div className="relative bg-grid">
        {/* Dim the grid so the text stays legible over it. */}
        <div className="absolute inset-0 bg-surface/85" aria-hidden />

        <ol className="relative space-y-0 p-5 sm:p-6">
          {/* The spine. Drawn once, downward, as the block enters view. */}
          <div
            className="absolute bottom-6 left-[1.72rem] top-6 w-px bg-border sm:left-[1.97rem]"
            aria-hidden
          >
            <motion.div
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{
                duration: reduce ? 0 : systemLayers.length * stepDelay + 0.5,
                ease: 'easeInOut',
              }}
              className="h-full w-full origin-top bg-gradient-to-b from-primary via-primary to-primary/30"
            />
          </div>

          {systemLayers.map((layer, i) => (
            <motion.li
              key={layer.id}
              initial={{ opacity: 0, x: 12 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }}
              transition={{
                delay: reduce ? 0 : 0.25 + i * stepDelay,
                duration: reduce ? 0.2 : 0.5,
                ease: easeOutExpo,
              }}
              className="relative flex items-center gap-4 py-3"
            >
              {/* Node */}
              <span className="relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-primary/40 bg-elevated sm:h-8 sm:w-8">
                <span className="h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight text-foreground">{layer.label}</p>
                {/* Long stack strings must wrap, not push the card wide. */}
                <p className="mt-0.5 break-words font-mono text-[0.66rem] leading-relaxed text-muted-foreground">
                  {layer.stack}
                </p>
              </div>

              <span className="shrink-0 font-mono text-[0.6rem] text-muted-foreground/40">
                {String(i + 1).padStart(2, '0')}
              </span>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* Footer claim */}
      <div className="flex items-center gap-2 border-t border-border px-5 py-3.5">
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        <p className="font-mono text-[0.62rem] tracking-wide text-muted-foreground">
          one developer, every layer
        </p>
      </div>

      {/* Corner marks */}
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-primary/30" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-primary/30" />
    </div>
  );
};
