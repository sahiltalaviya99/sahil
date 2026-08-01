import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { systemLayers } from '@/content/site';
import { easeOutExpo, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * The About section's visual — a typographic index of the stack.
 *
 * An earlier version wrapped this in fake editor chrome (traffic-light dots, a
 * mono "system / end-to-end" title bar). That reads as generated: a window that
 * isn't a window, decorating content that didn't need decorating. This is set
 * as an index instead — numerals, hairline rules, generous space. No frame, no
 * card, no pretend UI.
 */
export const SystemStack = ({ className }: { className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, viewportOnce);

  return (
    <div ref={ref} className={cn('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-4 pb-5">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
          What I cover
        </p>
        <p className="font-mono text-[0.62rem] text-muted-foreground/50">
          {String(systemLayers.length).padStart(2, '0')}
        </p>
      </div>

      <ol className="border-t border-border">
        {systemLayers.map((layer, i) => (
          <motion.li
            key={layer.id}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{
              delay: reduce ? 0 : i * 0.09,
              duration: reduce ? 0.2 : 0.6,
              ease: easeOutExpo,
            }}
            className="group border-b border-border"
          >
            <div className="flex items-baseline gap-4 py-4 sm:gap-6 sm:py-5">
              <span className="w-7 shrink-0 font-mono text-[0.66rem] text-muted-foreground/45 transition-colors duration-300 group-hover:text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold tracking-tight transition-colors duration-300 group-hover:text-primary sm:text-xl">
                  {layer.label}
                </h3>
                {/* Long stack strings wrap rather than pushing the column wide. */}
                <p className="mt-1 break-words font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
                  {layer.stack}
                </p>
              </div>

              {/* A rule that draws in as the row arrives — the only ornament. */}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{
                  delay: reduce ? 0 : 0.25 + i * 0.09,
                  duration: reduce ? 0 : 0.7,
                  ease: easeOutExpo,
                }}
                className="hidden h-px w-10 origin-right bg-primary/40 sm:block"
              />
            </div>
          </motion.li>
        ))}
      </ol>

      <p className="pt-5 text-sm text-muted-foreground">
        <span className="text-foreground">One developer, every layer.</span> No hand-off gap
        where a feature stalls waiting on someone else&rsquo;s part of the stack.
      </p>
    </div>
  );
};
