/**
 * 2048 — slide, merge, score.
 *
 * Pure functions over a flat 16-number array, so the merge rules can be
 * asserted directly rather than through a keyboard.
 *
 * The merge is where naive implementations go wrong, and the rules are exact:
 *   - a tile may merge at most ONCE per move, so [2,2,2,2] → [4,4], never [8];
 *   - merges resolve from the direction of travel, so pressing left turns
 *     [4,4,2] into [8,2] rather than [4,8];
 *   - a move that changes nothing must not spawn a tile, or the board fills up
 *     while the player is pressing a direction that does nothing.
 */

export const SIZE = 4;
export const WIN_TILE = 2048;

export type Direction = 'left' | 'right' | 'up' | 'down';
/** Row-major, 0 = empty. */
export type Grid = number[];

export type MoveResult = {
  grid: Grid;
  /** False when nothing shifted or merged — no tile should be spawned. */
  moved: boolean;
  /** Points earned this move: the sum of every tile created by a merge. */
  gained: number;
};

export const emptyGrid = (): Grid => new Array(SIZE * SIZE).fill(0);

export const emptyCells = (grid: Grid): number[] => {
  const out: number[] = [];
  for (let i = 0; i < grid.length; i++) if (grid[i] === 0) out.push(i);
  return out;
};

/** 90% a 2, 10% a 4 — the standard distribution. `rand` is injected for tests. */
export const addRandomTile = (grid: Grid, rand: () => number = Math.random): Grid => {
  const free = emptyCells(grid);
  if (!free.length) return grid;
  const next = [...grid];
  next[free[Math.floor(rand() * free.length)]] = rand() < 0.9 ? 2 : 4;
  return next;
};

export const createGame = (rand: () => number = Math.random): Grid =>
  addRandomTile(addRandomTile(emptyGrid(), rand), rand);

/**
 * Collapse one line toward index 0.
 *
 * Compact first, then merge left-to-right marking each result as spent, then
 * compact again. Doing it in one pass is what produces the [2,2,2,2] → [8] bug.
 */
const collapse = (line: number[]): { line: number[]; gained: number } => {
  const packed = line.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;

  for (let i = 0; i < packed.length; i++) {
    if (i + 1 < packed.length && packed[i] === packed[i + 1]) {
      const merged = packed[i] * 2;
      out.push(merged);
      gained += merged;
      i++; // consume the partner so it can't merge again this move
    } else {
      out.push(packed[i]);
    }
  }

  while (out.length < SIZE) out.push(0);
  return { line: out, gained };
};

/** Indices of one line, ordered so that index 0 is the far end in `dir`. */
const lineIndices = (dir: Direction, n: number): number[] => {
  const idx: number[] = [];
  for (let k = 0; k < SIZE; k++) {
    if (dir === 'left') idx.push(n * SIZE + k);
    else if (dir === 'right') idx.push(n * SIZE + (SIZE - 1 - k));
    else if (dir === 'up') idx.push(k * SIZE + n);
    else idx.push((SIZE - 1 - k) * SIZE + n);
  }
  return idx;
};

export const move = (grid: Grid, dir: Direction): MoveResult => {
  const next = [...grid];
  let gained = 0;
  let moved = false;

  for (let n = 0; n < SIZE; n++) {
    const idx = lineIndices(dir, n);
    const before = idx.map((i) => grid[i]);
    const { line: after, gained: g } = collapse(before);
    gained += g;
    for (let k = 0; k < SIZE; k++) {
      if (before[k] !== after[k]) moved = true;
      next[idx[k]] = after[k];
    }
  }

  return { grid: next, moved, gained };
};

/** No empty cell and no equal orthogonal neighbours. */
export const isGameOver = (grid: Grid): boolean => {
  if (emptyCells(grid).length) return false;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r * SIZE + c];
      if (c + 1 < SIZE && grid[r * SIZE + c + 1] === v) return false;
      if (r + 1 < SIZE && grid[(r + 1) * SIZE + c] === v) return false;
    }
  }
  return true;
};

export const hasWon = (grid: Grid): boolean => grid.some((v) => v >= WIN_TILE);

/**
 * Tailwind classes per tile value.
 *
 * Emerald deepens as the value climbs, then hands over to the lime `--signal`
 * for 512 and up so the big tiles read as an event. Low tiles stay quiet —
 * a board where every tile shouts has no sense of progress.
 */
export const tileClass = (value: number): string => {
  switch (value) {
    case 0:
      return 'bg-border/40';
    case 2:
      return 'bg-elevated text-muted-foreground';
    case 4:
      return 'bg-elevated text-foreground';
    case 8:
      return 'bg-primary/25 text-foreground';
    case 16:
      return 'bg-primary/40 text-foreground';
    case 32:
      return 'bg-primary/60 text-primary-foreground';
    case 64:
      return 'bg-primary/80 text-primary-foreground';
    case 128:
      return 'bg-primary text-primary-foreground';
    case 256:
      return 'bg-primary text-primary-foreground glow-sm';
    default:
      return 'bg-signal text-primary-foreground glow-md';
  }
};
