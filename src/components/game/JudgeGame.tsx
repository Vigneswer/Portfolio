import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * JudgeGame — the engine behind FLAGGED and GROUNDED.
 *
 * Both games are the same decision under time pressure: a document appears,
 * exactly one of its details may be wrong, and you either wave it through or
 * reject it before the clock runs out. That's a binary classifier with a
 * latency budget — which is precisely what both source projects are, so one
 * engine plays both and only the content differs.
 */

const LIVES = 3;

type Line =
  | { kind: "label"; text: string }
  | { kind: "big"; text: string }
  | { kind: "meta"; text: string }
  | { kind: "chip"; text: string; broken?: boolean };

export type Round = {
  lines: Line[];
  /** true → the correct action is reject. */
  bad: boolean;
  /** Shown after the round resolves — the tell, or why it was clean. */
  hint: string;
};

export type JudgeConfig = {
  id: string;
  title: string;
  tagline: string;
  intro: { title: string; body: string[]; keys: string };
  /** Plain-words context for visitors who don't know the source project. */
  about: string;
  acceptLabel: string;
  rejectLabel: string;
  /** Toast when time runs out on a bad item (it slipped through). */
  timeoutBad: string;
  /** Seconds per round at the start and at full ramp. */
  time: [start: number, floor: number];
  makeRound: () => Round;
  over: { title: string; copy: string };
};

type Phase = "intro" | "running" | "feedback" | "over";

