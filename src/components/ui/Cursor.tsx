import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

/**
 * A two-part cursor: a hard ink dot that tracks exactly, and a signal-coloured
 * ring that lags behind on a spring. The lag is the point — it gives the whole
 * site a consistent sense of weight.
 *
 * Only mounts for fine pointers, and only then does it hide the native cursor
 * (via a data attribute on <html>), so touch and keyboard users are untouched.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.dataset.cursor = "custom";

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let scale = 1;
    let targetScale = 1;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      // Grow over anything actionable so the cursor reports affordance.
      const el = e.target as HTMLElement | null;
      targetScale = el?.closest("a,button,input,[data-cursor-grow]") ? 2.1 : 1;
    };

    const tick = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      scale += (targetScale - scale) * 0.18;

      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      delete document.documentElement.dataset.cursor;
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] hidden md:block">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-7 w-7 rounded-full border border-ink/40 mix-blend-multiply"
        style={{ backgroundColor: "color-mix(in srgb, var(--signal) 55%, transparent)" }}
      />
      <div ref={dotRef} className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-ink" />
    </div>
  );
}
