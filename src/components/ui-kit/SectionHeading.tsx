import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion/Reveal';

type Props = {
  /** Small mono label above the title. */
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Two-digit section marker, e.g. "02". */
  index?: string;
  align?: 'left' | 'center';
  className?: string;
};

export const SectionHeading = ({
  eyebrow,
  title,
  description,
  index,
  align = 'left',
  className,
}: Props) => (
  <div
    className={cn(
      'flex flex-col gap-4',
      align === 'center' && 'items-center text-center',
      className,
    )}
  >
    <Reveal variant="fade" className="flex items-center gap-3">
      {index && (
        <span className="font-mono text-xs text-muted-foreground/60">{index}</span>
      )}
      <span className="h-px w-8 bg-primary/50" aria-hidden />
      <span className="eyebrow">{eyebrow}</span>
    </Reveal>

    <Reveal variant="mask" delay={0.05}>
      {/* max-w keeps headings from stretching into a single line on 4K. */}
      <h2 className={cn('section-title max-w-3xl', align === 'center' && 'mx-auto')}>
        {title}
      </h2>
    </Reveal>

    {description && (
      <Reveal variant="fade-up" delay={0.12}>
        <p className={cn('lead max-w-2xl', align === 'center' && 'mx-auto')}>
          {description}
        </p>
      </Reveal>
    )}
  </div>
);
