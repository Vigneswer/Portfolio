import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { education, experience } from "../../content/profile";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { Section } from "../ui/Section";

/**
 * One timeline entry. It doesn't fade — it *swings in*, rotating around its
 * left edge as it crosses the viewport, driven directly by scroll position
 * rather than by a one-shot trigger. Scroll back up and it swings out again,
 * which is what makes the section feel connected to the wheel under your hand.
 */
function Entry({
  item,
  side,
}: {
  item: (typeof experience)[number];
  side: 1 | -1;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const reduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "start 0.42"],
  });

  // Kept deliberately shallow: a wide block rotating even a few degrees swings
  // its far edge a long way, and anything steeper visibly collides with the
  // entry below while it settles.
  const rotate = useTransform(scrollYProgress, [0, 1], [side * 2.6, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [46, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.55], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);

  const style = reduced ? undefined : { rotate, y, opacity, scale };

  return (
    <motion.li
      ref={ref}
      style={{ ...style, transformOrigin: "left center" }}
      className="grid gap-5 border-t border-ink/15 pt-8 sm:grid-cols-[11rem_1fr]"
    >
      <div className="type-label pt-1.5 text-ink-faint">
        {item.from} — {item.to}
      </div>

      <div>
        <h3 className="type-display-tight text-[clamp(1.35rem,3.2vw,2rem)] text-ink">
          {item.role}
        </h3>
        <p className="type-label mb-5 mt-2 text-ink-soft">
          <span
            className="mr-2 inline-block h-1.5 w-1.5 align-middle"
            style={{ backgroundColor: "var(--signal)" }}
            aria-hidden="true"
          />
          {item.org} · {item.place}
        </p>

        <ul className="space-y-2.5 border-l border-ink/15 pl-5">
          {item.points.map((p) => (
            <li key={p} className="type-body text-ink-soft">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </motion.li>
  );
}

export function Experience() {
  const railRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  // A rail that fills as the section passes — the section's own progress bar.
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 0.8", "end 0.6"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <Section id="experience" index="02" title="Experience" kicker="where the work happened">
      <div ref={railRef} className="relative">
        {!reduced && (
          <motion.div
            aria-hidden="true"
            style={{ scaleY, transformOrigin: "top" }}
            className="absolute -left-4 top-0 hidden h-full w-[2px] sm:block"
          >
            <div className="h-full w-full" style={{ backgroundColor: "var(--signal)" }} />
          </motion.div>
        )}

        <ol className="space-y-16">
          {experience.map((e, i) => (
            <Entry key={e.org} item={e} side={i % 2 === 0 ? -1 : 1} />
          ))}

          <li className="grid gap-5 border-t border-ink/15 pt-8 sm:grid-cols-[11rem_1fr]">
            <div className="type-label pt-1.5 text-ink-faint">
              {education.from} — {education.to}
            </div>
            <div>
              <h3 className="type-display-tight text-[clamp(1.35rem,3.2vw,2rem)] text-ink">
                {education.degree}
              </h3>
              <p className="type-label mt-2 text-ink-soft">{education.school}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {education.certifications.map((c) => (
                  <li
                    key={c}
                    className="type-label border border-ink/20 px-2 py-1 text-ink-soft transition-colors duration-200 hover:border-ink hover:bg-[var(--signal)] hover:text-ink"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        </ol>
      </div>
    </Section>
  );
}
