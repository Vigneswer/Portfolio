import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ARCADE, type GameId } from "./registry";
import { DoubleCharge } from "./DoubleCharge";
import { FlaggedGame } from "./FlaggedGame";
import { JudgeGame, GROUNDED_CONFIG } from "./JudgeGame";

/**
 * The arcade: one overlay that is either the game-select screen or a running
 * game. Every entry point on the site lands here — nav and terminal open the
 * menu, the Work section and case studies deep-link straight into a game.
 * Closing a game returns to the menu; closing the menu returns to the site.
 */
export function Arcade({
  initial,
  onExit,
}: {
  initial: GameId | "menu";
  onExit: () => void;
}) {
  const [screen, setScreen] = useState<GameId | "menu">(initial);

  if (screen === "commerce") return <DoubleCharge onClose={() => setScreen("menu")} />;
  if (screen === "flagged") return <FlaggedGame onClose={() => setScreen("menu")} />;
  if (screen === "grounded")
    return <JudgeGame config={GROUNDED_CONFIG} onClose={() => setScreen("menu")} />;

  return <Menu onPick={setScreen} onExit={onExit} />;
}

function Menu({
  onPick,
  onExit,
}: {
  onPick: (id: GameId) => void;
  onExit: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < ARCADE.length) onPick(ARCADE[idx].id);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onExit, onPick]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label="Arcade — pick a game"
      className="fixed inset-0 z-[95] flex flex-col bg-paper"
    >
      <header className="flex items-center justify-between border-b border-ink/15 px-5 py-3 sm:px-8">
        <div className="flex items-baseline gap-4">
          <span className="type-display-tight text-sm text-ink sm:text-base">ARCADE</span>
          <span className="type-label hidden text-ink-faint sm:inline">
            every project, playable
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="type-label border border-ink/25 px-2.5 py-1 text-ink-soft transition-colors hover:border-ink hover:bg-[var(--signal)] hover:text-ink"
        >
          esc ✕
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-8">
        <div className="w-full max-w-xl">
          <p className="type-body mb-8 max-w-md text-[0.9375rem] text-ink-soft">
            Each game is the hard part of one of my projects, made playable.
            Lose, and the game-over screen tells you how the real system wins.
          </p>

          <ol className="space-y-4">
            {ARCADE.map((g, i) => (
              <motion.li
                key={g.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <button
                  type="button"
                  onClick={() => onPick(g.id)}
                  className="group flex w-full items-baseline justify-between gap-4 border-2 border-ink bg-paper px-5 py-4 text-left shadow-[4px_4px_0_0_var(--color-ink)] transition-all hover:bg-[var(--signal)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)]"
                >
                  <span className="min-w-0">
                    <span className="type-display-tight block text-xl text-ink sm:text-2xl">
                      {g.name}
                    </span>
                    <span className="type-label mt-1 block text-ink-soft">{g.tagline}</span>
                    <span className="type-body mt-2 block text-[0.8125rem] leading-snug text-ink-soft">
                      {g.desc}
                    </span>
                  </span>
                  <span className="type-label shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-1">
                    {g.index} ▸
                  </span>
                </button>
              </motion.li>
            ))}
          </ol>

          <p className="type-label mt-8 text-ink-faint">keys 1 · 2 · 3 pick a game · esc leaves</p>
        </div>
      </div>
    </motion.div>
  );
}

export default Arcade;
