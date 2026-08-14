import { Suspense, lazy, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Hero } from "./components/hero/Hero";
import { Opening } from "./components/opening/Opening";
import { About } from "./components/sections/About";
import { Contact } from "./components/sections/Contact";
import { Experience } from "./components/sections/Experience";
import { Projects } from "./components/sections/Projects";
import { Skills } from "./components/sections/Skills";
import { Cursor } from "./components/ui/Cursor";
import { Grain } from "./components/ui/Grain";
import { LoadReveal } from "./components/ui/LoadReveal";
import { Nav } from "./components/ui/Nav";
import { Ticker } from "./components/ui/Ticker";
import { links, profile, skills } from "./content/profile";
import { usePointerField } from "./hooks/usePointerField";

const TICKER_ONE = [
  "Clean Architecture",
  "CQRS",
  "Event-Driven",
  "Multi-Tenant",
  "Idempotent",
];

const TICKER_TWO = skills.flatMap((g) => g.items.map((s) => s.name));

// The arcade ships in its own chunk — nobody pays for it until they hit play.
const Arcade = lazy(() => import("./components/game/Arcade"));

export default function App() {
  const pointer = usePointerField();
  // Which arcade screen to open: a specific game id, "menu", or closed.
  const [arcade, setArcade] = useState<string | null>(null);

  // Fired by the nav, the Work section, case studies and the terminal's
  // `play` command (see game/registry.ts).
  useEffect(() => {
    const onPlay = (e: Event) => {
      const detail = (e as CustomEvent<{ game?: string }>).detail;
      setArcade(detail?.game ?? "menu");
    };
    window.addEventListener("vg:play", onPlay);
    return () => window.removeEventListener("vg:play", onPlay);
  }, []);

  return (
    <>
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-ink focus:bg-paper focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <LoadReveal />
      <Grain />
      <Cursor />
      <Nav />

      <AnimatePresence>
        {arcade && (
          <Suspense fallback={null}>
            <Arcade
              initial={arcade as "menu"}
              onExit={() => setArcade(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <main>
        <Opening />

        <Hero pointer={pointer} />

        <Ticker items={TICKER_ONE} direction={-1} />

        <About />

        <Experience />

        <Ticker items={TICKER_TWO} direction={1} />

        <Projects />

        <Skills />

        <Contact />
      </main>

      <footer className="border-t border-ink/15 px-5 py-10 sm:px-8">
        <div className="mx-auto flex w-full max-w-[88rem] flex-wrap items-center justify-between gap-4">
          <p className="type-label text-ink-faint">
            {profile.name} · built with React, TypeScript & too much care
          </p>
          <div className="flex items-center gap-5">
            <a
              href={links.github}
              target="_blank"
              rel="noreferrer"
              className="type-label text-ink-soft transition-colors hover:text-ink"
            >
              github
            </a>
            <a
              href={links.linkedin}
              target="_blank"
              rel="noreferrer"
              className="type-label text-ink-soft transition-colors hover:text-ink"
            >
              linkedin
            </a>
            <a
              href="#top"
              className="type-label text-ink-soft transition-colors hover:text-ink"
            >
              back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
