import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Timer } from 'lucide-react';

import {
  SIZES,
  isSolvable,
  isSolved,
  movableTiles,
  placedCount,
  shuffle,
  slide,
  type Board,
  type Size,
} from '@/lib/sliding-puzzle';
import { cn } from '@/lib/utils';

/**
 * The 15-puzzle, guaranteed solvable.
 *
 * Exactly half of all tile permutations are unreachable from the solved state.
 * Shuffle naively and roughly one game in two is impossible — with no feedback
 * to the player beyond a wasted hour. `shuffle` computes the parity and flips
 * it when it comes out wrong, so every board handed over here can be finished.
 *
 * Rules and the parity maths live in lib/sliding-puzzle.ts and are tested in
 * Node, including the classic unsolvable 14/15 swap.
 */
export const SlidingPuzzle = () => {
  const [size, setSize] = useState<Size>(SIZES[1]);
  const [board, setBoard] = useState<Board>(() => shuffle(SIZES[1].n));
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [best, setBest] = useState<Record<string, number>>({});
  const boardRef = useRef<HTMLDivElement>(null);
  const onScreen = useRef(false);

  const solved = isSolved(board);
  const movable = movableTiles(board, size.n);

  useEffect(() => {
    if (solved || moves === 0) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [solved, moves]);

  useEffect(() => {
    if (!solved || moves === 0) return;
    setBest((prev) =>
      prev[size.id] === undefined || moves < prev[size.id] ? { ...prev, [size.id]: moves } : prev,
    );
  }, [solved, moves, size.id]);

  const restart = (s: Size = size) => {
    setSize(s);
    setBoard(shuffle(s.n));
    setMoves(0);
    setSeconds(0);
  };

  const push = (i: number) => {
    const next = slide(board, i, size.n);
    if (!next) return; // not adjacent to the blank
    setBoard(next);
    setMoves((m) => m + 1);
  };

  /* Arrow keys move the tile *into* the blank, which is the intuitive mapping:
     pressing Left slides the tile on the blank's right leftwards. */
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([e]) => {
        onScreen.current = e.isIntersecting;
      },
      { threshold: 0.2 },
    );
    observer.observe(el);

    const onKey = (e: KeyboardEvent) => {
      if (!onScreen.current) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const blank = board.indexOf(0);
      const n = size.n;
      const map: Record<string, number> = {
        ArrowLeft: blank + 1,
        ArrowRight: blank - 1,
        ArrowUp: blank + n,
        ArrowDown: blank - n,
      };
      const target = map[e.key];
      if (target === undefined) return;
      e.preventDefault();
      push(target);
    };

    window.addEventListener('keydown', onKey);
    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', onKey);
    };
  });

  const placed = placedCount(board);

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-elevated/40 p-3">
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="tabular-nums text-muted-foreground">
            moves <span className="text-primary">{moves}</span>
          </span>
          <span className="flex items-center gap-1.5 tabular-nums text-muted-foreground/70">
            <Timer className="h-3.5 w-3.5" />
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:
            {String(seconds % 60).padStart(2, '0')}
          </span>
          <span className="hidden tabular-nums text-muted-foreground/50 sm:inline">
            {placed}/{size.n * size.n - 1} placed
          </span>
          {best[size.id] !== undefined && (
            <span className="hidden tabular-nums text-muted-foreground/50 sm:inline">
              best {best[size.id]}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-lg border border-border p-0.5">
            {SIZES.map((s) => (
              <button
                key={s.id}
                onClick={() => restart(s)}
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-[0.62rem] transition-colors',
                  size.id === s.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button onClick={() => restart()} className="btn-ghost px-3 py-1.5 text-xs">
            <Shuffle className="h-3 w-3" />
            Shuffle
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div
          ref={boardRef}
          className="mx-auto grid w-full max-w-sm gap-1.5 rounded-xl bg-elevated/40 p-1.5"
          style={{ gridTemplateColumns: `repeat(${size.n}, minmax(0, 1fr))` }}
        >
          {board.map((value, i) =>
            value === 0 ? (
              <div key="blank" className="aspect-square rounded-lg" />
            ) : (
              <motion.button
                // Keyed by tile value, so framer animates the same element to a
                // new grid position instead of cross-fading two cells.
                key={value}
                layout
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                onClick={() => push(i)}
                disabled={solved}
                className={cn(
                  'grid aspect-square place-items-center rounded-lg font-display font-bold tabular-nums transition-colors',
                  size.n >= 5 ? 'text-sm' : 'text-lg sm:text-xl',
                  value === i + 1
                    ? 'bg-primary/25 text-primary'
                    : 'bg-border/70 text-foreground',
                  movable.includes(i) && !solved && 'cursor-pointer hover:bg-primary/40',
                )}
              >
                {value}
              </motion.button>
            ),
          )}
        </div>
      </div>

      {solved && moves > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/40 bg-primary/[0.07] px-4 py-3">
          <p className="font-mono text-xs text-primary">
            Solved in {moves} moves, {seconds}s
          </p>
          <button onClick={() => restart()} className="btn-primary px-3 py-1.5 text-xs">
            Shuffle again
          </button>
        </div>
      )}

      <p className="border-t border-border/60 px-4 py-3 text-[0.7rem] leading-relaxed text-muted-foreground/70">
        Click a tile beside the gap, or use the arrow keys. Every shuffle is checked for{' '}
        <strong>solvability</strong> before you get it — half of all arrangements can never be
        finished, and handing someone one of those is how Sam Loyd got away with offering
        $1,000 for a solution. Current board:{' '}
        <span className="text-primary">{isSolvable(board, size.n) ? 'solvable' : 'impossible'}</span>.
      </p>
    </div>
  );
};
