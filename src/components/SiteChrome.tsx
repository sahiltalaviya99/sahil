import { Outlet } from 'react-router-dom';

import { useScrollTopOnNavigate } from '@/hooks/use-section-nav';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CommandPalette } from '@/components/CommandPalette';
import { Backdrop } from '@/components/ui-kit/Backdrop';
import { CustomCursor } from '@/components/fx/CustomCursor';
import { Preloader } from '@/components/fx/Preloader';

/**
 * The persistent shell: everything that is *not* the page.
 *
 * This exists because each page used to render its own `<Navbar />`,
 * `<Footer />`, `<Backdrop />`, `<CustomCursor />` and `<CommandPalette />`. On
 * a client-side navigation React therefore unmounted the entire chrome and
 * mounted a fresh copy of it, which looks exactly like a full page reload even
 * though no request is made: the header re-runs its entrance animation, the
 * scroll-progress bar snaps back, the custom cursor is destroyed and recreated
 * mid-movement, and the backdrop flashes.
 *
 * As a layout route the chrome mounts once for the life of the session and only
 * the `<Outlet />` swaps. That also makes the navbar's `layoutId="nav-pill"`
 * behave as designed — the pill *slides* from a section anchor to /lab instead
 * of the old element being destroyed and a new one fading in somewhere else.
 *
 * Keep page-specific things (the `<main>` wrapper, `document.title`) in the
 * pages. Only put something here if it should genuinely survive a route change.
 *
 * The scroll reset is the exception, and it belongs here precisely *because* the
 * chrome persists: nothing unmounts on navigation any more, so there is no
 * mount-time effect to hang it on except the pages themselves — and each page
 * doing it separately is how /404 ended up without one.
 */
export const SiteChrome = () => {
  // Arrive at the top of whatever you navigated to, not at the offset you left
  // the last page on. Goes through Lenis; see the hook for why that matters.
  useScrollTopOnNavigate();

  return (
    <>
      {/* Session-gated internally, so it doesn't replay on every navigation. */}
      <Preloader />
      <CustomCursor />
      <Backdrop />
      <Navbar />
      {/* Outside Navbar so the ⌘K listener doesn't depend on the header. */}
      <CommandPalette />

      <Outlet />

      <Footer />
    </>
  );
};
