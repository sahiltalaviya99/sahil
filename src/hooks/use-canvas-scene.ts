import { useEffect, useRef } from 'react';

/**
 * One RAF loop, correctly plumbed, so a canvas background is just a draw
 * function.
 *
 * Every animated background on /motion needs the same five things, and getting
 * any of them wrong is what makes canvas work feel cheap:
 *
 *  - **devicePixelRatio sizing**, capped at 2. Uncapped, a 3x phone paints nine
 *    times the pixels for no visible gain.
 *  - **ResizeObserver, not window resize.** These canvases sit in a panel whose
 *    width changes when the sidebar layout changes, with no window event.
 *  - **IntersectionObserver gating.** Six particle systems all running while
 *    five of them are scrolled off screen is six times the work for one visible
 *    result. Off screen, the loop is cancelled outright, not throttled.
 *  - **visibilitychange**, so a background tab does nothing at all.
 *  - **prefers-reduced-motion**, which paints exactly one frame and stops. The
 *    composition still reads; it just doesn't move.
 *
 * `t` accumulates from clamped deltas rather than being derived from a start
 * timestamp: pausing and resuming would otherwise jump the field forward by the
 * length of the pause, and every particle teleports on the frame you scroll
 * back to it.
 */

export type SceneFrame = {
  ctx: CanvasRenderingContext2D;
  /** CSS pixels — the context is already scaled, so never use canvas.width here. */
  w: number;
  h: number;
  /** Seconds of *visible* time since mount. */
  t: number;
  /** Seconds since the last frame, clamped to 50ms. */
  dt: number;
  /** Pointer in CSS pixels. Falls back to the centre when the pointer is away. */
  px: number;
  py: number;
  pointer: boolean;
  frame: number;
};

export const useCanvasScene = (draw: (f: SceneFrame) => void) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  // Kept current without re-running the effect — the effect owns listeners and
  // an observer, and tearing those down every render would be absurd.
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let t = 0;
    let frame = 0;
    let last = 0;
    let raf = 0;
    let onScreen = false;

    let px = 0;
    let py = 0;
    let pointer = false;

    const paint = (dt: number) => {
      if (!w || !h) return;
      drawRef.current({
        ctx,
        w,
        h,
        t,
        dt,
        px: pointer ? px : w / 2,
        py: pointer ? py : h / 2,
        pointer,
        frame: frame++,
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Resizing clears the backing store, so a paused or reduced-motion scene
      // has to be repainted or the panel goes blank on a layout change.
      if (reduce || !raf) paint(0);
    };

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      t += dt;
      paint(dt);
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const play = () => {
      if (raf || reduce || document.hidden || !onScreen) return;
      last = 0; // first frame after a pause gets dt 0, so nothing lurches
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      pointer = true;
    };
    const onLeave = () => {
      pointer = false;
    };
    const onVisibility = () => (document.hidden ? stop() : play());

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) play();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return ref;
};

/** Reads a theme token as raw HSL components, e.g. "158 64% 52%". */
export const token = (name: string, fallback: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
