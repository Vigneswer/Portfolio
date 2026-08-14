import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * DOUBLE-CHARGE — a playable argument.
 *
 * The pitch of this whole site is "webhooks that must never double-charge".
 * Here the visitor *is* the idempotency layer: payment events fall, every
 * fresh event must be acknowledged exactly once, and the provider re-delivers
 * duplicates exactly like Razorpay does. Ack a duplicate and you've charged a
 * customer twice.
 *
 * The visible ledger only remembers the last three processed ids — which is
 * the joke and the lesson: a human with a 3-row ledger is a bad idempotency
 * store, and the game-over copy says what production uses instead.
 *
 * Everything is DOM (buttons, not canvas) so it stays clickable, focusable and
 * styleable with the site's own tokens. One rAF loop moves the cards.
 */

const LANES = 3;
const LIVES = 3;
const LEDGER_ROWS = 3;
const HS_KEY = "vg-doublecharge-hs";

const EVENT_KINDS = [
  { kind: "ORDER.PAID", amount: "₹1,299" },
  { kind: "PAYMENT.CAPTURED", amount: "₹749" },
  { kind: "ORDER.PAID", amount: "₹2,150" },
  { kind: "REFUND.CREATED", amount: "₹499" },
  { kind: "PAYMENT.CAPTURED", amount: "₹3,999" },
] as const;

type Card = {
  key: number;
  id: string;
  kind: string;
  amount: string;
  lane: number;
  y: number;
  speed: number;
  dup: boolean;
  /** Set once the card is scored; it then animates out and stops moving. */
  resolved: "acked" | "charged" | "lost" | "deduped" | null;
  /** Seconds a resolved card lingers while its exit transition plays. */
  ttl: number;
};

type Toast = { key: number; text: string; bad: boolean; lane: number; y: number };

type Phase = "intro" | "running" | "over";

const hex = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0");

