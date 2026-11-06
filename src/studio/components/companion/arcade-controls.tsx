
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import styles from "./arcade-controls.module.css";

export type ArcadeKey = "up" | "down" | "left" | "right" | "a" | "b" | "start";
type Handler = (key: ArcadeKey, down: boolean) => void;
const Input = createContext<{ current: Handler | null } | null>(null);
export function ArcadeInputProvider({ children }: { children: ReactNode }) {
  const handler = useRef<Handler | null>(null);
  return <Input.Provider value={handler}>{children}</Input.Provider>;
}
// Shared context keeps handheld controls and games connected across lazy chunks.
// eslint-disable-next-line react-refresh/only-export-components
export function useArcadeInput(handler: Handler) {
  const inputRef = useContext(Input);
  useEffect(() => {
    if (!inputRef) return;
    inputRef.current = handler;
    return () => { if (inputRef.current === handler) inputRef.current = null; };
  }, [handler, inputRef]);
}
export function ArcadeControls({ inGame, hint, actionLabels, onBack, onMenuInput }: { inGame: boolean; hint: string; actionLabels: { a: string; b: string }; onBack: () => void; onMenuInput: Handler }) {
  const inputRef = useContext(Input);
  useEffect(() => {
    if (!inGame) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        inputRef?.current?.("start", true);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [inGame, inputRef]);
  const send: Handler = (key, down) => {
    if (inGame) inputRef?.current?.(key, down);
    else onMenuInput(key, down);
  };
  const button = (key: ArcadeKey, label: string, glyph: string) => <button key={key} className={styles[key]} type="button" aria-label={label}
    onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); send(key, true); }}
    onPointerUp={() => send(key, false)} onPointerCancel={() => send(key, false)} onLostPointerCapture={() => send(key, false)}
    onClick={event => { if (event.detail === 0) { send(key, true); send(key, false); } }}>{glyph}</button>;
  return <div className={styles.controls} aria-label="Handheld controls">
    <div className={styles.dpad} aria-label="Direction pad">{button("up", "Move up", "▲")}{button("left", "Move left", "◀")}<span className={styles.center} />{button("right", "Move right", "▶")}{button("down", "Move down", "▼")}</div>
    <div className={styles.system}><span className={styles.wordmark}>VIGNESWER<span> pocket</span></span><div><button type="button" onClick={onBack}>SELECT</button><button type="button" onClick={() => { send("start", true); send("start", false); }}>START</button></div><small>{hint}</small></div>
    <div className={styles.actions}><span>{button("b", `B: ${actionLabels.b}`, "B")}<small>{actionLabels.b}</small></span><span>{button("a", `A: ${actionLabels.a}`, "A")}<small>{actionLabels.a}</small></span></div>
  </div>;
}
