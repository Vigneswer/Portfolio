import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Magnetic hover: the element leans toward the cursor while it is nearby and
 * springs back when it leaves.
 *
 * Written against the element's own bounding box with a rAF-driven spring
 * rather than a CSS transition, so the release actually overshoots and settles
 * instead of easing out linearly. Disabled entirely for reduced-motion users
 * and for coarse pointers, where there is no hover state to speak of.
 */
export function useMagnetic<T extends HTMLElement = HTMLAnchorElement>(
  strength = 0.35,
  radius = 90,
) {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    let raf = 0;
    let running = false;

    const STIFFNESS = 0.14;
    const DAMPING = 0.72;

    const tick = () => {
      vx = (vx + (targetX - x) * STIFFNESS) * DAMPING;
      vy = (vy + (targetY - y) * STIFFNESS) * DAMPING;
      x += vx;
      y += vy;

      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

      const settled =
        Math.abs(vx) < 0.01 &&
        Math.abs(vy) < 0.01 &&
        Math.abs(targetX - x) < 0.01 &&
        Math.abs(targetY - y) < 0.01;

      if (settled) {
        el.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const reach = Math.max(r.width, r.height) / 2 + radius;

      if (dist < reach) {
        const falloff = 1 - dist / reach;
        targetX = dx * strength * falloff;
        targetY = dy * strength * falloff;
      } else {
        targetX = 0;
        targetY = 0;
      }
      start();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      start();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
      cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [reduced, strength, radius]);

  return ref;
}
