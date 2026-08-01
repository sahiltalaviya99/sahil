import { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Pause, Play, Shuffle, SkipForward } from 'lucide-react';

import {
  PATTERNS,
  createCells,
  population,
  randomise,
  stamp,
  step,
  type Cells,
  type Pattern,
} from '@/lib/life';
import { cn } from '@/lib/utils';

/**
 * Conway's Game of Life.
 *
 * Four rules, no player, unbounded complexity — the canonical demonstration
 * that simple local rules produce structure nobody designed. It's the one
 * exhibit here that isn't showing off anything except that.
 *
 * Canvas, because a 120×60 grid is 7,200 cells redrawn every tick. The grid
 * wraps into a torus, so gliders leave one edge and return on the other rather
 * than dying against a wall — a bounded grid quietly changes the rules at the
 * border and long-running patterns decay there.
 */

const W = 120;
const H = 60;

export const GameOfLife = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cells, setCells] = useState<Cells>(() =>
    stamp(createCells(W, H), W, H, PATTERNS.find((p) => p.id === 'gosper')!, 6, 6),
  );
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(12);
  const [generation, setGeneration] = useState(0);
  const [brush, setBrush] = useState<Pattern | null>(null);
  const painting = useRef(false);

  /* ------------------------------ simulation ----------------------------- */
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setCells((c) => step(c, W, H));
      setGeneration((g) => g + 1);
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [running, speed]);

  /* ------------------------------- drawing ------------------------------- */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const cell = cw / W;
    const ch = cell * H;

    if (canvas.width !== Math.floor(cw * dpr) || canvas.height !== Math.floor(ch * dpr)) {
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.height = `${ch}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue('--primary').trim() || '158 64% 52%';
    const border = css.getPropertyValue('--border').trim() || '218 13% 16%';

    ctx.fillStyle = `hsl(${border} / 0.22)`;
    ctx.fillRect(0, 0, cw, ch);

    // One path for every live cell — 7,200 individual fills would not hold 60fps.
    ctx.fillStyle = `hsl(${primary})`;
    ctx.beginPath();
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (cells[y * W + x]) ctx.rect(x * cell, y * cell, cell - 0.5, cell - 0.5);
      }
    }
    ctx.fill();
  }, [cells]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  /* ----------------------------- interaction ----------------------------- */
  const cellAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = rect.width / W;
    const x = Math.floor((e.clientX - rect.left) / size);
    const y = Math.floor((e.clientY - rect.top) / size);
    if (x < 0 || x >= W || y < 0 || y >= H) return null;
    return { x, y };
  };

  const apply = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const at = cellAt(e);
    if (!at) return;
    setCells((c) =>
      brush
        ? // Stamping a pattern centres it on the cursor — placing by top-left
          // makes it feel like it lands somewhere you didn't click.
          stamp(
            c,
            W,
            H,
            brush,
            at.x - Math.round(Math.max(...brush.points.map((p) => p[0])) / 2),
            at.y - Math.round(Math.max(...brush.points.map((p) => p[1])) / 2),
          )
        : (() => {
            const next = new Uint8Array(c);
            next[at.y * W + at.x] = 1;
            return next;
          })(),
    );
    if (brush) setBrush(null); // one stamp per selection, then back to drawing
  };

  const clear = () => {
    setCells(createCells(W, H));
    setGeneration(0);
    setRunning(false);
  };

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-elevated/40 p-3">
        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={() => setRunning((v) => !v)}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {running ? 'Pause' : 'Run'}
          </button>
          <button
            onClick={() => {
              setCells((c) => step(c, W, H));
              setGeneration((g) => g + 1);
            }}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            <SkipForward className="h-3 w-3" />
            Step
          </button>
          <span className="tabular-nums text-muted-foreground/70">
            gen {generation} · {population(cells)} alive
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground/60">
            Speed
            <input
              type="range"
              min={1}
              max={30}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="h-1 w-20 accent-primary"
              aria-label="Simulation speed"
            />
          </label>
          <button
            onClick={() => {
              setCells(randomise(W, H));
              setGeneration(0);
            }}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            <Shuffle className="h-3 w-3" />
            Random
          </button>
          <button onClick={clear} className="btn-ghost px-3 py-1.5 text-xs">
            <Eraser className="h-3 w-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Pattern palette */}
      <div className="flex flex-wrap gap-1.5 border-b border-border/70 px-3 py-2.5">
        <span className="mr-1 self-center font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground/50">
          Stamp
        </span>
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => setBrush(brush?.id === p.id ? null : p)}
            title={p.note}
            className={cn(
              'rounded-full border px-2.5 py-1 font-mono text-[0.6rem] transition-colors',
              brush?.id === p.id
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="p-3">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            painting.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            apply(e);
          }}
          onPointerMove={(e) => {
            if (painting.current && !brush) apply(e);
          }}
          onPointerUp={(e) => {
            painting.current = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          className="w-full cursor-crosshair touch-none rounded-lg"
          aria-label="Game of Life grid. Click to draw cells or stamp a pattern."
        />
      </div>

      <p className="border-t border-border/60 px-4 py-3 text-[0.7rem] leading-relaxed text-muted-foreground/70">
        Draw with the pointer, or pick a pattern and click to place it. Four rules: a live
        cell with two or three neighbours survives, a dead cell with exactly three is born,
        everything else dies. The grid is a <strong>torus</strong> — gliders that leave the
        right edge come back on the left, rather than dissolving against a wall.
      </p>
    </div>
  );
};
