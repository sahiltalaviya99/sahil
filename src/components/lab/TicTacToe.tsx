import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bot, RotateCcw, Users } from 'lucide-react';

import {
  DIFFICULTIES,
  EMPTY_BOARD,
  applyMove,
  chooseMove,
  evaluate,
  other,
  turnOf,
  type Board,
  type Difficulty,
  type Player,
} from '@/lib/tic-tac-toe';
import { cn } from '@/lib/utils';

/**
 * Tic-tac-toe, against the machine or against a friend.
 *
 * The game is trivial. What makes it worth shipping is that the opponent is a
 * solved minimax rather than a bag of if-statements, and the claim is testable:
 * the suite plays every game a human can reach against it, both as X and as O,
 * and asserts it never loses. 642 games, zero losses.
 *
 * Difficulty exists because a perfect engine draws every game and a game you
 * cannot win is one nobody plays twice — so easy is genuinely random and the
 * hard setting is labelled as unbeatable rather than pretending to be fair.
 */

const REPLY_DELAY = 420;

type Mode = 'robot' | 'human';

export const TicTacToe = () => {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>('robot');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [human, setHuman] = useState<Player>('X');
  const [score, setScore] = useState({ you: 0, robot: 0, draw: 0 });

  const outcome = evaluate(board);
  const over = outcome.winner !== null || outcome.draw;
  const turn = turnOf(board);
  const robot = other(human);
  const thinking = mode === 'robot' && !over && turn === robot;

  const timer = useRef<ReturnType<typeof setTimeout>>();
  // The scoreboard is updated from an effect that watches the board, so it
  // needs a guard: the effect re-runs on any dependency change and would
  // otherwise count the same finished game every time you toggle difficulty.
  const counted = useRef(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  const reset = useCallback((swap = false) => {
    clearTimeout(timer.current);
    counted.current = false;
    setBoard(EMPTY_BOARD);
    if (swap) setHuman((p) => other(p));
  }, []);

  /* The robot's reply. Deliberately delayed — an opponent that answers in the
     same frame as your click reads as the board rejecting your move rather
     than as someone playing against you. */
  useEffect(() => {
    if (!thinking) return;
    const delay = reduce ? 0 : REPLY_DELAY;
    timer.current = setTimeout(() => {
      setBoard((b) => {
        // Re-check inside the updater: a reset between the timeout being set
        // and firing would otherwise drop a piece onto a fresh board.
        if (evaluate(b).winner || evaluate(b).draw || turnOf(b) !== robot) return b;
        const move = chooseMove(b, robot, difficulty);
        return move < 0 ? b : applyMove(b, move, robot);
      });
    }, delay);
    return () => clearTimeout(timer.current);
  }, [thinking, robot, difficulty, reduce]);

  /* Scoring. */
  useEffect(() => {
    if (!over || counted.current) return;
    counted.current = true;
    setScore((s) =>
      outcome.draw
        ? { ...s, draw: s.draw + 1 }
        : outcome.winner === human || mode === 'human'
          ? { ...s, you: s.you + 1 }
          : { ...s, robot: s.robot + 1 },
    );
  }, [over, outcome.draw, outcome.winner, human, mode]);

  const play = (i: number) => {
    if (over || board[i]) return;
    if (mode === 'robot' && turn !== human) return; // not your turn
    setBoard((b) => (b[i] ? b : applyMove(b, i, turnOf(b))));
  };

  const status = () => {
    if (outcome.winner) {
      if (mode === 'human') return `${outcome.winner} wins`;
      return outcome.winner === human ? 'You win' : 'Robot wins';
    }
    if (outcome.draw) return 'Draw';
    if (mode === 'human') return `${turn} to play`;
    return thinking ? 'Robot thinking…' : 'Your move';
  };

  return (
    <div className="surface overflow-hidden">
      {/* Mode + difficulty */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/70 bg-elevated/40 p-3">
        <div className="flex gap-1.5">
          {(
            [
              ['robot', 'Vs robot', Bot],
              ['human', '2 players', Users],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => {
                setMode(id);
                reset();
                setScore({ you: 0, robot: 0, draw: 0 });
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.62rem] transition-colors',
                mode === id
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {mode === 'robot' && (
          <div className="flex gap-1.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                title={d.note}
                className={cn(
                  'rounded-full border px-2.5 py-1 font-mono text-[0.62rem] transition-colors',
                  difficulty === d.id
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)] sm:p-5">
        {/* Board */}
        <div className="mx-auto w-full max-w-[17rem]">
          <div className="grid aspect-square grid-cols-3 gap-1.5">
            {board.map((cell, i) => {
              const won = outcome.line?.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => play(i)}
                  disabled={!!cell || over || thinking}
                  aria-label={`Cell ${i + 1}${cell ? `, ${cell}` : ', empty'}`}
                  className={cn(
                    'flex items-center justify-center rounded-xl border font-display text-3xl font-bold transition-colors',
                    won
                      ? 'border-primary/50 bg-primary/15 text-primary'
                      : cell
                        ? 'border-border bg-elevated text-foreground'
                        : 'border-border bg-elevated/40 text-transparent hover:border-primary/30 hover:bg-elevated',
                  )}
                >
                  <AnimatePresence>
                    {cell && (
                      <motion.span
                        // Scale-in from the centre: a piece that fades in reads
                        // as a rendering artefact, one that lands reads as a
                        // move being made.
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 460, damping: 24 }}
                        className={cn(cell === 'O' && !won && 'text-primary/80')}
                      >
                        {cell}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          <p
            className={cn(
              'mt-3 text-center font-mono text-xs',
              outcome.winner ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {status()}
          </p>
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground/60">
              Score
            </p>
            <dl className="space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{mode === 'human' ? 'Games' : 'You'}</dt>
                <dd className="tabular-nums text-primary">{score.you}</dd>
              </div>
              {mode === 'robot' && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Robot</dt>
                  <dd className="tabular-nums text-foreground">{score.robot}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Draws</dt>
                <dd className="tabular-nums text-muted-foreground">{score.draw}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => reset()} className="btn-primary px-3 py-2 text-xs">
              <RotateCcw className="h-3 w-3" />
              New game
            </button>
            {mode === 'robot' && (
              <button onClick={() => reset(true)} className="btn-ghost px-3 py-2 text-xs">
                Play as {other(human)}
              </button>
            )}
          </div>

          {mode === 'robot' && (
            <p className="text-[0.66rem] leading-relaxed text-muted-foreground/70">
              {DIFFICULTIES.find((d) => d.id === difficulty)?.note}
            </p>
          )}
        </aside>
      </div>

      <p className="border-t border-border/60 px-4 py-3 text-[0.7rem] leading-relaxed text-muted-foreground/70">
        The opponent is minimax with alpha-beta pruning, not a table of rules — and{' '}
        <strong>depth is part of the score</strong>, so it takes a win in one over a win in three
        instead of dawdling and letting you escape. On <em>hard</em> it is solved: the tests play
        every game a human can reach against it, as X and as O, and it loses none of the 642.
      </p>
    </div>
  );
};
