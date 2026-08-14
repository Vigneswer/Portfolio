import { motion } from "framer-motion";
import { profile } from "../../content/profile";
import type { PointerField } from "../../hooks/usePointerField";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import MaskedHeading from "../ui/MaskedHeading";
import { SignalField } from "./SignalField";
import { Terminal } from "./Terminal";

type Props = { pointer: React.RefObject<PointerField> };

export function Hero({ pointer }: Props) {
  const reduced = usePrefersReducedMotion();

  // The per-letter rise that used to live here is now MaskedHeading's own
  // word-level `rise` reveal, so the name animates with the same mechanism as
  // every other heading rather than a bespoke one.

  return (
    <header
      id="intro"
      className="relative min-h-[100svh] w-full overflow-hidden border-y border-ink/15"
    >
      <SignalField pointer={pointer} className="absolute inset-0 h-full w-full" />

      {/* Paper wash so the type always clears the field for contrast. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-paper/30 via-transparent to-paper/85"
      />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[88rem] flex-col justify-between px-5 pb-6 pt-24 sm:px-8 lg:pt-28">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.15fr_minmax(0,0.85fr)] lg:gap-14">
          {/* Type block. min-w-0 so a long unbreakable word can never force
              the grid wider than its track and squeeze the terminal. */}
          <div className="min-w-0">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="type-label mb-5 flex items-center gap-3 text-ink-soft"
            >
              <span className="inline-block h-2 w-2 bg-[var(--signal)]" aria-hidden="true" />
              {profile.role} · {profile.experience}
            </motion.p>

            {/* The name is cut from the same plate as the section headings and
                the opening frame, so all three read as one material.
                textScale is a fraction of this column's width — 0.105 lands a
                step below the old 7.2vw clamp, which is the size reduction. */}
            <MaskedHeading
              tag="h1"
              text={profile.name}
              src="/heading-fill.jpg"
              className="type-display"
              align="left"
              textScale={0.105}
              weight={800}
              tracking={-0.035}
              lineHeight={0.86}
              fillScale={1.4}
              parallax={30}
              drift={14}
              reveal="rise"
              trigger="mount"
              duration={1.2}
              stagger={0.1}
            />

            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 max-w-md border-l-2 border-[var(--signal)] pl-4"
            >
              <p className="type-body text-ink-soft">{profile.pitch}</p>
            </motion.div>
          </div>

          {/* Anchor interaction */}
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full min-w-0"
          >
            <Terminal />
            <p className="type-label mt-3 text-ink-faint">
              ↑ this is real — it runs commands
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-10 flex items-end justify-between gap-4 border-t border-ink/15 pt-4"
        >
          <span className="type-label text-ink-faint">{profile.location}</span>
          <a
            href="#about"
            className="type-label group flex items-center gap-2 text-ink-soft transition-colors hover:text-ink"
          >
            scroll
            <span
              aria-hidden="true"
              className="motion-safe:animate-[nudge_1.8s_var(--ease-settle)_infinite]"
            >
              ↓
            </span>
          </a>
        </motion.div>
      </div>
    </header>
  );
}
