import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/ui-kit/SectionHeading';
import { site, socials } from '@/content/site';

const ContactSection = () => {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some contexts (insecure origin, permissions) —
      // fall back to just opening the mail client rather than failing silently.
      toast.error('Could not copy — opening your mail app instead');
      window.location.href = `mailto:${site.email}`;
    }
  };

  return (
    <section id="contact" className="section-y relative">
      <div className="section-shell">
        <SectionHeading
          index="05"
          eyebrow="Contact"
          title={
            <>
              Got something that needs building — <span className="text-primary">or automating?</span>
            </>
          }
          description="I'm open to full-stack builds, ERP and business systems, and AI automation work. The fastest way to reach me is email; I reply within a day."
        />

        {/* --- The email, as the main event ---------------------------- */}
        <Reveal variant="blur-in" className="mt-12 lg:mt-16">
          <div className="surface relative overflow-hidden p-6 sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" aria-hidden />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Write to me
                </p>

                <a
                  href={`mailto:${site.email}`}
                  className="mt-2 block font-display text-[clamp(1.15rem,4.2vw,2.5rem)] font-bold tracking-tight transition-colors hover:text-primary"
                  // Long address on a 360px screen must break, not overflow.
                  style={{ overflowWrap: 'anywhere' }}
                >
                  {site.email}
                </a>
              </div>

              <button
                onClick={copyEmail}
                className="btn-ghost shrink-0 self-start lg:self-auto"
                aria-label="Copy email address"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-primary" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy address
                  </>
                )}
              </button>
            </div>
          </div>
        </Reveal>

        {/* --- Everywhere else ----------------------------------------- */}
        <Stagger
          stagger={0.08}
          className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]"
        >
          {socials.map((s) => (
            <StaggerItem key={s.name} variant="fade-up">
              <a
                href={s.href}
                target={s.download ? undefined : '_blank'}
                rel="noopener noreferrer"
                download={s.download}
                className="surface-interactive group flex h-full items-center gap-4 p-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-elevated text-muted-foreground transition-colors duration-300 group-hover:border-primary/40 group-hover:text-primary">
                  <s.icon className="h-4 w-4" />
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-medium">{s.name}</span>
                  <span
                    className="block truncate text-xs text-muted-foreground"
                    title={s.handle}
                  >
                    {s.handle}
                  </span>
                </span>
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
};

export default ContactSection;
