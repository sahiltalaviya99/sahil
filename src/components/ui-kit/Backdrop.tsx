import { cn } from '@/lib/utils';

/**
 * Ambient page background: a faint technical grid with slow-drifting emerald
 * aurora behind it.
 *
 * This replaces the old three.js/@react-three particle field, which pulled in
 * roughly 600KB of renderer to draw 5000 dots behind the hero. Pure CSS here —
 * no WebGL context, no per-frame JS, and it degrades to a static gradient under
 * prefers-reduced-motion.
 */
export const Backdrop = ({ className }: { className?: string }) => (
  <div
    className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}
    aria-hidden
  >
    {/* Base wash */}
    <div className="absolute inset-0 bg-background" />

    {/* Technical grid, faded out towards the edges */}
    <div className="absolute inset-0 bg-grid mask-radial opacity-[0.55]" />

    {/* Drifting colour. Blur is large and blobs are few — cheap to composite. */}
    <div
      className="aurora-blob left-[-10%] top-[-8%] h-[38rem] w-[38rem] animate-aurora bg-primary/[0.13]"
      style={{ animationDelay: '-4s' }}
    />
    <div className="aurora-blob right-[-12%] top-[35%] h-[30rem] w-[30rem] animate-aurora bg-signal/[0.07]" />
    <div
      className="aurora-blob bottom-[-10%] left-[25%] h-[34rem] w-[34rem] animate-aurora bg-primary/[0.09]"
      style={{ animationDelay: '-9s' }}
    />

    {/* Film grain — texture, not noise. */}
    <div className="absolute inset-0 grain" />

    {/* Vignette so the content column always reads against something calm. */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,hsl(var(--background))_100%)]" />
  </div>
);
