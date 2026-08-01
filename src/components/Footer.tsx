import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

import { Reveal } from '@/components/motion/Reveal';
import { Marquee } from '@/components/ui-kit/Marquee';
import { ROUTES, SECTIONS, site, socials } from '@/content/site';
import { useScrollToSection } from '@/hooks/use-section-nav';

const Footer = () => {
  const scrollTo = useScrollToSection();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/70">
      {/* Oversized name as a slow marquee — the site's sign-off. */}
      <Reveal variant="fade">
        <div className="overflow-hidden py-10 sm:py-14">
          <Marquee duration={38} pauseOnHover={false} itemClassName="gap-10 px-5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="flex shrink-0 items-center gap-10 whitespace-nowrap font-display text-[clamp(2.5rem,9vw,7rem)] font-bold uppercase tracking-tight text-foreground/[0.07]"
              >
                {site.name}
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary/40" aria-hidden />
              </span>
            ))}
          </Marquee>
        </div>
      </Reveal>

      <div className="section-shell pb-10">
        <div className="grid gap-10 border-t border-border/70 pt-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Pitch */}
          <div className="min-w-0">
            <p className="max-w-sm font-display text-lg font-semibold leading-snug tracking-tight">
              Available for full-stack, ERP and AI automation work.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-3 inline-block text-sm text-primary transition-opacity hover:opacity-80"
              style={{ overflowWrap: 'anywhere' }}
            >
              {site.email}
            </a>
            <p className="mt-1 text-sm text-muted-foreground">{site.location}</p>
          </div>

          {/* Sitemap — same SECTIONS array the navbar uses. */}
          <nav aria-label="Footer">
            <h2 className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground/70">
              Navigate
            </h2>
            <ul className="mt-4 space-y-2.5">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {s.label}
                  </button>
                </li>
              ))}
              {ROUTES.map((r) => (
                <li key={r.path}>
                  <Link
                    to={r.path}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Elsewhere */}
          <div>
            <h2 className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground/70">
              Elsewhere
            </h2>
            <ul className="mt-4 space-y-2.5">
              {socials.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target={s.download ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    download={s.download}
                    className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <s.icon className="h-3.5 w-3.5" />
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-6">
          <p className="font-mono text-xs text-muted-foreground">
            © {year} {site.name}
          </p>

          <p className="font-mono text-xs text-muted-foreground/70">
            React · TypeScript · Tailwind · Framer Motion · Lenis
          </p>

          <button
            onClick={() => scrollTo('home')}
            className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-primary"
          >
            Back to top
            <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
