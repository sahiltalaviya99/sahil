import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { easeOutExpo } from '@/lib/motion';

/**
 * The hero name: staggered entrance plus a proximity-reactive hover.
 *
 * Hovering a character lifts it *and* its neighbours on a falloff, so the whole
 * word ripples rather than one letter popping in isolation — the isolated-pop
 * version reads as a bug.
 *
 * Written by hand rather than using GSAP SplitText because that only gives an
 * entrance; owning the markup means the same characters can carry the hover
 * interaction, and it let us drop GSAP from the bundle entirely.
 */
type Props = {
  text: string;
  /** Word index (0-based) to tint with the accent colour. */
  accentWord?: number;
  /** Seconds before the first character animates in. */
  delay?: number;
  className?: string;
};

/** How far the ripple spreads, in characters. */
const FALLOFF = 2.6;

export const AnimatedName = ({ text, accentWord, delay = 0, className }: Props) => {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);

  const words = text.split(' ');
  let charCursor = 0;

  return (
    <span
      className={cn('block', className)}
      onPointerLeave={() => setHovered(null)}
      aria-hidden
    >
      {words.map((word, wordIndex) => {
        const chars = word.split('');
        const node = (
          <span
            key={wordIndex}
            // inline-block keeps each word whole — letting characters wrap
            // individually breaks the name mid-word on a narrow screen.
            className={cn(
              'inline-block whitespace-nowrap',
              accentWord === wordIndex ? 'text-primary' : 'text-foreground',
            )}
          >
            {chars.map((char) => {
              const index = charCursor++;
              const distance = hovered === null ? Infinity : Math.abs(index - hovered);
              const lift = reduce ? 0 : Math.max(0, 1 - distance / FALLOFF);

              return (
                <motion.span
                  key={index}
                  className="inline-block will-change-transform"
                  onPointerEnter={() => setHovered(index)}
                  initial={{ opacity: 0, y: '0.45em', rotateX: -55, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                  transition={{
                    duration: reduce ? 0.2 : 0.85,
                    ease: easeOutExpo,
                    delay: reduce ? 0 : delay + index * 0.035,
                  }}
                  style={{ transformOrigin: 'bottom center' }}
                >
                  <motion.span
                    className="inline-block"
                    animate={{
                      y: -lift * 12,
                      scale: 1 + lift * 0.06,
                    }}
                    transition={{ type: 'spring', stiffness: 340, damping: 20 }}
                  >
                    {char}
                  </motion.span>
                </motion.span>
              );
            })}
            {/* Real space between words, sized to the font. */}
            {wordIndex < words.length - 1 && <span className="inline-block w-[0.28em]" />}
          </span>
        );
        return node;
      })}
    </span>
  );
};
