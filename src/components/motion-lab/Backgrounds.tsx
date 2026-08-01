import { useRef } from 'react';
import { motion } from 'framer-motion';

import { useCanvasScene, token, type SceneFrame } from '@/hooks/use-canvas-scene';
import { contourSegments } from '@/lib/marching-squares';
import { fbm, flowAngle, hash2 } from '@/lib/noise';

/**
 * Six animated backgrounds.
 *
 * Five are canvas, all of them through `useCanvasScene`, which owns the RAF
 * loop, dpr sizing, the resize observer, the visibility gate and the
 * reduced-motion path — so each scene below is only its draw function. One is
 * pure CSS/transform, because a sweeping beam does not need a pixel buffer and
 * putting it on the compositor costs nothing.
 *
 * Colours are read from the theme tokens rather than hardcoded, and re-read
 * every 90 frames, so the terminal's `theme` command recolours these the same
 * way it recolours the hero's dot field.
 */

type Palette = { primary: string; signal: string; border: string; bg: string };

const DEFAULTS: Palette = {
  primary: '158 64% 52%',
  signal: '83 78% 55%',
  border: '218 13% 16%',
  bg: '220 16% 4%',
};

const readPalette = (): Palette => ({
  primary: token('--primary', DEFAULTS.primary),
  signal: token('--signal', DEFAULTS.signal),
  border: token('--border', DEFAULTS.border),
  bg: token('--background', DEFAULTS.bg),
});

/** Re-reads the tokens periodically rather than every frame — getComputedStyle forces style resolution. */
const usePalette = () => {
  const ref = useRef<Palette>(DEFAULTS);
  return (frame: number) => {
    if (frame % 90 === 0) ref.current = readPalette();
    return ref.current;
  };
};

/* ========================================================================== */
/*  1. Topography — canvas + noise + marching squares                         */
/* ========================================================================== */

/**
 * A drifting contour map: the noise field read as terrain and traced at eleven
 * elevations.
 *
 * This replaced an aurora — three blurred radial blobs on looping transforms.
 * That effect is the single most copied background on the web right now, and a
 * page whose entire argument is "these are built, not installed" cannot open on
 * the one thing every template ships. This makes a claim the blobs can't: it is
 * a real algorithm over a real scalar field, and the ridges move because the
 * terrain is being resampled, not because a div is being translated.
 */
/**
 * Measured, not guessed. Benchmarked in Node against a full-width 1200x224
 * panel, which is the worst case (backgrounds drop to one column below xl):
 *
 *   GRID 6, 11 levels, 4 octaves -> 7.62 ms   nearly half the frame budget
 *   GRID 7, 11 levels, 4 octaves -> 3.43 ms
 *   GRID 7, 10 levels, 3 octaves -> 3.13 ms   <- here
 *   GRID 8,  9 levels, 3 octaves -> 2.24 ms   visibly sparser, ridges thin out
 *
 * The jump from 6 to 7 is most of the win because sampling is quadratic in the
 * spacing and fbm dominates. A fourth octave adds detail finer than the 7px
 * grid can resolve, so it costs 25% for something you cannot see.
 */
const GRID = 7; // sample spacing in CSS px — the cost knob
const LEVELS = 10;
const OCTAVES = 3;

export const Topography = () => {
  const palette = usePalette();
  const field = useRef<Float32Array>(new Float32Array(0));

  const ref = useCanvasScene(({ ctx, w, h, t, px, py, pointer, frame }: SceneFrame) => {
    const { primary, signal } = palette(frame);

    const cols = Math.ceil(w / GRID) + 1;
    const rows = Math.ceil(h / GRID) + 1;
    if (field.current.length !== cols * rows) field.current = new Float32Array(cols * rows);
    const f = field.current;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // fbm gives ridges and plains at several scales; a single octave is a
        // smooth blob field with no detail to contour. The frequency is tied to
        // GRID (7 / 0.061 ~ 115px per feature) so changing the sample spacing
        // rescales the terrain in pixels rather than resizing the hills.
        let v = fbm(x * 0.061, y * 0.061 + t * 0.09, OCTAVES, 17);

        if (pointer) {
          // The pointer raises a hill, so the contours crowd around it — the
          // same reading you get from a real map where the ground is steep.
          const d2 = ((x * GRID - px) ** 2 + (y * GRID - py) ** 2) / 9000;
          v += 0.85 * Math.exp(-d2);
        }

        f[y * cols + x] = v;
      }
    }

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;

    for (let i = 0; i < LEVELS; i++) {
      const level = -0.75 + (i / (LEVELS - 1)) * 1.5;
      const segs = contourSegments(f, cols, rows, level);
      if (!segs.length) continue;

      // Every level is one path, not one path per segment. Eleven strokes a
      // frame instead of a few thousand is the difference between this holding
      // 60fps and not.
      const high = i > LEVELS - 4;
      ctx.strokeStyle = `hsl(${high ? signal : primary} / ${high ? 0.5 : 0.16 + (i / LEVELS) * 0.3})`;
      ctx.beginPath();
      for (let s = 0; s < segs.length; s += 4) {
        ctx.moveTo(segs[s] * GRID, segs[s + 1] * GRID);
        ctx.lineTo(segs[s + 2] * GRID, segs[s + 3] * GRID);
      }
      ctx.stroke();
    }
  });

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
};

