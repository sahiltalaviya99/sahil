import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Layers, MousePointerClick, Sparkles, SquareStack } from 'lucide-react';

import { Reveal } from '@/components/motion/Reveal';
import { DemoTile } from '@/components/motion-lab/DemoTile';
import { DEMOS, GROUPS, type DemoGroup } from '@/components/motion-lab/registry';
import { site } from '@/content/site';
import { useScrollToElement } from '@/hooks/use-section-nav';
import { cn } from '@/lib/utils';
import { easeOutExpo } from '@/lib/motion';

/**
 * Motion — the interface layer, on its own route.
 *
 * Same shape as /lab and for the same reason: twenty-five live demos, six of
 * them animated canvases, do not belong stapled to the bottom of a portfolio,
 * and they don't fit in one Lab exhibit either. The Lab is about systems you
 * can run; this is about the interface those systems are wearing.
 *
 * One group is mounted at a time. That matters more here than on /lab — the
 * background scenes each own a RAF loop, and mounting all four canvases plus
 * the two CSS scenes at once to show the visitor six things they aren't looking
 * at is exactly the kind of waste this page is arguing against. `useCanvasScene`
 * additionally cancels the loop for any canvas scrolled out of view.
 */

const GROUP_META: Record<DemoGroup, { icon: typeof Layers; blurb: string }> = {
  Buttons: {
    icon: MousePointerClick,
    blurb:
      'Seven ways for a button to answer you. Each is fifteen-odd lines of framer-motion or plain CSS — the argument for writing them rather than installing them.',
  },
  Components: {
    icon: SquareStack,
    blurb:
      'The pieces an interface is actually assembled from: a rolling counter, a travelling tab indicator, a collapsing stack, a skeleton that matches its content.',
  },
  Advanced: {
    icon: Sparkles,
    blurb:
      'Motion values rather than React state. A dock that re-renders twelve items per pointermove holds 60fps in a demo and falls over in a real page — none of these touch the render cycle.',
  },
  Backgrounds: {
    icon: Layers,
    blurb:
      'Five canvas scenes and one built purely from transforms. All six read the theme tokens, so the terminal’s theme command recolours them; all six stop dead when scrolled out of view.',
  },
};

const MotionPage = () => {
  const reduce = useReducedMotion();
  // Opens on Backgrounds: it's the group that is already moving when you
  // arrive, and the one that makes the case for the page in one glance.
  const [group, setGroup] = useState<DemoGroup>('Backgrounds');
  const shown = DEMOS.filter((d) => d.group === group);

  const sectionRef = useRef<HTMLElement>(null);
  const scrollToElement = useScrollToElement();

  // Same re-anchor as /lab: switching groups changes the panel height a lot
  // (six 14rem background tiles vs seven small button tiles), and without this
  // the browser clamps the scroll position and drops you at the footer.
  const choose = (g: DemoGroup) => {
    setGroup(g);
    scrollToElement(sectionRef.current);
  };
  const meta = GROUP_META[group];

  useEffect(() => {
    document.title = `Motion — ${site.name}`;
    return () => {
      document.title = `${site.name} — ${site.role}`;
    };
  }, []);

  /* Scroll-to-top on arrival is SiteChrome's job now (useScrollTopOnNavigate).
     It used to be an effect here, which could not fire until this lazy chunk
     had downloaded — and until it does, the route renders a Suspense fallback,
     the document collapses to fallback + footer, and the browser clamps your
     scroll position to the bottom of that. Arriving from the Contact section
     therefore opened this page at its footer, for as long as the chunk took.

     It is also where `TypeError: destroy is not a function` came from: written
     as `useEffect(() => window.scrollTo(0, 0), [])`, the concise body returned
     scrollTo's value — undefined per spec, an object in Chrome 150 — and React
     called it as the cleanup on unmount, taking the route down. Never give an
     effect a concise body unless it genuinely returns a cleanup function. */

  return (
    <>
      <main className="pt-[calc(var(--nav-h)+3rem)]">
        <header className="section-shell">
          <Reveal variant="fade-up">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to the portfolio
            </Link>

            <h1 className="mt-5 max-w-3xl font-display text-[clamp(2rem,6vw,3.75rem)] font-bold leading-[1.03] tracking-tight">
              Twenty-five interactions, <span className="text-primary">and why each one is built that way.</span>
            </h1>

            <p className="lead mt-5 max-w-2xl">
              Six animated backgrounds, then buttons, components and motion-value work — every
              one of them framer-motion, canvas or plain CSS. No animation package was installed
              to make any of it, which is the point: most of what a library ships is fifteen
              lines you could read. Each tile carries its mechanism and the decision behind it.
            </p>
          </Reveal>
        </header>

        {/* mt-* is load-bearing: the sticky sidebar's first item otherwise sits
            directly against the last line of the lead paragraph above it, and
            at lg the two read as one collided block. /lab doesn't need this
            because the terminal sits between its header and its switcher. */}
        <section id="demos" ref={sectionRef} className="section-shell mt-12 pb-24 sm:mt-16 sm:pb-32">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-10">
            <nav aria-label="Groups" className="min-w-0">
              <div className="lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
                {/* Mobile: a scrolling chip row, same pattern as /lab. */}
                <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 lg:hidden">
                  {GROUPS.map((g) => {
                    const Icon = GROUP_META[g].icon;
                    return (
                      <button
                        key={g}
                        onClick={() => choose(g)}
                        className={cn(
                          'flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                          group === g
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {g}
                      </button>
                    );
                  })}
                </div>

                <ul className="hidden space-y-0.5 lg:block">
                  {GROUPS.map((g) => {
                    const Icon = GROUP_META[g].icon;
                    return (
                      <li key={g}>
                        <button
                          onClick={() => choose(g)}
                          aria-current={group === g ? 'true' : undefined}
                          className={cn(
                            'relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                            group === g ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {group === g && (
                            <motion.span
                              layoutId="motion-group-pill"
                              className="absolute inset-0 rounded-lg border border-primary/25 bg-primary/10"
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            />
                          )}
                          <Icon className="relative h-4 w-4 shrink-0" />
                          <span className="relative min-w-0 flex-1 truncate">{g}</span>
                          <span className="relative font-mono text-[0.62rem] text-muted-foreground/50">
                            {DEMOS.filter((d) => d.group === g).length}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-5 hidden border-t border-border/60 pt-4 text-[0.68rem] leading-relaxed text-muted-foreground/60 lg:block">
                  {reduce
                    ? 'Your system asks for reduced motion, so the canvases paint one frame and the rest is damped.'
                    : 'Everything here respects prefers-reduced-motion. Feedback that carries meaning stays; decoration stops.'}
                </p>
              </div>
            </nav>

            <div className="min-h-[34rem] min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={group}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: easeOutExpo }}
                >
                  <h2 className="font-display text-2xl font-bold tracking-tight">{group}</h2>
                  <p className="mb-5 mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {meta.blurb}
                  </p>

                  {/* Backgrounds want the full panel width; everything else
                      reflows on an intrinsic grid rather than at fixed
                      breakpoints, since the tiles are all one size. */}
                  <div
                    className={cn(
                      'grid gap-4',
                      group === 'Backgrounds'
                        ? 'grid-cols-1 xl:grid-cols-2'
                        : '[grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr))]',
                    )}
                  >
                    {shown.map((d) => (
                      <DemoTile key={d.id} demo={d} />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default MotionPage;
