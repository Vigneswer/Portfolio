import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * FLAGGED — the Malayalam misinformation project as an evidence hunt.
 *
 * The other two arcade games are reflex (DOUBLE-CHARGE) and judgement
 * (GROUNDED). This one is *investigation*: it's not enough to feel that a
 * post is fake — you have to tap the exact detail that's lying. The photo
 * that doesn't match the caption, the recycled-archive watermark, the source
 * that isn't one, the date that can't exist. Accuse the wrong detail and
 * you've smeared a real story, which costs the same as missing a fake.
 *
 * That's also the honest version of the real project: the classifier doesn't
 * output "fake" — it localises which pairing broke (image ↔ text ↔ metadata).
 */

const LIVES = 3;
const HS_KEY = "vg-flagged-hs";
/** Seconds per round, start → floor as the score ramps. */
const TIME: [number, number] = [14, 8];

type Topic = "flood" | "exam" | "ferry" | "metro" | "rocket" | "zoo";
/** The four pieces of evidence a post carries. */
type Zone = "photo" | "watermark" | "source" | "date";

const ZONE_LABEL: Record<Zone, string> = {
  photo: "the photo",
  watermark: "the watermark",
  source: "the source",
  date: "the date",
};

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
  /** Which piece of evidence is lying — null means the post is clean. */
  tell: Zone | null;
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
    tell: null,
    hint: "photo, source and date all held up — that one was real.",
  };

  if (bad) {
    const tell = pick(["photo", "watermark", "source", "date"] as const);
    post.tell = tell;
    if (tell === "photo") {
      const other = pick(STORIES.filter((s) => s.topic !== story.topic));
      post.photoTopic = other.topic;
      post.hint = `the photo shows ${SCENE_NOUN[other.topic]}, not ${SCENE_NOUN[story.topic]} — image and caption don't match.`;
    } else if (tell === "watermark") {
      post.watermark = pick(["ARCHIVE · 2018", "FILE PHOTO · 2011", "© 2019 · Chennai"]);
      post.hint = "the watermark gives it away — old stock, not this event.";
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
   The photos — six drawn scenes in ink linework with one signal accent each,
   so a mismatch against the caption is readable in under a second.
   -------------------------------------------------------------------------- */
function Scene({ topic }: { topic: Topic }) {
  const ink = "color-mix(in srgb, var(--color-ink) 60%, transparent)";
  const faint = "color-mix(in srgb, var(--color-ink) 25%, transparent)";
  const common = { stroke: ink, strokeWidth: 2.5, fill: "none", strokeLinecap: "round" as const };

  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      {topic === "flood" && (
        <g {...common}>
          <path d="M70 96 L110 60 L150 96" />
          <path d="M78 96 h64" stroke={faint} />
          <path d="M200 100 q18 -14 44 0" />
          <path d="M20 112 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="var(--signal)" strokeWidth="3" />
          <path d="M30 132 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0" stroke={faint} />
          <path d="M20 152 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke={faint} />
        </g>
      )}
      {topic === "exam" && (
        <g {...common}>
          <circle cx="160" cy="42" r="16" />
          <path d="M160 42 v-9 M160 42 h7" />
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
          <path d="M70 118 L86 142 h148 L250 118 Z" />
          <rect x="118" y="88" width="84" height="30" />
          <path d="M138 88 v-16 M138 72 h22" stroke="var(--signal)" strokeWidth="3" />
          <circle cx="136" cy="103" r="4" stroke={faint} />
          <circle cx="160" cy="103" r="4" stroke={faint} />
          <circle cx="184" cy="103" r="4" stroke={faint} />
          <path d="M40 156 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke={faint} />
        </g>
      )}
      {topic === "metro" && (
        <g {...common}>
          <path d="M20 132 h280" />
          <path d="M60 132 v28 M160 132 v28 M260 132 v28" stroke={faint} />
          <rect x="72" y="76" width="176" height="52" rx="12" />
          <rect x="88" y="88" width="28" height="18" stroke={faint} />
          <rect x="128" y="88" width="28" height="18" stroke={faint} />
          <rect x="168" y="88" width="28" height="18" stroke={faint} />
          <path d="M208 88 h24 v18 h-24 z" stroke="var(--signal)" strokeWidth="3" />
          <path d="M150 76 l14 -16 l14 16" stroke={faint} />
        </g>
      )}
      {topic === "rocket" && (
        <g {...common}>
          <path d="M104 150 V52 M104 66 h34 M104 92 h34 M104 118 h30" stroke={faint} />
          <path d="M168 150 V72 q0 -26 16 -40 q16 14 16 40 v78" />
          <path d="M168 150 l-14 16 M200 150 l14 16" />
          <path d="M176 150 h16" stroke={faint} />
          <path d="M184 154 q-7 14 0 22 q7 -8 0 -22" stroke="var(--signal)" strokeWidth="3" />
          <circle cx="184" cy="62" r="5" stroke={faint} />
        </g>
      )}
      {topic === "zoo" && (
        <g {...common}>
          <path d="M96 132 v-26 q0 -26 30 -26 h34 q26 0 26 22 v30" />
          <path d="M186 106 q16 4 12 24" />
          <path d="M108 132 v10 M170 132 v10" stroke={faint} />
          <circle cx="120" cy="96" r="2.5" fill={ink} />
          <path d="M218 138 v-12 q0 -14 16 -14 h16 q13 0 13 12 v14" />
          <path d="M263 126 q9 3 7 14" stroke="var(--signal)" strokeWidth="3" />
          <path d="M60 152 h210" stroke={faint} />
        </g>
      )}
    </svg>
  );
}

type Phase = "intro" | "running" | "feedback" | "over";
type Reveal = { accused: Zone | "publish"; actual: Zone | null; ok: boolean };

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
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [timeFrac, setTimeFrac] = useState(1);
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string } | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [highScore, setHighScore] = useState(readHighScore);
  const [roundKey, setRoundKey] = useState(0);

  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;
  const postRef = useRef<Post | null>(null);
  postRef.current = post;
  const scoreRef = useRef(0);
  const livesRef = useRef(LIVES);

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
    setPost(makePost());
    setRoundKey((k) => k + 1);
    setVerdict(null);
    setReveal(null);
    setTimeFrac(1);
    setPhase("running");
  }, []);

  const start = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = LIVES;
    setScore(0);
    setLives(LIVES);
    setStreak(0);
    nextRound();
  }, [nextRound]);

  /** Accuse one piece of evidence, or publish the whole post. */
  const answer = useCallback(
    (accused: Zone | "publish", timedOut = false) => {
      const p = postRef.current;
      if (!p || phaseRef.current !== "running") return;
      setPhase("feedback");

      const ok = accused === "publish" ? p.tell === null : accused === p.tell;
      setReveal({ accused, actual: p.tell, ok });

      if (ok) {
        // Catching the lie pays more than waving a clean post through.
        const bonus = (accused === "publish" ? 10 : 15) + Math.min(streak, 5) * 2;
        scoreRef.current += bonus;
        setScore(scoreRef.current);
        setStreak((s) => s + 1);
        setVerdict({ ok: true, text: `+${bonus} · ${p.hint}` });
      } else {
        livesRef.current -= 1;
        setLives(livesRef.current);
        setStreak(0);
        const text = timedOut
          ? `too slow — it went viral · ${p.hint}`
          : accused === "publish"
            ? `you published a fake · ${p.hint}`
            : p.tell === null
              ? `false accusation — ${ZONE_LABEL[accused as Zone]} was fine. that post was real.`
              : `wrong detail — ${ZONE_LABEL[accused as Zone]} was fine. ${p.hint}`;
        setVerdict({ ok: false, text });
      }

      window.setTimeout(() => {
        if (livesRef.current <= 0) gameOver();
        else nextRound();
      }, 1700);
    },
    [gameOver, nextRound, streak],
  );

  /* Round clock — running out counts as publishing unreviewed. */
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
        answer("publish", true);
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
      if (phaseRef.current === "running" && (e.key === "Enter" || e.key === "p")) {
        answer("publish");
        return;
      }
      if (phaseRef.current !== "running" && phaseRef.current !== "feedback" && e.key === "Enter") {
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

  /** Evidence-zone styling: quiet at rest, outlined on hover, judged after. */
  const zoneClass = (zone: Zone) => {
    const base =
      "group/zone relative cursor-pointer text-left transition-all duration-200 outline-offset-2";
    if (!reveal) {
      return `${base} hover:outline hover:outline-2 hover:outline-dashed hover:outline-ink/50`;
    }
    // The true lie is always revealed in signal — whether you caught it or
    // missed it — and a wrong accusation is marked in red, so the two never
    // read as the same thing.
    if (reveal.actual === zone) {
      return `${base} outline outline-2 outline-[var(--signal)]`;
    }
    if (reveal.accused === zone) {
      return `${base} outline outline-2 outline-[#ff4f18]`;
    }
    return base;
  };

  /** Tiny "inspect" tag that appears when hovering a zone. */
  const InspectTag = () => (
    <span
      aria-hidden="true"
      className="type-label pointer-events-none absolute -top-2.5 right-1 z-10 hidden bg-ink px-1.5 py-0.5 text-[0.5rem] text-paper group-hover/zone:block"
    >
      accuse
    </span>
  );

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
            tap the lie, not just the post
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

      <div className="relative flex flex-1 items-center justify-center overflow-y-auto px-5 py-6">
        {(phase === "running" || phase === "feedback") && post && (
          <div className="w-full max-w-md">
            <motion.div
              key={roundKey}
              initial={{ opacity: 0, y: 22, rotate: -0.6 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative border border-ink bg-paper shadow-[6px_6px_0_0_var(--color-ink)]"
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

              {/* Post header: source (zone) + date (zone) */}
              <div className="flex items-center gap-2.5 px-4 py-2.5">
                <button
                  type="button"
                  disabled={phase !== "running"}
                  onClick={() => answer("source")}
                  className={`${zoneClass("source")} flex min-w-0 items-center gap-2.5`}
                >
                  <InspectTag />
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center border border-ink/25 font-mono text-[0.6875rem] text-ink-soft"
                  >
                    {post.source[0].toUpperCase()}
                  </span>
                  <span className="block truncate font-mono text-[0.8125rem] text-ink">
                    {post.source}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={phase !== "running"}
                  onClick={() => answer("date")}
                  className={`${zoneClass("date")} ml-auto shrink-0`}
                >
                  <InspectTag />
                  <span className="type-label block text-[0.5625rem] text-ink-faint">
                    {post.date} · fwd 1.2k
                  </span>
                </button>
              </div>

              {/* The photo (zone) with its watermark (zone) */}
              <div className="relative border-y border-ink/15">
                <button
                  type="button"
                  disabled={phase !== "running"}
                  onClick={() => answer("photo")}
                  className={`${zoneClass("photo")} block aspect-video w-full bg-paper-deep/70`}
                >
                  <InspectTag />
                  <Scene topic={post.photoTopic} />
                </button>
                <button
                  type="button"
                  disabled={phase !== "running"}
                  onClick={() => answer("watermark")}
                  className={`${zoneClass("watermark")} type-label absolute bottom-2 right-2 border border-ink/20 bg-paper/90 px-1.5 py-0.5 text-[0.5625rem] text-ink-soft`}
                >
                  <InspectTag />
                  {post.watermark}
                </button>
              </div>

              {/* Caption — not evidence, just the claim. */}
              <p className="type-body px-4 py-3.5 text-[1rem] font-medium text-ink">
                {post.headline}
              </p>
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

            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="type-label max-w-[14rem] text-ink-faint">
                tap the detail that's lying — or, if it all checks out:
              </p>
              <button
                type="button"
                disabled={phase !== "running"}
                onClick={() => answer("publish")}
                className="type-label shrink-0 border-2 border-ink bg-[var(--signal)] px-5 py-3 text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)] disabled:opacity-50"
              >
                publish ↵
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
                        A news post: photo, source, date, caption. Some are real.
                        Some carry exactly one lie.
                      </p>
                      <p>
                        Don't just call it fake —{" "}
                        <mark className="bg-[var(--signal)] px-1 text-ink">
                          tap the detail that's lying
                        </mark>
                        : the photo that doesn't match the caption, the recycled-archive
                        watermark, the source that isn't one, the impossible date.
                      </p>
                      <p>
                        Accuse the wrong detail and you've smeared a real story — that
                        costs a life, same as publishing a fake. Clean post? Hit publish.
                      </p>
                      <p className="type-label text-ink-faint">
                        tap evidence to accuse · enter publishes
                      </p>
                    </div>
                    <p
                      className="type-body mt-4 border-l-2 pl-3 text-[0.8125rem] leading-relaxed text-ink-faint"
                      style={{ borderColor: "var(--signal)" }}
                    >
                      Based on my Fake News Detection project — an AI that spots fake
                      Malayalam news by checking whether the photo, the text and the
                      metadata actually belong together. In this game, you're the AI.
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
                      pairing. The real classifier reads them together: MuRIL for the
                      Malayalam text, CLIP and BLIP for the image. You just did its job
                      by hand.
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
