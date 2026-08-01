import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Undo2 } from 'lucide-react';

import {
  SIZE,
  addRandomTile,
  createGame,
  hasWon,
  isGameOver,
  move,
  tileClass,
  type Direction,
  type Grid,
} from '@/lib/game-2048';
import { cn } from '@/lib/utils';

/**
 * 2048. Arrow keys or WASD on a keyboard, swipe on touch.
 *
 * The rules live in lib/game-2048.ts as pure functions and are tested in Node —
 * the merge is the part that's easy to get subtly wrong, so it's asserted
 * rather than eyeballed.
 *
 * Key handling is bound to the window but gated on the board being on screen,
 * via an IntersectionObserver. A permanently-live arrow-key handler would eat
 * page scrolling for the whole site; a board you must click first to focus is
 * a worse first impression. This gives immediate play without the theft.
 */

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  d: 'right',
  w: 'up',
  s: 'down',
};

const SWIPE_THRESHOLD = 28;

export const Game2048 = () => {
  const [grid, setGrid] = useState<Grid>(() => createGame());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [dismissedWin, setDismissedWin] = useState(false);
  /** One level of undo — enough to recover from a misfire, not enough to cheat. */
  const previous = useRef<{ grid: Grid; score: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const onScreen = useRef(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const over = isGameOver(grid);

  /**
   * Reads state directly rather than from a setState updater. Updaters must be
   * pure — React invokes them twice under StrictMode to catch exactly this —
   * and scoring inside one would silently double every merge.
   */
  const play = (dir: Direction) => {
    const result = move(grid, dir);
    // A move that changes nothing must not spawn, or holding a dead direction
    // fills the board for free.
    if (!result.moved) return;

    previous.current = { grid, score };
    const next = addRandomTile(result.grid);
    const nextScore = score + result.gained;

    setGrid(next);
    setScore(nextScore);
    setBest((b) => Math.max(b, nextScore));
    if (hasWon(next)) setWon(true);
  };

  // The key handler subscribes once and calls through this, so it always sees
  // the current closure without re-subscribing on every point scored.
  const playRef = useRef(play);
  playRef.current = play;

  /* ---------------------------- input ---------------------------- */

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen.current = entry.isIntersecting;
      },
      { threshold: 0.25 },
    );
    observer.observe(el);

    const onKey = (e: KeyboardEvent) => {
      if (!onScreen.current) return;
      // Never steal keys from a field — the lab has inputs on other exhibits.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const dir = KEY_TO_DIR[e.key];
      if (!dir) return;
      e.preventDefault(); // stop arrows scrolling the page mid-game
      playRef.current(dir);
    };

    window.addEventListener('keydown', onKey);
    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
    play(
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up',
    );
  };

  const restart = () => {
    setGrid(createGame());
    setScore(0);
    scoreRef.current = 0;
    setWon(false);
    setDismissedWin(false);
    previous.current = null;
  };

  const undo = () => {
    const prev = previous.current;
    if (!prev) return;
    setGrid(prev.grid);
    setScore(prev.score);
    scoreRef.current = prev.score;
    previous.current = null;
  };

  const showWin = won && !dismissedWin;

  return (
    <div className="surface overflow-hidden">
      {/* Score */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-elevated/40 p-3">
        <div className="flex gap-4 font-mono text-xs">
          <span className="text-muted-foreground">
            score <span className="tabular-nums text-primary">{score}</span>
          </span>
          <span className="text-muted-foreground/60">
            best <span className="tabular-nums">{best}</span>
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={!previous.current}
            className="btn-ghost px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </button>
          <button onClick={restart} className="btn-ghost px-3 py-1.5 text-xs">
            <RotateCcw className="h-3 w-3" />
            New
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="p-4 sm:p-6">
        <div
          ref={boardRef}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="relative mx-auto w-full max-w-sm touch-none select-none rounded-xl bg-elevated/40 p-2"
        >
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
          >
            {grid.map((value, i) => (
              <motion.div
                key={i}
                // Keyed by position, so the pop fires when a cell's value
                // changes rather than trying to animate tiles across the board.
                animate={{ scale: value === 0 ? 1 : [0.86, 1] }}
                transition={{ duration: 0.16 }}
                className={cn(
                  'grid aspect-square place-items-center rounded-lg font-display font-bold tabular-nums transition-colors',
                  value >= 1024 ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl',
                  tileClass(value),
                )}
              >
                {value !== 0 && value}
              </motion.div>
            ))}
          </div>

          {/* Overlays */}
          {(showWin || over) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 grid place-items-center rounded-xl bg-background/85 backdrop-blur-sm"
            >
              <div className="text-center">
                <p
                  className={cn(
                    'font-display text-2xl font-bold tracking-tight',
                    showWin ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {showWin ? '2048' : 'No moves left'}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">score {score}</p>
                <div className="mt-4 flex justify-center gap-2">
                  {showWin && !over && (
                    <button
                      onClick={() => setDismissedWin(true)}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      Keep going
                    </button>
                  )}
                  <button onClick={restart} className="btn-primary px-3 py-1.5 text-xs">
                    New game
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <p className="border-t border-border/60 px-4 py-3 text-[0.7rem] leading-relaxed text-muted-foreground/70">
        Arrow keys or WASD, or swipe on the board. Keys only respond while the board is on
        screen, so they never steal scrolling from the rest of the page. A tile merges at most
        once per move — that&apos;s why <span className="font-mono">2 2 2 2</span> becomes{' '}
        <span className="font-mono">4 4</span> and not <span className="font-mono">8</span>.
      </p>
    </div>
  );
};
