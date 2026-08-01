import { Suspense, lazy, useEffect, useRef, type ComponentType } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ReactLenis, type LenisRef } from 'lenis/react';
import { cancelFrame, frame } from 'framer-motion';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SiteChrome } from '@/components/SiteChrome';
import { safeGet, safeSet } from '@/lib/safe-storage';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

/**
 * Code-split: the lab carries eight exhibits, a SQL parser, a BM25 index and a
 * CSV engine, and someone landing on the portfolio shouldn't download any of
 * it. Split here rather than per-exhibit — they're only ever reached through
 * this route, so one chunk is the right granularity.
 */
/**
 * `lazy`, plus one retry via a hard reload when the chunk itself can't be
 * fetched.
 *
 * This is a real failure mode, not a theoretical one. A tab left open across a
 * deploy still holds the old build's module graph, so `/assets/Lab-<oldhash>.js`
 * 404s and the import rejects with "Failed to fetch dynamically imported
 * module" — the visitor gets the error screen for a site that is working
 * perfectly for everyone who arrived after them. The same thing happens in dev
 * every time the server restarts. A reload fetches the current index.html and
 * the current hashes, and the problem evaporates.
 *
 * The session flag is the important half: without it a genuinely missing chunk
 * reloads forever, which is a far worse failure than the error screen. One
 * attempt, then let the boundary do its job.
 */
const lazyRoute = (name: string, load: () => Promise<{ default: ComponentType }>) =>
  lazy(() =>
    load().catch((error) => {
      const key = `chunk-retry:${name}`;
      if (safeGet(key)) throw error;
      safeSet(key, '1');
      window.location.reload();
      // Never resolves — the reload takes the page before React can react.
      return new Promise<{ default: ComponentType }>(() => {});
    }),
  );

const LabPage = lazyRoute('lab', () => import('./pages/Lab'));

/**
 * Split separately from the lab, not bundled with it. /motion carries six
 * animated backgrounds, five of them canvas scenes with their own noise field —
 * someone opening the SQL console should not be paying for a particle system.
 */
const MotionPage = lazyRoute('motion', () => import('./pages/Motion'));

/**
 * Sahil's private résumé editor. **Unlisted on purpose** — it is absent from
 * `ROUTES`, the footer sitemap and the ⌘K palette, and reachable only by typing
 * the path. Do not add a link to it; that is the requirement, not an oversight.
 *
 * Note where it sits in the tree below: outside `SiteChrome`, so it renders
 * without the navbar, footer, preloader and custom cursor. It is a tool, not a
 * page of the portfolio.
 */
const RESUME_PATH = '/sahil9909657018';
const ResumeBuilderPage = lazyRoute('resume', () => import('./pages/ResumeBuilder'));

/**
 * Clears a caught error when the route changes, so one bad page doesn't leave
 * every other page showing the fallback. Has to live inside the router to read
 * the location; the outer boundary in main.tsx stays as the last line of
 * defence for throws from the providers themselves.
 */
const RouteBoundary = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
};

/**
 * Lenis drives all scrolling on the site.
 *
 * `autoRaf: false` plus framer's own `frame` loop is deliberate — running
 * Lenis on its own requestAnimationFrame alongside framer-motion means two
 * tickers fighting over the same frame, which shows up as jitter on
 * scroll-linked animation.
 */
const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const update = (data: { timestamp: number }) => {
      lenisRef.current?.lenis?.raf(data.timestamp);
    };

    frame.update(update, true);
    return () => cancelFrame(update);
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        lerp: 0.09,
        wheelMultiplier: 1,
        // Native scrolling on touch — hijacking it there feels broken.
        syncTouch: false,
        /**
         * Without this, Lenis swallows every wheel event at the window and
         * drives the page with it, so nothing nested can scroll itself — the
         * Lab's execution log and API response pane, the terminal buffer, the
         * project and ERP dialogs, the ⌘K list and the mobile drawer were all
         * frozen.
         *
         * Chosen over tagging each container with `data-lenis-prevent`, which
         * disables Lenis for that whole subtree: reaching the bottom of the
         * execution log would then stop the page scrolling until you moved the
         * pointer out. `allowNestedScroll` detects the nested scroller and
         * honours `overscroll-behavior`, so the scroll chains back to the page
         * at the end — and it covers containers added later for free.
         */
        allowNestedScroll: true,
      }}
    >
      {children}
    </ReactLenis>
  );
};

const App = () => (
  <TooltipProvider delayDuration={200}>
    <SmoothScroll>
      <BrowserRouter>
        <RouteBoundary>
          <Routes>
            {/* Standalone, above the layout route — no chrome. */}
            <Route
              path={RESUME_PATH}
              element={
                <Suspense fallback={<div className="min-h-[100svh] bg-background" />}>
                  <ResumeBuilderPage />
                </Suspense>
              }
            />

            {/* Layout route: the navbar, footer, cursor and palette mount once
                and survive every navigation. Only the Outlet swaps. */}
            <Route element={<SiteChrome />}>
              <Route path="/" element={<Index />} />
              <Route
                path="/lab"
                element={
                  // Matches the page background, so the split reads as a beat
                  // rather than a flash of white.
                  <Suspense fallback={<div className="min-h-[100svh] bg-background" />}>
                    <LabPage />
                  </Suspense>
                }
              />
              <Route
                path="/motion"
                element={
                  <Suspense fallback={<div className="min-h-[100svh] bg-background" />}>
                    <MotionPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </RouteBoundary>
      </BrowserRouter>
    </SmoothScroll>
    <Toaster />
  </TooltipProvider>
);

export default App;
