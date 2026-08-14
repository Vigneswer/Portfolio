import { motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { profile } from "../../content/profile";
import { useMagnetic } from "../../hooks/useMagnetic";

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

export function Nav() {
  const [active, setActive] = useState("");
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

        <div className="flex items-center gap-5 sm:gap-7">
          {SECTIONS.map((s) => (
            <NavLink key={s.id} {...s} active={active === s.id} />
          ))}
        </div>
      </div>

      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress, transformOrigin: "left", backgroundColor: "var(--signal)" }}
        className="absolute bottom-0 left-0 h-[2px] w-full"
      />
    </nav>
  );
}
