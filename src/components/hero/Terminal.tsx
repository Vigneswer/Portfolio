import { useCallback, useEffect, useRef, useState } from "react";
import { profile } from "../../content/profile";
import {
  BOOT,
  QUICK_COMMANDS,
  complete,
  runCommand,
  type CommandContext,
  type Line,
} from "./commands";

let uid = 0;
const withIds = (lines: Omit<Line, "id">[]): Line[] =>
  lines.map((l) => ({ ...l, id: uid++ }));

const KIND_CLASS: Record<Line["kind"], string> = {
  input: "text-ink",
  out: "text-ink",
  dim: "text-ink-faint",
  signal: "text-ink font-medium",
  error: "text-ink-soft",
  rule: "text-ink-faint",
};

/**
 * The anchor interaction: a real, keyboard-driven terminal that doubles as the
 * site's navigation. Commands scroll the page, open case studies, and print
 * content sourced from `profile.ts` — nothing here is faked or pre-scripted.
 *
 * Accessibility: it is a labelled text input, not a contenteditable div. Output
 * lives in a polite live region so screen readers hear results, and every
 * command is reachable without typing via the chip row (which is also the whole
 * mobile interaction — no on-screen keyboard required to explore the site).
 */
export function Terminal() {
  const [lines, setLines] = useState<Line[]>(() => withIds(BOOT));
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ctx: CommandContext = {
    goto: (section) => {
      // Let the output paint before stealing the scroll position.
      requestAnimationFrame(() => {
        document
          .getElementById(section)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    clear: () => setLines([]),
    invert: () => {
      const root = document.documentElement;
      const current = root.style.getPropertyValue("--signal");
      root.style.setProperty(
        "--signal",
        current === "#ff4f18" ? "#c8ff33" : "#ff4f18",
      );
    },
  };

  const submit = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      if (!cmd) return;

      const echo: Omit<Line, "id"> = { kind: "input", text: cmd };
      const result = runCommand(cmd, ctx);

      // `clear` empties state inside runCommand; re-appending here would undo it.
      if (cmd.split(/\s+/)[0].toLowerCase() !== "clear") {
        setLines((prev) => [...prev, ...withIds([echo, ...result, { kind: "out", text: "" }])]);
      }

      setHistory((prev) => [...prev, cmd]);
      setHistoryIndex(-1);
      setValue("");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit(value);
      return;
    }

    if (e.key === "Tab") {
      const match = complete(value);
      if (match) {
        e.preventDefault();
        setValue(match + " ");
      }
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (history.length === 0) return;
      e.preventDefault();
      const next =
        e.key === "ArrowUp"
          ? Math.min(history.length - 1, historyIndex + 1)
          : historyIndex - 1;
      setHistoryIndex(next);
      setValue(next < 0 ? "" : history[history.length - 1 - next]);
      return;
    }

    // Ctrl-L / Ctrl-C, because muscle memory is a feature.
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setLines([]);
    }
    if (e.ctrlKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      setLines((prev) => [...prev, ...withIds([{ kind: "input", text: `${value}^C` }])]);
      setValue("");
    }
  };

  // Keep the newest line in view without yanking the whole page around.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <section
      aria-label="Interactive terminal"
      className="group relative w-full border border-ink/15 bg-paper-deep/60 backdrop-blur-[2px]"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Chrome bar */}
      <header className="flex items-center justify-between border-b border-ink/12 px-3 py-2">
        <span className="type-label text-ink-faint">
          {profile.handle}@portfolio
        </span>
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="block h-1.5 w-1.5 rounded-full bg-ink/25" />
          <i className="block h-1.5 w-1.5 rounded-full bg-ink/25" />
          <i className="block h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
        </span>
      </header>

      {/* Scrollback */}
      <div
        ref={scrollerRef}
        className="h-[15.5rem] overflow-y-auto overscroll-contain px-3 py-3 sm:h-[17rem]"
        aria-live="polite"
        aria-atomic="false"
      >
        <ol className="space-y-0.5">
          {lines.map((line) => (
            <li
              key={line.id}
              className={`font-mono text-[0.8125rem] leading-relaxed whitespace-pre-wrap break-words ${KIND_CLASS[line.kind]}`}
            >
              {line.kind === "input" && (
                <span className="mr-2 select-none text-[var(--signal-ink,inherit)] text-ink-faint">
                  ›
                </span>
              )}
              {line.kind === "signal" ? (
                <mark className="bg-[var(--signal)] px-1 text-ink">{line.text}</mark>
              ) : line.href ? (
                <a
                  href={line.href}
                  target={line.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-[var(--signal)] hover:bg-[var(--signal)]"
                >
                  {line.text}
                </a>
              ) : (
                line.text || " "
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Prompt */}
      <div className="flex items-center gap-2 border-t border-ink/12 px-3 py-2.5">
        <label htmlFor="terminal-input" className="sr-only">
          Type a command. Try help.
        </label>
        <span aria-hidden="true" className="font-mono text-[0.8125rem] text-ink-faint">
          {profile.handle} ›
        </span>
        <input
          id="terminal-input"
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="help"
          className="min-w-0 flex-1 bg-transparent font-mono text-[0.8125rem] text-ink caret-transparent outline-none placeholder:text-ink-faint/60"
        />
        {/* Block caret, drawn rather than native, so it matches the type. */}
        <span
          aria-hidden="true"
          className="-ml-2 h-4 w-[0.5rem] shrink-0 bg-ink motion-safe:animate-[blink_1.1s_steps(1)_infinite]"
          style={{ opacity: value ? 1 : 0.35 }}
        />
      </div>

      {/* Chip row — the full command surface without a keyboard. This is the
          primary interaction on touch, not a fallback. */}
      <div className="flex flex-wrap gap-1.5 border-t border-ink/12 px-3 py-2.5">
        {QUICK_COMMANDS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              submit(c);
            }}
            className="type-label border border-ink/20 px-2.5 py-1 text-ink-soft transition-all duration-200 hover:border-ink hover:bg-[var(--signal)] hover:text-ink active:scale-95"
          >
            {c}
          </button>
        ))}
      </div>
    </section>
  );
}
