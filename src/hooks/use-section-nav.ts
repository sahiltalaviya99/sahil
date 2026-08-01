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
 * On the home route, consume a `/#section` hash left by a cross-route jump.
 *
 * Runs after a frame: the sections have to be laid out before Lenis can be
 * told where to go, and on a fresh route render they aren't yet.
 */
export const useHashLanding = () => {
  const { hash } = useLocation();
  const scrollTo = useScrollToSection();

  useEffect(() => {
    const id = hash.replace(/^#/, '');
    if (!id || !document.getElementById(id)) return;
    const raf = requestAnimationFrame(() => scrollTo(id));
    return () => cancelAnimationFrame(raf);
  }, [hash, scrollTo]);
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
