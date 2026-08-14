import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { skills } from "../../content/profile";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useScrollSpin } from "../../hooks/useScrollMotion";
import { Section } from "../ui/Section";

const FLAT = skills.flatMap((g) => g.items.map((s) => ({ ...s, group: g.group })));
const STEP = 360 / FLAT.length;

/** Shortest-path equivalent of `desired` relative to where we already are. */
const nearest = (current: number, desired: number) =>
  desired + 360 * Math.round((current - desired) / 360);

type DialProps = {
  active: number;
  onFocusIndex: (i: number | null) => void;
  hovered: number | null;
};

/**
 * The skill dial.
 *
 * Scroll turns the ring; whatever reaches the marker at twelve o'clock becomes
 * the active skill and reads out in the centre. Hovering any label — on the
 * ring or in the list beside it — takes the wheel: the ring spins that skill up
 * to the marker by the shortest path and holds it there, then hands control
 * back to the scroll when the pointer leaves.
 *
 * The handover is the fiddly part. A spring follows a target value rather than
 * the scroll position directly, and the number of whole turns already taken is
 * tracked separately — otherwise releasing a hover after several rotations
 * would unwind the entire way back instead of easing to the nearest equivalent
 * angle.
 */
function Dial({ active, onFocusIndex, hovered }: DialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(150);

  const base = useScrollSpin(0.14);
  const target = useMotionValue(0);
  const ring = useSpring(target, { stiffness: 110, damping: 22, mass: 0.7 });
  const counter = useTransform(ring, (v) => -v);

  // Whole turns already accumulated, so scroll can resume without unwinding.
  const turns = useRef(0);
  const hoveredRef = useRef<number | null>(null);
  hoveredRef.current = hovered;

  useMotionValueEvent(base, "change", (v) => {
    if (hoveredRef.current === null) target.set(v + 360 * turns.current);
  });

  useEffect(() => {
    if (hovered === null) {
      // Re-anchor to the scroll position by the shortest route.
      const current = ring.get();
      const b = base.get();
      turns.current = Math.round((current - b) / 360);
      target.set(b + 360 * turns.current);
    } else {
      target.set(nearest(ring.get(), -hovered * STEP));
    }
  }, [hovered, base, ring, target]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const size = Math.min(el.clientWidth, el.clientHeight);
      setRadius(Math.max(96, size / 2 - 74));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const current = FLAT[active];

  return (
    <div ref={containerRef} className="relative mx-auto aspect-square w-full max-w-[30rem]">
      {/* Static instrument housing */}
      <div className="absolute inset-6 rounded-full border border-ink/12" />
      <div className="absolute inset-[4.25rem] rounded-full border border-ink/10" />

      {/* Weight gauge — an arc that fills to the active skill's depth. */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="41"
          fill="none"
          stroke="color-mix(in srgb, var(--color-ink) 8%, transparent)"
          strokeWidth="1"
        />
        {/* Drawn in ink, not signal — a gauge needle, not a paint stripe.
            The signal is reserved for the marker, the head dot and the
            active label, so one hue means exactly one thing: "current". */}
        <motion.circle
          cx="50"
          cy="50"
          r="41"
          fill="none"
          stroke="color-mix(in srgb, var(--color-ink) 55%, transparent)"
          strokeWidth="1.6"
          strokeLinecap="round"
          pathLength={1}
          initial={false}
          animate={{ pathLength: current.weight }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
        {/* Signal dot riding the head of the arc. */}
        <motion.g
          initial={false}
          animate={{ rotate: current.weight * 360 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{ transformOrigin: "50px 50px" }}
        >
          <circle cx="91" cy="50" r="2.2" fill="var(--signal)" stroke="var(--color-ink)" strokeWidth="0.5" />
        </motion.g>
      </svg>

      {/* Marker + needle at twelve o'clock */}
      <div
        className="absolute left-1/2 top-4 h-5 w-[2px] -translate-x-1/2"
        style={{ backgroundColor: "var(--signal)" }}
        aria-hidden="true"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[4.5rem] w-px -translate-x-1/2"
        style={{
          height: `calc(50% - 4.5rem - 3.25rem)`,
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--color-ink) 30%, transparent), transparent)",
        }}
      />

      {/* Rotating layer: ticks + labels */}
      <motion.div style={{ rotate: ring }} className="absolute inset-0">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {FLAT.map((_, i) => {
            const t = (i * STEP * Math.PI) / 180;
            const outer = 46;
            const inner = i === active ? 40 : 43.5;
            return (
              <line
                key={i}
                x1={50 + Math.sin(t) * outer}
                y1={50 - Math.cos(t) * outer}
                x2={50 + Math.sin(t) * inner}
                y2={50 - Math.cos(t) * inner}
                stroke={
                  i === active
                    ? "var(--signal)"
                    : "color-mix(in srgb, var(--color-ink) 22%, transparent)"
                }
                strokeWidth={i === active ? 1.6 : 0.7}
              />
            );
          })}
        </svg>

        {FLAT.map((s, i) => {
          const angle = i * STEP;
          // Two alternating orbits, so long neighbouring labels never crowd
          // each other as they pass the marker.
          const orbit = radius - (i % 2) * 30;
          return (
            <div
              key={s.name}
              className="absolute left-1/2 top-1/2 h-0 w-0"
              style={{ transform: `rotate(${angle}deg) translateY(-${orbit}px)` }}
            >
              {/* Three nested rotations about the same zero-size point:
                  counter-spin the ring, then undo this item's placement angle,
                  so the label stays upright and centred wherever it travels. */}
              <motion.div style={{ rotate: counter }} className="relative">
                <div className="relative" style={{ transform: `rotate(${-angle}deg)` }}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onPointerEnter={() => onFocusIndex(i)}
                    onPointerLeave={() => onFocusIndex(null)}
                    className="type-label absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-pointer whitespace-nowrap px-2 py-1 transition-all duration-300"
                    style={(() => {
                      // The two labels flanking the active one pass right
                      // behind its chip at the marker — ghost them while
                      // they're neighbours so the chip always reads clean.
                      const n = FLAT.length;
                      const isNeighbor =
                        i === (active + 1) % n || i === (active - 1 + n) % n;
                      return {
                        color:
                          i === active
                            ? "var(--color-ink)"
                            : `color-mix(in srgb, var(--color-ink) ${isNeighbor ? 10 : 34}%, transparent)`,
                        backgroundColor: i === active ? "var(--signal)" : "transparent",
                        transform: `translate(-50%, -50%) scale(${i === active ? 1.08 : 1})`,
                      };
                    })()}
                  >
                    {s.name}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      {/* Readout */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="type-label mb-2 text-ink-faint">{current.group}</span>

        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={current.name}
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="type-display-tight max-w-[11rem] text-[clamp(1.1rem,3.2vw,1.65rem)] leading-tight text-ink [text-wrap:balance]"
          >
            {current.name}
          </motion.span>
        </AnimatePresence>

        <span className="mt-3 flex items-baseline gap-1 font-mono">
          <span className="type-display-tight text-xl tabular-nums text-ink">
            {Math.round(current.weight * 100)}
          </span>
          <span className="type-label text-ink-faint">/ 100</span>
        </span>
      </div>
    </div>
  );
}

export function Skills() {
  const reduced = usePrefersReducedMotion();
  // The dial needs elbow room for its orbiting labels; below lg it clips at
  // both edges, so it simply doesn't mount there — the list is the section.
  const hasRoom = useMediaQuery("(min-width: 1024px)");
  const [hovered, setHovered] = useState<number | null>(null);
  const [scrollActive, setScrollActive] = useState(0);

  // Hover wins when present; otherwise the scroll-driven index rules.
  const active = hovered ?? scrollActive;

  const onFocusIndex = useCallback((i: number | null) => setHovered(i), []);

  const showDial = !reduced && hasRoom;

  return (
    <Section
      id="skills"
      index="04"
      title="Skills"
      kicker={showDial ? "scroll to turn the dial · hover to hold one" : "by depth"}
    >
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr]">
        {showDial && (
          <DialWithScrollIndex
            hovered={hovered}
            active={active}
            onFocusIndex={onFocusIndex}
            onScrollIndex={setScrollActive}
          />
        )}

        {/* The honest, readable version — and the only version screen readers
            and reduced-motion users get. Hovering a row drives the dial, so the
            two halves are one instrument rather than a chart and a decoration. */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1 lg:gap-7">
          {skills.map((g) => (
            <div key={g.group}>
              <h3 className="type-label mb-3 text-ink-faint">{g.group}</h3>
              <ul className="space-y-1">
                {g.items.map((s) => {
                  const i = FLAT.findIndex((f) => f.name === s.name);
                  const isActive = showDial && i === active;
                  return (
                    <li
                      key={s.name}
                      onPointerEnter={() => showDial && setHovered(i)}
                      onPointerLeave={() => showDial && setHovered(null)}
                      className="group relative -mx-3 cursor-default px-3 py-1.5 transition-colors duration-300"
                      style={{
                        // Quiet paper wash + a signal spine — an underline of
                        // attention, not a highlighter dragged across the row.
                        backgroundColor: isActive
                          ? "color-mix(in srgb, var(--color-ink) 5%, transparent)"
                          : "transparent",
                        boxShadow: isActive
                          ? "inset 2px 0 0 0 var(--signal)"
                          : "none",
                      }}
                    >
                      <div className="mb-1 flex items-baseline justify-between gap-4">
                        <span className="type-body flex items-center gap-2 text-ink">
                          <span
                            aria-hidden="true"
                            className="inline-block h-1.5 w-1.5 shrink-0 transition-all duration-300"
                            style={{
                              backgroundColor: isActive
                                ? "var(--signal)"
                                : "color-mix(in srgb, var(--color-ink) 22%, transparent)",
                              transform: `rotate(45deg) scale(${isActive ? 1.4 : 1})`,
                            }}
                          />
                          {s.name}
                        </span>
                        <span
                          className="type-label tabular-nums transition-colors duration-300"
                          style={{
                            color: isActive
                              ? "var(--color-ink)"
                              : "color-mix(in srgb, var(--color-ink) 45%, transparent)",
                          }}
                        >
                          {Math.round(s.weight * 100)}
                        </span>
                      </div>
                      {/* Ink hairlines by default; the signal only lands on the
                          row you're actually pointing at (or the dial is). */}
                      <div className="h-[2px] w-full bg-ink/10">
                        <motion.div
                          className="h-full origin-left transition-colors duration-300"
                          style={{
                            backgroundColor: isActive
                              ? "var(--signal)"
                              : "color-mix(in srgb, var(--color-ink) 40%, transparent)",
                          }}
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: s.weight }}
                          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/**
 * Thin wrapper so the parent can know which index the *scroll* is pointing at
 * without the dial having to own hover state it doesn't control.
 */
function DialWithScrollIndex({
  hovered,
  active,
  onFocusIndex,
  onScrollIndex,
}: {
  hovered: number | null;
  active: number;
  onFocusIndex: (i: number | null) => void;
  onScrollIndex: (i: number) => void;
}) {
  const base = useScrollSpin(0.14);

  useMotionValueEvent(base, "change", (v) => {
    const idx = ((Math.round(-v / STEP) % FLAT.length) + FLAT.length) % FLAT.length;
    onScrollIndex(idx);
  });

  return <Dial active={active} hovered={hovered} onFocusIndex={onFocusIndex} />;
}
