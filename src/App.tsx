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

export default function App() {
  const pointer = usePointerField();

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
