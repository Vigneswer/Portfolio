import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { profile } from "../../content/profile";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

/**
 * Opening curtain.
 *
 * An ink panel with a counter that fills, then splits and lifts away in two
 * halves to reveal the page. It exists for one practical reason as well as a
 * theatrical one: the variable fonts and the opening plate need a beat to
 * arrive, and a deliberate curtain is a much better use of that beat than
 * watching type reflow.
 *
 * Deliberately short — 1.4s total. A portfolio that makes you wait is a
 * portfolio nobody scrolls. Skipped entirely under reduced motion, and it
 * locks scroll only while it is up.
 */
export function LoadReveal() {
  const reduced = usePrefersReducedMotion();
  const [done, setDone] = useState(reduced);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduced) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let raf = 0;
    const start = performance.now();
    const DURATION = 900;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DURATION);
      // Ease-out so the count decelerates into 100 rather than snapping.
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prev;
    };
  }, [reduced]);

  useEffect(() => {
    if (done) document.body.style.overflow = "";
  }, [done]);

  if (reduced) return null;

  const half = {
    initial: { y: 0 },
    exit: (dir: number) => ({
      y: `${dir * -100}%`,
      transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1] as const },
    }),
  };

  return (
    <AnimatePresence>
      {!done && (
        <div className="fixed inset-0 z-[100] flex" aria-hidden="true">
          {/* Two halves that part vertically — a single fade would read as a
              loading spinner; a split reads as a curtain. */}
          <motion.div
            className="h-full w-1/2 bg-ink"
            variants={half}
            initial="initial"
            exit="exit"
            custom={1}
          />
          <motion.div
            className="h-full w-1/2 bg-ink"
            variants={half}
            initial="initial"
            exit="exit"
            custom={-1}
          />

          <motion.div
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-5"
          >
            <span className="type-display-tight text-paper/90 text-[clamp(1.25rem,3vw,2rem)]">
              {profile.name}
            </span>
            <div className="h-px w-40 overflow-hidden bg-paper/20">
              <div
                className="h-full origin-left"
                style={{
                  backgroundColor: "var(--signal)",
                  transform: `scaleX(${count / 100})`,
                }}
              />
            </div>
            <span className="type-label tabular-nums text-paper/45">
              {String(count).padStart(3, "0")}
            </span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
