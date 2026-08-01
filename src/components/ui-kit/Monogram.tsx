import { cn } from '@/lib/utils';
import type { Project } from '@/content/projects';

/** Deterministic hue from a string, so a project always gets the same panel. */
const hueFrom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  // Bias towards the emerald→lime arc so covers stay inside the palette.
  return 120 + (h % 90);
};

const initials = (title: string) =>
  title
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

const kindLabel: Record<Project['kind'], string> = {
  erp: 'ERP System',
  product: 'Product',
  automation: 'Automation',
  qa: 'Quality Assurance',
};

/**
 * Cover art for a project card.
 *
 * Uses `project.cover` when a real screenshot exists; otherwise draws a
 * generated panel. The previous version filled every card with an unrelated
 * Unsplash/iStock stock photo, which read as filler on client work — a blank
 * honest panel is better than a stock photo of someone else's laptop.
 */
export const Monogram = ({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) => {
  if (project.cover) {
    return (
      <img
        src={project.cover}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn('h-full w-full object-cover', className)}
      />
    );
  }

  const hue = hueFrom(project.id);

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden bg-elevated', className)}
      style={{
        backgroundImage: `radial-gradient(120% 120% at 15% 10%, hsl(${hue} 65% 20% / 0.85), transparent 60%), radial-gradient(90% 90% at 90% 95%, hsl(${hue + 30} 70% 26% / 0.5), transparent 55%)`,
      }}
      aria-hidden
    >
      <div className="absolute inset-0 bg-grid opacity-[0.35]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span
          className="font-display text-5xl font-bold tracking-tight sm:text-6xl"
          style={{ color: `hsl(${hue} 70% 72% / 0.9)` }}
        >
          {initials(project.title)}
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/40">
          {kindLabel[project.kind]}
        </span>
      </div>

      {/* Bottom scrim so overlaid text keeps its contrast. */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
    </div>
  );
};
