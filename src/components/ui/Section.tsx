import { motion } from "framer-motion";
import { useScrollSpin } from "../../hooks/useScrollMotion";
import MaskedHeading from "./MaskedHeading";

type Props = {
  id: string;
  index: string;
  title: string;
  /** Small line under the heading. */
  kicker?: string;
  children: React.ReactNode;
};

/**
 * Shared section shell.
 *
 * The heading is cut out of the generative plate — the same artwork that fills
 * the opening frame — so the type is a window onto the field rather than flat
 * ink. The index numeral still spins with scroll, tying each section back to
 * the same mechanism as the seals.
 */
export function Section({ id, index, title, kicker, children }: Props) {
  const numeralSpin = useScrollSpin(-0.12);

  return (
    <section
      id={id}
      className="relative mx-auto w-full max-w-[88rem] scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="mb-12 flex items-start gap-5">
        <motion.span
          style={{ rotate: numeralSpin }}
          className="type-label mt-3 inline-flex h-9 w-9 shrink-0 items-center justify-center border border-ink/25 text-ink-faint"
        >
          {index}
        </motion.span>

        {/* flex-1 + min-w-0 so the heading has a real width to size itself
            against — MaskedHeading derives its type size from the container,
            and a content-sized flex item would make that circular. */}
        <div className="min-w-0 flex-1">
          <MaskedHeading
            tag="h2"
            text={title}
            src="/heading-fill.jpg"
            className="type-display"
            align="left"
            textScale={0.07}
            weight={800}
            tracking={-0.035}
            lineHeight={0.86}
            fillScale={1.35}
            parallax={22}
            drift={10}
            reveal="rise"
            trigger="view"
            duration={1}
            stagger={0.08}
          />

          {kicker ? (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="type-label mt-4 text-ink-faint"
            >
              {kicker}
            </motion.p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}
