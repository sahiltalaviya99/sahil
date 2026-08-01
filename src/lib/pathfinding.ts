/**
 * Grid pathfinding: BFS, Dijkstra and A*, plus maze generation.
 *
 * Pure functions over typed arrays — no DOM, no React — so the algorithms can
 * be asserted against directly in Node rather than through a canvas.
 *
 * The three are here to be *compared*, which is the interesting part:
 *   - BFS ignores terrain cost entirely, so on a weighted grid it confidently
 *     returns a route that is short in steps and expensive to walk. It is not
 *     a worse implementation of the same thing — it answers a different
 *     question, and that distinction is the whole demo.
 *   - Dijkstra gets the cheapest route but explores outward in every direction.
 *   - A* gets the same route as Dijkstra while expanding far fewer nodes,
 *     because the heuristic points it at the goal.
 */

export type Grid = {
  cols: number;
  rows: number;
  /** 1 = impassable. */
  walls: Uint8Array;
  /** Movement cost to enter a cell. Always >= 1. */
  weights: Uint8Array;
};

export type Algorithm = 'bfs' | 'dijkstra' | 'astar';

export type RunResult = {
  /** Cell indices in the order they were expanded — drives the animation. */
  order: number[];
  /** Start → goal, inclusive. Empty when the goal is unreachable. */
  path: number[];
  /** Total terrain cost of the path (excludes the start cell). */
  cost: number;
  /** How many cells the algorithm had to expand. The number that matters. */
  explored: number;
  ms: number;
};

export const idx = (grid: Grid, x: number, y: number) => y * grid.cols + x;
export const xOf = (grid: Grid, i: number) => i % grid.cols;
export const yOf = (grid: Grid, i: number) => Math.floor(i / grid.cols);

export const createGrid = (cols: number, rows: number): Grid => ({
  cols,
  rows,
  walls: new Uint8Array(cols * rows),
  weights: new Uint8Array(cols * rows).fill(1),
});

/** 4-directional. No diagonals, which keeps the Manhattan heuristic admissible. */
const neighbours = (grid: Grid, i: number, out: number[]) => {
  out.length = 0;
  const x = xOf(grid, i);
  const y = yOf(grid, i);
  if (x > 0) out.push(i - 1);
  if (x < grid.cols - 1) out.push(i + 1);
  if (y > 0) out.push(i - grid.cols);
  if (y < grid.rows - 1) out.push(i + grid.cols);
  return out;
};

/** Binary min-heap keyed by number. Kept local — a sorted array turns Dijkstra quadratic. */
class MinHeap {
  private keys: number[] = [];
  private vals: number[] = [];

  get size() {
    return this.vals.length;
  }

