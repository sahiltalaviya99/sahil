import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, ChevronDown, ExternalLink, Plus } from 'lucide-react';

import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/ui-kit/SectionHeading';
import { Monogram } from '@/components/ui-kit/Monogram';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  earlierWork,
  projectFilters,
  projects,
  statusLabel,
  type Project,
  type ProjectFilter,
} from '@/content/projects';
import { cn } from '@/lib/utils';
import { easeOutExpo } from '@/lib/motion';

const featured = projects.filter((p) => p.featured);
const rest = projects.filter((p) => !p.featured);

/** How many of the remaining projects show before "view all". */
const PREVIEW_COUNT = 6;

/** Small status pill. Live work says so; internal systems say that too. */
const StatusPill = ({ status }: { status: Project['status'] }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em]',
      status === 'live'
        ? 'border-primary/30 bg-primary/10 text-primary'
        : 'border-border bg-elevated text-muted-foreground',
    )}
  >
    <span
      className={cn(
        'h-1.5 w-1.5 rounded-full',
        status === 'live' ? 'bg-primary' : 'bg-muted-foreground/60',
      )}
    />
    {statusLabel[status]}
  </span>
);

/* -------------------------------------------------------------------------- */
/*  Featured — sticky stacking cards                                           */
/* -------------------------------------------------------------------------- */

/**
 * Each card sticks below the nav at a slightly deeper offset than the last, so
 * they physically stack as you scroll and the one beneath shrinks away.
 *
 * Built on CSS `position: sticky` rather than GSAP pinning — no pin-spacer
 * maths, nothing to recalculate on resize, and it degrades to plain stacked
 * cards below `lg` where the effect would just eat vertical space.
 */
const StackCard = ({
  project,
  index,
  total,
  onOpen,
}: {
  project: Project;
  index: number;
  total: number;
  onOpen: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 12%', 'end start'],
  });

  // Cards shrink and dim slightly as the next one slides over them.
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0.35]);

  return (
    <div
      ref={ref}
      className="lg:sticky"
      style={{ top: `calc(var(--nav-h) + 2rem + ${index * 1.1}rem)` }}
    >
      <motion.article
        style={{ scale, opacity }}
        className="surface overflow-hidden bg-surface/95 backdrop-blur-sm"
      >
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          {/* Visual */}
          <div className="relative aspect-[16/10] overflow-hidden border-b border-border lg:aspect-auto lg:min-h-[27rem] lg:border-b-0 lg:border-r">
            <Monogram project={project} />
          </div>

          {/* Copy */}
          <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
            <div className="min-w-0">
              <div className="mb-5 flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground/60">
                  {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden />
                <span className="font-mono text-xs text-muted-foreground">{project.year}</span>
              </div>

              <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2.4rem] lg:leading-[1.1]">
                {project.title}
              </h3>

              {/* Client is named but never linked — the ERP itself isn't
                  public, and linking their marketing site would imply it is. */}
              {project.client && (
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-primary">
                  {project.client}
                </p>
              )}

              <p className="mt-4 max-w-[52ch] leading-relaxed text-muted-foreground">
                {project.summary}
              </p>

              <p className="mt-5 border-l-2 border-primary/40 pl-4 text-sm leading-relaxed text-foreground/80">
                {project.outcome}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {project.tags.slice(0, 5).map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={onOpen} className="btn-primary text-sm">
                Case detail
                <Plus className="h-4 w-4" />
              </button>

              {project.demo ? (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-sm"
                >
                  Visit live
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <StatusPill status={project.status} />
              )}
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Remaining work — compact grid                                             */
/* -------------------------------------------------------------------------- */

const CompactCard = ({ project, onOpen }: { project: Project; onOpen: () => void }) => (
  <StaggerItem variant="fade-up" as="article" className="min-w-0">
    <button
      onClick={onOpen}
      className="surface-interactive group flex h-full w-full flex-col p-5 text-left sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight">
          {project.title}
        </h3>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      {project.client && (
        <p className="mt-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-primary/80">
          {project.client}
        </p>
      )}

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{project.summary}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {project.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="chip">
            {tag}
          </span>
        ))}
        {project.status === 'live' && (
          <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-widest text-primary">
            Live
          </span>
        )}
      </div>
    </button>
  </StaggerItem>
);

/* -------------------------------------------------------------------------- */

