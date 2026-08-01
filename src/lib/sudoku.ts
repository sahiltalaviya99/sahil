/**
 * Sudoku — generation, solving and validation.
 *
 * The part that separates a real generator from a fake one is **uniqueness**.
 * Punching random holes in a solved grid produces puzzles with many solutions,
 * which means "check" can call a perfectly reasonable board wrong and the
 * player has no way to know they were right. Every cell removed here is
 * removed only if the puzzle still has exactly one solution — verified by a
 * solver that counts up to two and stops.
 *
 * Pure and dependency-free so all of that can be asserted in Node.
 */

export const N = 9;
export const CELLS = N * N;

/** 0 = empty. Row-major. */
export type Board = number[];

export type Difficulty = { id: string; label: string; clues: number };

export const DIFFICULTIES: Difficulty[] = [
  { id: 'easy', label: 'Easy', clues: 42 },
  { id: 'medium', label: 'Medium', clues: 34 },
  { id: 'hard', label: 'Hard', clues: 28 },
];

export const rowOf = (i: number) => Math.floor(i / N);
export const colOf = (i: number) => i % N;
export const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

/** Cell indices sharing a row, column or box with `i` — excluding `i` itself. */
export const peers = (i: number): number[] => {
  const out: number[] = [];
  for (let j = 0; j < CELLS; j++) {
    if (j === i) continue;
    if (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i)) out.push(j);
  }
  return out;
};

/** Precomputed — peers() is called per keystroke during play. */
const PEERS: number[][] = Array.from({ length: CELLS }, (_, i) => peers(i));

export const canPlace = (board: Board, i: number, value: number): boolean => {
  if (value === 0) return true;
  for (const p of PEERS[i]) if (board[p] === value) return false;
  return true;
};

/** Indices whose value duplicates a peer. Drives the red highlight. */
export const conflicts = (board: Board): Set<number> => {
  const bad = new Set<number>();
  for (let i = 0; i < CELLS; i++) {
    const v = board[i];
    if (v === 0) continue;
    for (const p of PEERS[i]) {
      if (board[p] === v) {
        bad.add(i);
        bad.add(p);
      }
    }
  }
  return bad;
};

export const isComplete = (board: Board): boolean =>
  board.every((v) => v !== 0) && conflicts(board).size === 0;

/**
 * Does the board already contradict itself?
 *
 * Both search functions MUST call this first. `canPlace` only validates the
 * cell being written, so a board whose *givens* already duplicate a value looks
 * perfectly explorable — the solver then enumerates the entire space of an
 * unsatisfiable grid and never returns. Early-exit rather than building the
 * full conflict set, since this runs before every search.
 */
export const hasConflict = (board: Board): boolean => {
  for (let i = 0; i < CELLS; i++) {
    const v = board[i];
    if (v === 0) continue;
    for (const p of PEERS[i]) if (board[p] === v) return true;
  }
  return false;
};

/** Next empty cell with the fewest candidates — cuts the search dramatically. */
const bestEmpty = (board: Board): { index: number; candidates: number[] } | null => {
  let best: { index: number; candidates: number[] } | null = null;
  for (let i = 0; i < CELLS; i++) {
    if (board[i] !== 0) continue;
    const candidates: number[] = [];
    for (let v = 1; v <= N; v++) if (canPlace(board, i, v)) candidates.push(v);
    if (!candidates.length) return { index: i, candidates }; // dead end, fail fast
    if (!best || candidates.length < best.candidates.length) best = { index: i, candidates };
    if (candidates.length === 1) break;
  }
  return best;
};

const shuffled = <T,>(items: T[], rand: () => number): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * Count solutions, stopping at `limit`.
 *
 * Capped on purpose: generation only ever needs to know "exactly one or more
 * than one", and enumerating every solution of a sparse grid is unbounded work.
 */
export const countSolutions = (board: Board, limit = 2, rand?: () => number): number => {
  if (hasConflict(board)) return 0;
  const work = [...board];

  const search = (): number => {
    const spot = bestEmpty(work);
    if (!spot) return 1; // filled with no conflicts
    if (!spot.candidates.length) return 0;

    let found = 0;
    const order = rand ? shuffled(spot.candidates, rand) : spot.candidates;
    for (const v of order) {
      work[spot.index] = v;
      found += search();
      work[spot.index] = 0;
      if (found >= limit) break;
    }
    return found;
  };

  return search();
};

export const solve = (board: Board): Board | null => {
  if (hasConflict(board)) return null;
  const work = [...board];

  const search = (): boolean => {
    const spot = bestEmpty(work);
    if (!spot) return true;
    for (const v of spot.candidates) {
      work[spot.index] = v;
      if (search()) return true;
      work[spot.index] = 0;
    }
    return false;
  };

  return search() ? work : null;
};

/** A complete, valid, randomly-generated grid. */
export const generateSolved = (rand: () => number = Math.random): Board => {
  const board: Board = new Array(CELLS).fill(0);

  const fill = (): boolean => {
    const spot = bestEmpty(board);
    if (!spot) return true;
    for (const v of shuffled(spot.candidates, rand)) {
      board[spot.index] = v;
      if (fill()) return true;
      board[spot.index] = 0;
    }
    return false;
  };

  fill();
  return board;
};

export type Puzzle = { given: Board; solution: Board; clues: number };

/**
 * Dig holes out of a solved grid, keeping the solution unique at every step.
 *
 * `targetClues` is a target, not a promise — below roughly 24 clues the
 * uniqueness constraint starts refusing removals, and reporting the count we
 * actually reached is more honest than looping forever chasing a number.
 */
export const generate = (
  targetClues: number,
  rand: () => number = Math.random,
): Puzzle => {
  const solution = generateSolved(rand);
  const given = [...solution];
  let clues = CELLS;

  for (const i of shuffled(
    Array.from({ length: CELLS }, (_, k) => k),
    rand,
  )) {
    if (clues <= targetClues) break;
    const saved = given[i];
    given[i] = 0;
    if (countSolutions(given, 2) === 1) clues--;
    else given[i] = saved; // removal would allow a second solution
  }

  return { given, solution, clues };
};
