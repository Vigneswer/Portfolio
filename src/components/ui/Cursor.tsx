import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

/**
 * A three-part cursor: a hard ink dot that tracks exactly, a signal-coloured
 * ring that lags behind on a spring, and a micro-label that names what a zone
 * does. The lag gives the site weight; the deformation gives it physics — the
 * ring squashes along its direction of travel like a real object pushed
 * through air, then relaxes to a circle when the hand stops.
 *
 * Zones opt in with `data-cursor-label="drag"` etc. — the cursor is the
 * tooltip, so affordances travel with the pointer instead of cluttering the
 * layout.
 *
 * Only mounts for fine pointers, and only then does it hide the native cursor
 * (via a data attribute on <html>), so touch and keyboard users are untouched.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    document.documentElement.dataset.cursor = "custom";

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let scale = 1;
    let targetScale = 1;
    let stretch = 0; // smoothed speed → squash amount
    let raf = 0;
    let currentLabel = "";

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;

      const el = e.target as HTMLElement | null;
      // Grow over anything actionable so the cursor reports affordance.
      targetScale = el?.closest("a,button,input,[data-cursor-grow]") ? 2.1 : 1;

      // Named zones put a word on the cursor.
      const zone = el?.closest<HTMLElement>("[data-cursor-label]");
      const next = zone?.dataset.cursorLabel ?? "";
      if (next !== currentLabel) {
        currentLabel = next;
        label.textContent = next;
        label.style.opacity = next ? "1" : "0";
        label.style.transform = next ? "translateY(0)" : "translateY(4px)";
      }
    };

    const tick = () => {
      const vx = mx - rx;
      const vy = my - ry;
      rx += vx * 0.16;
      ry += vy * 0.16;
      scale += (targetScale - scale) * 0.18;

      // Squash along the velocity vector. The ring is drawn as a circle and
      // deformed with scaleX inside a rotation, so it always stretches
      // *toward* where it's going.
      const speed = Math.hypot(vx, vy);
      stretch += (Math.min(speed / 220, 0.45) - stretch) * 0.2;
      const angle = Math.atan2(vy, vx);

      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      ring.style.transform =
        `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) ` +
        `rotate(${angle}rad) scale(${(scale * (1 + stretch)).toFixed(3)}, ${(scale * (1 - stretch * 0.6)).toFixed(3)})`;
      label.style.left = `${rx + 18}px`;
      label.style.top = `${ry + 14}px`;

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
    // Topmost layer by design: the cursor must stay visible over every
    // overlay (menu z-40, case study z-80, game z-95) because the native
    // cursor is hidden site-wide while this one is mounted.
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[120] hidden md:block">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-7 w-7 rounded-full border border-ink/40 mix-blend-multiply"
        style={{ backgroundColor: "color-mix(in srgb, var(--signal) 55%, transparent)" }}
      />
      <div ref={dotRef} className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-ink" />
      <div
        ref={labelRef}
        className="type-label absolute px-1.5 py-0.5 text-ink opacity-0 transition-[opacity,transform] duration-200"
        style={{ backgroundColor: "var(--signal)" }}
      />
    </div>
  );
}
