import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Code2, Copy } from 'lucide-react';
import { toast } from 'sonner';

import type { Demo } from './registry';
import { cn } from '@/lib/utils';

/**
 * One demo: the running component, the reason it is built that way, and the
 * mechanism behind it on a toggle.
 *
 * The code panel is deliberately *not* open by default. A wall of twenty-five
 * expanded snippets is a file listing; the animation is what someone came for,
 * and the reasoning is what they stay for.
 */
export const DemoTile = ({ demo }: { demo: Demo }) => {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(demo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access is permission-gated and throws outright when blocked;
      // a failed copy should not take the tile down with it.
      toast.error('Clipboard blocked by the browser.');
    }
  };

  return (
    <div className="surface flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
        <p className="min-w-0 truncate font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
          {demo.label}
        </p>
        <button
          onClick={() => setShowCode((v) => !v)}
          aria-expanded={showCode}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] transition-colors',
            showCode
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          <Code2 className="h-3 w-3" />
          Code
        </button>
      </div>

      {/* Stage. Backgrounds fill it edge to edge and get more height; the rest
          are centred on a dotted field with a fixed minimum so the grid keeps
          its rhythm regardless of what a demo happens to measure.

          Both heights are `min-h-*`, never `h-*`. `flex-1` is `flex: 1 1 0%`,
          and in a column flex container that 0% basis beats a plain `height` —
          the stage collapses to nothing and the background, whose canvas is
          absolutely positioned and contributes no height of its own, vanishes.
          A min-height clamps the flex sizing instead of losing to it. */}
      <div
        className={cn(
          'relative flex flex-1 items-center justify-center overflow-hidden',
          demo.full ? 'min-h-[14rem] bg-background' : 'min-h-[9.5rem] bg-dots px-4 py-6',
        )}
      >
        <demo.Component />
      </div>

      <p className="border-t border-border/60 px-4 py-3 text-[0.72rem] leading-relaxed text-muted-foreground/80">
        {demo.note}
      </p>

      <AnimatePresence initial={false}>
        {showCode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border/60 bg-background"
          >
            <div className="relative">
              <button
                onClick={copy}
                className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {/* Scrolls inside its own pane — Lenis is configured with
                  allowNestedScroll, so this chains back to the page at the end
                  instead of trapping the scroll. */}
              <pre className="max-h-72 overflow-auto p-4 pr-16 font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
                <code>{demo.code}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
