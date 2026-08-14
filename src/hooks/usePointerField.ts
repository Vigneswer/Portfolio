import { useEffect, useRef } from "react";

export type PointerField = {
  /** Viewport pixel coords of the influence point. */
  x: number;
  y: number;
  /** Smoothed velocity, used to stretch strokes in the direction of travel. */
  vx: number;
  vy: number;
  /** 0 when idle/absent, 1 when actively driven. Fades rather than snapping. */
  power: number;
  /** True when the field is being driven by tilt instead of a real pointer. */
  tilt: boolean;
};

/**
 * A single shared "influence point" for all cursor-reactive visuals.
 *
 * Desktop: the mouse.
 * Touch: the finger while dragging, and — crucially — device tilt when it is
 *        not. The mobile experience is not the desktop one scaled down; the
 *        field responds to how you physically hold the phone.
 *
 * Returns a ref rather than state on purpose: this updates at pointer rate and
 * is consumed inside requestAnimationFrame loops, so it must never re-render.
 */
export function usePointerField() {
  const field = useRef<PointerField>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    power: 0,
    tilt: false,
  });

  useEffect(() => {
    const f = field.current;
    f.x = window.innerWidth / 2;
    f.y = window.innerHeight / 2;

    let lastX = f.x;
    let lastY = f.y;

    const drive = (x: number, y: number, tilt: boolean) => {
      f.vx = f.vx * 0.7 + (x - lastX) * 0.3;
      f.vy = f.vy * 0.7 + (y - lastY) * 0.3;
      lastX = x;
      lastY = y;
      f.x = x;
      f.y = y;
      f.power = 1;
      f.tilt = tilt;
    };

    const onMove = (e: PointerEvent) => drive(e.clientX, e.clientY, false);
    const onLeave = () => {
      f.power = 0;
    };

    /* Tilt fallback: map device orientation onto the viewport so the field
       drifts toward wherever the phone is leaning. Clamped so it stays on
       screen at extreme angles. */
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      // Ignore tilt while a finger is actually driving the field.
      if (!f.tilt && f.power > 0.05) return;
      const nx = Math.max(-1, Math.min(1, e.gamma / 35));
      const ny = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
      drive(
        window.innerWidth * (0.5 + nx * 0.45),
        window.innerHeight * (0.5 + ny * 0.45),
        true,
      );
      f.power = 0.65; // Tilt is a softer influence than a deliberate touch.
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("deviceorientation", onTilt, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  return field;
}
