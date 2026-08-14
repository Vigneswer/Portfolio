import {
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Rotation driven by absolute scroll position.
 *
 * Everything that spins on this site shares this one source, so the seals, the
 * skill dial and the section numerals all turn in lockstep — the page reads as
 * a single mechanism being cranked rather than a pile of separate widgets.
 *
 * `factor` is degrees per pixel scrolled. Negative spins anticlockwise.
 */
export function useScrollSpin(factor = 0.06): MotionValue<number> {
  const { scrollY } = useScroll();
  const reduced = usePrefersReducedMotion();
  return useTransform(scrollY, (v) => (reduced ? 0 : v * factor));
}

/**
 * Signed, smoothed scroll velocity normalised to roughly [-1, 1].
 *
 * Used to skew and speed up the tickers: fling the page and the type leans
 * into the movement, then settles. This is the detail that makes scrolling
 * feel physical rather than like a viewport moving over static content.
 */
export function useScrollVelocity(): MotionValue<number> {
  const { scrollY } = useScroll();
  const raw = useVelocity(scrollY);
  const reduced = usePrefersReducedMotion();

  const smooth = useSpring(raw, { stiffness: 320, damping: 46, mass: 0.4 });
  return useTransform(smooth, (v) =>
    reduced ? 0 : Math.max(-1, Math.min(1, v / 2200)),
  );
}

/**
 * Progress of one element through the viewport, 0 → 1, entry to exit.
 * The scroll-driven transforms in Experience and Skills read from this.
 */
export function useElementProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  return { ref, progress: scrollYProgress };
}