function readHighScore(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

export function JudgeGame({
  config,
  onClose,
}: {
  config: JudgeConfig;
  onClose: () => void;
}) {
  const hsKey = `vg-${config.id}-hs`;
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState<Round | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [timeFrac, setTimeFrac] = useState(1);
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string } | null>(null);
  const [highScore, setHighScore] = useState(() => readHighScore(hsKey));

  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;
  const scoreRef = useRef(0);
  const livesRef = useRef(LIVES);
  const roundRef = useRef<Round | null>(null);
  roundRef.current = round;

  const gameOver = useCallback(() => {
    setPhase("over");
    setHighScore((hs) => {
      const next = Math.max(hs, scoreRef.current);
      try {
        localStorage.setItem(hsKey, String(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }, [hsKey]);

  const nextRound = useCallback(() => {
    setRound(config.makeRound());
    setVerdict(null);
    setTimeFrac(1);
    setPhase("running");
  }, [config]);

  const start = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = LIVES;
    setScore(0);
    setLives(LIVES);
    setStreak(0);
    nextRound();
  }, [nextRound]);

  /** Resolve the current round. `accepted` covers timeouts too. */
  const answer = useCallback(
    (accepted: boolean, timedOut = false) => {
      const r = roundRef.current;
      if (!r || phaseRef.current !== "running") return;

      const correct = accepted !== r.bad;
      if (correct) {
        const bonus = 10 + Math.min(streak, 5) * 2;
        scoreRef.current += bonus;
        setScore(scoreRef.current);
        setStreak((s) => s + 1);
        setVerdict({ ok: true, text: `+${bonus} · ${r.hint}` });
      } else {
        livesRef.current -= 1;
        setLives(livesRef.current);
        setStreak(0);
        setVerdict({
          ok: false,
          text: timedOut && r.bad ? `${config.timeoutBad} · ${r.hint}` : r.hint,
        });
      }
      setPhase("feedback");

      window.setTimeout(() => {
        if (livesRef.current <= 0) gameOver();
        else nextRound();
      }, 1250);
    },
    [config.timeoutBad, gameOver, nextRound, streak],
  );

  /* Round clock — a shrinking fraction driven by rAF, ramping with score. */
  useEffect(() => {
    if (phase !== "running") return;
    const [t0, floor] = config.time;
    const total = Math.max(floor, t0 - (t0 - floor) * Math.min(scoreRef.current / 150, 1));
    let raf = 0;
    const started = performance.now();
    const step = (now: number) => {
      const frac = 1 - (now - started) / (total * 1000);
      if (frac <= 0) {
        setTimeFrac(0);
        answer(true, true); // silence is consent — it shipped
        return;
      }
      setTimeFrac(frac);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, round, config.time, answer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (phaseRef.current === "running") {
        if (e.key === "1" || e.key === "ArrowLeft") answer(false);
        if (e.key === "2" || e.key === "ArrowRight") answer(true);
      } else if (phaseRef.current !== "feedback" && e.key === "Enter") {
        start();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [answer, onClose, start]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${config.title} — a game`}
      className="fixed inset-0 z-[95] flex flex-col bg-paper"
    >
      {/* HUD — same chrome as DOUBLE-CHARGE so the arcade reads as one machine */}
      <header className="flex items-center justify-between border-b border-ink/15 px-5 py-3 sm:px-8">
        <div className="flex min-w-0 items-baseline gap-4">
          <span className="type-display-tight whitespace-nowrap text-sm text-ink sm:text-base">
            {config.title}
          </span>
          <span className="type-label hidden text-ink-faint lg:inline">{config.tagline}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <span className="type-label whitespace-nowrap tabular-nums text-ink">
            {score}
            <span className="ml-2 hidden text-ink-faint sm:inline">
              best {Math.max(highScore, score)}
            </span>
          </span>
          <span className="flex gap-1.5" aria-label={`${lives} lives left`}>
            {Array.from({ length: LIVES }).map((_, i) => (
              <span
                key={i}
                className="inline-block h-2.5 w-2.5 transition-colors duration-300"
                style={{
                  backgroundColor:
                    i < lives
                      ? "var(--signal)"
                      : "color-mix(in srgb, var(--color-ink) 15%, transparent)",
                }}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="type-label border border-ink/25 px-2.5 py-1 text-ink-soft transition-colors hover:border-ink hover:bg-[var(--signal)] hover:text-ink"
          >
            esc ↩
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-y-auto px-5 py-6">
        {(phase === "running" || phase === "feedback") && round && (
          <div className="w-full max-w-lg">
            <div className="border border-ink bg-paper shadow-[6px_6px_0_0_var(--color-ink)]">
              {/* Round clock */}
              <div className="h-[3px] w-full bg-ink/10">
                <div
                  className="h-full origin-left"
                  style={{
                    transform: `scaleX(${timeFrac})`,
                    backgroundColor: timeFrac < 0.3 ? "#ff4f18" : "var(--signal)",
                  }}
                />
              </div>

              <div className="space-y-2.5 px-5 py-5 sm:px-6">
                {round.lines.map((l, i) =>
                  l.kind === "label" ? (
                    <p key={i} className="type-label text-ink-faint">
                      {l.text}
                    </p>
                  ) : l.kind === "big" ? (
                    <p key={i} className="type-body text-[1.0625rem] font-medium text-ink">
                      {l.text}
                    </p>
                  ) : l.kind === "chip" ? (
                    <p key={i}>
                      <span className="type-label inline-block border border-ink/25 px-2 py-1 text-ink-soft">
                        {l.text}
                      </span>
                    </p>
                  ) : (
                    <p key={i} className="font-mono text-[0.8125rem] text-ink-soft">
                      {l.text}
                    </p>
                  ),
                )}
              </div>

              {/* Verdict strip */}
              <AnimatePresence>
                {verdict && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-ink/15 px-5 py-3 font-mono text-[0.8125rem] sm:px-6"
                    style={{
                      backgroundColor: verdict.ok
                        ? "color-mix(in srgb, var(--signal) 30%, transparent)"
                        : "color-mix(in srgb, #ff4f18 22%, transparent)",
                    }}
                  >
                    {verdict.ok ? "✓ " : "✕ "}
                    {verdict.text}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={phase !== "running"}
                onClick={() => answer(false)}
                className="type-label border-2 border-ink bg-paper px-4 py-3.5 text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-all hover:bg-[#ff4f18] hover:text-paper active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)] disabled:opacity-50"
              >
                {config.rejectLabel}
                <span className="mt-1 block text-[0.5625rem] text-current opacity-60">1 / ←</span>
              </button>
              <button
                type="button"
                disabled={phase !== "running"}
                onClick={() => answer(true)}
                className="type-label border-2 border-ink bg-[var(--signal)] px-4 py-3.5 text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)] disabled:opacity-50"
              >
                {config.acceptLabel}
                <span className="mt-1 block text-[0.5625rem] opacity-60">2 / →</span>
              </button>
            </div>
          </div>
        )}

        {/* Intro / game over */}
        <AnimatePresence>
          {(phase === "intro" || phase === "over") && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-paper/85 px-5 backdrop-blur-[2px]"
            >
              <div className="w-full max-w-md border border-ink bg-paper p-6 shadow-[6px_6px_0_0_var(--color-ink)]">
                {phase === "intro" ? (
                  <>
                    <h2 className="type-display mb-4 text-2xl text-ink">{config.intro.title}</h2>
                    <div className="type-body space-y-2.5 text-[0.875rem] text-ink-soft">
                      {config.intro.body.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                      <p className="type-label text-ink-faint">{config.intro.keys}</p>
                    </div>
                    <p className="type-body mt-4 border-l-2 pl-3 text-[0.8125rem] leading-relaxed text-ink-faint" style={{ borderColor: "var(--signal)" }}>
                      {config.about}
                    </p>
                    <button
                      type="button"
                      onClick={start}
                      autoFocus
                      className="type-label mt-6 border-2 border-ink bg-[var(--signal)] px-6 py-3 text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)]"
                    >
                      start ↵
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="type-display mb-1 text-2xl text-ink">{config.over.title}</h2>
                    <p className="type-label mb-5 text-ink-faint">
                      score {score} · best {highScore}
                    </p>
                    <p className="type-body mb-6 text-[0.875rem] text-ink-soft">
                      {config.over.copy}
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={start}
                        autoFocus
                        className="type-label border-2 border-ink bg-[var(--signal)] px-5 py-2.5 text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)]"
                      >
                        run it back ↵
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="type-label border border-ink/25 px-5 py-2.5 text-ink-soft transition-colors hover:border-ink"
                      >
                        back to arcade
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

/* ==========================================================================
   GROUNDED — Ask KTU, playable.
   The bot drafts answers with a citation chip. Ship what's grounded; reject
   hallucinations and citations that don't cover the question.
   ========================================================================== */

const QA = [
  { q: "What's the minimum attendance to write the end‑sem exam?", a: "75%, condonable to 60% on medical grounds with certificates.", doc: "B.Tech Regulations §7.2" },
  { q: "How many grace marks for NCC/NSS activities?", a: "Up to 25 marks per academic year, applied to one theory course.", doc: "Grace Marks Order 2023" },
  { q: "When do supplementary exams happen?", a: "Within four weeks of the regular results being published.", doc: "Exam Manual §4.1" },
  { q: "How many credits do I need to register for S7?", a: "At least half the credits from S1–S5 must be earned.", doc: "Curriculum Handbook §2.3" },
  { q: "Can I get a break of study after S4?", a: "Yes, up to two semesters with the Dean's approval.", doc: "Academic Regulations §11" },
];
const WRONG_DOCS = [
  "Hostel Mess Rules 2022",
  "Library Fine Schedule",
  "Bus Pass Circular 2019",
  "Sports Quota Notification",
];

function makeGroundedRound(): Round {
  const qa = pick(QA);
  const bad = Math.random() < 0.55;
  let chip = `cites: ${qa.doc}`;
  let broken = false;
  let hint = "grounded — the citation actually covers the question.";

  if (bad) {
    if (Math.random() < 0.5) {
      chip = "no source retrieved · confidence 92%";
      broken = true;
      hint = "confident is not the same as grounded — there was no source.";
    } else {
      chip = `cites: ${pick(WRONG_DOCS)}`;
      broken = true;
      hint = "the cited document doesn't cover this question.";
    }
  }

  return {
    bad,
    hint,
    lines: [
      { kind: "label", text: "student asks" },
      { kind: "big", text: qa.q },
      { kind: "meta", text: `bot drafts: ${qa.a}` },
      { kind: "chip", text: chip, broken },
    ],
  };
}

export const GROUNDED_CONFIG: JudgeConfig = {
  id: "grounded",
  title: "GROUNDED",
  tagline: "you are the retrieval layer",
  intro: {
    title: "GROUNDED",
    body: [
      "The chatbot drafts answers to real student questions, each with a citation chip.",
      "Ship the ones grounded in an actual document. Reject the confident hallucinations and the citations that don't cover the question.",
      "A student is waiting — but a confidently wrong answer is worse than a slow one.",
    ],
    keys: "1/← rejects · 2/→ ships",
  },
  about:
    "Based on Ask KTU, a chatbot I built for my university. It answers questions about the rules using only the official documents — so it can't invent an answer. In this game, you do its fact-checking by hand.",
  rejectLabel: "reject",
  acceptLabel: "ship it",
  timeoutBad: "shipped unreviewed",
  // Generous on purpose: there's a question, an answer and a citation to
  // read — the pressure should come from judgement, not from reading speed.
  time: [16, 9],
  makeRound: makeGroundedRound,
  over: {
    title: "CONFIDENTLY WRONG",
    copy:
      "The real system chunks the regulations into vector storage and refuses to answer without a retrieved source — because a chatbot that improvises university rules is worse than no chatbot. You just graded like it does.",
  },
};

export default JudgeGame;
