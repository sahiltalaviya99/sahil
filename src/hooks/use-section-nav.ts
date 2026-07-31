import { useCallback, useEffect, useState } from 'react';
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
 */
export const useScrollToSection = () => {
  const lenis = useLenis();

  return useCallback(
    (id: SectionId | string) => {
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
    [lenis],
  );
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
