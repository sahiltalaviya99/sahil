/**
 * Minesweeper — the actual game, rules and all.
 *
 * Pure functions returning new boards, so React just renders state and the
 * rules can be asserted against directly in Node.
 *
 * The three things that separate a real implementation from a weekend one, all
 * of which are here:
 *   - mines are placed *after* the first click, excluding it and its
 *     neighbours, so the opening move always opens a region rather than
 *     ending the game on a coin flip;
 *   - revealing a zero flood-fills its whole region iteratively, not
 *     recursively — a 30×16 board can cascade deep enough to matter;
 *   - chording (clicking a satisfied number to clear its neighbours) is how
 *     the game is actually played at speed, and it can legitimately lose you
 *     the game if your flags are wrong.
 */

export type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  /** Mines in the eight surrounding cells. */
  adjacent: number;
};

export type GameState = 'idle' | 'playing' | 'won' | 'lost';

export type Board = {
  cols: number;
  rows: number;
  mines: number;
  cells: Cell[];
  state: GameState;
  /** Index that ended the game, so the UI can mark the fatal cell. */
  detonated: number | null;
};

export type Difficulty = { id: string; label: string; cols: number; rows: number; mines: number };

export const DIFFICULTIES: Difficulty[] = [
  { id: 'beginner', label: 'Beginner', cols: 9, rows: 9, mines: 10 },
  { id: 'intermediate', label: 'Intermediate', cols: 16, rows: 16, mines: 40 },
  { id: 'expert', label: 'Expert', cols: 24, rows: 16, mines: 80 },
];

const emptyCell = (): Cell => ({ mine: false, revealed: false, flagged: false, adjacent: 0 });

export const createBoard = ({ cols, rows, mines }: Difficulty): Board => ({
  cols,
  rows,
  mines,
  cells: Array.from({ length: cols * rows }, emptyCell),
  state: 'idle',
  detonated: null,
});

export const neighbours = (board: Board, i: number): number[] => {
  const x = i % board.cols;
  const y = Math.floor(i / board.cols);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= board.cols || ny < 0 || ny >= board.rows) continue;
      out.push(ny * board.cols + nx);
    }
  }
  return out;
};

const clone = (board: Board): Board => ({ ...board, cells: board.cells.map((c) => ({ ...c })) });

/**
 * Place mines, keeping `safe` and everything around it clear.
 *
 * `rand` is injected so tests can pin a seed rather than hoping. If the board
 * is so dense that the safe zone can't be excluded, the exclusion shrinks to
 * just the clicked cell — better a hard opening than an infinite loop.
 */
export const placeMines = (board: Board, safe: number, rand: () => number = Math.random): Board => {
  const next = clone(board);
  const total = next.cols * next.rows;
  const excluded = new Set<number>([safe, ...neighbours(next, safe)]);
  if (total - excluded.size < next.mines) {
    excluded.clear();
    excluded.add(safe);
  }

  let placed = 0;
  while (placed < next.mines) {
    const i = Math.floor(rand() * total);
    if (excluded.has(i) || next.cells[i].mine) continue;
    next.cells[i].mine = true;
    placed++;
  }

  for (let i = 0; i < total; i++) {
    next.cells[i].adjacent = neighbours(next, i).filter((n) => next.cells[n].mine).length;
  }

  return next;
};

const allSafeRevealed = (board: Board) =>
  board.cells.every((c) => c.mine || c.revealed);

/** Reveal every mine and mark wrong flags — the standard end-of-game board. */
const exposeAll = (board: Board, detonated: number | null): Board => {
  const next = clone(board);
  for (const cell of next.cells) {
    if (cell.mine) cell.revealed = true;
  }
  next.state = 'lost';
  next.detonated = detonated;
  return next;
};

/** Iterative flood fill from `origin`. Mutates `cells` in place — caller owns the clone. */
const floodFrom = (board: Board, origin: number) => {
  const stack = [origin];
  while (stack.length) {
    const i = stack.pop()!;
    const cell = board.cells[i];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    // Only zero-adjacency cells continue the cascade; numbered cells are the
    // boundary and stop it.
    if (cell.adjacent === 0) {
      for (const n of neighbours(board, i)) {
        if (!board.cells[n].revealed && !board.cells[n].flagged) stack.push(n);
      }
    }
  }
};

export const reveal = (board: Board, i: number, rand: () => number = Math.random): Board => {
  if (board.state === 'won' || board.state === 'lost') return board;

  // First click: lay the mines around it now, so the opening is always safe.
  let working = board;
  if (working.state === 'idle') {
    working = placeMines(working, i, rand);
    working.state = 'playing';
  }

  if (working.cells[i].flagged || working.cells[i].revealed) return working;

  if (working.cells[i].mine) return exposeAll(working, i);

  const next = clone(working);
  floodFrom(next, i);
  if (allSafeRevealed(next)) next.state = 'won';
  return next;
};

export const toggleFlag = (board: Board, i: number): Board => {
  if (board.state === 'won' || board.state === 'lost') return board;
  if (board.cells[i].revealed) return board;
  const next = clone(board);
  next.cells[i].flagged = !next.cells[i].flagged;
  return next;
};

/**
 * Chord: on a revealed number whose adjacent flags equal its count, reveal
 * every unflagged neighbour. This is how the game is played at speed — and if
 * the flags are wrong it will happily detonate, which is correct.
 */
export const chord = (board: Board, i: number): Board => {
  if (board.state !== 'playing') return board;
  const cell = board.cells[i];
  if (!cell.revealed || cell.adjacent === 0) return board;

  const around = neighbours(board, i);
  const flagged = around.filter((n) => board.cells[n].flagged).length;
  if (flagged !== cell.adjacent) return board;

  const toOpen = around.filter((n) => !board.cells[n].flagged && !board.cells[n].revealed);
  if (!toOpen.length) return board;

  const hit = toOpen.find((n) => board.cells[n].mine);
  if (hit !== undefined) return exposeAll(board, hit);

  const next = clone(board);
  for (const n of toOpen) floodFrom(next, n);
  if (allSafeRevealed(next)) next.state = 'won';
  return next;
};

export const flagsUsed = (board: Board) => board.cells.filter((c) => c.flagged).length;
export const minesRemaining = (board: Board) => board.mines - flagsUsed(board);
