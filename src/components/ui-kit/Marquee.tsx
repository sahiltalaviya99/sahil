import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  /** Seconds for one full pass. Longer = slower. */
  duration?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  itemClassName?: string;
};

/**
 * CSS-only infinite marquee — no JS ticker, no scroll listener, and it keeps
 * running smoothly while the main thread is busy.
 *
 * The track is rendered twice and translated by -50%, so the second copy lands
 * exactly where the first started. `aria-hidden` on the duplicate keeps screen
 * readers from reading everything twice.
 */
export const Marquee = ({
  children,
  duration = 40,
  reverse = false,
  pauseOnHover = true,
  className,
  itemClassName,
}: Props) => (
  <div
    className={cn('group relative w-full overflow-hidden mask-fade-x', className)}
    style={{ ['--marquee-duration' as string]: `${duration}s` }}
  >
    <div
      className={cn(
        'flex w-max shrink-0',
        reverse ? 'animate-marquee-reverse' : 'animate-marquee',
        pauseOnHover && 'group-hover:[animation-play-state:paused]',
      )}
    >
      <div className={cn('flex shrink-0 items-center', itemClassName)}>{children}</div>
      <div className={cn('flex shrink-0 items-center', itemClassName)} aria-hidden>
        {children}
      </div>
    </div>
  </div>
);
