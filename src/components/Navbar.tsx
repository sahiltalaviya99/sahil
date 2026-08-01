import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { ArrowUpRight, Menu, Search, X } from 'lucide-react';

import { openCommandPalette } from '@/lib/command-palette';
import { ROUTES, SECTIONS, site } from '@/content/site';
import { useActiveSection, useScrollToSection, useScrolled } from '@/hooks/use-section-nav';
import { cn } from '@/lib/utils';
import { easeOutExpo } from '@/lib/motion';

/** Show ⌘ on Apple hardware, Ctrl everywhere else. */
const shortcutKey =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl ';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled(24);
  const active = useActiveSection();
  const scrollTo = useScrollToSection();
  const { pathname } = useLocation();
  const onHome = pathname === '/';

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40, mass: 0.4 });

  // Lock the page while the drawer is open, without the body.style.cssText
  // surgery the previous navbar did (which stomped every other body style).
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    // Let the drawer start closing before the scroll begins.
    setTimeout(() => scrollTo(id), menuOpen ? 180 : 0);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.2 }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={cn(
            'transition-[background-color,border-color,backdrop-filter] duration-500',
            scrolled
              ? 'border-b border-border/70 bg-background/70 backdrop-blur-xl'
              : 'border-b border-transparent bg-transparent',
          )}
        >
          <nav className="section-shell flex h-[var(--nav-h)] items-center justify-between gap-4">
            <button
              onClick={() => go('home')}
              className="group flex items-center gap-2.5 font-display text-lg font-bold tracking-tight"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary" />
                <span className="relative h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="transition-colors group-hover:text-primary">
                {site.shortName}
                <span className="text-primary">.</span>
              </span>
            </button>

            {/* Desktop links — the active pill is a shared layoutId, so it
                physically slides between items instead of cross-fading. */}
            <ul className="hidden items-center gap-1 lg:flex">
              {SECTIONS.map((s) => {
                // Sections only exist on the home route — off it, nothing in
                // this list is "current", and the pill belongs to the route link.
                const isActive = onHome && active === s.id;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => go(s.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-full border border-primary/25 bg-primary/10"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative">{s.label}</span>
                    </button>
                  </li>
                );
              })}

              {ROUTES.map((r) => {
                const isActive = pathname === r.path;
                return (
                  <li key={r.path}>
                    <Link
                      to={r.path}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'relative block rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300',
                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-full border border-primary/25 bg-primary/10"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative">{r.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-2">
              {/* ⌘K trigger. Doubles as the affordance that tells people the
                  palette exists at all — a hidden shortcut nobody discovers
                  is the same as no shortcut. */}
              <button
                onClick={openCommandPalette}
                aria-label="Open command palette"
                className="hidden items-center gap-2 rounded-full border border-border py-2 pl-3.5 pr-2 text-sm text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:text-primary lg:inline-flex"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Jump to…</span>
                <kbd className="rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-[0.62rem] leading-none">
                  {shortcutKey}K
                </kbd>
              </button>

              <a
                href={site.resume}
                download
                className="hidden items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/50 hover:text-primary sm:inline-flex"
              >
                Résumé
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>

              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className="grid h-11 w-11 place-items-center rounded-full border border-border transition-colors hover:border-primary/50 hover:text-primary lg:hidden"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>
        </div>

        {/* Scroll progress */}
        <motion.div
          style={{ scaleX: progress }}
          className="h-px origin-left bg-gradient-to-r from-primary via-primary-hi to-signal"
        />
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            />

            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.5, ease: easeOutExpo }}
              className="fixed inset-x-0 top-0 z-40 max-h-[100dvh] overflow-y-auto border-b border-border bg-surface pb-8 pt-[var(--nav-h)] lg:hidden"
            >
              <ul className="section-shell flex flex-col pt-4">
                {SECTIONS.map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: easeOutExpo }}
                  >
                    <button
                      onClick={() => go(s.id)}
                      className={cn(
                        'flex w-full items-baseline gap-4 border-b border-border/60 py-4 text-left',
                        onHome && active === s.id ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      <span className="font-mono text-xs text-muted-foreground/60">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-display text-2xl font-semibold tracking-tight">
                        {s.label}
                      </span>
                    </button>
                  </motion.li>
                ))}

                {ROUTES.map((r, i) => (
                  <motion.li
                    key={r.path}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.08 + (SECTIONS.length + i) * 0.05,
                      duration: 0.4,
                      ease: easeOutExpo,
                    }}
                  >
                    <Link
                      to={r.path}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'flex w-full items-baseline gap-4 border-b border-border/60 py-4 text-left',
                        pathname === r.path ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      <span className="font-mono text-xs text-muted-foreground/60">
                        {String(SECTIONS.length + i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-display text-2xl font-semibold tracking-tight">
                        {r.label}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <div className="section-shell mt-6">
                <a
                  href={site.resume}
                  download
                  onClick={() => setMenuOpen(false)}
                  className="btn-primary w-full"
                >
                  Download résumé
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