function readHighScore(): number {
  try {
    return Number(localStorage.getItem(HS_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function DoubleCharge({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [cards, setCards] = useState<Card[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [ledger, setLedger] = useState<string[]>([]);
  const [stats, setStats] = useState({ processed: 0, deduped: 0, disputes: 0, lost: 0 });
  const [highScore, setHighScore] = useState(readHighScore);
  const [hurt, setHurt] = useState(0); // increments to retrigger the damage flash

  const areaRef = useRef<HTMLDivElement>(null);

  // The rAF loop reads/writes these refs; React state is only touched when
  // something scoreworthy happens, so 60fps never churns the tree.
  const cardsRef = useRef<Card[]>([]);
  const ackedRef = useRef<string[]>([]); // every processed id, newest last
  const scoreRef = useRef(0);
  const livesRef = useRef(LIVES);
  const spawnAtRef = useRef(0);
  const keyRef = useRef(1);
  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;

  const pushToast = useCallback((text: string, bad: boolean, lane: number, y: number) => {
    const key = keyRef.current++;
    setToasts((t) => [...t.slice(-4), { key, text, bad, lane, y }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 1100);
  }, []);

  const loseLife = useCallback(() => {
    livesRef.current -= 1;
    setLives(livesRef.current);
    setHurt((h) => h + 1);
    if (livesRef.current <= 0) {
      setPhase("over");
      setHighScore((hs) => {
        const next = Math.max(hs, scoreRef.current);
        try {
          localStorage.setItem(HS_KEY, String(next));
        } catch {
          /* private mode — the score just isn't durable */
        }
        return next;
      });
    }
  }, []);

  const ack = useCallback(
    (key: number) => {
      const card = cardsRef.current.find((c) => c.key === key && !c.resolved);
      if (!card || phaseRef.current !== "running") return;

      if (card.dup) {
        card.resolved = "charged";
        setStats((s) => ({ ...s, disputes: s.disputes + 1 }));
        pushToast(`−${card.amount} refund dispute`, true, card.lane, card.y);
        loseLife();
      } else {
        card.resolved = "acked";
        ackedRef.current.push(card.id);
        scoreRef.current += 10;
        setScore(scoreRef.current);
        setStats((s) => ({ ...s, processed: s.processed + 1 }));
        setLedger(ackedRef.current.slice(-LEDGER_ROWS).reverse());
        pushToast("processed +10", false, card.lane, card.y);
      }
      setCards([...cardsRef.current]);
    },
    [loseLife, pushToast],
  );

  /** Keyboard play: 1/2/3 acks the lowest live card in that lane. */
  const ackLane = useCallback(
    (lane: number) => {
      const target = cardsRef.current
        .filter((c) => c.lane === lane && !c.resolved)
        .sort((a, b) => b.y - a.y)[0];
      if (target) ack(target.key);
    },
    [ack],
  );

  const start = useCallback(() => {
    cardsRef.current = [];
    ackedRef.current = [];
    scoreRef.current = 0;
    livesRef.current = LIVES;
    spawnAtRef.current = 0;
    setCards([]);
    setScore(0);
    setLives(LIVES);
    setLedger([]);
    setStats({ processed: 0, deduped: 0, disputes: 0, lost: 0 });
    setPhase("running");
  }, []);

  /* ------------------------------ game loop ------------------------------ */
  useEffect(() => {
    if (phase !== "running") return;

    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      // Clamp dt so a background tab doesn't dump one giant frame on return.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const area = areaRef.current;
      const height = area?.clientHeight ?? 600;
      const ramp = Math.min(scoreRef.current / 200, 1); // 0 → 1 over ~20 acks

      /* Spawn. Interval and duplicate probability both ramp with score. */
      spawnAtRef.current -= dt;
      if (spawnAtRef.current <= 0) {
        spawnAtRef.current = 1.9 - 1.1 * ramp;
        const dupPool = ackedRef.current.slice(-6);
        const dup = dupPool.length > 0 && Math.random() < 0.25 + 0.2 * ramp;
        const proto = EVENT_KINDS[Math.floor(Math.random() * EVENT_KINDS.length)];
        cardsRef.current.push({
          key: keyRef.current++,
          id: dup
            ? dupPool[Math.floor(Math.random() * dupPool.length)]
            : `evt_${hex()}`,
          kind: proto.kind,
          amount: proto.amount,
          lane: Math.floor(Math.random() * LANES),
          y: -90,
          speed: 55 + 85 * ramp + Math.random() * 20,
          dup,
          resolved: null,
          ttl: 0.4,
        });
      }

      /* Move + floor. */
      let changed = false;
      for (const c of cardsRef.current) {
        if (c.resolved) continue;
        c.y += c.speed * dt;
        if (c.y > height - 64) {
          changed = true;
          if (c.dup) {
            c.resolved = "deduped";
            scoreRef.current += 5;
            setScore(scoreRef.current);
            setStats((s) => ({ ...s, deduped: s.deduped + 1 }));
            pushToast("duplicate ignored +5", false, c.lane, c.y);
          } else {
            c.resolved = "lost";
            setStats((s) => ({ ...s, lost: s.lost + 1 }));
            pushToast("order lost", true, c.lane, c.y);
            loseLife();
          }
        }
      }

      // Resolved cards linger while their CSS exit plays, then leave the array.
      for (const c of cardsRef.current) if (c.resolved) c.ttl -= dt;
      cardsRef.current = cardsRef.current.filter((c) => !c.resolved || c.ttl > 0);

      // Positions change every frame; one setState per frame is the honest
      // cost of DOM cards, and profiles fine at this card count (< 12).
      setCards([...cardsRef.current]);
      if (changed && livesRef.current <= 0) return; // phase flipped in loseLife

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [phase, loseLife, pushToast]);

  /* ------------------------------ keys ----------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (phaseRef.current === "running" && ["1", "2", "3"].includes(e.key)) {
        e.preventDefault();
        ackLane(Number(e.key) - 1);
      }
      if (phaseRef.current !== "running" && e.key === "Enter") start();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [ackLane, onClose, start]);

  const laneLeft = (lane: number) => `${(lane * 100) / LANES}%`;
  const laneWidth = `${100 / LANES}%`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label="Double-Charge — a game about idempotency"
      className="fixed inset-0 z-[95] flex flex-col bg-paper"
    >
      {/* Damage flash. keyed so every hit re-fires it. */}
      <AnimatePresence>
        {hurt > 0 && phase === "running" && (
          <motion.div
            key={hurt}
            aria-hidden="true"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0 z-10"
            style={{ backgroundColor: "color-mix(in srgb, #ff4f18 30%, transparent)" }}
          />
        )}
      </AnimatePresence>

      {/* HUD */}
      <header className="flex items-center justify-between border-b border-ink/15 px-5 py-3 sm:px-8">
        <div className="flex min-w-0 items-baseline gap-4">
          <span className="type-display-tight whitespace-nowrap text-sm text-ink sm:text-base">
            DOUBLE‑CHARGE
          </span>
          <span className="type-label hidden text-ink-faint lg:inline">
            you are the idempotency layer
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
                    i < lives ? "var(--signal)" : "color-mix(in srgb, var(--color-ink) 15%, transparent)",
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

      {/* Play area */}
      <div ref={areaRef} className="relative flex-1 overflow-hidden">
        {/* Lane rules */}
        {Array.from({ length: LANES - 1 }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="absolute inset-y-0 border-l border-dashed border-ink/10"
            style={{ left: laneLeft(i + 1) }}
          />
        ))}

        {/* Floor line — where fresh orders die and duplicates get ignored. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-14 h-px"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, color-mix(in srgb, var(--color-ink) 35%, transparent) 0 8px, transparent 8px 16px)",
          }}
        />
        <div className="type-label absolute bottom-5 left-5 text-ink-faint sm:left-8">
          fresh event past this line = lost order
        </div>

        {/* The 3-row idempotency store. Deliberately too small — that's the bit. */}
        <aside className="absolute right-5 top-4 w-[11.5rem] border border-ink/20 bg-paper-deep/70 sm:right-8">
          <p className="type-label border-b border-ink/15 px-3 py-1.5 text-ink-faint">
            processed_events
          </p>
          <ol className="px-3 py-2 font-mono text-[0.75rem] leading-relaxed text-ink">
            {ledger.length === 0 && <li className="text-ink-faint">— empty —</li>}
            {ledger.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ol>
          <p className="type-label border-t border-ink/15 px-3 py-1.5 text-[0.5625rem] text-ink-faint">
            capacity: {LEDGER_ROWS} rows · the rest is on you
          </p>
        </aside>

        {/* Falling events */}
        {cards.map((c) => (
          <button
            key={c.key}
            type="button"
            onPointerDown={() => ack(c.key)}
            disabled={Boolean(c.resolved)}
            className="absolute select-none border border-ink bg-paper p-2.5 text-left shadow-[3px_3px_0_0_var(--color-ink)] transition-opacity duration-300 will-change-transform"
            style={{
              left: `calc(${laneLeft(c.lane)} + 4%)`,
              width: `calc(${laneWidth} - 8%)`,
              maxWidth: "13rem",
              transform: `translate3d(0, ${c.y}px, 0) ${
                c.resolved === "acked"
                  ? "scale(0.9)"
                  : c.resolved === "charged" || c.resolved === "lost"
                    ? "rotate(4deg) scale(0.92)"
                    : ""
              }`,
              opacity: c.resolved ? 0 : 1,
              backgroundColor:
                c.resolved === "acked"
                  ? "var(--signal)"
                  : c.resolved === "charged" || c.resolved === "lost"
                    ? "#ff4f18"
                    : undefined,
            }}
          >
            <span className="block font-mono text-[0.6875rem] text-ink-faint">{c.id}</span>
            <span className="type-label block text-ink">{c.kind}</span>
            <span className="block font-mono text-[0.8125rem] font-medium text-ink">
              {c.amount}
            </span>
          </button>
        ))}

        {/* Score toasts, at the spot where it happened */}
        {toasts.map((t) => (
          <span
            key={t.key}
            aria-hidden="true"
            className="type-label pointer-events-none absolute z-10 px-1.5 py-0.5"
            style={{
              left: `calc(${laneLeft(t.lane)} + 6%)`,
              top: t.y,
              backgroundColor: t.bad ? "#ff4f18" : "var(--signal)",
              color: "var(--color-ink)",
            }}
          >
            {t.text}
          </span>
        ))}

        {/* Intro / game over */}
        <AnimatePresence>
          {phase !== "running" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-paper/85 px-5 backdrop-blur-[2px]"
            >
              <div className="w-full max-w-md border border-ink bg-paper p-6 shadow-[6px_6px_0_0_var(--color-ink)]">
                {phase === "intro" ? (
                  <>
                    <h2 className="type-display mb-4 text-2xl text-ink">DOUBLE‑CHARGE</h2>
                    <div className="type-body space-y-2.5 text-[0.875rem] text-ink-soft">
                      <p>
                        Payment webhooks are falling. <mark className="bg-[var(--signal)] px-1 text-ink">Tap a fresh event</mark> to
                        process the order.
                      </p>
                      <p>
                        The provider <em>re-delivers</em> events. Tap a duplicate id and
                        you've charged a customer twice — that's a refund dispute and a
                        life.
                      </p>
                      <p>
                        Let duplicates fall through. Never let a fresh order drop.
                        Your ledger only remembers the last {LEDGER_ROWS} ids.
                      </p>
                      <p className="type-label text-ink-faint">
                        keys 1 · 2 · 3 ack a lane — or just tap
                      </p>
                    </div>
                    <p
                      className="type-body mt-4 border-l-2 pl-3 text-[0.8125rem] leading-relaxed text-ink-faint"
                      style={{ borderColor: "var(--signal)" }}
                    >
                      Based on Druvino Commerce, the online-shopping platform I build at
                      work. Payment providers sometimes send the same "payment received"
                      message twice — the real system must spot the repeat and charge
                      only once. Here, you do that job by hand.
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
                    <h2 className="type-display mb-1 text-2xl text-ink">
                      {stats.disputes > 0 ? "REFUND DISPUTES FILED" : "ORDERS LOST"}
                    </h2>
                    <p className="type-label mb-5 text-ink-faint">
                      score {score} · best {highScore}
                    </p>
                    <dl className="mb-5 grid grid-cols-2 gap-x-6 gap-y-2 border-l-2 pl-4" style={{ borderColor: "var(--signal)" }}>
                      {(
                        [
                          ["processed", stats.processed],
                          ["deduped", stats.deduped],
                          ["double-charged", stats.disputes],
                          ["orders lost", stats.lost],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k} className="flex items-baseline justify-between gap-3">
                          <dt className="type-label text-ink-faint">{k}</dt>
                          <dd className="font-mono text-sm tabular-nums text-ink">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="type-body mb-6 text-[0.875rem] text-ink-soft">
                      In production this memory is a UNIQUE constraint on{" "}
                      <code className="bg-paper-deep px-1">event_id</code> and an outbox
                      table — humans make bad idempotency layers. That's why I build the
                      other kind.
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

export default DoubleCharge;
