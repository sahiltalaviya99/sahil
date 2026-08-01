import { useEffect, useMemo, useRef, useState } from 'react';
import { Eraser, Lightbulb, Pencil, RotateCcw, Timer } from 'lucide-react';

import {
  CELLS,
  DIFFICULTIES,
  N,
  boxOf,
  colOf,
  conflicts,
  generate,
  isComplete,
  rowOf,
  type Board,
  type Difficulty,
} from '@/lib/sudoku';
import { cn } from '@/lib/utils';

/**
 * Sudoku with a generator that guarantees a unique solution.
 *
 * That guarantee is the whole reason this is worth shipping: a puzzle with
 * multiple solutions makes "check" call a perfectly valid board wrong, and the
 * player has no way to tell whose fault it is. Every clue removed during
 * generation is removed only if exactly one solution survives.
 *
 * Rules and generation live in lib/sudoku.ts and are tested in Node.
 */
export const Sudoku = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[0]);
  const [puzzle, setPuzzle] = useState(() => generate(DIFFICULTIES[0].clues));
  const [board, setBoard] = useState<Board>(() => [...puzzle.given]);
  const [notes, setNotes] = useState<Set<number>[]>(() =>
    Array.from({ length: CELLS }, () => new Set<number>()),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const onScreen = useRef(false);

  const bad = useMemo(() => conflicts(board), [board]);
  const solved = useMemo(() => isComplete(board), [board]);

  useEffect(() => {
    if (solved) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [solved]);

  const newGame = (d: Difficulty = difficulty) => {
    const p = generate(d.clues);
    setDifficulty(d);
    setPuzzle(p);
    setBoard([...p.given]);
    setNotes(Array.from({ length: CELLS }, () => new Set<number>()));
    setSelected(null);
    setSeconds(0);
    setMistakes(0);
  };

  const write = (value: number) => {
    if (selected === null || solved) return;
    if (puzzle.given[selected] !== 0) return; // clues are immutable

    if (noteMode && value !== 0) {
      setNotes((prev) => {
        const next = prev.map((s) => new Set(s));
        if (next[selected].has(value)) next[selected].delete(value);
        else next[selected].add(value);
        return next;
      });
      return;
    }

    setBoard((prev) => {
      const next = [...prev];
      next[selected] = next[selected] === value ? 0 : value;
      return next;
    });
    setNotes((prev) => {
      const next = prev.map((s) => new Set(s));
      next[selected].clear();
      return next;
    });
    // Counting mistakes against the known solution, not against conflicts —
    // a wrong-but-non-conflicting digit is still wrong.
    if (value !== 0 && value !== puzzle.solution[selected]) setMistakes((m) => m + 1);
  };

  const hint = () => {
    if (selected === null || solved) return;
    if (puzzle.given[selected] !== 0 || board[selected] === puzzle.solution[selected]) return;
    setBoard((prev) => {
      const next = [...prev];
      next[selected] = puzzle.solution[selected];
      return next;
    });
  };

  /* Keyboard, gated on visibility so it never steals typing elsewhere. */
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
      if (!onScreen.current || selected === null) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        write(Number(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        write(0);
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const r = rowOf(selected);
        const c = colOf(selected);
        const dr = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
        const dc = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
        const nr = Math.min(N - 1, Math.max(0, r + dr));
        const nc = Math.min(N - 1, Math.max(0, c + dc));
        setSelected(nr * N + nc);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', onKey);
    };
  });

  const selectedValue = selected !== null ? board[selected] : 0;
  /** How many of each digit are still unplaced — tells you what's left. */
  const counts = useMemo(() => {
    const c = new Array(10).fill(0);
    for (const v of board) if (v) c[v]++;
    return c;
  }, [board]);

  return (
    <div className="surface overflow-hidden">
      {/* Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-elevated/40 p-3">
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="flex items-center gap-1.5 tabular-nums text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:
            {String(seconds % 60).padStart(2, '0')}
          </span>
          <span className={cn('tabular-nums', mistakes ? 'text-destructive' : 'text-muted-foreground/60')}>
            {mistakes} mistake{mistakes === 1 ? '' : 's'}
          </span>
          <span className="hidden text-muted-foreground/50 sm:inline">{puzzle.clues} clues</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-lg border border-border p-0.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => newGame(d)}
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
          <button onClick={() => newGame()} className="btn-ghost px-3 py-1.5 text-xs">
            <RotateCcw className="h-3 w-3" />
            New
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-3 sm:p-5">
        <div
          ref={boardRef}
          className="mx-auto grid w-full max-w-sm grid-cols-9 overflow-hidden rounded-lg border-2 border-border"
        >
          {board.map((value, i) => {
            const isGiven = puzzle.given[i] !== 0;
            const isSelected = selected === i;
            const isPeer =
              selected !== null &&
              (rowOf(i) === rowOf(selected) ||
                colOf(i) === colOf(selected) ||
                boxOf(i) === boxOf(selected));
            const sameValue = selectedValue !== 0 && value === selectedValue;

            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={cn(
                  'relative grid aspect-square place-items-center font-display text-base font-semibold transition-colors sm:text-lg',
                  // 3×3 box separators, drawn with borders rather than gaps so
                  // the grid stays a single continuous surface.
                  colOf(i) % 3 === 2 && colOf(i) !== 8 && 'border-r-2 border-r-border',
                  rowOf(i) % 3 === 2 && rowOf(i) !== 8 && 'border-b-2 border-b-border',
                  'border-[0.5px] border-border/40',
                  isSelected
                    ? 'bg-primary/25'
                    : sameValue
                      ? 'bg-primary/15'
                      : isPeer
                        ? 'bg-elevated/60'
                        : 'bg-surface',
                  bad.has(i) && 'bg-destructive/25',
                  isGiven ? 'text-foreground' : 'text-primary',
                )}
              >
                {value !== 0 ? (
                  value
                ) : notes[i].size ? (
                  <span className="grid grid-cols-3 gap-0 p-0.5 text-[0.42rem] leading-none text-muted-foreground/70">
                    {Array.from({ length: 9 }, (_, k) => (
                      <span key={k} className="grid h-1.5 w-1.5 place-items-center">
                        {notes[i].has(k + 1) ? k + 1 : ''}
                      </span>
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Number pad */}
        <div className="mx-auto mt-4 flex w-full max-w-sm flex-wrap gap-1.5">
          {Array.from({ length: 9 }, (_, k) => k + 1).map((v) => (
            <button
              key={v}
              onClick={() => write(v)}
              disabled={counts[v] >= 9}
              className={cn(
                'grid h-9 flex-1 place-items-center rounded-lg border border-border font-display text-base font-semibold transition-colors',
                counts[v] >= 9
                  ? 'cursor-not-allowed text-muted-foreground/25'
                  : 'text-foreground hover:border-primary/40 hover:text-primary',
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-2 flex w-full max-w-sm gap-1.5">
          <button
            onClick={() => setNoteMode((v) => !v)}
            aria-pressed={noteMode}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors',
              noteMode
                ? 'border-primary/40 bg-primary/15 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <Pencil className="h-3 w-3" />
            Notes
          </button>
          <button onClick={() => write(0)} className="btn-ghost flex-1 px-3 py-2 text-xs">
            <Eraser className="h-3 w-3" />
            Erase
          </button>
          <button onClick={hint} className="btn-ghost flex-1 px-3 py-2 text-xs">
            <Lightbulb className="h-3 w-3" />
            Hint
          </button>
        </div>
      </div>

      {solved && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/40 bg-primary/[0.07] px-4 py-3">
          <p className="font-mono text-xs text-primary">
            Solved in {Math.floor(seconds / 60)}m {seconds % 60}s
            {mistakes === 0 && ' — flawless'}
          </p>
          <button onClick={() => newGame()} className="btn-primary px-3 py-1.5 text-xs">
            New puzzle
          </button>
        </div>
      )}

      <p className="border-t border-border/60 px-4 py-3 text-[0.7rem] leading-relaxed text-muted-foreground/70">
        Click a cell, then type 1–9 (arrows move, Backspace clears). Every puzzle is generated
        fresh with a <strong>guaranteed unique solution</strong> — clues are only removed while
        exactly one solution survives, so a valid board is never called wrong.
      </p>
    </div>
  );
};
