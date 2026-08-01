import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Cursor-reactive dot matrix behind the hero.
 *
 * Canvas rather than DOM: a 40×24 grid is ~950 nodes, and animating that many
 * elements through React or CSS would flatten the main thread. On canvas it's
 * one draw call per frame at a steady 60fps.
 *
 * Deliberately abstract. It reacts, so it reads as built rather than decorative,
 * but it never imitates a UI — which is what made the previous hero panels look
 * generated.
 */
export const DotField = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let time = 0;

    /** Pointer in canvas space. Parked far away so nothing reacts until moved. */
    const pointer = { x: -9999, y: -9999, active: false };

    // --primary can change at runtime (the terminal's `theme` command), so
    // re-read it periodically rather than caching once forever.
    let primary = '158 64% 52%';
    let sinceColorRead = 0;
    const readColor = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      if (v) primary = v;
    };
    readColor();

    const SPACING = 30;
    const RADIUS = 190; // influence radius of the cursor

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.006;

      sinceColorRead += 1;
      if (sinceColorRead > 90) {
        readColor();
        sinceColorRead = 0;
      }

      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const baseX = i * SPACING;
          const baseY = j * SPACING;

          // Slow diagonal wave so the field breathes even without a cursor.
          const wave = Math.sin(time + i * 0.28 + j * 0.22);

          let x = baseX;
          let y = baseY;
          let scale = 0.55 + wave * 0.2;
          let alpha = 0.16 + wave * 0.05;

          if (pointer.active) {
            const dx = baseX - pointer.x;
            const dy = baseY - pointer.y;
            const dist = Math.hypot(dx, dy);

            if (dist < RADIUS) {
              // Smoothstep falloff — a linear one has a visible hard edge.
              const t = 1 - dist / RADIUS;
              const force = t * t * (3 - 2 * t);
              const angle = Math.atan2(dy, dx);

              x += Math.cos(angle) * force * 20;
              y += Math.sin(angle) * force * 20;
              scale += force * 2.4;
              alpha += force * 0.72;
            }
          }

          if (alpha <= 0.02) continue;

          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.3, scale), 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${primary} / ${Math.min(alpha, 0.95)})`;
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    // Stop drawing entirely when the hero scrolls away — no point burning
    // frames on a field nobody can see.
    const observer = new IntersectionObserver(
      ([entry]) => {
        cancelAnimationFrame(raf);
        if (entry.isIntersecting) raf = requestAnimationFrame(draw);
      },
      { threshold: 0 },
    );

    resize();
    observer.observe(canvas);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);

    if (reduce) {
      // One static frame — the texture without the motion.
      pointer.active = false;
      ctx.clearRect(0, 0, width, height);
      draw();
      cancelAnimationFrame(raf);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [reduce]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
};
