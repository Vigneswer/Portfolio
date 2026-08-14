import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Pointer-driven 3D tilt with a specular sheen.
 *
 * The element leans away from the cursor on two axes and lifts slightly toward
 * the viewer, and a highlight tracks the pointer across its surface — which is
 * the part that sells it as a physical object rather than a rotating rectangle.
 *
 * Driven by a rAF spring rather than a CSS transition so the release
 * overshoots and settles, matching the motion language everything else on the
 * site uses. Disabled for coarse pointers and reduced motion.
 *
 * Set `--tilt-x` / `--tilt-y` on a child to position a sheen gradient.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(
  maxDeg = 7,
  lift = 14,
) {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let x = 0;
    let y = 0;
    let z = 0;
    let vx = 0;
    let vy = 0;
    let vz = 0;
    let raf = 0;
    let running = false;

    const STIFFNESS = 0.12;
    const DAMPING = 0.76;

    const tick = () => {
      vx = (vx + (targetX - x) * STIFFNESS) * DAMPING;
      vy = (vy + (targetY - y) * STIFFNESS) * DAMPING;
      vz = (vz + (targetZ - z) * STIFFNESS) * DAMPING;
      x += vx;
      y += vy;
      z += vz;

      el.style.transform = `perspective(900px) rotateX(${x.toFixed(3)}deg) rotateY(${y.toFixed(3)}deg) translateZ(${z.toFixed(2)}px)`;

      const settled =
        Math.abs(vx) < 0.002 && Math.abs(vy) < 0.002 && Math.abs(vz) < 0.01;
      if (settled) {
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
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;

      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) {
        targetX = 0;
        targetY = 0;
        targetZ = 0;
      } else {
        targetX = (0.5 - ny) * maxDeg * 2;
        targetY = (nx - 0.5) * maxDeg * 2;
        targetZ = lift;
        el.style.setProperty("--tilt-x", `${(nx * 100).toFixed(1)}%`);
        el.style.setProperty("--tilt-y", `${(ny * 100).toFixed(1)}%`);
      }
      start();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      targetZ = 0;
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
  }, [reduced, maxDeg, lift]);

  return ref;
}
