import { useCallback, type PointerEvent } from 'react';

/**
 * Spread onto any element carrying the `.spotlight` class.
 *
 * Writes the pointer's position into --mx/--my as CSS custom properties, which
 * the `.spotlight::before` gradient in index.css reads. Because it mutates
 * custom properties directly rather than going through React state, moving the
 * cursor never triggers a re-render — this can sit on 15 cards at once without
 * costing anything.
 */
export const useSpotlight = () => {
  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);

  return { onPointerMove };
};
