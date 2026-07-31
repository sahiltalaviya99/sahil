import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react';

import SplitText from '@/components/reactbits/SplitText';
import RotatingText from '@/components/reactbits/RotatingText';
import Magnet from '@/components/reactbits/Magnet';
import { site } from '@/content/site';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollToSection } from '@/hooks/use-section-nav';
import { easeOutExpo } from '@/lib/motion';

const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const scrollTo = useScrollToSection();

  // Parallax on scroll-out. Scoped to this section, so it can't affect
  // anything below it the way the old global scroll listener did.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '18%']);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pb-20 pt-[calc(var(--nav-h)+2rem)]"
    >
      <motion.div style={{ y, opacity: fade }} className="section-shell w-full">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          {/* --- Main column ------------------------------------------- */}
          <div className="min-w-0">
            {/* Availability */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.15 }}
              className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-primary/25 bg-primary/[0.07] py-1.5 pl-2.5 pr-4"
            >
              <span className="relative flex h-2 w-2">
                {site.available && (
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary" />
                )}
                <span className="relative h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-primary">
                {site.available ? 'Open to opportunities' : 'Currently engaged'}
              </span>
              <span className="hidden h-3 w-px bg-primary/25 xs:block" aria-hidden />
              <span className="hidden font-mono text-[0.68rem] tracking-wide text-muted-foreground xs:inline">
                @ {site.company}
              </span>
            </motion.div>

            {/* Name — GSAP SplitText, character by character */}
            <h1 className="mb-5">
              <span className="sr-only">
                {site.name} — {site.role}
              </span>

              <SplitText
                text={site.name}
                tag="span"
                textAlign="left"
                /* "words, chars" still animates per character, but wraps each
                   word as a unit — splitting on chars alone lets the name
                   break mid-word at ~360px. */
                splitType="words, chars"
                delay={28}
                duration={0.9}
                ease="power4.out"
                from={{ opacity: 0, y: 60, rotateX: -70 }}
                to={{ opacity: 1, y: 0, rotateX: 0 }}
                threshold={0.05}
                rootMargin="0px"
                /* Solid colour, not a bg-clip-text gradient: SplitText wraps
                   every character in its own transformed element, which breaks
                   background-clip painting inherited from an ancestor. */
                className="block font-display text-[clamp(2.5rem,10vw,7rem)] font-bold leading-[0.95] tracking-[-0.03em] text-foreground"
              />
            </h1>

            {/* Rotating role */}
            <div
              className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-[clamp(1.05rem,3.4vw,1.9rem)] font-medium tracking-tight"
              aria-hidden
            >
              <span className="text-muted-foreground">I work as a</span>
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
              transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.6 }}
              className="lead mb-10 max-w-xl text-balance"
            >
              {site.tagline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.72 }}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              {/* Magnet is pointer-driven — switched off on touch. Its wrapper
                  is display:inline-block, so it needs the width classes too or
                  the buttons won't reach the edges on a phone. */}
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

          {/* --- Meta column: fills the right on wide screens, wraps to a
                  simple row on small ones. -------------------------------- */}
          <motion.dl
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: easeOutExpo, delay: 0.85 }}
            className="flex shrink-0 flex-wrap gap-x-10 gap-y-6 border-t border-border/70 pt-6 lg:min-w-[15rem] lg:flex-col lg:gap-6 lg:border-l lg:border-t-0 lg:pb-2 lg:pl-8 lg:pt-0"
          >
            <div>
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground/60">
                Based in
              </dt>
              <dd className="mt-1.5 flex items-center gap-1.5 text-sm text-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {site.location}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground/60">
                Focus
              </dt>
              <dd className="mt-1.5 text-sm text-foreground">
                Next.js · Node · PostgreSQL · n8n
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground/60">
                Currently
              </dt>
              <dd className="mt-1.5 text-sm text-foreground">
                Building ERP systems @ {site.company}
              </dd>
            </div>
          </motion.dl>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.button
        onClick={() => scrollTo('about')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        style={{ opacity: fade }}
        className="absolute inset-x-0 bottom-6 mx-auto hidden w-fit flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary sm:flex"
        aria-label="Scroll to about section"
      >
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.25em]">Scroll</span>
        <motion.span
          animate={reduce ? {} : { y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="h-4 w-4" />
        </motion.span>
      </motion.button>
    </section>
  );
};

export default HeroSection;
