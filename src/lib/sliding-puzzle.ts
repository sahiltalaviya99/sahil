/**
 * Sliding tile puzzle (the 15-puzzle and friends).
 *
 * The subtle part is **solvability**. Exactly half of all permutations of a
 * sliding puzzle are unreachable from the solved state — shuffle naively and
 * roughly one game in two is impossible, with no feedback to the player beyond
 * an hour of wasted effort. Sam Loyd famously offered $1,000 for a solution to
 * one of the unsolvable ones.
 *
 * `shuffle` guarantees a solvable board by computing the parity and, when it
 * comes out wrong, swapping two tiles to flip it.
 */

/** Row-major. 0 is the blank. */
export type Board = number[];

export type Size = { id: string; label: string; n: number };

export const SIZES: Size[] = [
  { id: '3', label: '3 × 3', n: 3 },
  { id: '4', label: '4 × 4', n: 4 },
  { id: '5', label: '5 × 5', n: 5 },
];

export const solvedBoard = (n: number): Board => [
  ...Array.from({ length: n * n - 1 }, (_, i) => i + 1),
  0,
];

export const isSolved = (board: Board): boolean => {
  for (let i = 0; i < board.length - 1; i++) if (board[i] !== i + 1) return false;
  return board[board.length - 1] === 0;
};

/** Pairs out of order, ignoring the blank. */
export const inversions = (board: Board): number => {
  const tiles = board.filter((v) => v !== 0);
  let count = 0;
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] > tiles[j]) count++;
    }
  }
  return count;
};

/**
 * Parity test.
 *
 * Odd width: solvable iff the inversion count is even.
 * Even width: solvable iff (inversions + the blank's row counted from the
 * bottom, 1-indexed) is odd.
 *
 * Sliding a tile horizontally never changes the inversion count; sliding one
 * vertically changes it by an odd number and also moves the blank's row — so
 * that combined quantity is invariant, and the solved board's value is the only
 * reachable one.
 */
export const isSolvable = (board: Board, n: number): boolean => {
  const inv = inversions(board);
  if (n % 2 === 1) return inv % 2 === 0;
  const blankRowFromBottom = n - Math.floor(board.indexOf(0) / n);
  return (inv + blankRowFromBottom) % 2 === 1;
};

/** Always returns a solvable board, and never the already-solved one. */
export const shuffle = (n: number, rand: () => number = Math.random): Board => {
  const board = solvedBoard(n);

  for (let attempt = 0; attempt < 100; attempt++) {
    for (let i = board.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [board[i], board[j]] = [board[j], board[i]];
    }

    if (!isSolvable(board, n)) {
      // Swapping any two non-blank tiles flips the inversion parity and leaves
      // the blank where it is — the cheapest way to land in the solvable half.
      const a = board.findIndex((v) => v !== 0);
      const b = board.findIndex((v, i) => v !== 0 && i > a);
      [board[a], board[b]] = [board[b], board[a]];
    }

    if (!isSolved(board)) return board;
  }

  return board;
};

/** Indices orthogonally adjacent to the blank — the only legal moves. */
export const movableTiles = (board: Board, n: number): number[] => {
  const blank = board.indexOf(0);
  const bx = blank % n;
  const by = Math.floor(blank / n);
  const out: number[] = [];
  if (bx > 0) out.push(blank - 1);
  if (bx < n - 1) out.push(blank + 1);
  if (by > 0) out.push(blank - n);
  if (by < n - 1) out.push(blank + n);
  return out;
};

/** Slide the tile at `i` into the blank. Returns null when that isn't legal. */
export const slide = (board: Board, i: number, n: number): Board | null => {
  if (!movableTiles(board, n).includes(i)) return null;
  const next = [...board];
  const blank = next.indexOf(0);
  next[blank] = next[i];
  next[i] = 0;
  return next;
};

/** How many tiles sit in their final position — a gentle progress signal. */
export const placedCount = (board: Board): number =>
  board.reduce((sum, v, i) => sum + (v !== 0 && v === i + 1 ? 1 : 0), 0);
