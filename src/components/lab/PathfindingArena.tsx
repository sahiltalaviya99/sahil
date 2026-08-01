import { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Grid3x3, Mountain, Play, Shuffle, Square } from 'lucide-react';

import {
  ALGORITHMS,
  createGrid,
  generateMaze,
  idx,
  run,
  scatterTerrain,
  type Algorithm,
  type Grid,
  type RunResult,
} from '@/lib/pathfinding';
import { cn } from '@/lib/utils';

/**
 * Pathfinding arena — draw a maze, then watch three algorithms solve it.
 *
 * The comparison is the point, not the animation. Every run executes all three
 * and fills the table, so one click shows that A* reaches the same answer as
 * Dijkstra while expanding a fraction of the cells, and that BFS — which
 * ignores terrain cost — confidently returns a route that is short in steps and
 * expensive to walk.
 *
 * Rendered on canvas: a 49×25 grid is 1,225 cells, and repainting that many DOM
 * nodes every animation frame would flatten the main thread. All the algorithms
 * live in lib/pathfinding.ts as pure functions and are tested directly.
 */

const COLS = 49;
const ROWS = 25;

/** Cell index from coordinates, for the fixed grid this component owns. */
const at = (x: number, y: number) => y * COLS + x;

type Brush = 'wall' | 'terrain' | 'erase';

const BRUSHES: Array<{ id: Brush; label: string; icon: typeof Square }> = [
  { id: 'wall', label: 'Wall', icon: Square },
  { id: 'terrain', label: 'Rough ×9', icon: Mountain },
  { id: 'erase', label: 'Erase', icon: Eraser },
];

