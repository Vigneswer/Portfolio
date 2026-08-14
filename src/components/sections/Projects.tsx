import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { projects } from "../../content/profile";
import { ARCADE, gameForProject, openGame } from "../game/registry";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useTilt } from "../../hooks/useTilt";
import { Section } from "../ui/Section";

const PhysicsBoard = lazy(() =>
  import("./PhysicsBoard").then((m) => ({ default: m.PhysicsBoard })),
);

/** Static, ordered grid — used for reduced-motion and as the Suspense fallback. */
function StaticBoard({ onOpen }: { onOpen: (id: string, from?: DOMRect) => void }) {
  return (
    <ul className="grid gap-px border border-ink/15 bg-ink/15 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={(e) => onOpen(p.id, e.currentTarget.getBoundingClientRect())}
            className="h-full w-full bg-paper p-6 text-left transition-colors duration-300 hover:bg-paper-deep"
          >
            <div className="mb-3 flex items-baseline justify-between">
              <span className="type-label text-ink-faint">{p.index}</span>
              <span className="type-label text-ink-faint">{p.year}</span>
            </div>
            <h3 className="type-display-tight mb-2 text-xl text-ink">{p.name}</h3>
            <p className="type-body text-ink-soft">{p.blurb}</p>
            <span
              className="mt-4 inline-block px-1.5 py-0.5 text-[0.625rem] uppercase tracking-[0.18em]"
              style={{ backgroundColor: "var(--signal)" }}
            >
              case study →
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Case study panel. Slides up from the bottom edge with the site's overshoot
 * easing, traps focus via a native dialog-style pattern, and closes on Escape
 * or backdrop click.
 */
function CaseStudy({
  id,
  from,
  onClose,
}: {
  id: string;
  /** Viewport rect of the card that was clicked — the panel FLIPs out of it. */
  from?: DOMRect;
  onClose: () => void;
}) {
  const project = projects.find((p) => p.id === id);
  const reduced = usePrefersReducedMotion();
  // The panel leans with the pointer and carries a sheen, so it reads as a
  // physical card lifted off the page rather than a flat modal.
  const tiltRef = useTilt<HTMLDivElement>(3.5, 10);

  // FLIP: measure where the panel ended up, start it at the clicked card's
  // rect, and let WAAPI spring it home. Composite 'replace' means the
  // animation owns transform for its duration, then hands back to useTilt.
  const morphRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = morphRef.current;
    if (!el || !from || reduced) return;
    el.style.transformOrigin = "top left";
    const to = el.getBoundingClientRect();
    const sx = from.width / to.width;
    const sy = from.height / to.height;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    el.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
          boxShadow: "4px 4px 0 0 var(--color-ink)",
        },
        { transform: "none", boxShadow: "8px 8px 0 0 var(--color-ink)" },
      ],
      { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  }, [from, reduced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <motion.button
        type="button"
        aria-label="Close case study"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink/45 backdrop-blur-[3px]"
      />

      {/* Two nested elements on purpose: Framer owns the transform on the
          outer one for the enter/exit, useTilt owns it on the inner one for
          the pointer lean. Sharing a single element would have them fight over
          the same style property every frame. */}
      <motion.div
        /* When a source rect exists the WAAPI FLIP below owns the entrance,
           so Framer only handles the (rect-less) fallback slide and the exit. */
        initial={
          from && !reduced
            ? { opacity: 1 }
            : reduced
              ? { opacity: 0 }
              : { y: "18%", opacity: 0, rotate: -1.2 }
        }
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        exit={reduced ? { opacity: 0 } : { y: "12%", opacity: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl"
      >
        <div
          ref={(el) => {
            morphRef.current = el;
            (tiltRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`cs-${project.id}`}
          className="relative max-h-[88svh] w-full overflow-y-auto border border-ink bg-paper shadow-[8px_8px_0_0_var(--color-ink)]"
        >
          {/* Specular sheen tracking the pointer — the detail that makes the
              lean read as a surface catching light. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 opacity-70"
            style={{
              background:
                "radial-gradient(320px circle at var(--tilt-x, 50%) var(--tilt-y, 0%), color-mix(in srgb, var(--signal) 22%, transparent), transparent 70%)",
            }}
          />
        <header className="sticky top-0 flex items-center justify-between border-b border-ink/15 bg-paper px-6 py-4">
          <span className="type-label text-ink-faint">
            {project.index} · {project.year}
          </span>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="type-label border border-ink/25 px-2.5 py-1 text-ink-soft transition-colors hover:border-ink hover:bg-[var(--signal)] hover:text-ink"
          >
            close ✕
          </button>
        </header>

        <div className="px-6 py-7">
          <h3
            id={`cs-${project.id}`}
            className="type-display mb-6 text-[clamp(1.75rem,5vw,3rem)] text-ink"
          >
            {project.name}
          </h3>

          <dl className="space-y-6">
            {(
              [
                ["Problem", project.problem],
                ["Approach", project.approach],
                ["Outcome", project.outcome],
              ] as const
            ).map(([k, v], i) => (
              <motion.div
                key={k}
                initial={{ opacity: 0, x: reduced ? 0 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.08, duration: 0.5 }}
                className="border-l-2 pl-4"
                style={{ borderColor: "var(--signal)" }}
              >
                <dt className="type-label mb-1.5 text-ink-faint">{k}</dt>
                <dd className="type-body text-ink">{v}</dd>
              </motion.div>
            ))}
          </dl>

          <ul className="mt-7 flex flex-wrap gap-1.5 border-t border-ink/15 pt-6">
            {project.tech.map((t) => (
              <li
                key={t}
                className="type-label border border-ink/20 px-2 py-0.5 text-ink-soft"
              >
                {t}
              </li>
            ))}
          </ul>

          {(() => {
            const game = gameForProject(project.id);
            return game ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openGame(game.id);
                }}
                className="type-label mt-6 flex w-full items-center justify-between gap-3 border-2 border-ink bg-[var(--signal)] px-4 py-3 text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)] sm:w-auto sm:min-w-[20rem]"
              >
                <span>
                  play {game.name} — {game.tagline}
                </span>
                <span aria-hidden="true">▸</span>
              </button>
            ) : null;
          })()}

          {(project.href || project.repo) && (
            <div className="mt-6 flex gap-3">
              {project.href && (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="type-label border border-ink px-4 py-2 transition-colors hover:bg-[var(--signal)]"
                >
                  live ↗
                </a>
              )}
              {project.repo && (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="type-label border border-ink px-4 py-2 transition-colors hover:bg-[var(--signal)]"
                >
                  source ↗
                </a>
              )}
            </div>
          )}
        </div>
        </div>
      </motion.div>
    </div>
  );
}

export function Projects() {
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState<{ id: string; from?: DOMRect } | null>(null);
  const handleOpen = useCallback(
    (id: string, from?: DOMRect) => setOpen({ id, from }),
    [],
  );

  return (
    <Section
      id="projects"
      index="03"
      title="Work"
      kicker={reduced ? "three case studies" : "three case studies — currently in freefall"}
    >
      {reduced ? (
        <StaticBoard onOpen={handleOpen} />
      ) : (
        <Suspense fallback={<StaticBoard onOpen={handleOpen} />}>
          <PhysicsBoard projects={projects} onOpen={handleOpen} />
        </Suspense>
      )}

      {/* The arcade strip. Reading about a system is one thing — each of
          these is that project's hardest guarantee, playable. */}
      <div className="mt-10 border border-ink/15 bg-paper-deep/40">
        <p className="type-label border-b border-ink/12 px-4 py-2.5 text-ink-faint">
          don't just read them — each project ships as a game
        </p>
        <div className="grid sm:grid-cols-3">
          {ARCADE.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => openGame(g.id)}
              data-cursor-label="play"
              className={`group flex items-baseline justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-[var(--signal)] ${
                i > 0 ? "border-t border-ink/12 sm:border-l sm:border-t-0" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="type-display-tight block text-base text-ink">{g.name}</span>
                <span className="type-label mt-0.5 block truncate text-ink-soft">
                  {g.tagline}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="type-label shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-1"
              >
                ▸
              </span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <CaseStudy
            key={open.id}
            id={open.id}
            from={open.from}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </Section>
  );
}
