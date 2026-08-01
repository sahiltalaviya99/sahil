import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Code2, Globe, MapPin, Zap } from 'lucide-react';

import RotatingText from '@/components/reactbits/RotatingText';
import Magnet from '@/components/reactbits/Magnet';
import { AnimatedName } from '@/components/hero/AnimatedName';
import { HeroTerminal } from '@/components/hero/HeroTerminal';
import { DotField } from '@/components/fx/DotField';
import { Marquee } from '@/components/ui-kit/Marquee';
import { site, stats } from '@/content/site';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollToSection } from '@/hooks/use-section-nav';
import { easeOutExpo } from '@/lib/motion';

const statIcons = [Code2, Zap, Globe];

const CAPABILITIES = [
  'Enterprise ERP',
  'Next.js',
  'Node.js',
  'PostgreSQL',
  '.NET',
  'REST APIs',
  'n8n',
  'Zapier',
  'Make',
  'Playwright',
  'Deployment',
];

const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const scrollTo = useScrollToSection();

  // Parallax on scroll-out, scoped to this section so it can't affect
  // anything below it the way the old global scroll listener did.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '12%']);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0]);
  const markY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-22%']);

  return (
    <section
      id="home"
      ref={ref}
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pb-0 pt-[calc(var(--nav-h)+2rem)]"
    >
      {/* Reactive dot matrix — the layer that makes the hero feel alive. */}
      <DotField className="pointer-events-none absolute inset-0 h-full w-full opacity-70 mask-radial" />

      <motion.div style={{ y, opacity: fade }} className="section-shell relative w-full flex-1 flex flex-col justify-center">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-8 xl:gap-14">
          {/* ================= Left: the pitch ================= */}
          <div className="min-w-0">
            {/* Availability */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.15 }}
              className="mb-7 inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full border border-primary/25 bg-primary/[0.07] py-1.5 pl-2.5 pr-4 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                {site.available && !reduce && (
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary" />
                )}
                <span className="relative h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-primary">
                {site.available ? 'Open to opportunities' : 'Currently engaged'}
              </span>
              <span className="hidden h-3 w-px bg-primary/25 xs:block" aria-hidden />
              <span className="hidden font-mono text-[0.66rem] tracking-wide text-muted-foreground xs:inline">
                @ {site.company}
              </span>
            </motion.div>

            {/* Headline. The visible version is per-character spans, so it's
                aria-hidden and the sr-only span carries the real text. */}
            <h1
              className="mb-6 font-display text-[clamp(2.8rem,9vw,6.5rem)] font-bold leading-[0.94] tracking-[-0.045em]"
              style={{ perspective: 800 }}
            >
              <span className="sr-only">
                {site.name} — {site.role}
              </span>
              <AnimatedName text="Sahil" delay={0.3} />
              <AnimatedName text="Talaviya." accentWord={0} delay={0.42} />
            </h1>

            {/* Rotating role */}
            <div
              className="mb-7 flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-[clamp(1rem,3vw,1.55rem)] font-medium tracking-tight"
              aria-hidden
            >
              <span className="text-muted-foreground">I work as an</span>
              <RotatingText
                texts={[...site.roles]}
                rotationInterval={2600}
                staggerDuration={0.018}
                staggerFrom="first"
                splitBy="characters"
                mainClassName="inline-flex overflow-hidden rounded-lg bg-primary/10 px-3 py-1 text-primary"
                splitLevelClassName="overflow-hidden"
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              />
            </div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.75 }}
              className="lead mb-9 max-w-xl"
            >
              {site.tagline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.85 }}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              {/* Magnet's wrapper is inline-block — it needs the width classes
                  too or the buttons won't reach the edges on a phone. */}
              <Magnet
                padding={70}
                magnetStrength={5}
                disabled={isMobile || !!reduce}
                wrapperClassName="w-full sm:w-auto"
                innerClassName="w-full"
              >
                <button onClick={() => scrollTo('work')} className="btn-primary w-full sm:w-auto">
                  View selected work
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </Magnet>

              <Magnet
                padding={70}
                magnetStrength={5}
                disabled={isMobile || !!reduce}
                wrapperClassName="w-full sm:w-auto"
                innerClassName="w-full"
              >
                <button onClick={() => scrollTo('contact')} className="btn-ghost w-full sm:w-auto">
                  Get in touch
                </button>
              </Magnet>
            </motion.div>
          </div>

          {/* ================= Right: the shell =================
              A working terminal over the real content modules, not a mock
              interface — you can type into it. Fixed height with its own
              scrollbar, so the hero never resizes as output accumulates. */}
          {/* No `order-first` on mobile any more: the ASCII mark earned the top
              slot as a visual hook, but a shell above the name asks a visitor
              to operate something before they know whose page it is. */}
          <motion.div style={{ y: markY }} className="relative min-w-0">
            <HeroTerminal className="relative mx-auto w-full max-w-[30rem] lg:max-w-none" />
          </motion.div>
        </div>

        {/* Stats + meta */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOutExpo, delay: 1 }}
          className="mt-12 grid gap-6 border-t border-border/70 pt-7 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 xl:gap-14"
        >
          <dl className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr))]">
            {stats.map((s, i) => {
              const Icon = statIcons[i] ?? Code2;
              return (
                <div key={s.label} className="min-w-0">
                  <Icon className="mb-2 h-3.5 w-3.5 text-primary" />
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {s.value}
                      {s.suffix || '+'}
                    </span>
                    <span className="mt-1 block text-[0.7rem] leading-snug text-muted-foreground">
                      {s.label}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>

          <dl className="flex flex-wrap gap-x-8 gap-y-4 lg:justify-end">
            <div className="min-w-0">
              <dt className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground/60">
                Based in
              </dt>
              <dd className="mt-1.5 flex items-center gap-1.5 text-sm text-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                {site.location}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground/60">
                Currently
              </dt>
              <dd className="mt-1.5 text-sm text-foreground">
                Building ERP systems @ {site.company}
              </dd>
            </div>
          </dl>
        </motion.div>
      </motion.div>

      {/* Full-bleed capability marquee, pinned to the base of the hero. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.2 }}
        style={{ opacity: fade }}
        className="relative mt-10 border-y border-border/60 bg-surface/30 py-3.5 backdrop-blur-sm"
      >
        <Marquee duration={44} itemClassName="gap-7 px-3.5">
          {CAPABILITIES.map((c) => (
            <span
              key={c}
              className="flex shrink-0 items-center gap-7 whitespace-nowrap font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground"
            >
              {c}
              <span className="h-1 w-1 rounded-full bg-primary/60" aria-hidden />
            </span>
          ))}
        </Marquee>
      </motion.div>

      {/* Scroll cue */}
      <motion.button
        onClick={() => scrollTo('about')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        style={{ opacity: fade }}
        className="absolute bottom-20 right-5 hidden flex-col items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary xl:flex"
        aria-label="Scroll to about section"
      >
        <span className="[writing-mode:vertical-rl] font-mono text-[0.56rem] uppercase tracking-[0.3em]">
          Scroll
        </span>
        <motion.span
          animate={reduce ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </motion.span>
      </motion.button>
    </section>
  );
};

export default HeroSection;
