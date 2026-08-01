import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Two-part cursor: a dot that tracks exactly, and a ring that lags behind it on
 * a spring. The lag is the whole effect — a ring that tracks perfectly reads as
 * a broken cursor rather than a designed one.
 *
 * Fine pointers only. On touch there is no hover position to track, and under
 * reduced motion a spring-chasing ring is exactly the kind of thing the setting
 * exists to suppress.
 */
export const CustomCursor = () => {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 260, damping: 26, mass: 0.5 });

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    setEnabled(true);

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);

      // Grow over anything clickable. Checked per-move via closest() rather
      // than by attaching listeners to every element on the page.
      const el = e.target as Element | null;
      setHovering(
        !!el?.closest?.('a, button, [role="button"], input, textarea, [data-cursor="grow"]'),
      );
    };

    const leave = () => setVisible(false);

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, [reduce, x, y]);

  if (!enabled) return null;

  return (
    <>
      {/* Dot — exact tracking */}
      <motion.div
        aria-hidden
        style={{ x, y }}
        animate={{ opacity: visible ? 1 : 0, scale: hovering ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none fixed left-0 top-0 z-[95] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-primary"
      />

      {/* Ring — lagging, inverts over whatever is beneath it */}
      <motion.div
        aria-hidden
        style={{ x: ringX, y: ringY }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: hovering ? 1.9 : 1,
          borderColor: hovering ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.45)',
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="pointer-events-none fixed left-0 top-0 z-[95] -ml-5 -mt-5 h-10 w-10 rounded-full border mix-blend-difference"
      />
    </>
  );
};
