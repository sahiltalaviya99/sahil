import type { Variants } from 'framer-motion';

/** Shared easing. Matches --ease-out-expo in index.css. */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

/** Viewport config used by every scroll reveal on the site. */
export const viewportOnce = { once: true, margin: '-12% 0px -12% 0px' } as const;

export type RevealVariant = 'fade' | 'fade-up' | 'blur-in' | 'mask' | 'scale' | 'slide-left' | 'slide-right';

export const revealVariants: Record<RevealVariant, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.7, ease: easeOutExpo } },
  },
  'fade-up': {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: easeOutExpo } },
  },
  'blur-in': {
    hidden: { opacity: 0, y: 18, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.85, ease: easeOutExpo },
    },
  },
  mask: {
    hidden: { opacity: 0, y: '55%' },
    visible: { opacity: 1, y: '0%', transition: { duration: 0.9, ease: easeOutExpo } },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: easeOutExpo } },
  },
  'slide-left': {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: easeOutExpo } },
  },
  'slide-right': {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: easeOutExpo } },
  },
};

/** Reduced-motion fallback: state changes still happen, they just don't move. */
export const reducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

