import { profile } from "../../content/profile";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import ScrollExpand from "./ScrollExpand";

/**
 * The opening beat, above the main hero.
 *
 * The media is generated, not photographed — a flow field with a signal-lime
 * aperture, drawn by scripts/build-opening-plate.mjs. It is deliberately the
 * same visual language as the live <SignalField> canvas in the hero, so the
 * opening reads as the frozen still and the hero as the interactive version of
 * the same thing.
 *
 * A generative texture also suits this component better than any photograph:
 * the resting frame is a small crop of the full-bleed composition, and a field
 * reads well at every crop and every viewport.
 */
export function Opening() {
  // On a phone the desktop proportions (32 × 62) produce a thin vertical
  // sliver; the resting frame should read as a plate, not a bookmark.
  const narrow = useMediaQuery("(max-width: 640px)");

  return (
    <section id="top" aria-label="Introduction" className="relative w-full bg-paper">
      <ScrollExpand
        className="scroll-expand--ink"
        useWindowScroll
        src="/opening-plate.jpg"
        mediaType="image"
        alt=""
        /* No `title`. The component centres it across the whole stage, so a
           headline wide enough to read spills outside the resting frame onto
           bare paper. The name lands once, in the hero below. */
        scrollHint="scroll to open"
        startWidth={narrow ? 62 : 32}
        startHeight={narrow ? 44 : 62}
        startRadius={2}
        endRadius={0}
        /* The plate is a texture, so a real zoom-out is legible here in a way
           it never was with a portrait — the field visibly relaxes as the
           frame opens. */
        mediaZoom={1.75}
        scrollDistance={1.15}
        holdDistance={0.4}
        smoothing={0.09}
        overlayScrim={0.4}
        /* The still plate leans with the hand before the first scroll — the
           site is alive from the first pointer movement, not the first wheel. */
        pointerParallax={30}
      >
        <p className="type-label mb-5 text-paper/70">
          <span
            className="mr-3 inline-block h-2 w-2 align-middle"
            style={{ backgroundColor: "var(--signal)" }}
            aria-hidden="true"
          />
          <span className="whitespace-nowrap">{profile.role}</span> ·{" "}
          <span className="whitespace-nowrap">{profile.location}</span>
        </p>

        <p className="type-display max-w-[22ch] text-[clamp(1.125rem,2.9vw,2.35rem)] text-paper">
          {profile.pitch}
        </p>

        <span className="type-label mt-8 text-paper/55">keep scrolling ↓</span>
      </ScrollExpand>
    </section>
  );
}