export const PathfindingArena = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<Grid>(() => createGrid(COLS, ROWS));
  const [start, setStart] = useState(() => at(1, 12));
  const [goal, setGoal] = useState(() => at(47, 12));
  const [algorithm, setAlgorithm] = useState<Algorithm>('astar');
  const [brush, setBrush] = useState<Brush>('wall');
  const [results, setResults] = useState<Record<Algorithm, RunResult> | null>(null);
  const [cursor, setCursor] = useState(0);
  const [running, setRunning] = useState(false);

  /** What the pointer grabbed on pointerdown — endpoints drag, cells paint. */
  const dragMode = useRef<'paint' | 'start' | 'goal' | null>(null);

  /* ----------------------------- drawing ---------------------------- */

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const cell = cw / COLS;
    const ch = cell * ROWS;

    if (canvas.width !== Math.floor(cw * dpr) || canvas.height !== Math.floor(ch * dpr)) {
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.height = `${ch}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue('--primary').trim() || '158 64% 52%';
    const signal = css.getPropertyValue('--signal').trim() || '83 78% 55%';
    const border = css.getPropertyValue('--border').trim() || '218 13% 16%';

    const result = results?.[algorithm];
    const explored = new Uint8Array(COLS * ROWS);
    if (result) {
      for (let i = 0; i < Math.min(cursor, result.order.length); i++) explored[result.order[i]] = 1;
    }
    const onPath = new Uint8Array(COLS * ROWS);
    // Only reveal the path once the exploration animation has caught up.
    if (result && cursor >= result.order.length) {
      for (const i of result.path) onPath[i] = 1;
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x;
        const px = x * cell;
        const py = y * cell;

        let fill = `hsl(${border} / 0.28)`;
        if (grid.weights[i] > 1) fill = `hsl(${signal} / 0.14)`;
        if (explored[i]) fill = `hsl(${primary} / 0.28)`;
        if (onPath[i]) fill = `hsl(${primary} / 0.95)`;
        if (grid.walls[i]) fill = `hsl(${border} / 1)`;
        if (i === start) fill = `hsl(${signal} / 1)`;
        if (i === goal) fill = `hsl(${primary} / 1)`;

        ctx.fillStyle = fill;
        // The 1px inset is the grid: cheaper and crisper than stroking lines.
        ctx.fillRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
      }
    }
  }, [grid, start, goal, results, algorithm, cursor]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  /* ---------------------------- animation --------------------------- */

  useEffect(() => {
    if (!running || !results) return;
    const total = results[algorithm].order.length;
    // Fixed frame budget rather than a fixed delay, so a 700-cell Dijkstra
    // sweep and a 39-cell A* run both finish in about the same wall time.
    const perFrame = Math.max(1, Math.ceil(total / 90));
    let raf = 0;

    const tick = () => {
      setCursor((c) => {
        const next = c + perFrame;
        if (next >= total) {
          setRunning(false);
          return total;
        }
        raf = requestAnimationFrame(tick);
        return next;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, results, algorithm]);

  /* --------------------------- interaction -------------------------- */

  const cellAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cell = rect.width / COLS;
    const x = Math.floor((e.clientX - rect.left) / cell);
    const y = Math.floor((e.clientY - rect.top) / cell);
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return null;
    return y * COLS + x;
  };

  const paint = (i: number) => {
    if (i === start || i === goal) return;
    setGrid((g) => {
      const walls = new Uint8Array(g.walls);
      const weights = new Uint8Array(g.weights);
      if (brush === 'wall') {
        walls[i] = 1;
        weights[i] = 1;
      } else if (brush === 'terrain') {
        walls[i] = 0;
        weights[i] = 9;
      } else {
        walls[i] = 0;
        weights[i] = 1;
      }
      return { ...g, walls, weights };
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const i = cellAt(e);
    if (i === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (i === start) dragMode.current = 'start';
    else if (i === goal) dragMode.current = 'goal';
    else {
      dragMode.current = 'paint';
      paint(i);
    }
    clear();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragMode.current) return;
    const i = cellAt(e);
    if (i === null) return;
    if (dragMode.current === 'start') {
      if (i !== goal) setStart(i);
    } else if (dragMode.current === 'goal') {
      if (i !== start) setGoal(i);
    } else {
      paint(i);
    }
  };

  const clear = () => {
    setResults(null);
    setCursor(0);
    setRunning(false);
  };

  const execute = () => {
    // Run all three — the table is the exhibit, the animation is the garnish.
    const next = {
      bfs: run(grid, 'bfs', start, goal),
      dijkstra: run(grid, 'dijkstra', start, goal),
      astar: run(grid, 'astar', start, goal),
    } as Record<Algorithm, RunResult>;
    setResults(next);
    setCursor(0);
    setRunning(true);
  };

  const maze = () => {
    const g = generateMaze(createGrid(COLS, ROWS));
    setGrid(g);
    setStart(idx(g, 1, 1));
    setGoal(idx(g, COLS - 2, ROWS - 2));
    clear();
  };

  const terrain = () => {
    setGrid((g) => scatterTerrain({ ...g, walls: new Uint8Array(g.walls) }));
    clear();
  };

  const reset = () => {
    setGrid(createGrid(COLS, ROWS));
    setStart(at(1, 12));
    setGoal(at(47, 12));
    clear();
  };

  const unreachable = results && results[algorithm].path.length === 0;

  return (
    <div className="surface overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-elevated/40 p-3">
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {ALGORITHMS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setAlgorithm(a.id);
                setCursor(0);
                if (results) setRunning(true);
              }}
              title={a.note}
              className={cn(
                'rounded-md px-2.5 py-1 font-mono text-[0.68rem] transition-colors',
                algorithm === a.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {a.label}
            </button>
          ))}
        </div>

        <button onClick={execute} className="btn-primary px-3 py-1.5 text-xs">
          <Play className="h-3 w-3" />
          Run
        </button>

        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {BRUSHES.map((b) => (
            <button
              key={b.id}
              onClick={() => setBrush(b.id)}
              title={b.label}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.68rem] transition-colors',
                brush === b.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <b.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{b.label}</span>
            </button>
          ))}
        </div>

        <button onClick={maze} className="btn-ghost px-3 py-1.5 text-xs">
          <Grid3x3 className="h-3 w-3" />
          Maze
        </button>
        <button onClick={terrain} className="btn-ghost px-3 py-1.5 text-xs">
          <Shuffle className="h-3 w-3" />
          Terrain
        </button>
        <button onClick={reset} className="btn-ghost px-3 py-1.5 text-xs">
          Clear
        </button>
      </div>

      {/* Grid */}
      <div className="p-3">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            dragMode.current = null;
          }}
          onPointerCancel={() => {
            dragMode.current = null;
          }}
          className="w-full touch-none rounded-lg"
          style={{ cursor: 'crosshair' }}
          aria-label="Pathfinding grid. Draw walls, drag the endpoints, then press Run."
        />
      </div>

      {/* Comparison — the actual exhibit */}
      <div className="border-t border-border/70 p-3 sm:p-4">
        {unreachable && (
          <p className="mb-3 font-mono text-xs text-destructive">
            No route exists — the goal is walled off.
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-max border-collapse text-left font-mono text-[0.68rem]">
            <thead>
              <tr className="border-b border-border bg-elevated/60 text-muted-foreground">
                <th className="px-3 py-2 font-medium">algorithm</th>
                <th className="px-3 py-2 font-medium">cells expanded</th>
                <th className="px-3 py-2 font-medium">steps</th>
                <th className="px-3 py-2 font-medium">route cost</th>
                <th className="px-3 py-2 font-medium">time</th>
              </tr>
            </thead>
            <tbody>
              {ALGORITHMS.map((a) => {
                const r = results?.[a.id];
                const best = results
                  ? Math.min(...ALGORITHMS.map((x) => results[x.id].cost || Infinity))
                  : 0;
                return (
                  <tr
                    key={a.id}
                    className={cn(
                      'border-b border-border/50 last:border-0',
                      algorithm === a.id && 'bg-primary/[0.06]',
                    )}
                  >
                    <td className="px-3 py-1.5">
                      <span className={algorithm === a.id ? 'text-primary' : 'text-foreground'}>
                        {a.label}
                      </span>
                      <span className="ml-2 hidden text-muted-foreground/50 sm:inline">
                        {a.note}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">{r ? r.explored : '—'}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {r ? (r.path.length ? r.path.length - 1 : '—') : '—'}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-1.5',
                        r && r.cost && r.cost > best ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {r ? r.cost || '—' : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground/60">
                      {r ? `${r.ms.toFixed(2)} ms` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[0.7rem] leading-relaxed text-muted-foreground/70">
          Draw walls, drop <span className="text-signal">rough terrain</span> (costs 9 to cross),
          or drag either endpoint — then Run. Every press executes all three, so the table is a
          real comparison. A* reaches the same route as Dijkstra while expanding a fraction of the
          cells. BFS often finds a <em>shorter</em> route that costs far more, because it counts
          steps and ignores terrain entirely — a different question, not a worse answer.
        </p>
      </div>
    </div>
  );
};
