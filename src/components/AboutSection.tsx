import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

import CountUp from '@/components/reactbits/CountUp';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/ui-kit/SectionHeading';
import { SystemStack } from '@/components/ui-kit/SystemStack';
import { stats } from '@/content/site';

const paragraphs = [
  <>
    I build complete systems, not slices of them. Right now that means three enterprise{' '}
    <strong className="font-medium text-foreground">ERP platforms</strong> — a two-branch hospital
    with a ten-bed inpatient ward, an HVAC and refrigeration business, and a candle manufacturer
    running retail, wholesale and custom production side by side. Database schema through to
    interface, end-to-end tests, and the deployment.
  </>,
  <>
    The stack is <strong className="font-medium text-foreground">Next.js</strong>,{' '}
    <strong className="font-medium text-foreground">React</strong>,{' '}
    <strong className="font-medium text-foreground">Node</strong> and{' '}
    <strong className="font-medium text-foreground">PostgreSQL</strong>, with{' '}
    <strong className="font-medium text-foreground">.NET</strong> where a client’s environment calls
    for it, and <strong className="font-medium text-foreground">Playwright</strong> covering the
    critical paths so a release never rests on someone remembering to click through it.
  </>,
  <>
    The other half of the job is automation. I build AI-driven workflows in{' '}
    <strong className="font-medium text-foreground">n8n</strong>,{' '}
    <strong className="font-medium text-foreground">Zapier</strong> and{' '}
    <strong className="font-medium text-foreground">Make</strong> that take recurring work off
    people’s desks entirely — documents that generate themselves, invoices that raise on approval,
    job posts that distribute the day they go live.
  </>,
];

const AboutSection = () => {
  const portraitRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Gentle counter-scroll on the portrait so the two columns don't move as one
  // solid block.
  const { scrollYProgress } = useScroll({
    target: portraitRef,
    offset: ['start end', 'end start'],
  });
  const portraitY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['6%', '-6%']);

  return (
    <section id="about" className="section-y relative">
      <div className="section-shell">
        <SectionHeading
          index="01"
          eyebrow="About"
          title={
            <>
              I build the whole system <span className="text-primary">—</span> and the automation
              that runs it.
            </>
          }
        />

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          {/* --- Prose ------------------------------------------------- */}
          <div className="min-w-0">
            <Stagger stagger={0.12} className="space-y-6">
              {paragraphs.map((p, i) => (
                <StaggerItem key={i} variant="blur-in">
                  {/* Capped measure — full-column text is unreadable at 1920px. */}
                  <p className="max-w-[62ch] text-[1.02rem] leading-[1.75] text-muted-foreground">
                    {p}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>

            {/* Stats — every figure derives from the project/experience data. */}
            <Stagger
              stagger={0.1}
              delayChildren={0.15}
              className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border xs:grid-cols-3"
            >
              {stats.map((s) => (
                <StaggerItem key={s.label} variant="fade-up" className="bg-surface p-5 sm:p-6">
                  <div className="font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                    <CountUp to={s.value} duration={1.6} />
                    {s.suffix}
                  </div>
                  <p className="mt-2 text-sm leading-snug text-muted-foreground">{s.label}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          {/* --- System stack -------------------------------------------
              Deliberately not a portrait. Sahil doesn't want a photo of
              himself on the site, and this makes the section's own argument
              visually instead: one person, every layer of the stack. */}
          <div ref={portraitRef} className="lg:pt-2">
            <Reveal variant="scale">
              <motion.div style={{ y: portraitY }} className="lg:sticky lg:top-28">
                <SystemStack />
              </motion.div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
