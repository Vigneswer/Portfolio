import { motion } from "framer-motion";
import { useId } from "react";
import { useMagnetic } from "../../hooks/useMagnetic";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useScrollSpin } from "../../hooks/useScrollMotion";

type Props = {
  text: string;
  size?: number;
  factor?: number;
  className?: string;
  /** Solid ink disc instead of a hairline ring. Use for the loud one. */
  filled?: boolean;
  /** Radar ping behind the disc — reads as a live status light. */
  pulse?: boolean;
  /** Renders the seal as a link. Makes an availability badge actionable. */
  href?: string;
  /** Accessible name, required when `href` is set. */
  label?: string;
  children?: React.ReactNode;
};

/**
 * A rotating seal — circular text on a ring, cranked by scroll position.
 *
 * Two layers of rotation compose here on purpose: scroll position drives the
 * main turn, and a slow constant idle spin sits underneath it. Scroll-only
 * rotation makes the seal look broken when the page is still; idle-only makes
 * it ignore the reader. Together it behaves like a mechanism that is always
 * running but responds when you crank it.
 *
 * `filled` promotes it from a watermark to an object: solid ink disc, paper
 * type, and it inverts to signal on hover. With `href` the whole thing is a
 * link, which is what an "available for work" badge should be.
 */
export function SpinSeal({
  text,
  size = 132,
  factor = 0.09,
  className,
  filled = false,
  pulse = false,
  href,
  label,
  children,
}: Props) {
  const rotate = useScrollSpin(factor);
  const reduced = usePrefersReducedMotion();
  const magneticRef = useMagnetic<HTMLElement>(0.22, 60);
  const id = useId().replace(/:/g, "");

  const r = size / 2 - (filled ? 15 : 11);
  const circumference = 2 * Math.PI * r;

  const fontSize = Math.max(9, size * 0.072);
  const label_ = `${text} · `;

  /* Repeat the label to roughly fill the ring, then let textLength do the fine
     fit. A single lap stretched across the whole circumference — which is what
     this used to do — leaves the letters so far apart the word stops reading. */
  const perChar = fontSize * 0.84; // monospace advance + 0.22em tracking
  const repeats = Math.max(1, Math.round(circumference / (label_.length * perChar)));
  const ring = label_.repeat(repeats);

  const Wrapper = href ? motion.a : motion.div;

  return (
    <Wrapper
      ref={magneticRef as never}
      {...(href
        ? {
            href,
            "aria-label": label ?? text,
            target: href.startsWith("mailto:") ? undefined : "_blank",
            rel: "noreferrer",
          }
        : { "aria-hidden": true })}
      className={`group relative block shrink-0 ${href ? "cursor-pointer" : ""} ${className ?? ""}`}
      style={{ width: size, height: size }}
      whileHover={reduced ? undefined : { scale: 1.06 }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      {/* Radar ping. Sits behind the disc and is purely decorative, so it never
          interferes with the hit area. */}
      {pulse && !reduced && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="absolute inset-0 rounded-full border motion-safe:animate-[ping-out_3.2s_cubic-bezier(0,0,0.2,1)_infinite]"
              style={{
                borderColor: "var(--signal)",
                animationDelay: `${i * 1.6}s`,
              }}
            />
          ))}
        </span>
      )}

      {/* The idle turn. Composed with the scroll turn on the <svg> inside. */}
      <span
        className="absolute inset-0 block motion-safe:animate-[seal-idle_38s_linear_infinite]"
        aria-hidden="true"
      >
        <motion.svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          style={{ rotate }}
          className="overflow-visible"
        >
          <defs>
            <path
              id={id}
              fill="none"
              d={`M ${size / 2},${size / 2} m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`}
            />
          </defs>

          {filled ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 1}
              className="fill-ink transition-colors duration-300 group-hover:fill-[var(--signal)]"
            />
          ) : (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r + 9}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.18}
            />
          )}

          <text
            className={`type-label transition-colors duration-300 ${
              filled ? "fill-paper group-hover:fill-ink" : "fill-current"
            }`}
            style={{ fontSize, letterSpacing: "0.22em" }}
          >
            <textPath
              href={`#${id}`}
              startOffset="0%"
              textLength={circumference}
              lengthAdjust="spacing"
            >
              {ring}
            </textPath>
          </text>
        </motion.svg>
      </span>

      {children ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {children}
        </span>
      ) : null}
    </Wrapper>
  );
}
