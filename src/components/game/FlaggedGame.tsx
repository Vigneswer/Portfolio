import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * FLAGGED — the Malayalam misinformation project as a swipeable feed.
 *
 * Every round is a social post: source, photo, caption. The photos are drawn
 * (inline SVG in the site's own ink-and-signal language), which lets the game
 * do the thing the real project does — put the *image* in play. On many fakes
 * the picture simply isn't of the thing the caption claims, and spotting that
 * image/text mismatch is exactly what MuRIL + CLIP do together.
 *
 * Swipe right to publish, left to flag. Buttons and keys work too.
 */

const LIVES = 3;
const HS_KEY = "vg-flagged-hs";
/** Seconds per round, start → floor as the score ramps. */
const TIME: [number, number] = [14, 8];

type Topic = "flood" | "exam" | "ferry" | "metro" | "rocket" | "zoo";

const STORIES: { topic: Topic; headline: string }[] = [
  { topic: "flood", headline: "NH‑66 closed after overnight flooding near Kochi" },
  { topic: "exam", headline: "KTU postpones S6 exams by two weeks" },
  { topic: "ferry", headline: "New ferry route opens: Fort Kochi ↔ Vypin" },
  { topic: "metro", headline: "Kochi Metro runs till 11.30pm for Onam week" },
  { topic: "rocket", headline: "ISRO opens weekend campus tours at VSSC" },
  { topic: "zoo", headline: "Thrissur zoo announces twin elephant calves" },
];

/** What each drawing visibly is — used to write the mismatch hint. */
const SCENE_NOUN: Record<Topic, string> = {
  flood: "a flooded street",
  exam: "an exam hall",
  ferry: "a ferry",
  metro: "a metro train",
  rocket: "a rocket launch",
  zoo: "elephants",
};

const REAL_SOURCES = ["The Hindu", "Mathrubhumi", "PIB Kerala", "Manorama Online"];
const FAKE_SOURCES = ["forwarded as received", "@kerala_newz_4u", "TruthVoice.blog"];

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

type Post = {
  headline: string;
  photoTopic: Topic;
  watermark: string;
  source: string;
  date: string;
  bad: boolean;
  hint: string;
};

function makePost(): Post {
  const story = pick(STORIES);
  const bad = Math.random() < 0.55;

  const post: Post = {
    headline: story.headline,
    photoTopic: story.topic,
    watermark: "LIVE · this week",
    source: pick(REAL_SOURCES),
    date: "today",
    bad,
    hint: "photo, source and date all held up — that one was real.",
  };

  if (bad) {
    const tell = pick(["mismatch", "archive", "source", "date"] as const);
    if (tell === "mismatch") {
      const other = pick(STORIES.filter((s) => s.topic !== story.topic));
      post.photoTopic = other.topic;
      post.hint = `the photo shows ${SCENE_NOUN[other.topic]}, not ${SCENE_NOUN[story.topic]} — image and caption don't match.`;
    } else if (tell === "archive") {
      post.watermark = pick(["ARCHIVE · 2018", "FILE PHOTO · 2011", "© 2019 · Chennai"]);
      post.hint = "check the watermark — that photo is old stock, not this event.";
    } else if (tell === "source") {
      post.source = pick(FAKE_SOURCES);
      post.hint = "“forwarded as received” is not a source.";
    } else {
      post.date = "30 February";
      post.hint = "30 February doesn't exist.";
    }
  }

  return post;
}

/* --------------------------------------------------------------------------
   The photos. Deliberately drawn, not photographic — six little scenes in
   ink linework with one signal accent each, so the mismatch tell is readable
   in under a second.
   -------------------------------------------------------------------------- */
function Scene({ topic }: { topic: Topic }) {
  const ink = "color-mix(in srgb, var(--color-ink) 60%, transparent)";
  const faint = "color-mix(in srgb, var(--color-ink) 25%, transparent)";
  const common = { stroke: ink, strokeWidth: 2.5, fill: "none", strokeLinecap: "round" as const };

  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      {topic === "flood" && (
        <g {...common}>
          {/* house sunk to the eaves */}
          <path d="M70 96 L110 60 L150 96" />
          <path d="M78 96 h64" stroke={faint} />
          {/* car roof above water */}
          <path d="M200 100 q18 -14 44 0" />
          {/* water */}
          <path d="M20 112 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="var(--signal)" strokeWidth="3" />
          <path d="M30 132 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0" stroke={faint} />
          <path d="M20 152 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke={faint} />
        </g>
      )}
      {topic === "exam" && (
        <g {...common}>
          {/* clock */}
          <circle cx="160" cy="42" r="16" />
          <path d="M160 42 v-9 M160 42 h7" />
          {/* rows of desks */}
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <g key={`${r}${c}`}>
                <rect x={52 + c * 82} y={84 + r * 30} width="46" height="12" stroke={r === 0 && c === 1 ? "var(--signal)" : ink} />
                <path d={`M${56 + c * 82} ${96 + r * 30} v10 M${94 + c * 82} ${96 + r * 30} v10`} stroke={faint} />
              </g>
            )),
          )}
        </g>
      )}
      {topic === "ferry" && (
        <g {...common}>
          {/* hull + cabin */}
          <path d="M70 118 L86 142 h148 L250 118 Z" />
          <rect x="118" y="88" width="84" height="30" />
          <path d="M138 88 v-16 M138 72 h22" stroke="var(--signal)" strokeWidth="3" />
          {/* portholes */}
          <circle cx="136" cy="103" r="4" stroke={faint} />
          <circle cx="160" cy="103" r="4" stroke={faint} />
          <circle cx="184" cy="103" r="4" stroke={faint} />
          {/* water */}
          <path d="M40 156 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke={faint} />
        </g>
      )}
      {topic === "metro" && (
        <g {...common}>
          {/* elevated track */}
          <path d="M20 132 h280" />
          <path d="M60 132 v28 M160 132 v28 M260 132 v28" stroke={faint} />
          {/* train */}
          <rect x="72" y="76" width="176" height="52" rx="12" />
          <rect x="88" y="88" width="28" height="18" stroke={faint} />
          <rect x="128" y="88" width="28" height="18" stroke={faint} />
          <rect x="168" y="88" width="28" height="18" stroke={faint} />
          <path d="M208 88 h24 v18 h-24 z" stroke="var(--signal)" strokeWidth="3" />
          {/* pantograph */}
          <path d="M150 76 l14 -16 l14 16" stroke={faint} />
        </g>
      )}
      {topic === "rocket" && (
        <g {...common}>
          {/* gantry */}
          <path d="M104 150 V52 M104 66 h34 M104 92 h34 M104 118 h30" stroke={faint} />
          {/* rocket */}
          <path d="M168 150 V72 q0 -26 16 -40 q16 14 16 40 v78" />
          <path d="M168 150 l-14 16 M200 150 l14 16" />
          <path d="M176 150 h16" stroke={faint} />
          {/* flame */}
          <path d="M184 154 q-7 14 0 22 q7 -8 0 -22" stroke="var(--signal)" strokeWidth="3" />
          <circle cx="184" cy="62" r="5" stroke={faint} />
        </g>
      )}
      {topic === "zoo" && (
        <g {...common}>
          {/* adult elephant */}
          <path d="M96 132 v-26 q0 -26 30 -26 h34 q26 0 26 22 v30" />
          <path d="M186 106 q16 4 12 24" />
          <path d="M108 132 v10 M170 132 v10" stroke={faint} />
          <circle cx="120" cy="96" r="2.5" fill={ink} />
          {/* calf */}
          <path d="M218 138 v-12 q0 -14 16 -14 h16 q13 0 13 12 v14" />
          <path d="M263 126 q9 3 7 14" stroke="var(--signal)" strokeWidth="3" />
          {/* ground */}
          <path d="M60 152 h210" stroke={faint} />
        </g>
      )}
    </svg>
  );
}

