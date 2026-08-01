/**
 * Mastermind — break the hidden code by deduction.
 *
 * The whole game hinges on one function, `score`, and it is a notorious source
 * of subtle bugs the moment duplicate colours are allowed. The rules:
 *
 *   - an EXACT peg is a right colour in the right position;
 *   - a PARTIAL peg is a right colour in the wrong position, and each peg in
 *     the guess may be paid out at most once against each peg in the secret.
 *
 * The naive "for each guess peg, does the secret contain it?" gives nonsense:
 * secret [red, red, blue, green] against guess [red, blue, red, red] should
 * score 1 exact + 2 partial, but that version reports 1 exact + 3 partial,
 * claiming more red pegs than exist. Counting colour frequencies over the
 * *non-exact* positions only, then summing the minimum on each colour, is the
 * correct formulation — and it's what the tests pin down.
 */

export type Peg = number;
export type Code = Peg[];

export type Feedback = { exact: number; partial: number };

export type Level = {
  id: string;
  label: string;
  colours: number;
  length: number;
  attempts: number;
  duplicates: boolean;
};

export const LEVELS: Level[] = [
  { id: 'classic', label: 'Classic', colours: 6, length: 4, attempts: 10, duplicates: true },
  { id: 'tricky', label: 'Tricky', colours: 7, length: 4, attempts: 9, duplicates: true },
  { id: 'brutal', label: 'Brutal', colours: 8, length: 5, attempts: 10, duplicates: true },
];

/** Palette indices → Tailwind classes. Deliberately distinguishable without colour alone. */
export const PEG_STYLES = [
  { className: 'bg-primary', label: 'emerald' },
  { className: 'bg-signal', label: 'lime' },
  { className: 'bg-destructive', label: 'red' },
  { className: 'bg-foreground', label: 'white' },
  { className: 'bg-primary-hi', label: 'mint' },
  { className: 'bg-muted-foreground', label: 'grey' },
  { className: 'bg-amber-400', label: 'amber' },
  { className: 'bg-sky-400', label: 'sky' },
];

export const makeSecret = (level: Level, rand: () => number = Math.random): Code => {
  if (level.duplicates) {
    return Array.from({ length: level.length }, () => Math.floor(rand() * level.colours));
  }
  // Without duplicates, draw without replacement.
  const pool = Array.from({ length: level.colours }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, level.length);
};

export const score = (secret: Code, guess: Code): Feedback => {
  let exact = 0;
  // Frequencies over the positions that did NOT match exactly. Counting over
  // the whole code instead is precisely the bug this avoids.
  const secretRest = new Map<Peg, number>();
  const guessRest = new Map<Peg, number>();

  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) {
      exact++;
    } else {
      secretRest.set(secret[i], (secretRest.get(secret[i]) ?? 0) + 1);
      guessRest.set(guess[i], (guessRest.get(guess[i]) ?? 0) + 1);
    }
  }

  let partial = 0;
  for (const [colour, count] of guessRest) {
    partial += Math.min(count, secretRest.get(colour) ?? 0);
  }

  return { exact, partial };
};

export const isWin = (feedback: Feedback, length: number) => feedback.exact === length;

/**
 * Every code still consistent with the feedback given so far.
 *
 * Powers the "possibilities remaining" readout — the number that turns the game
 * from guessing into deduction, because you can watch it collapse. Capped
 * because 8^5 is 32,768 and there's no need to enumerate beyond a useful count.
 */
export const remainingPossibilities = (
  level: Level,
  history: Array<{ guess: Code; feedback: Feedback }>,
  cap = 20000,
): number => {
  let count = 0;
  const code: Code = new Array(level.length).fill(0);

  const consistent = (candidate: Code) =>
    history.every((h) => {
      const f = score(candidate, h.guess);
      return f.exact === h.feedback.exact && f.partial === h.feedback.partial;
    });

  const walk = (pos: number): void => {
    if (count >= cap) return;
    if (pos === level.length) {
      if (consistent(code)) count++;
      return;
    }
    for (let c = 0; c < level.colours; c++) {
      code[pos] = c;
      walk(pos + 1);
      if (count >= cap) return;
    }
  };

  walk(0);
  return count;
};
