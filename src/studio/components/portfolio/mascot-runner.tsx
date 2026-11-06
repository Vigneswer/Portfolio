
import { lazy, Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { PixelSprite } from "../companion/pixel-sprite";
import { useReducedMotion } from "../../hooks/use-motion";

const CompanionPanel = lazy(() => import("../companion/companion-panel").then(module => ({ default: module.CompanionPanel })));
const subscribeMounted = () => () => {};
type Phase = "closed" | "entering" | "open" | "leaving";

export function MascotRunner() {
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("closed");
  const [greeting, setGreeting] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [origin, setOrigin] = useState({ x: "50%", y: "50%" });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hintRef = useRef<HTMLElement>(null);
  const phaseRef = useRef<Phase>("closed");
  const isOpen = phase !== "closed";

  useLayoutEffect(() => { phaseRef.current = phase; }, [phase]);

  useLayoutEffect(() => {
    const button = buttonRef.current, hint = hintRef.current;
    if (!button || !hint || !mounted || !showHint || isOpen) return;
    const place = () => {
      const anchor = button.getBoundingClientRect();
      const box = hint.getBoundingClientRect();
      const below = window.innerWidth <= 680;
      const left = below ? anchor.left + anchor.width / 2 - box.width / 2 : anchor.right + 14;
      const top = below ? anchor.bottom + 14 : anchor.top + anchor.height / 2 - box.height / 2;
      const x = Math.max(12, Math.min(left, window.innerWidth - box.width - 12));
      const y = Math.max(12, Math.min(top, window.innerHeight - box.height - 12));
      hint.style.left = `${x}px`;
      hint.style.top = `${y}px`;
      hint.style.setProperty("--hint-arrow", `${Math.max(18, Math.min(anchor.left + anchor.width / 2 - x, box.width - 24))}px`);
      hint.dataset.side = below ? "below" : "right";
      hint.style.visibility = "visible";
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(button); observer.observe(hint);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { observer.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [mounted, showHint, isOpen]);

  useEffect(() => {
    if (phase !== "entering" && phase !== "leaving") return;
    const timer = window.setTimeout(() => {
      if (phase === "entering") setPhase("open");
      else {
        setPhase("closed");
        requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }));
      }
    }, reducedMotion ? 0 : phase === "entering" ? 640 : 480);
    return () => window.clearTimeout(timer);
  }, [phase, reducedMotion]);

  useEffect(() => {
    const studio = buttonRef.current?.closest<HTMLElement>(".app-window");
    if (!studio || !isOpen) return;
    const wasInert = studio.inert;
    studio.inert = true;
    return () => { studio.inert = wasInert; };
  }, [isOpen]);

  const preload = () => { void import("../companion/companion-panel"); };
  const launch = () => {
    if (phaseRef.current !== "closed") return;
    const box = buttonRef.current?.getBoundingClientRect();
    if (box) setOrigin({ x: `${box.left + box.width / 2}px`, y: `${box.top + box.height / 2}px` });
    setShowHint(false);
    setPhase(reducedMotion ? "open" : "entering");
  };
  const close = useCallback(() => {
    if (phaseRef.current === "leaving" || phaseRef.current === "closed") return;
    if (reducedMotion) {
      setPhase("closed");
      requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }));
    } else setPhase("leaving");
  }, [reducedMotion]);

  return <>
    <button ref={buttonRef} className="arcade-entry" type="button" aria-label="Vignesh arcade: chat with Vigneswer or play a game" aria-haspopup="dialog" aria-expanded={isOpen} aria-describedby={showHint && mounted && !isOpen ? "arcade-invitation" : undefined}
      onClick={launch} onPointerEnter={() => { setGreeting(true); preload(); }} onPointerLeave={() => setGreeting(false)} onFocus={() => { setGreeting(true); preload(); }} onBlur={() => setGreeting(false)}>
      <PixelSprite pose={greeting ? "wave" : "idle"} paused={!greeting} className="arcade-entry-character" decorative />
      <span className="arcade-entry-copy"><strong>Vignesh arcade</strong><small>Chat or take a play break</small></span>
      <ArrowUpRight size={15} aria-hidden="true" />
    </button>
    {mounted && showHint && !isOpen && createPortal(<aside ref={hintRef} className="arcade-invitation" aria-label="Meet pixel Vigneswer" style={{ visibility: "hidden" }}>
      <button className="arcade-invitation-action" type="button" onClick={launch}>
        <span className="arcade-invitation-spark" aria-hidden="true">✦</span>
        <span id="arcade-invitation"><strong>Click mini me!</strong><span>Chat with me or play a game.</span></span>
      </button>
      <button className="arcade-invitation-dismiss" type="button" onClick={() => setShowHint(false)} aria-label="Dismiss arcade hint">×</button>
    </aside>, document.body)}
    {mounted && isOpen && createPortal(<div className="arcade-portal" data-phase={phase} style={{ "--portal-x": origin.x, "--portal-y": origin.y } as CSSProperties}>
      <div className="arcade-portal-scene" inert={phase === "leaving"}>
        <Suspense fallback={<div className="arcade-loading" role="status">Loading arcade…</div>}><CompanionPanel open onClose={close} /></Suspense>
      </div>
      {(phase === "entering" || phase === "leaving") && <div className="arcade-warp" aria-hidden="true">
        <div className="arcade-warp-rings">{[0, 1, 2, 3, 4].map(index => <i key={index} style={{ "--ring": index } as CSSProperties} />)}</div>
      </div>}
    </div>, document.body)}
  </>;
}
