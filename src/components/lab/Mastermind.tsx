import { useMemo, useState } from 'react';
import { Check, Eye, RotateCcw } from 'lucide-react';

import {
  LEVELS,
  PEG_STYLES,
  isWin,
  makeSecret,
  remainingPossibilities,
  score,
  type Code,
  type Feedback,
  type Level,
} from '@/lib/mastermind';
import { cn } from '@/lib/utils';

/**
 * Mastermind — break the code by deduction.
 *
 * The interesting readout is "possibilities remaining": every row of feedback
 * eliminates codes, and watching 1,296 collapse toward 1 turns the game from
 * guessing into deduction. It's computed by actually enumerating consistent
 * codes, not estimated.
 *
 * Scoring lives in lib/mastermind.ts and is tested in Node — with duplicate
 * colours the naive implementation over-awards pegs, so the rules are pinned by
 * assertion rather than trusted.
 */
type Row = { guess: Code; feedback: Feedback };

export const Mastermind = () => {
  const [level, setLevel] = useState<Level>(LEVELS[0]);
  const [secret, setSecret] = useState<Code>(() => makeSecret(LEVELS[0]));
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Code>(() => new Array(LEVELS[0].length).fill(-1));
  const [revealed, setRevealed] = useState(false);
  const [cursor, setCursor] = useState(0);

  const won = rows.length > 0 && isWin(rows[rows.length - 1].feedback, level.length);
  const lost = !won && rows.length >= level.attempts;
  const over = won || lost;

  // Enumerating 6^4 (or 8^5, capped) per render is fine — it only recomputes
  // when a row is actually submitted.
  const remaining = useMemo(
    () => (rows.length ? remainingPossibilities(level, rows) : null),
    [rows, level],
  );

  const reset = (l: Level = level) => {
    setLevel(l);
    setSecret(makeSecret(l));
    setRows([]);
    setDraft(new Array(l.length).fill(-1));
    setRevealed(false);
    setCursor(0);
  };

  const place = (colour: number) => {
    if (over) return;
    setDraft((prev) => {
      const next = [...prev];
      next[cursor] = colour;
      return next;
    });
    // Advance to the next empty slot, wrapping — so you can fill a row without
    // aiming at each hole.
    setCursor((c) => (c + 1) % level.length);
  };

  const submit = () => {
    if (over || draft.some((p) => p === -1)) return;
    setRows((prev) => [...prev, { guess: [...draft], feedback: score(secret, draft) }]);
    setDraft(new Array(level.length).fill(-1));
    setCursor(0);
  };

  const complete = draft.every((p) => p !== -1);

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-elevated/40 p-3">
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="tabular-nums text-muted-foreground">
            turn <span className="text-primary">{Math.min(rows.length + 1, level.attempts)}</span>
            /{level.attempts}
          </span>
          {remaining !== null && !over && (
            <span className="tabular-nums text-muted-foreground/70">
              {remaining.toLocaleString()} code{remaining === 1 ? '' : 's'} left
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-lg border border-border p-0.5">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => reset(l)}
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-[0.62rem] transition-colors',
                  level.id === l.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button onClick={() => reset()} className="btn-ghost px-3 py-1.5 text-xs">
            <RotateCcw className="h-3 w-3" />
            New
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Secret */}
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            Code
          </span>
          <div className="flex gap-1.5">
            {secret.map((c, i) => (
              <span
                key={i}
                className={cn(
                  'h-6 w-6 rounded-full border border-border/60 transition-colors',
                  over || revealed ? PEG_STYLES[c].className : 'bg-elevated',
                )}
                aria-label={over || revealed ? PEG_STYLES[c].label : 'hidden'}
              />
            ))}
          </div>
          {!over && (
            <button
              onClick={() => setRevealed((v) => !v)}
              className="ml-auto flex items-center gap-1.5 font-mono text-[0.62rem] text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <Eye className="h-3 w-3" />
              {revealed ? 'Hide' : 'Peek'}
            </button>
          )}
        </div>

        {/* History */}
        <ul className="mb-4 space-y-1.5">
          {rows.map((row, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="w-4 shrink-0 font-mono text-[0.6rem] text-muted-foreground/40">
                {i + 1}
              </span>
              <div className="flex gap-1.5">
                {row.guess.map((c, k) => (
                  <span
                    key={k}
                    className={cn('h-6 w-6 rounded-full', PEG_STYLES[c].className)}
                    aria-label={PEG_STYLES[c].label}
                  />
                ))}
              </div>
              {/* Feedback pegs: filled = right place, hollow = right colour only. */}
              <div className="flex gap-1">
                {Array.from({ length: row.feedback.exact }, (_, k) => (
                  <span key={`e${k}`} className="h-2.5 w-2.5 rounded-full bg-primary" />
                ))}
                {Array.from({ length: row.feedback.partial }, (_, k) => (
                  <span
                    key={`p${k}`}
                    className="h-2.5 w-2.5 rounded-full border border-muted-foreground/70"
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>

        {/* Draft row */}
        {!over && (
          <div className="mb-4 flex items-center gap-3">
            <span className="w-4 shrink-0 font-mono text-[0.6rem] text-primary">
              {rows.length + 1}
            </span>
            <div className="flex gap-1.5">
              {draft.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setCursor(i)}
                  className={cn(
                    'h-6 w-6 rounded-full border transition-all',
                    c === -1 ? 'bg-elevated' : PEG_STYLES[c].className,
                    cursor === i ? 'border-primary ring-2 ring-primary/30' : 'border-border/60',
                  )}
                  aria-label={c === -1 ? `slot ${i + 1}, empty` : PEG_STYLES[c].label}
                />
              ))}
            </div>
            <button
              onClick={submit}
              disabled={!complete}
              className="btn-primary ml-auto px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-3 w-3" />
              Guess
            </button>
          </div>
        )}

        {/* Palette */}
        {!over && (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            {Array.from({ length: level.colours }, (_, c) => (
              <button
                key={c}
                onClick={() => place(c)}
                aria-label={PEG_STYLES[c].label}
                className={cn(
                  'h-8 w-8 rounded-full border border-border/60 transition-transform hover:scale-110 active:scale-95',
                  PEG_STYLES[c].className,
                )}
              />
            ))}
          </div>
        )}
      </div>

      {over && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3',
            won ? 'border-primary/40 bg-primary/[0.07]' : 'border-destructive/40 bg-destructive/[0.07]',
          )}
        >
          <p className={cn('font-mono text-xs', won ? 'text-primary' : 'text-destructive')}>
            {won ? `Cracked it in ${rows.length} guess${rows.length === 1 ? '' : 'es'}` : 'Out of turns.'}
          </p>
          <button onClick={() => reset()} className="btn-primary px-3 py-1.5 text-xs">
            Play again
          </button>
        </div>
      )}

      <p className="border-t border-border/60 px-4 py-3 text-[0.7rem] leading-relaxed text-muted-foreground/70">
        Pick colours to fill the row, then guess. A <span className="text-primary">filled</span> peg
        means right colour <em>and</em> right position; a hollow one means right colour, wrong
        place. Colours repeat, which is what makes the scoring subtle — each peg can be paid out
        only once, so four of one colour against a code holding two never scores more than two.
      </p>
    </div>
  );
};
