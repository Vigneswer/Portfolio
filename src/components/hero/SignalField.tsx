import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import type { PointerField } from "../../hooks/usePointerField";

type Props = {
  pointer: React.RefObject<PointerField>;
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0 = ink, 1 = fully charged signal colour. Decays back toward 0. */
  charge: number;
  life: number;
  maxLife: number;
};

const INK = [20, 18, 15] as const;
const SIGNAL = [163, 212, 23] as const;

/** Cheap layered-trig flow field. Deterministic, no noise lib, no allocation. */
function fieldAngle(x: number, y: number, t: number) {
  return (
    Math.sin(x * 0.0016 + t * 0.18) * 1.6 +
    Math.cos(y * 0.0021 - t * 0.13) * 1.6 +
    Math.sin((x + y) * 0.0009 + t * 0.07) * 0.9
  );
}

/**
 * The hero's cursor-reactive canvas.
 *
 * Ink particles drift along a slow flow field and leave short strokes on the
 * paper. The pointer (or device tilt) pushes them outward and *charges* them —
 * they turn signal-lime and stretch in the direction they were shoved, then
 * cool back to ink. The result reads as ink being disturbed on a page rather
 * than the usual glowing-particle field.
 *
 * Perf notes:
 *  - Particle count scales with viewport area and is hard-capped.
 *  - DPR capped at 2; beyond that the fill rate buys nothing visible.
 *  - The loop is fully suspended when the tab is hidden or the hero scrolls
 *    out of view, so it costs nothing while the user reads the rest of the page.
 *  - Trails come from compositing a translucent paper wash each frame rather
 *    than storing history per particle.
 */
export function SignalField({ pointer, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let raf = 0;
    let running = false;
    let visible = true;

    const paper = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-paper")
      .trim() || "#f4f1ea";

    const spawn = (): Particle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0,
      vy: 0,
      charge: 0,
      life: 0,
      maxLife: 220 + Math.random() * 420,
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, w, h);

      // ~1 particle per 2200px², capped so a 4K display doesn't melt.
      const count = Math.min(760, Math.max(160, Math.round((w * h) / 2200)));
      particles = Array.from({ length: count }, spawn);
    };

    const step = (t: number) => {
      const time = t * 0.001;
      const p = pointer.current;

      // Paper wash — this is what creates the trails.
      ctx.fillStyle = paper;
      ctx.globalAlpha = 0.055;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      const px = p.x;
      const py = p.y;
      const power = p.power;
      const radius = p.tilt ? 260 : 190;
      const r2 = radius * radius;

      ctx.lineCap = "round";

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const ox = a.x;
        const oy = a.y;

        // Flow.
        const ang = fieldAngle(a.x, a.y, time);
        a.vx += Math.cos(ang) * 0.09;
        a.vy += Math.sin(ang) * 0.09;

        // Pointer influence: push outward, charge, and inherit some of the
        // pointer's own velocity so fast swipes visibly drag the ink.
        if (power > 0.01) {
          const dx = a.x - px;
          const dy = a.y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const falloff = (1 - d / radius) * power;
            const push = falloff * 1.5;
            a.vx += (dx / d) * push + p.vx * 0.012 * falloff;
            a.vy += (dy / d) * push + p.vy * 0.012 * falloff;
            a.charge = Math.min(1, a.charge + falloff * 0.32);
          }
        }

        a.vx *= 0.93;
        a.vy *= 0.93;
        a.x += a.vx;
        a.y += a.vy;
        a.charge *= 0.965;
        a.life++;

        // Recycle off-screen or expired particles instead of allocating.
        if (
          a.x < -20 ||
          a.x > w + 20 ||
          a.y < -20 ||
          a.y > h + 20 ||
          a.life > a.maxLife
        ) {
          a.x = Math.random() * w;
          a.y = Math.random() * h;
          a.vx = 0;
          a.vy = 0;
          a.charge = 0;
          a.life = 0;
          continue;
        }

        const c = a.charge;
        const rr = Math.round(INK[0] + (SIGNAL[0] - INK[0]) * c);
        const gg = Math.round(INK[1] + (SIGNAL[1] - INK[1]) * c);
        const bb = Math.round(INK[2] + (SIGNAL[2] - INK[2]) * c);

        ctx.strokeStyle = `rgba(${rr},${gg},${bb},${0.3 + c * 0.6})`;
        ctx.lineWidth = 0.85 + c * 2.1;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(a.x, a.y);
        ctx.stroke();
      }

      // Idle decay so the field calms down when the pointer stops.
      p.power *= 0.94;
      p.vx *= 0.9;
      p.vy *= 0.9;

      raf = requestAnimationFrame(step);
    };

    /** A single composed still frame for reduced-motion users. */
    const drawStatic = () => {
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = "round";
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        let x = a.x;
        let y = a.y;
        ctx.strokeStyle = "rgba(20,18,15,0.22)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        // Trace the streamline once so the still frame shows the field's shape.
        for (let s = 0; s < 14; s++) {
          const ang = fieldAngle(x, y, 0);
          x += Math.cos(ang) * 3.2;
          y += Math.sin(ang) * 3.2;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(step);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    if (reduced) {
      drawStatic();
    } else {
      start();
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) drawStatic();
    });
    ro.observe(canvas);

    // Suspend while off-screen — the hero is only ~1 viewport of a long page.
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pointer, reduced]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      role="presentation"
    />
  );
}
