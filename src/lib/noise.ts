/**
 * Deterministic 2D value noise, and the flow field built on it.
 *
 * The animated backgrounds need a smooth, continuous field they can sample per
 * particle per frame — `Math.random()` gives you static, not structure. This is
 * value noise rather than Perlin/simplex: for a background at 60fps the visual
 * difference is nil, the implementation is a third of the size, and there is no
 * gradient table to get subtly wrong.
 *
 * Pure and DOM-free on purpose, like every other engine in this repo, so it can
 * be bundled with esbuild and asserted against in Node. Determinism is the
 * property that matters most — a field that differs between two samples of the
 * same coordinate makes particles jitter rather than flow.
 */

/**
 * Integer hash → [0, 1).
 *
 * `Math.imul` throughout: plain `*` on values this size silently goes through
 * float64 and loses the low bits that carry all the entropy, which shows up as
 * visible banding in the field.
 */
export const hash2 = (ix: number, iy: number, seed = 0): number => {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

/** Smoothstep. Linear interpolation between lattice points leaves visible creases. */
const fade = (t: number) => t * t * (3 - 2 * t);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smooth value noise in [-1, 1]. Continuous everywhere, including across negative coordinates. */
export const noise2 = (x: number, y: number, seed = 0): number => {
  // Math.floor, not `| 0` — the latter truncates toward zero, so the lattice
  // cell is wrong for every negative coordinate and the field tears at x = 0.
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);

  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x0 + 1, y0, seed);
  const n01 = hash2(x0, y0 + 1, seed);
  const n11 = hash2(x0 + 1, y0 + 1, seed);

  return lerp(lerp(n00, n10, fx), lerp(n01, n11, fx), fy) * 2 - 1;
};

/**
 * Fractal Brownian motion — octaves of noise2 at doubling frequency and halving
 * amplitude. Normalised by the total amplitude so the result stays in [-1, 1]
 * regardless of octave count; without that, adding an octave quietly rescales
 * the whole field and every tuned constant downstream drifts.
 */
export const fbm = (x: number, y: number, octaves = 3, seed = 0): number => {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let total = 0;

  for (let o = 0; o < octaves; o++) {
    sum += noise2(x * freq, y * freq, seed + o * 1013) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }

  return total === 0 ? 0 : sum / total;
};

/**
 * Direction of the flow field at a point, in radians.
 *
 * `t` advances the field itself rather than the particles, which is what makes
 * the streams reorganise over time instead of running down fixed rails.
 * Multiplied past 2π so neighbouring cells can differ by more than a half turn
 * — a field clamped to one rotation reads as a single slow swirl.
 */
export const flowAngle = (x: number, y: number, t = 0, seed = 0): number =>
  fbm(x, y + t * 0.12, 3, seed) * Math.PI * 3;