/* ========================================================================== */
/*  2. Constellation — canvas                                                 */
/* ========================================================================== */

const NODES = 64;
const LINK_DIST = 96;

type Node = { x: number; y: number; vx: number; vy: number };

export const Constellation = () => {
  const nodes = useRef<Node[]>([]);
  const palette = usePalette();

  const ref = useCanvasScene(({ ctx, w, h, dt, px, py, pointer, frame }: SceneFrame) => {
    const { primary } = palette(frame);

    // Positions are normalised 0–1 and scaled at draw time, so a resize
    // rearranges nothing — storing pixels means every node jumps on layout.
    if (!nodes.current.length) {
      nodes.current = Array.from({ length: NODES }, (_, i) => ({
        x: hash2(i, 1, 7),
        y: hash2(i, 2, 7),
        vx: (hash2(i, 3, 7) - 0.5) * 0.04,
        vy: (hash2(i, 4, 7) - 0.5) * 0.04,
      }));
    }

    ctx.clearRect(0, 0, w, h);

    for (const n of nodes.current) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      // Wrap rather than bounce: a bounce puts a visible hard edge on a field
      // that is supposed to look unbounded.
      if (n.x < 0) n.x += 1;
      if (n.x > 1) n.x -= 1;
      if (n.y < 0) n.y += 1;
      if (n.y > 1) n.y -= 1;
    }

    // O(n²) over 64 nodes is 2,016 pairs — trivial. It stops being trivial
    // around 300, which is why the count is capped here rather than tuned up.
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.current.length; i++) {
      const a = nodes.current[i];
      const ax = a.x * w;
      const ay = a.y * h;

      for (let j = i + 1; j < nodes.current.length; j++) {
        const b = nodes.current[j];
        const dx = ax - b.x * w;
        const dy = ay - b.y * h;
        const d = Math.hypot(dx, dy);
        if (d > LINK_DIST) continue;
        ctx.strokeStyle = `hsl(${primary} / ${(1 - d / LINK_DIST) * 0.28})`;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(b.x * w, b.y * h);
        ctx.stroke();
      }

      const pd = pointer ? Math.hypot(ax - px, ay - py) : Infinity;
      const near = pd < 130;
      if (near) {
        ctx.strokeStyle = `hsl(${primary} / ${(1 - pd / 130) * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(px, py);
        ctx.stroke();
      }

      ctx.fillStyle = `hsl(${primary} / ${near ? 0.95 : 0.5})`;
      ctx.beginPath();
      ctx.arc(ax, ay, near ? 2.2 : 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
};

/* ========================================================================== */
/*  3. Flow field — canvas + noise                                            */
/* ========================================================================== */

const PARTICLES = 260;
const LIFESPAN = 3.2;

type Particle = { x: number; y: number; age: number };

export const FlowField = () => {
  const parts = useRef<Particle[]>([]);
  const palette = usePalette();

  const ref = useCanvasScene(({ ctx, w, h, t, dt, px, py, pointer, frame }: SceneFrame) => {
    const { primary, signal, bg } = palette(frame);

    if (!parts.current.length) {
      parts.current = Array.from({ length: PARTICLES }, (_, i) => ({
        x: hash2(i, 11, 3) * w,
        y: hash2(i, 12, 3) * h,
        age: hash2(i, 13, 3) * LIFESPAN,
      }));
    }

    // Trails come from painting the background at low alpha instead of
    // clearing — cheaper than keeping a position history per particle, and it
    // fades old strokes on a curve rather than dropping them.
    ctx.fillStyle = `hsl(${bg} / 0.13)`;
    ctx.fillRect(0, 0, w, h);

    ctx.lineWidth = 1.1;
    for (const p of parts.current) {
      const a = flowAngle(p.x * 0.0032, p.y * 0.0032, t, 21);
      let vx = Math.cos(a) * 46;
      let vy = Math.sin(a) * 46;

      if (pointer) {
        // The pointer pushes the flow outward rather than attracting it —
        // attraction collapses every particle into one dot within a second.
        const dx = p.x - px;
        const dy = p.y - py;
        const d = Math.hypot(dx, dy);
        if (d < 150 && d > 0.001) {
          const push = (1 - d / 150) * 130;
          vx += (dx / d) * push;
          vy += (dy / d) * push;
        }
      }

      const nx = p.x + vx * dt;
      const ny = p.y + vy * dt;

      ctx.strokeStyle = `hsl(${p.age > LIFESPAN * 0.6 ? signal : primary} / 0.4)`;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      p.x = nx;
      p.y = ny;
      p.age += dt;

      // Respawn on a lifespan as well as on leaving the frame; without it the
      // particles all settle into the same few attractor streams and the rest
      // of the canvas goes empty.
      if (p.age > LIFESPAN || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
        p.x = Math.random() * w;
        p.y = Math.random() * h;
        p.age = 0;
      }
    }
  });

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
};

/* ========================================================================== */
/*  4. Digital rain — canvas                                                  */
/* ========================================================================== */

const COL_W = 14;

export const DigitalRain = () => {
  const drops = useRef<{ y: number; speed: number }[]>([]);
  const palette = usePalette();

  const ref = useCanvasScene(({ ctx, w, h, dt, frame }: SceneFrame) => {
    const { primary, bg } = palette(frame);
    const cols = Math.ceil(w / COL_W);

    if (drops.current.length !== cols) {
      drops.current = Array.from({ length: cols }, (_, i) => ({
        y: -hash2(i, 5, 13) * h,
        speed: 90 + hash2(i, 6, 13) * 210,
      }));
    }

    ctx.fillStyle = `hsl(${bg} / 0.16)`;
    ctx.fillRect(0, 0, w, h);

    ctx.font = '12px "JetBrains Mono Variable", "JetBrains Mono", monospace';
    ctx.textBaseline = 'top';

    for (let i = 0; i < cols; i++) {
      const d = drops.current[i];
      d.y += d.speed * dt;
      if (d.y > h + 40) {
        d.y = -40;
        d.speed = 90 + Math.random() * 210;
      }

      // Katakana by code point rather than a literal string — this file stays
      // pure ASCII, which is one less encoding trap on a Windows checkout.
      const glyph = String.fromCharCode(0x30a1 + Math.floor(hash2(i, frame >> 2, 31) * 90));
      // Head is bright, the trail is the fading fill above doing the work.
      ctx.fillStyle = `hsl(${primary} / 0.95)`;
      ctx.fillText(glyph, i * COL_W, d.y);
      ctx.fillStyle = `hsl(${primary} / 0.35)`;
      ctx.fillText(
        String.fromCharCode(0x30a1 + Math.floor(hash2(i, (frame >> 2) - 1, 31) * 90)),
        i * COL_W,
        d.y - 15,
      );
    }
  });

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
};

/* ========================================================================== */
/*  5. Beam grid — CSS only                                                   */
/* ========================================================================== */

const BEAMS = [
  { left: '18%', delay: 0, dur: 6.5 },
  { left: '46%', delay: 2.1, dur: 8 },
  { left: '72%', delay: 4.3, dur: 7.2 },
];

export const BeamGrid = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          'linear-gradient(hsl(var(--border) / 0.9) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.9) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        // Fades the grid out at the edges so it reads as a surface rather than
        // a texture that stops.
        maskImage: 'radial-gradient(ellipse at 50% 40%, black 25%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 25%, transparent 78%)',
      }}
    />
    {BEAMS.map((b, i) => (
      <motion.div
        key={i}
        // The beam spans the full height and carries a short bright band near
        // its top, because a transform percentage resolves against the element,
        // not its container — a 6rem bar animated -30%→130% travels 6rem and
        // never crosses the panel at all.
        initial={{ y: '-100%' }}
        animate={{ y: '100%' }}
        transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'linear' }}
        style={{
          left: b.left,
          background:
            'linear-gradient(to bottom, transparent 0%, hsl(var(--primary) / 0.9) 9%, transparent 18%)',
        }}
        className="absolute inset-y-0 w-px"
      />
    ))}
  </div>
);

/* ========================================================================== */
/*  6. Wave field — canvas                                                    */
/* ========================================================================== */

const LINES = 20;
const STEP = 7;

export const WaveField = () => {
  const palette = usePalette();

  const ref = useCanvasScene(({ ctx, w, h, t, px, py, pointer, frame }: SceneFrame) => {
    const { primary } = palette(frame);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;

    for (let i = 0; i < LINES; i++) {
      const baseY = ((i + 0.5) / LINES) * h;
      ctx.strokeStyle = `hsl(${primary} / ${0.1 + (1 - Math.abs(i / LINES - 0.5) * 2) * 0.3})`;
      ctx.beginPath();

      for (let x = 0; x <= w; x += STEP) {
        let y = baseY + Math.sin(x * 0.011 + t * 1.3 + i * 0.45) * 7;

        if (pointer) {
          // Gaussian bulge, not a linear cone: a linear falloff leaves a
          // visible crease exactly at the radius.
          const d2 = ((x - px) ** 2 + (baseY - py) ** 2) / 5200;
          y += Math.sign(baseY - py || 1) * 34 * Math.exp(-d2);
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    }
  });

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
};
