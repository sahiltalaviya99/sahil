import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLenis } from 'lenis/react';
import { SECTIONS, type SectionId } from '@/content/site';

/** Height of the fixed nav, in px. Sections scroll to sit just below it. */
const NAV_OFFSET = -88;

/**
 * Scrolls to a section through Lenis.
 *
 * Replaces two separate hand-rolled implementations: the document-level anchor
 * click handler that used to live in Index.tsx and a duplicate window.scrollTo
 * in Navbar.tsx. Both are gone.
 *
 * Sections only exist on the home route, so calling this from /lab (the navbar,
 * the footer sitemap, the terminal's `open` command) has to route home first
 * and scroll on arrival — Index picks the target back up from the hash.
 */
export const useScrollToSection = () => {
  const lenis = useLenis();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(
    (id: SectionId | string) => {
      if (pathname !== '/') {
        navigate(`/#${id}`);
        return;
      }

      const target = document.getElementById(id);
      if (!target) return;

      if (lenis) {
        lenis.scrollTo(target, { offset: NAV_OFFSET, duration: 1.1 });
      } else {
        // Lenis not mounted yet (or reduced motion disabled it) — still works.
        window.scrollTo({ top: target.offsetTop + NAV_OFFSET, behavior: 'smooth' });
      }

      history.replaceState(null, '', `#${id}`);
    },
    [lenis, navigate, pathname],
  );
};

/**
 * Scrolls an element on the *current* page below the nav. No routing, no hash.
 *
 * Exists for the exhibit switchers on /lab and /motion. Swapping a tall exhibit
 * for a short one shrinks the document, the browser clamps scrollTop to the new
 * maximum, and you are silently dumped at the footer — having clicked something
 * you can no longer see. Anchoring back to the top of the switcher makes the
 * landing position deterministic instead of a function of what you just left.
 */
export const useScrollToElement = () => {
  const lenis = useLenis();

  return useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { offset: NAV_OFFSET, duration: 0.7 });
      else window.scrollTo({ top: el.offsetTop + NAV_OFFSET, behavior: 'smooth' });
    },
    [lenis],
  );
};

/**
 * Sends the page to the very top, instantly, through Lenis.
 *
 * `immediate` skips the easing — a route change is a cut, not a scroll — and
 * `force` makes it fire even when Lenis is stopped or prevented, which it is
 * while a dialog or the mobile drawer is open.
 *
 * Routed through Lenis rather than `window.scrollTo` on principle, not because
 * the raw call is broken: measured, Lenis resyncs from the native scroll event
 * and a following wheel notch moves normally. Going through it keeps
 * `targetScroll` and `animatedScroll` correct without depending on that.
 */
export const useScrollToTop = () => {
  const lenis = useLenis();

  return useCallback(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [lenis]);
};

/**
 * Every route change lands at the top. Mounted once, in SiteChrome.
 *
 * **This has to live above the route, not inside the page.** It used to be a
 * `window.scrollTo(0, 0)` effect in Lab.tsx and Motion.tsx, and both routes are
 * `React.lazy` — so the reset could not run until the chunk had downloaded.
 * Until it does, the route renders a Suspense fallback: the document collapses
 * from ~10,600px to fallback-plus-footer, the browser clamps scrollTop to that
 * new maximum, and you are looking at the footer of a page that hasn't loaded.
 * Leaving the Contact section for /lab opened it at the bottom.
 *
 * Reproduced with 600ms of emulated latency: /lab sat pinned at its clamped
 * maximum for the full three seconds of sampling, /motion for 2.5s. Undetectable
 * on localhost, where the chunk arrives in single-digit milliseconds — which is
 * why this survived a browser pass that only ever tested unthrottled.
 *
 * Central rather than one effect per page for the other half of it too: /404
 * never had one at all, so it inherited whatever offset you arrived with.
 */
export const useScrollTopOnNavigate = () => {
  const { pathname, hash } = useLocation();
  const toTop = useScrollToTop();

  useEffect(() => {
    // A `/#section` arrival owns its own scroll — see useHashLanding below.
    if (hash) return;

    toTop();
    /* Re-assert on the next frame. /lab and /motion are lazy, so what mounts
       first is the Suspense fallback; the real page arrives a tick later and
       grows the document under us. Without this the landing position depends on
       whether the chunk was already cached. */
    const raf = requestAnimationFrame(toTop);
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash, toTop]);
};

/**
 * On the home route, consume a `/#section` hash left by a cross-route jump.
 *
 * Runs after a frame: the sections have to be laid out before Lenis can be
 * told where to go, and on a fresh route render they aren't yet.
 */
export const useHashLanding = () => {
  const { hash } = useLocation();
  const lenis = useLenis();
  const scrollTo = useScrollToSection();

  useEffect(() => {
    const id = hash.replace(/^#/, '');
    if (!id || !document.getElementById(id)) return;

    const raf = requestAnimationFrame(() => {
      /* Re-measure before scrolling. Lenis caches the scrollable height and
         clamps every scrollTo to it — and arriving from /lab it is still
         holding *the lab's* limit, about 1,400px against the home page's
         10,600. Asking for #work therefore stranded you at 1,416: not the
         section, not the top, just wherever the previous page happened to end.
         Its ResizeObserver would catch up a frame or two later, which is one
         frame too late to be the thing that answers the click. */
      lenis?.resize();
      scrollTo(id);
    });
    return () => cancelAnimationFrame(raf);
  }, [hash, lenis, scrollTo]);
};

/**
 * Tracks which section is in view via IntersectionObserver rather than reading
 * getBoundingClientRect on every scroll event, which is what the old navbar did
 * for six sections on every frame.
 */
export const useActiveSection = (): SectionId => {
  const [active, setActive] = useState<SectionId>(SECTIONS[0].id);

  useEffect(() => {
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the viewport that's intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActive(visible[0].target.id as SectionId);
      },
      // Band across the upper-middle of the viewport: a section counts as
      // "active" once its content reaches reading position.
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return active;
};

/** True once the page has scrolled past `threshold` px. */
export const useScrolled = (threshold = 16) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
};
