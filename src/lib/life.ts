/**
 * Conway's Game of Life.
 *
 * Four rules, no player, and unbounded complexity — the canonical example of
 * emergence, and the reason it has been the "hello world" of simulation since
 * 1970. Included because it is the opposite of everything else in this lab:
 * nothing here reads content, nothing is being demonstrated except that very
 * simple local rules produce structure nobody designed.
 *
 * The grid wraps (a torus), so gliders leave one edge and return on the other
 * instead of dissolving against a wall. A bounded grid quietly changes the
 * rules at the border, which is why long-running patterns die there.
 */

export type Cells = Uint8Array;

export const createCells = (w: number, h: number): Cells => new Uint8Array(w * h);

/**
 * One generation.
 *
 * Written against a source buffer into a fresh destination — updating in place
 * means a cell's neighbours are counted partly from this generation and partly
 * the next, and the whole simulation silently becomes a different automaton.
 */
export const step = (cells: Cells, w: number, h: number): Cells => {
  const next = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let live = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          // Wrap: +w/+h before the modulo so negatives land in range.
          const nx = (x + dx + w) % w;
          const ny = (y + dy + h) % h;
          live += cells[ny * w + nx];
        }
      }

      const alive = cells[y * w + x] === 1;
      // Survives on 2 or 3; born on exactly 3. Everything else dies.
      next[y * w + x] = alive ? (live === 2 || live === 3 ? 1 : 0) : live === 3 ? 1 : 0;
    }
  }

  return next;
};

export const population = (cells: Cells): number => cells.reduce((a, b) => a + b, 0);

export type Pattern = {
  id: string;
  label: string;
  note: string;
  /** Offsets from the pattern's top-left. */
  points: Array<[number, number]>;
};

export const PATTERNS: Pattern[] = [
  {
    id: 'glider',
    label: 'Glider',
    note: 'Travels one cell diagonally every four generations.',
    points: [
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  },
  {
    id: 'blinker',
    label: 'Blinker',
    note: 'The simplest oscillator — period 2.',
    points: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  },
  {
    id: 'toad',
    label: 'Toad',
    note: 'Period 2, and prettier about it.',
    points: [
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    id: 'pulsar',
    label: 'Pulsar',
    note: 'Period 3, and the most symmetric thing here.',
    points: [
      [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
      [0, 2], [5, 2], [7, 2], [12, 2],
      [0, 3], [5, 3], [7, 3], [12, 3],
      [0, 4], [5, 4], [7, 4], [12, 4],
      [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
      [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
      [0, 8], [5, 8], [7, 8], [12, 8],
      [0, 9], [5, 9], [7, 9], [12, 9],
      [0, 10], [5, 10], [7, 10], [12, 10],
      [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12],
    ],
  },
  {
    id: 'lwss',
    label: 'Lightweight spaceship',
    note: 'Moves two cells horizontally every four generations.',
    points: [
      [0, 0], [3, 0],
      [4, 1],
      [0, 2], [4, 2],
      [1, 3], [2, 3], [3, 3], [4, 3],
    ],
  },
  {
    id: 'rpentomino',
    label: 'R-pentomino',
    note: 'Five cells. Runs wild for 1,103 generations before settling.',
    points: [
      [1, 0], [2, 0],
      [0, 1], [1, 1],
      [1, 2],
    ],
  },
  {
    id: 'gosper',
    label: 'Gosper glider gun',
    note: 'Emits a glider every 30 generations — forever.',
    points: [
      [24, 0],
      [22, 1], [24, 1],
      [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
      [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3],
      [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4],
      [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5], [24, 5],
      [10, 6], [16, 6], [24, 6],
      [11, 7], [15, 7],
      [12, 8], [13, 8],
    ],
  },
];

/** Stamp a pattern with its top-left at (ox, oy), wrapping at the edges. */
export const stamp = (
  cells: Cells,
  w: number,
  h: number,
  pattern: Pattern,
  ox: number,
  oy: number,
): Cells => {
  const next = new Uint8Array(cells);
  for (const [px, py] of pattern.points) {
    const x = (((ox + px) % w) + w) % w;
    const y = (((oy + py) % h) + h) % h;
    next[y * w + x] = 1;
  }
  return next;
};

export const randomise = (w: number, h: number, density = 0.28, rand: () => number = Math.random): Cells => {
  const cells = new Uint8Array(w * h);
  for (let i = 0; i < cells.length; i++) cells[i] = rand() < density ? 1 : 0;
  return cells;
};
