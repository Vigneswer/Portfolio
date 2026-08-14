import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

/**
 * Paper grain.
 *
 * A single fractal-noise tile, multiplied over the whole page. It is the
 * cheapest thing on this site and does more for how *material* the page feels
 * than any animation: flat #F4F1EA reads as a colour value, the same colour
 * under grain reads as stock.
 *
 * The tile is inline SVG in a data URI — no network request, no image decode
 * of any size, and it tiles seamlessly because feTurbulence is periodic.
 * Animated by stepping background-position rather than regenerating noise, so
 * it costs one composited layer and nothing per frame.
 */
export function Grain() {
  const reduced = usePrefersReducedMotion();

  const noise = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
      <filter id="n">
        <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="180" height="180" filter="url(#n)"/>
    </svg>`,
  );

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[95] mix-blend-multiply ${
        reduced ? "" : "motion-safe:animate-[grain_1s_steps(6)_infinite]"
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,${noise}")`,
        backgroundSize: "180px 180px",
        opacity: 0.16,
      }}
    />
  );
}
