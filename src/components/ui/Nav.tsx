import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { links, profile } from "../../content/profile";
import { useMagnetic } from "../../hooks/useMagnetic";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

const SECTIONS = [
  { id: "about", label: "about" },
  { id: "experience", label: "experience" },
  { id: "projects", label: "work" },
  { id: "skills", label: "skills" },
  { id: "contact", label: "contact" },
];

function NavLink({ id, label, active }: { id: string; label: string; active: boolean }) {
  const ref = useMagnetic<HTMLAnchorElement>(0.3, 40);
  return (
    <a
      ref={ref}
      href={`#${id}`}
      aria-current={active ? "true" : undefined}
      className="type-label relative px-1 py-1 text-ink-soft transition-colors hover:text-ink"
    >
      {label}
      <span
        aria-hidden="true"
        className="absolute -bottom-0.5 left-0 h-[2px] bg-[var(--signal)] transition-[width] duration-300 ease-[var(--ease-snap)]"
        style={{ width: active ? "100%" : "0%" }}
      />
    </a>
  );
}

/**
 * Full-screen menu for small viewports. The links are set in the same display
 * type as the section headings, so the menu reads as the site's index page
 * rather than a hamburger drawer bolted on.
 */
function Overlay({ active, onClose }: { active: string; onClose: () => void }) {
  const reduced = usePrefersReducedMotion();

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

  return (
    <motion.div
      id="site-menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.01 : 0.25 }}
      className="fixed inset-0 z-40 flex flex-col justify-between bg-paper px-5 pb-8 pt-24"
    >
      <nav aria-label="Menu">
        <ol>
          {SECTIONS.map((s, i) => (
            <motion.li
              key={s.id}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduced ? 0 : 0.05 + i * 0.05,
                duration: reduced ? 0.01 : 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="border-b border-ink/12"
            >
              <a
                href={`#${s.id}`}
                onClick={onClose}
                aria-current={active === s.id ? "true" : undefined}
                className="group flex items-baseline justify-between py-4"
              >
                <span className="type-display text-[clamp(1.9rem,9vw,3rem)] text-ink">
                  {s.label}
                </span>
                <span
                  className="type-label text-ink-faint"
                  style={active === s.id ? { backgroundColor: "var(--signal)", color: "var(--color-ink)", padding: "0.125rem 0.375rem" } : undefined}
                >
                  0{i + 1}
                </span>
              </a>
            </motion.li>
          ))}
        </ol>
      </nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : 0.35, duration: reduced ? 0.01 : 0.4 }}
        className="space-y-6"
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            window.dispatchEvent(new CustomEvent("vg:play"));
          }}
          className="type-label flex w-full items-center justify-between border-2 border-ink bg-[var(--signal)] px-4 py-3.5 text-ink shadow-[3px_3px_0_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)]"
        >
          play double‑charge — the game
          <span aria-hidden="true">▸</span>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href={`mailto:${links.email}`} className="type-label text-ink-soft">
            {links.email}
          </a>
          <span className="type-label text-ink-faint">{profile.location}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Nav() {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const [taps, setTaps] = useState(0);
  const markRef = useMagnetic<HTMLAnchorElement>(0.25, 50);
  const timer = useRef<number | null>(null);

  // Page progress, spring-smoothed so flicks don't make it twitch.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 32,
    restDelta: 0.001,
  });

  // Scroll spy — one observer over all sections, no scroll handler.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5] },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* Easter egg: knock on the logo mark five times. It reroutes the accent
     colour — the same thing the hidden `signal` terminal command does, so the
     two discoveries reinforce each other. */
  const knock = () => {
    const next = taps + 1;
    setTaps(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTaps(0), 900);

    if (next >= 5) {
      const root = document.documentElement;
      const current = root.style.getPropertyValue("--signal");
      root.style.setProperty("--signal", current === "#ff4f18" ? "#c8ff33" : "#ff4f18");
      setTaps(0);
    }
  };

  return (
    <>
    {/* The overlay lives outside the bar: backdrop-filter makes the bar a
        containing block for fixed descendants, which would pin a nested
        overlay to the bar instead of the viewport. */}
    <AnimatePresence>
      {open && <Overlay active={active} onClose={() => setOpen(false)} />}
    </AnimatePresence>

    <nav
      aria-label="Primary"
      className="fixed inset-x-0 top-0 z-50 border-b border-ink/12 bg-paper/80 backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between px-5 py-3.5 sm:px-8">
        <a
          ref={markRef}
          href="#top"
          onClick={knock}
          className="type-display-tight text-base tracking-tight text-ink"
        >
          {profile.handle}
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-2 w-2 align-baseline transition-colors duration-300"
            style={{ backgroundColor: taps > 0 ? "var(--signal)" : "transparent" }}
          />
        </a>

        {/* Inline links only where they actually fit. */}
        <div className="hidden items-center gap-5 md:flex lg:gap-7">
          {SECTIONS.map((s) => (
            <NavLink key={s.id} {...s} active={active === s.id} />
          ))}

          {/* The game's front door. The terminal's `play` command fires the
              same event — this is just the discoverable route to it. */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("vg:play"))}
            className="type-label group flex items-center gap-1.5 border border-ink/25 px-3 py-1.5 text-ink transition-colors hover:border-ink hover:bg-[var(--signal)]"
          >
            play
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
              ▸
            </span>
          </button>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
          className="type-label flex items-center gap-2 border border-ink/25 px-3 py-1.5 text-ink transition-colors hover:border-ink md:hidden"
        >
          {open ? "close" : "menu"}
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 transition-transform duration-300"
            style={{
              backgroundColor: "var(--signal)",
              transform: open ? "rotate(45deg) scale(1.3)" : "none",
            }}
          />
        </button>
      </div>

      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress, transformOrigin: "left", backgroundColor: "var(--signal)" }}
        className="absolute bottom-0 left-0 h-[2px] w-full"
      />
    </nav>
    </>
  );
}
