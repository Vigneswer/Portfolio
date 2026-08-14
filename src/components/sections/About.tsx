import { motion } from "framer-motion";
import { about, links } from "../../content/profile";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { staggerDelay } from "../../hooks/useReveal";
import { Section } from "../ui/Section";
import { SpinSeal } from "../ui/SpinSeal";

export function About() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section id="about" index="01" title="About" kicker="the short version">
      <div className="grid gap-12 lg:grid-cols-[1.45fr_1fr]">
        <div className="max-w-2xl space-y-7">
          {/* Word-level reveal rather than paragraph-level. The copy arrives at
              roughly reading speed, which makes the eye follow it instead of
              waiting for a block to finish fading. Words are the unit, not
              letters — per-letter at body size is noise. */}
          {about.lines.map((line, i) => (
            <motion.p
              key={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "0px 0px -12% 0px" }}
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: reduced ? 0 : 0.018,
                    delayChildren: staggerDelay(i, 0.08, 0.03),
                  },
                },
              }}
              className="type-body text-[clamp(1rem,1.9vw,1.3125rem)] leading-relaxed text-ink"
            >
              {line.split(" ").map((word, w) => (
                <motion.span
                  key={w}
                  className="inline-block whitespace-pre"
                  variants={{
                    hidden: reduced
                      ? { opacity: 0 }
                      : { opacity: 0, y: "0.4em", filter: "blur(4px)" },
                    show: {
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      transition: {
                        duration: reduced ? 0.01 : 0.55,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    },
                  }}
                >
                  {word}{" "}
                </motion.span>
              ))}
            </motion.p>
          ))}
        </div>

        <div className="flex flex-col items-start gap-10">
          {/* Not decoration any more: a solid ink badge with a live ping that
              is also the fastest route to an email from this section. */}
          <SpinSeal
            text="AVAILABLE FOR WORK"
            size={168}
            factor={0.1}
            filled
            pulse
            href={`mailto:${links.email}`}
            label="Available for work — email me"
            className="text-ink"
          >
            <span className="flex flex-col items-center gap-1.5">
              {/* Inverts with the disc — a signal dot on a signal fill would
                  disappear the moment the badge is hovered. */}
              <span className="h-2 w-2 rounded-full bg-[var(--signal)] transition-colors duration-300 group-hover:bg-ink motion-safe:animate-[breathe_2.4s_var(--ease-settle)_infinite]" />
              <span className="type-label text-[0.5625rem] text-paper/70 transition-colors duration-300 group-hover:text-ink/70">
                open
              </span>
            </span>
          </SpinSeal>

          <dl className="w-full space-y-4 border-l border-ink/15 pl-5">
            {about.notes.map((n, i) => (
              <motion.div
                key={n.k}
                initial={{ opacity: 0, x: reduced ? 0 : -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: staggerDelay(i, 0.08), duration: 0.6 }}
              >
                <dt className="type-label text-ink-faint">{n.k}</dt>
                <dd className="type-body text-ink">{n.v}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
