import { motion, useReducedMotion } from 'framer-motion';

import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/ui-kit/SectionHeading';
import { Marquee } from '@/components/ui-kit/Marquee';
import {
  allSkillNames,
  coreStack,
  levelValue,
  skillGroups,
  strengths,
} from '@/content/skills';
import { viewportOnce, easeOutExpo } from '@/lib/motion';

/** Proficiency bar — this is what the old `level` / `levelMap` data was for. */
const ProficiencyBar = ({ name, value, level }: { name: string; value: number; level: string }) => {
  const reduce = useReducedMotion();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-medium">{name}</span>
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.15em] text-muted-foreground">
          {level}
        </span>
      </div>

      <div
        className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-border"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${name}: ${level}`}
      >
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: value / 100 }}
          viewport={viewportOnce}
          transition={{ duration: reduce ? 0 : 1.1, ease: easeOutExpo }}
          className="h-full w-full origin-left rounded-full bg-gradient-to-r from-primary to-primary-hi"
        />
      </div>
    </div>
  );
};

const SkillsSection = () => (
  <section id="skills" className="section-y relative">
    <div className="section-shell">
      <SectionHeading
        index="04"
        eyebrow="Capabilities"
        title="Every layer, not just the one people see."
        description="Weighted honestly — advanced means I've shipped production work with it, not that I've read the docs."
      />

      <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* --- Core stack, with proficiency ---------------------------- */}
        <div className="min-w-0">
          <h3 className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
            Core stack
          </h3>

          <Stagger stagger={0.09} className="mt-6 space-y-6">
            {coreStack.map((s) => (
              <StaggerItem key={s.name} variant="fade-up">
                <ProficiencyBar name={s.name} value={levelValue[s.level]} level={s.level} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        {/* --- Grouped breadth ----------------------------------------- */}
        <div className="min-w-0">
          <Stagger
            stagger={0.08}
            className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,16rem),1fr))]"
          >
            {skillGroups.map((group) => (
              <StaggerItem
                key={group.id}
                variant="fade-up"
                as="article"
                className="surface-interactive min-w-0 p-5"
              >
                <h3 className="font-display font-semibold tracking-tight">{group.label}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {group.blurb}
                </p>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {group.skills.map((s) => (
                    <li
                      key={s.name}
                      className="rounded-md border border-border/70 bg-elevated/60 px-2 py-1 text-xs text-foreground/85"
                      title={s.level}
                    >
                      {s.name}
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>

      {/* --- How I work ------------------------------------------------ */}
      <Stagger
        stagger={0.08}
        className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]"
      >
        {strengths.map((s) => (
          <StaggerItem key={s.title} variant="fade" className="bg-surface p-5 sm:p-6">
            <h4 className="font-display font-semibold tracking-tight text-primary">{s.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </div>

    {/* --- Full-bleed marquee ------------------------------------------
        Text rather than logos: the old version hotlinked 31 brand icons from
        three different CDNs with no fallback, and the colours fought the
        palette. This costs nothing and stays on-brand. */}
    <Reveal variant="fade" className="mt-16 lg:mt-24">
      <div className="border-y border-border/70 py-6">
        <Marquee duration={52} itemClassName="gap-8 px-4">
          {allSkillNames.map((name) => (
            <span
              key={name}
              className="flex shrink-0 items-center gap-8 whitespace-nowrap font-display text-lg font-medium tracking-tight text-foreground/35 transition-colors hover:text-primary sm:text-xl"
            >
              {name}
              <span className="h-1 w-1 rounded-full bg-primary/50" aria-hidden />
            </span>
          ))}
        </Marquee>
      </div>
    </Reveal>
  </section>
);

export default SkillsSection;
