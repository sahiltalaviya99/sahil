import { forwardRef, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { Briefcase, GraduationCap } from 'lucide-react';

import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/ui-kit/SectionHeading';
import {
  experience,
  experienceFilters,
  type Entry,
  type ExperienceFilter,
} from '@/content/experience';
import { cn } from '@/lib/utils';
import { easeOutExpo } from '@/lib/motion';
import { useSpotlight } from '@/hooks/use-spotlight';

/**
 * `forwardRef` is required, not stylistic.
 *
 * The list below is an `AnimatePresence mode="popLayout"`, and popLayout works
 * by wrapping each child in framer's `PopChild`, which measures the exiting
 * element so the survivors can animate into its place — it needs a ref to do
 * that. A plain function component silently swallows the ref, so React logs
 * "Function components cannot be given refs. Check the render method of
 * PopChild" and the exit measurement is wrong.
 */
const TimelineEntry = forwardRef<HTMLLIElement, { entry: Entry }>(({ entry }, ref) => {
  const Icon = entry.type === 'work' ? Briefcase : GraduationCap;
  const spotlight = useSpotlight();

  return (
    <motion.li
      ref={ref}
      layout
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.55, ease: easeOutExpo }}
      className="relative pl-12 sm:pl-16"
    >
      {/* Node on the rail */}
      <span
        className={cn(
          'absolute left-0 top-1 grid h-9 w-9 place-items-center rounded-full border sm:h-11 sm:w-11',
          entry.current
            ? 'glow-sm border-primary/50 bg-primary/15 text-primary'
            : 'border-border bg-elevated text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4 sm:h-[1.1rem] sm:w-[1.1rem]" />
      </span>

      <div {...spotlight} className="surface-interactive spotlight p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
              {entry.title}
            </h3>
            <p className="mt-1 text-sm text-primary">{entry.org}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {entry.current && <span className="chip-primary">Current</span>}
            {/* Period wraps rather than truncating — long ranges stay legible. */}
            <span className="font-mono text-xs text-muted-foreground">{entry.period}</span>
          </div>
        </div>

        <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
          {entry.summary}
        </p>

        <ul className="mt-4 space-y-2">
          {entry.points.map((point) => (
            <li key={point} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span className="min-w-0">{point}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          {entry.skills.map((skill) => (
            <span key={skill} className="chip">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </motion.li>
  );
});

// forwardRef components have no inferred name, so React DevTools and any error
// stack would otherwise show "Anonymous" exactly where you need the name.
TimelineEntry.displayName = 'TimelineEntry';

const ExperienceSection = () => {
  const [filter, setFilter] = useState<ExperienceFilter>('all');
  const railRef = useRef<HTMLDivElement>(null);

  const visible = experience.filter((e) => filter === 'all' || e.type === filter);

  // The rail fills as the timeline scrolls past. Spring-smoothed so it tracks
  // Lenis rather than snapping frame to frame.
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ['start 80%', 'end 60%'],
  });
  const railScale = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.5 });

  return (
    <section id="experience" className="section-y relative">
      <div className="section-shell">
        <SectionHeading
          index="02"
          eyebrow="Experience & Education"
          title="Where I've built things, and what I learned first."
        />

        {/* Filters */}
        <Reveal variant="fade-up" className="mt-10">
          <div
            role="tablist"
            aria-label="Filter experience"
            className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-surface p-1"
          >
            {experienceFilters.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'relative min-h-11 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 sm:min-h-0',
                  filter === f.id
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {filter === f.id && (
                  <motion.span
                    layoutId="exp-tab"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* Timeline */}
        <div ref={railRef} className="relative mt-12">
          {/* Rail track + progress fill. Height is driven by content, so it
              can't overrun the last card the way the old h-full rail did. */}
          <div
            className="absolute bottom-0 left-[1.05rem] top-2 w-px bg-border sm:left-[1.3rem]"
            aria-hidden
          >
            <motion.div
              style={{ scaleY: railScale }}
              className="h-full w-full origin-top bg-gradient-to-b from-primary via-primary/60 to-transparent"
            />
          </div>

          <motion.ul layout className="space-y-8">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((entry) => (
                <TimelineEntry key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
