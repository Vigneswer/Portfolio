import { motion, useTransform } from "framer-motion";
import { useScrollSpin, useScrollVelocity } from "../../hooks/useScrollMotion";

type Props = {
  items: string[];
  /** Negative runs right-to-left. */
  direction?: 1 | -1;
  className?: string;
};

/**
 * A band of type that slides with scroll position and *skews* with scroll
 * velocity — fling the page and the words lean into the movement, then spring
 * back upright when you stop.
 *
 * Duplicated three times so the strip always covers the viewport during the
 * translate, with no seam and no JS measuring loop.
 */
export function Ticker({ items, direction = 1, className }: Props) {
  const spin = useScrollSpin(direction * 0.35);
  const velocity = useScrollVelocity();

  // Wrap the translate into a repeating third so it never runs out of runway.
  const x = useTransform(spin, (v) => `${(v % 33.333) - 33.333}%`);
  const skewX = useTransform(velocity, (v) => v * -9);
  const scaleY = useTransform(velocity, (v) => 1 + Math.abs(v) * 0.06);

  const strip = [...items, ...items, ...items];

  return (
    <div
      className={`relative flex w-full overflow-hidden border-y border-ink/15 bg-paper-deep py-3 ${className ?? ""}`}
      aria-hidden="true"
    >
      <motion.div style={{ x, skewX, scaleY }} className="flex shrink-0 whitespace-nowrap">
        {strip.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="type-display-tight px-5 text-[clamp(1rem,2.4vw,1.75rem)] text-ink">
              {item}
            </span>
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rotate-45"
              style={{ backgroundColor: "var(--signal)" }}
            />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