type Phase = "intro" | "running" | "feedback" | "over";

function readHighScore(): number {
  try {
    return Number(localStorage.getItem(HS_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function FlaggedGame({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [post, setPost] = useState<Post | null>(null);
  const [roundKey, setRoundKey] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [timeFrac, setTimeFrac] = useState(1);
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string } | null>(null);
  const [highScore, setHighScore] = useState(readHighScore);

  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;
  const postRef = useRef<Post | null>(null);
  postRef.current = post;
  const scoreRef = useRef(0);
  const livesRef = useRef(LIVES);

  // Swipe state — the card's x drives its rotation and the two stamps.
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-280, 280], [-11, 11]);
  const realOpacity = useTransform(x, [36, 130], [0, 1]);
  const flagOpacity = useTransform(x, [-130, -36], [1, 0]);

  const gameOver = useCallback(() => {
    setPhase("over");
    setHighScore((hs) => {
      const next = Math.max(hs, scoreRef.current);
      try {
        localStorage.setItem(HS_KEY, String(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);

  const nextRound = useCallback(() => {
    x.set(0);
    setPost(makePost());
    setRoundKey((k) => k + 1);
    setVerdict(null);
    setTimeFrac(1);
    setPhase("running");
  }, [x]);

  const start = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = LIVES;
    setScore(0);
    setLives(LIVES);
    setStreak(0);
    nextRound();
  }, [nextRound]);

  const answer = useCallback(
    (published: boolean, timedOut = false) => {
      const p = postRef.current;
      if (!p || phaseRef.current !== "running") return;
      setPhase("feedback");

      // Fling the card off in the direction of the decision.
      if (!timedOut) animate(x, published ? 560 : -560, { duration: 0.38, ease: [0.3, 0, 0.7, 0.4] });

      const correct = published !== p.bad;
      if (correct) {
        const bonus = 10 + Math.min(streak, 5) * 2;
        scoreRef.current += bonus;
        setScore(scoreRef.current);
        setStreak((s) => s + 1);
        setVerdict({ ok: true, text: `+${bonus} · ${p.hint}` });
      } else {
        livesRef.current -= 1;
        setLives(livesRef.current);
        setStreak(0);
        setVerdict({
          ok: false,
          text: timedOut && p.bad ? `too slow — it went viral · ${p.hint}` : p.hint,
        });
      }

      window.setTimeout(() => {
        if (livesRef.current <= 0) gameOver();
        else nextRound();
      }, 1500);
    },
    [gameOver, nextRound, streak, x],
  );

  /* Round clock. */
  useEffect(() => {
    if (phase !== "running") return;
    const [t0, floor] = TIME;
    const total = Math.max(floor, t0 - (t0 - floor) * Math.min(scoreRef.current / 150, 1));
    let raf = 0;
    const started = performance.now();
    const step = (now: number) => {
      const frac = 1 - (now - started) / (total * 1000);
      if (frac <= 0) {
        setTimeFrac(0);
        answer(true, true); // silence publishes it
        return;
      }
      setTimeFrac(frac);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, roundKey, answer]);

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
      aria-label="Flagged — a game about misinformation"
      className="fixed inset-0 z-[95] flex flex-col bg-paper"
    >
      <header className="flex items-center justify-between border-b border-ink/15 px-5 py-3 sm:px-8">
        <div className="flex min-w-0 items-baseline gap-4">
          <span className="type-display-tight whitespace-nowrap text-sm text-ink sm:text-base">
            FLAGGED
          </span>
          <span className="type-label hidden text-ink-faint lg:inline">
            you are the misinformation classifier
          </span>
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

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-6">
        {(phase === "running" || phase === "feedback") && post && (
          <div className="w-full max-w-md">
            {/* The post, swipeable. */}
            <motion.div
              key={roundKey}
              drag={phase === "running" ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              onDragEnd={(_, info) => {
                if (info.offset.x > 120 || info.velocity.x > 600) answer(true);
                else if (info.offset.x < -120 || info.velocity.x < -600) answer(false);
              }}
              style={{ x, rotate }}
              className="relative cursor-grab touch-pan-y border border-ink bg-paper shadow-[6px_6px_0_0_var(--color-ink)] active:cursor-grabbing"
            >
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

              {/* Post header */}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center border border-ink/25 font-mono text-[0.6875rem] text-ink-soft"
                  >
                    {post.source[0].toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[0.8125rem] text-ink">
                      {post.source}
                    </span>
                    <span className="type-label block text-[0.5625rem] text-ink-faint">
                      {post.date} · forwarded 1.2k times
                    </span>
                  </span>
                </span>
              </div>

              {/* The photo */}
              <div className="relative aspect-video border-y border-ink/15 bg-paper-deep/70">
                <Scene topic={post.photoTopic} />
                <span className="type-label absolute bottom-2 right-2 border border-ink/20 bg-paper/85 px-1.5 py-0.5 text-[0.5625rem] text-ink-soft">
                  {post.watermark}
                </span>
              </div>

              {/* Caption */}
              <p className="type-body px-4 py-3.5 text-[1rem] font-medium text-ink">
                {post.headline}
              </p>

              {/* Drag stamps */}
              <motion.span
                style={{ opacity: realOpacity }}
                className="type-label pointer-events-none absolute left-4 top-14 -rotate-12 border-2 border-ink bg-[var(--signal)] px-2.5 py-1 text-ink"
              >
                real ✓
              </motion.span>
              <motion.span
                /* Hard red, same as every failure state in the arcade. */
                style={{ opacity: flagOpacity, backgroundColor: "#ff4f18" }}
                className="type-label pointer-events-none absolute right-4 top-14 rotate-12 border-2 border-ink px-2.5 py-1 text-paper"
              >
                fake ✕
              </motion.span>
            </motion.div>

            {/* Verdict */}
            <div className="mt-4 min-h-[3.25rem]">
              <AnimatePresence>
                {verdict && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border border-ink/20 px-4 py-3 font-mono text-[0.8125rem] text-ink"
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

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={phase !== "running"}
                onClick={() => answer(false)}
                className="type-label border-2 border-ink bg-paper px-4 py-3.5 text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-all hover:bg-[#ff4f18] hover:text-paper active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)] disabled:opacity-50"
              >
                ← flag it
                <span className="mt-1 block text-[0.5625rem] opacity-60">swipe left · key 1</span>
              </button>
              <button
                type="button"
                disabled={phase !== "running"}
                onClick={() => answer(true)}
                className="type-label border-2 border-ink bg-[var(--signal)] px-4 py-3.5 text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)] disabled:opacity-50"
              >
                publish →
                <span className="mt-1 block text-[0.5625rem] opacity-60">swipe right · key 2</span>
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
                    <h2 className="type-display mb-4 text-2xl text-ink">FLAGGED</h2>
                    <div className="type-body space-y-2.5 text-[0.875rem] text-ink-soft">
                      <p>
                        Posts arrive the way misinformation actually travels: a photo
                        with a caption, forwarded a thousand times.
                      </p>
                      <p>
                        <mark className="bg-[var(--signal)] px-1 text-ink">Look at the picture.</mark>{" "}
                        Does it show what the caption claims? Check the watermark, the
                        source, the date. Every fake has one broken detail.
                      </p>
                      <p>Swipe right to publish the real ones. Swipe left to flag the fakes.</p>
                      <p className="type-label text-ink-faint">
                        drag the card · or keys 1/← flag · 2/→ publish
                      </p>
                    </div>
                    <p
                      className="type-body mt-4 border-l-2 pl-3 text-[0.8125rem] leading-relaxed text-ink-faint"
                      style={{ borderColor: "var(--signal)" }}
                    >
                      Based on my Fake News Detection project — an AI that spots fake
                      Malayalam news by checking whether the photo and the caption
                      actually belong together. In this game, you're the AI.
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
                    <h2 className="type-display mb-1 text-2xl text-ink">IT WENT VIRAL</h2>
                    <p className="type-label mb-5 text-ink-faint">
                      score {score} · best {highScore}
                    </p>
                    <p className="type-body mb-6 text-[0.875rem] text-ink-soft">
                      Each half of a fake looks fine on its own — the lie lives in the
                      pairing. That's why the real classifier reads both at once: MuRIL
                      for the Malayalam text, CLIP and BLIP for the image. You just
                      graded the way it does.
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

export default FlaggedGame;