  push(key: number, val: number) {
    this.keys.push(key);
    this.vals.push(val);
    let i = this.vals.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.keys[parent] <= this.keys[i]) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): number | undefined {
    if (!this.vals.length) return undefined;
    const top = this.vals[0];
    const lastKey = this.keys.pop()!;
    const lastVal = this.vals.pop()!;
    if (this.vals.length) {
      this.keys[0] = lastKey;
      this.vals[0] = lastVal;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let smallest = i;
        if (l < this.keys.length && this.keys[l] < this.keys[smallest]) smallest = l;
        if (r < this.keys.length && this.keys[r] < this.keys[smallest]) smallest = r;
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  private swap(a: number, b: number) {
    [this.keys[a], this.keys[b]] = [this.keys[b], this.keys[a]];
    [this.vals[a], this.vals[b]] = [this.vals[b], this.vals[a]];
  }
}

const rebuild = (cameFrom: Int32Array, start: number, goal: number): number[] => {
  if (cameFrom[goal] === -1 && goal !== start) return [];
  const path: number[] = [];
  let cur = goal;
  // Guard the walk: a corrupt parent chain must not spin forever.
  for (let guard = 0; guard <= cameFrom.length; guard++) {
    path.push(cur);
    if (cur === start) {
      path.reverse();
      return path;
    }
    cur = cameFrom[cur];
    if (cur === -1) return [];
  }
  return [];
};

const pathCost = (grid: Grid, path: number[]) =>
  path.slice(1).reduce((sum, i) => sum + grid.weights[i], 0);

const manhattan = (grid: Grid, a: number, b: number) =>
  Math.abs(xOf(grid, a) - xOf(grid, b)) + Math.abs(yOf(grid, a) - yOf(grid, b));

export const run = (
  grid: Grid,
  algorithm: Algorithm,
  start: number,
  goal: number,
): RunResult => {
  const t0 = performance.now();
  const n = grid.cols * grid.rows;
  const cameFrom = new Int32Array(n).fill(-1);
  const order: number[] = [];
  const nb: number[] = [];

  const finish = (path: number[]): RunResult => ({
    order,
    path,
    cost: pathCost(grid, path),
    explored: order.length,
    ms: performance.now() - t0,
  });

  if (grid.walls[start] || grid.walls[goal]) return finish([]);

  if (algorithm === 'bfs') {
    // Plain queue, and crucially no cost accounting — BFS optimises hops.
    const seen = new Uint8Array(n);
    const queue = [start];
    seen[start] = 1;
    for (let head = 0; head < queue.length; head++) {
      const cur = queue[head];
      order.push(cur);
      if (cur === goal) return finish(rebuild(cameFrom, start, goal));
      for (const next of neighbours(grid, cur, nb)) {
        if (seen[next] || grid.walls[next]) continue;
        seen[next] = 1;
        cameFrom[next] = cur;
        queue.push(next);
      }
    }
    return finish([]);
  }

  const best = new Float64Array(n).fill(Infinity);
  const done = new Uint8Array(n);
  const heap = new MinHeap();
  best[start] = 0;
  heap.push(algorithm === 'astar' ? manhattan(grid, start, goal) : 0, start);

  while (heap.size) {
    const cur = heap.pop()!;
    // Lazy deletion: a cell can sit in the heap more than once, and only the
    // first (cheapest) pop counts as an expansion.
    if (done[cur]) continue;
    done[cur] = 1;
    order.push(cur);

    if (cur === goal) return finish(rebuild(cameFrom, start, goal));

    for (const next of neighbours(grid, cur, nb)) {
      if (grid.walls[next] || done[next]) continue;
      const tentative = best[cur] + grid.weights[next];
      if (tentative >= best[next]) continue;
      best[next] = tentative;
      cameFrom[next] = cur;
      heap.push(
        algorithm === 'astar' ? tentative + manhattan(grid, next, goal) : tentative,
        next,
      );
    }
  }

  return finish([]);
};

/* ------------------------------------------------------------------ */
/*  Generation                                                         */
/* ------------------------------------------------------------------ */

/**
 * Recursive-backtracker maze. Carves on odd coordinates so walls stay one cell
 * thick, which is what makes the result readable at small cell sizes.
 *
 * `rand` is injected so tests can pin a seed instead of hoping.
 */
export const generateMaze = (grid: Grid, rand: () => number = Math.random): Grid => {
  const walls = new Uint8Array(grid.cols * grid.rows).fill(1);
  const stack: number[] = [];
  const startX = 1;
  const startY = 1;

  walls[idx(grid, startX, startY)] = 0;
  stack.push(idx(grid, startX, startY));

  while (stack.length) {
    const cur = stack[stack.length - 1];
    const cx = xOf(grid, cur);
    const cy = yOf(grid, cur);

    const options: Array<[number, number]> = [];
    if (cx > 2 && walls[idx(grid, cx - 2, cy)]) options.push([cx - 2, cy]);
    if (cx < grid.cols - 3 && walls[idx(grid, cx + 2, cy)]) options.push([cx + 2, cy]);
    if (cy > 2 && walls[idx(grid, cx, cy - 2)]) options.push([cx, cy - 2]);
    if (cy < grid.rows - 3 && walls[idx(grid, cx, cy + 2)]) options.push([cx, cy + 2]);

    if (!options.length) {
      stack.pop();
      continue;
    }

    const [nx, ny] = options[Math.floor(rand() * options.length)];
    walls[idx(grid, (cx + nx) / 2, (cy + ny) / 2)] = 0; // knock the wall between
    walls[idx(grid, nx, ny)] = 0;
    stack.push(idx(grid, nx, ny));
  }

  return { ...grid, walls, weights: new Uint8Array(grid.cols * grid.rows).fill(1) };
};

/** Scatter costly terrain so Dijkstra and BFS visibly disagree. */
export const scatterTerrain = (grid: Grid, rand: () => number = Math.random): Grid => {
  const weights = new Uint8Array(grid.cols * grid.rows).fill(1);
  const blobs = Math.max(3, Math.round((grid.cols * grid.rows) / 260));
  for (let b = 0; b < blobs; b++) {
    const cx = Math.floor(rand() * grid.cols);
    const cy = Math.floor(rand() * grid.rows);
    const r = 2 + Math.floor(rand() * 3);
    for (let y = Math.max(0, cy - r); y < Math.min(grid.rows, cy + r); y++) {
      for (let x = Math.max(0, cx - r); x < Math.min(grid.cols, cx + r); x++) {
        if (Math.hypot(x - cx, y - cy) <= r) weights[idx(grid, x, y)] = 9;
      }
    }
  }
  return { ...grid, weights };
};

export const ALGORITHMS: Array<{ id: Algorithm; label: string; note: string }> = [
  { id: 'bfs', label: 'BFS', note: 'Fewest steps. Ignores terrain cost entirely.' },
  { id: 'dijkstra', label: 'Dijkstra', note: 'Cheapest route, but explores in every direction.' },
  { id: 'astar', label: 'A*', note: 'Same route as Dijkstra, far fewer cells expanded.' },
];
