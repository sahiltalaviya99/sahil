import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  reducedVariants,
  revealVariants,
  viewportOnce,
  type RevealVariant,
} from '@/lib/motion';

type RevealProps = Omit<HTMLMotionProps<'div'>, 'variants'> & {
  variant?: RevealVariant;
  /** Seconds. Use for hand-tuned sequencing; prefer <Stagger> for lists. */
  delay?: number;
  /** `mask` clips the child so it rises out of a hidden edge. */
  as?: 'div' | 'section' | 'li' | 'span' | 'article' | 'header';
};

/**
 * The single scroll-reveal primitive for the whole site.
 *
 * This replaces the previous per-section `useScroll` + `useTransform(opacity)`
 * pattern, which faded sections back OUT at the scroll extremes — meaning on
 * short viewports content could be invisible while it was on screen.
 * Reveals here are one-way: once shown, content stays shown.
 */
export const Reveal = ({
  variant = 'fade-up',
  delay = 0,
  className,
  children,
  as = 'div',
  ...props
}: RevealProps) => {
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;

  const variants = reduce ? reducedVariants : revealVariants[variant];
  const isMask = variant === 'mask' && !reduce;

  const node = (
    <Comp
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={variants}
      transition={{ delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </Comp>
  );

  // A mask reveal needs an overflow-hidden parent to clip against.
  return isMask ? <span className="block overflow-hidden">{node}</span> : node;
};

type StaggerProps = Omit<HTMLMotionProps<'div'>, 'variants'> & {
  stagger?: number;
  delayChildren?: number;
};

/** Parent for staggered lists. Children should be <StaggerItem>. */
export const Stagger = ({
  stagger = 0.08,
  delayChildren = 0,
  className,
  children,
  ...props
}: StaggerProps) => {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduce ? 0 : stagger,
            delayChildren: reduce ? 0 : delayChildren,
          },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

type StaggerItemProps = Omit<HTMLMotionProps<'div'>, 'variants'> & {
  variant?: RevealVariant;
  as?: 'div' | 'li' | 'article' | 'span';
};

export const StaggerItem = ({
  variant = 'fade-up',
  className,
  children,
  as = 'div',
  ...props
}: StaggerItemProps) => {
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;

  return (
    <Comp
      variants={reduce ? reducedVariants : revealVariants[variant]}
      className={cn(className)}
      {...props}
    >
      {children}
    </Comp>
  );
};
