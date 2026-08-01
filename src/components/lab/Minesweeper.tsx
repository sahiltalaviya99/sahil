import { useCallback, useEffect, useRef, useState } from 'react';
import { Bomb, Flag, RotateCcw, Timer } from 'lucide-react';

import {
  DIFFICULTIES,
  chord,
  createBoard,
  minesRemaining,
  reveal,
  toggleFlag,
  type Board,
  type Difficulty,
} from '@/lib/minesweeper';
import { cn } from '@/lib/utils';

/**
 * Minesweeper. The actual game — first-click safety, flood fill, chording.
 *
 * All the rules live in lib/minesweeper.ts as pure functions and are tested in
 * Node; this file only renders state and routes input.
 *
 * The input mapping is the fiddly part. Desktop gets left-click to reveal,
 * right-click to flag and click-on-a-number to chord. Touch has no right
 * button and no hover, so it gets an explicit flag toggle plus long-press —
 * shipping a game you can't play on a phone isn't shipping a game.
 */

/** Classic number colours, mapped onto the palette rather than the original blues. */
const NUMBER_TONE = [
  '',
  'text-primary',
  'text-signal',
  'text-destructive',
  'text-primary-hi',
  'text-destructive',
  'text-signal',
  'text-foreground',
  'text-muted-foreground',
];

const LONG_PRESS_MS = 400;

export const Minesweeper = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[0]);
  const [board, setBoard] = useState<Board>(() => createBoard(DIFFICULTIES[0]));
  const [flagMode, setFlagMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [best, setBest] = useState<Record<string, number>>({});

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  /* ------------------------------- timer ------------------------------- */
  useEffect(() => {
    if (board.state !== 'playing') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [board.state]);

  useEffect(() => {
    if (board.state !== 'won') return;
    setBest((prev) => {
      const current = prev[difficulty.id];
      // Kept in state, not storage — a personal best that survives a refresh
      // isn't worth the storage-blocked crash risk (see lib/safe-storage).
      return current === undefined || seconds < current
        ? { ...prev, [difficulty.id]: seconds }
        : prev;
    });
  }, [board.state, difficulty.id, seconds]);

  const restart = useCallback(
    (d: Difficulty = difficulty) => {
      setDifficulty(d);
      setBoard(createBoard(d));
      setSeconds(0);
    },
    [difficulty],
  );

  /* ------------------------------- input ------------------------------- */

  const open = (i: number) => {
    setBoard((b) => {
      // A tap on an already-revealed number means "chord" — that's how the
      // game is played at speed, and it's the only way to express it on touch.
      if (b.cells[i].revealed) return chord(b, i);
      return reveal(b, i);
    });
  };

  const flag = (i: number) => setBoard((b) => toggleFlag(b, i));

  const onPointerDown = (i: number) => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      flag(i);
    }, LONG_PRESS_MS);
  };

  const onPointerUp = (i: number) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (longPressed.current) return; // the long press already flagged it
    if (flagMode) flag(i);
    else open(i);
  };

  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    longPressed.current = true; // suppress the click that follows a cancelled press
  };

  const finished = board.state === 'won' || board.state === 'lost';
  const bestTime = best[difficulty.id];

  return (
    <div className="surface overflow-hidden">
      {/* Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-elevated/40 p-3">
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="flex items-center gap-1.5 tabular-nums">
            <Bomb className="h-3.5 w-3.5 text-primary" />
            {String(minesRemaining(board)).padStart(2, '0')}
          </span>
          <span className="flex items-center gap-1.5 tabular-nums text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:
            {String(seconds % 60).padStart(2, '0')}
          </span>
          {bestTime !== undefined && (
            <span className="hidden tabular-nums text-muted-foreground/60 sm:inline">
              best {bestTime}s
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-lg border border-border p-0.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => restart(d)}
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-[0.62rem] transition-colors',
                  difficulty.id === d.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Explicit flag toggle: touch has no right button. */}
          <button
            onClick={() => setFlagMode((v) => !v)}
            aria-pressed={flagMode}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.68rem] transition-colors',
              flagMode
                ? 'border-primary/40 bg-primary/15 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <Flag className="h-3 w-3" />
            Flag
          </button>

          <button onClick={() => restart()} className="btn-ghost px-3 py-1.5 text-xs">
            <RotateCcw className="h-3 w-3" />
            New
          </button>
        </div>
      </div>

      {/* Board. Scrolls inside its own pane rather than widening the page. */}
      <div className="overflow-x-auto p-3">
        <div
          className="mx-auto grid w-max gap-[2px] select-none"
          style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {board.cells.map((cell, i) => {
            const isDetonated = board.detonated === i;
            const wrongFlag = finished && cell.flagged && !cell.mine;

            return (
              <button
                key={i}
                disabled={finished}
                onPointerDown={() => !finished && onPointerDown(i)}
                onPointerUp={() => !finished && onPointerUp(i)}
                onPointerLeave={cancelPress}
                onPointerCancel={cancelPress}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (!finished) flag(i);
                }}
                aria-label={
                  cell.revealed
                    ? cell.mine
                      ? 'mine'
                      : `${cell.adjacent} adjacent mines`
                    : cell.flagged
                      ? 'flagged'
                      : 'hidden cell'
                }
                className={cn(
                  'grid h-6 w-6 place-items-center rounded-[3px] font-mono text-[0.7rem] font-semibold leading-none transition-colors sm:h-7 sm:w-7 sm:text-xs',
                  cell.revealed
                    ? cell.mine
                      ? isDetonated
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-destructive/30 text-destructive'
                      : 'bg-elevated/70'
                    : 'bg-border/70 hover:bg-border active:bg-border',
                  wrongFlag && 'bg-destructive/20',
                  !cell.revealed && !finished && 'cursor-pointer',
                )}
              >
                {cell.revealed ? (
                  cell.mine ? (
                    <Bomb className="h-3 w-3" />
                  ) : cell.adjacent > 0 ? (
                    <span className={NUMBER_TONE[cell.adjacent]}>{cell.adjacent}</span>
                  ) : null
                ) : cell.flagged ? (
                  <Flag
                    className={cn('h-3 w-3', wrongFlag ? 'text-destructive' : 'text-primary')}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Outcome */}
      {finished && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3',
            board.state === 'won'
              ? 'border-primary/40 bg-primary/[0.07]'
              : 'border-destructive/40 bg-destructive/[0.07]',
          )}
        >
          <p className="font-mono text-xs">
            {board.state === 'won' ? (
              <span className="text-primary">
                Cleared in {seconds}s
                {bestTime !== undefined && seconds === bestTime && ' — new best'}
              </span>
            ) : (
              <span className="text-destructive">Detonated.</span>
            )}
          </p>
          <button onClick={() => restart()} className="btn-primary px-3 py-1.5 text-xs">
            Play again
          </button>
        </div>
      )}

      <p className="border-t border-border/60 px-4 py-3 text-[0.7rem] leading-relaxed text-muted-foreground/70">
        Click to reveal, right-click or long-press to flag, and click a revealed number to
        clear its neighbours once you&apos;ve flagged that many around it. The first click is
        always safe — mines are laid <em>after</em> it, avoiding it and everything touching
        it, so the opening move always opens a region instead of ending the game on a coin
        flip.
      </p>
    </div>
  );
};