const ProjectsSection = () => {
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState<Project | null>(null);

  const matching = rest.filter((p) => filter === 'all' || p.kind === filter);
  const visible = showAll ? matching : matching.slice(0, PREVIEW_COUNT);
  const hidden = matching.length - visible.length;

  return (
    <section id="work" className="section-y relative">
      <div className="section-shell">
        <SectionHeading
          index="03"
          eyebrow="Selected work"
          title="Three ERP systems, and the automation layer around them."
          description="Enterprise platforms built end to end — schema, API, interface, tests, deployment — plus the client products and AI workflows behind them."
        />
      </div>

      {/* --- Featured stack --------------------------------------------- */}
      <div className="section-shell mt-14 lg:mt-20">
        <div className="space-y-6 lg:space-y-10">
          {featured.map((p, i) => (
            <StackCard
              key={p.id}
              project={p}
              index={i}
              total={featured.length}
              onOpen={() => setActive(p)}
            />
          ))}
        </div>
      </div>

      {/* --- Everything else -------------------------------------------- */}
      <div className="section-shell mt-20 lg:mt-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal variant="fade-up">
            <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              More work
            </h3>
          </Reveal>

          <Reveal variant="fade" delay={0.08}>
            <div className="flex flex-wrap gap-1 rounded-full border border-border bg-surface p-1">
              {projectFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilter(f.id);
                    setShowAll(false);
                  }}
                  aria-pressed={filter === f.id}
                  className={cn(
                    'relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-300 sm:text-sm',
                    filter === f.id
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {filter === f.id && (
                    <motion.span
                      layoutId="work-tab"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{f.label}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* auto-fill grid: column count follows the viewport, no breakpoint
            juggling, and it never strands one card in a wide row.
            `key` remounts it so the stagger replays on filter/expand. */}
        <Stagger
          key={`${filter}-${showAll}`}
          stagger={0.05}
          className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,19rem),1fr))]"
        >
          {visible.map((p) => (
            <CompactCard key={p.id} project={p} onOpen={() => setActive(p)} />
          ))}
        </Stagger>

        {matching.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">Nothing in this category yet.</p>
        )}

        {/* View all — the rest of the catalogue is one click away rather than
            dumped on the page. */}
        {hidden > 0 && (
          <Reveal variant="fade" className="mt-8 flex justify-center">
            <button onClick={() => setShowAll(true)} className="btn-ghost group text-sm">
              View all {matching.length} projects
              <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>
          </Reveal>
        )}

        {showAll && matching.length > PREVIEW_COUNT && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setShowAll(false)}
              className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-primary"
            >
              Show less
            </button>
          </div>
        )}

        {/* --- Earlier work ---------------------------------------------- */}
        <Reveal variant="fade-up" className="mt-16">
          <div className="surface p-6 sm:p-8">
            <h4 className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
              Earlier builds
            </h4>
            <ul className="mt-5 divide-y divide-border">
              {earlierWork.map((w) => (
                <li key={w.title}>
                  <a
                    href={w.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5 transition-colors hover:text-primary"
                  >
                    <span className="font-display font-semibold tracking-tight">{w.title}</span>
                    <span className="min-w-0 flex-1 text-sm text-muted-foreground">{w.note}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      {/* --- Detail dialog ------------------------------------------------
          Radix Dialog: focus trap, Escape, scroll lock and aria wiring all
          come for free. The previous hand-rolled modal had none of them. */}
      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[88svh] max-w-2xl overflow-y-auto rounded-2xl border-border bg-elevated p-0">
          {active && (
            <>
              <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl">
                <Monogram project={active} />
              </div>

              <div className="p-6 sm:p-8">
                <DialogHeader className="space-y-3 text-left">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill status={active.status} />
                    <span className="font-mono text-xs text-muted-foreground">{active.year}</span>
                  </div>

                  <DialogTitle className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {active.title}
                  </DialogTitle>

                  {active.client && (
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-primary">
                      {active.client}
                    </p>
                  )}

                  <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                    {active.detail}
                  </DialogDescription>
                </DialogHeader>

                <dl className="mt-7 grid gap-4 border-y border-border py-5 sm:grid-cols-2">
                  <div>
                    <dt className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground/70">
                      My role
                    </dt>
                    <dd className="mt-1.5 text-sm text-foreground">{active.role}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground/70">
                      Outcome
                    </dt>
                    <dd className="mt-1.5 text-sm text-foreground">{active.outcome}</dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap gap-2">
                  {active.tags.map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </div>

                {active.demo && (
                  <motion.a
                    href={active.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, ease: easeOutExpo }}
                    className="btn-primary mt-7 w-full sm:w-auto"
                  >
                    Visit live site
                    <ExternalLink className="h-4 w-4" />
                  </motion.a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ProjectsSection;
