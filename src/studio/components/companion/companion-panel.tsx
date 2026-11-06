import { portfolioReply } from "../../lib/companion/local-guide";

import { lazy, Suspense } from "react";
import { ArrowLeft, ArrowRight, Gamepad2, MessageCircle, Play, X } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { type PixelPose, PixelSprite } from "./pixel-sprite";
import styles from "./companion-panel.module.css";
import { ArcadeControls, ArcadeInputProvider } from "./arcade-controls";

const CheckoutSprintGame = lazy(() => import("./games/checkout-sprint/checkout-sprint"));
const ProjectTrailGame = lazy(() => import("./games/project-trail/project-trail"));

type Mode = "home" | "games" | "chat" | "run" | "quest" | "stealth";
type ChatMessage = { role: "user" | "assistant"; content: string };

const hello = "Hey, player one.";

export function CompanionPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("home");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [chatOverlay, setChatOverlay] = useState(false);
  const [pose, setPose] = useState<PixelPose>("wave");
  const modeRef = useRef(mode);
  const chatOverlayRef = useRef(chatOverlay);
  const rootRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<HTMLElement>(null);

  // The launcher keeps this scene mounted until its return-warp animation finishes.
  const close = useCallback(() => onClose(), [onClose]);

  useLayoutEffect(() => {
    modeRef.current = mode;
    chatOverlayRef.current = chatOverlay;
  }, [mode, chatOverlay]);

  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => rootRef.current?.focus());
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!chatOverlayRef.current && (modeRef.current === "run" || (modeRef.current === "quest" || modeRef.current === "stealth"))) return;
        event.preventDefault();
        if (chatOverlayRef.current) setChatOverlay(false);
        else if (modeRef.current === "run" || (modeRef.current === "quest" || modeRef.current === "stealth")) setMode("games");
        else if (modeRef.current !== "home") setMode("home");
        else close();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  useLayoutEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) conversation.scrollTop = conversation.scrollHeight;
  }, [messages, busy, mode, chatOverlay]);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (!conversation) return;
    // Keep the newest bubble visible after font loading and viewport/keyboard resizing.
    const observer = new ResizeObserver(() => { conversation.scrollTop = conversation.scrollHeight; });
    observer.observe(conversation);
    if (conversation.lastElementChild) observer.observe(conversation.lastElementChild);
    return () => observer.disconnect();
  }, [messages, busy, mode, chatOverlay]);

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    const history = messages.slice(-14);
    const alignedHistory = history[0]?.role === "assistant" ? history.slice(1) : history;
    const next = [...alignedHistory, { role: "user" as const, content: text }];
    setMessages(next);
    setDraft("");
    setNotice("");
    setBusy(true);
    setPose("think");
    try {
      const result = { reply: portfolioReply(text) };
      const updated = [...next, { role: "assistant" as const, content: result.reply }].slice(-16);
      setMessages(updated);
      setPose("talk");
    } catch (error) {
      setMessages(messages);
      setDraft(text);
      setPose("idle");
      setNotice(error instanceof Error ? error.message : "Chat is temporarily unavailable. Your draft is saved.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (pose !== "talk" && pose !== "celebrate" && pose !== "wave") return;
    const latestMessage = messages.at(-1);
    const explanationLength = latestMessage?.role === "assistant" ? latestMessage.content.length : 0;
    const duration = pose === "talk" ? Math.min(14000, Math.max(4500, explanationLength * 35)) : pose === "celebrate" ? 1900 : 2800;
    const timer = window.setTimeout(() => setPose("idle"), duration);
    return () => window.clearTimeout(timer);
  }, [pose, messages]);

  const onComposerKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") inputRef.current?.blur();
  };

  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab" || !rootRef.current) return;
    const focusable = [...rootRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')].filter(element => element.getAttribute("aria-hidden") !== "true" && !element.closest("[inert]") && element.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  if (!open) return null;

  const inGame = mode === "run" || mode === "quest" || mode === "stealth";
  const compactArcadeChrome = inGame || mode === "chat";
  const openChat = () => { setMode(inGame ? mode : "chat"); setChatOverlay(inGame); setNotice(""); setTimeout(() => inputRef.current?.focus(), 50); };
  const endChat = () => {
    setNotice("");
    setChatOverlay(false);
    if (inGame) {
      requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('[aria-label="Pause and chat with Vigneswer"], [aria-label="Chat with Vigneswer"]')?.focus());
      return;
    }
    setMode("home");
  };

  return (
    <ArcadeInputProvider><div className={styles.backdrop} onMouseDown={event => { if (event.target === event.currentTarget && !inGame) close(); }}>
      <section ref={rootRef} className={`${styles.panel} ${inGame ? styles.gamePanel : ""} ${(mode === "chat" || chatOverlay) ? styles.chatPanel : ""}`} role="dialog" aria-modal="true" aria-label={compactArcadeChrome ? "Vigneswer arcade" : undefined} aria-labelledby={!compactArcadeChrome ? "pixel-title" : undefined} tabIndex={-1} onKeyDown={trapFocus}>
        <header className={styles.consoleHeader}>
          <div><span className={styles.powerLed} aria-hidden="true" /><strong id="companion-title">{mode === "run" ? "Checkout Sprint" : mode === "quest" ? "Project Trail" : mode === "stealth" ? "Order Dash" : "Vigneswer pocket"}</strong></div>
          <nav aria-label="Console menu">
            {mode !== "home" && <button type="button" onClick={() => { setChatOverlay(false); setMode(inGame ? "games" : "home"); }} aria-label="Back to arcade"><ArrowLeft size={17} /></button>}
            {inGame && <button type="button" onClick={openChat} aria-label="Chat with Vigneswer"><MessageCircle size={17} /></button>}
            <button type="button" onClick={close} aria-label="Close Vigneswer"><X size={18} /></button>
          </nav>
        </header>
        <Suspense fallback={<div className="arcade-loading" role="status">Loading game…</div>}><div className={styles.consoleScreen}>


        {mode === "home" && <main className={styles.home}>
          <div className={styles.homeStage}>
            <div className={styles.greetingBubble}>{hello}<i aria-hidden="true" /></div>
            <PixelSprite pose="wave" className={styles.homeCharacter} />
            <span className={styles.pixelGround} />
            <span className={styles.homeCloud} aria-hidden="true">✦</span>
          </div>
          <div className={styles.homeCopy}>
            <p className={styles.kicker}>Player one · ready</p>
            <h1>Pixel Arcade</h1>
            <p className={styles.subhead}>Pick a way to hang out.</p>
            <div className={styles.homeChoices} data-arcade-menu>
              <button className={styles.primaryChoice} type="button" onClick={openChat}><span className={styles.choiceIcon}><MessageCircle size={21} /></span><span><strong>Chat</strong><small>Ask Vigneswer</small></span><ArrowRight size={18} /></button>
              <button className={styles.secondaryChoice} type="button" onClick={() => setMode("games")}><span className={styles.choiceIcon}><Gamepad2 size={21} /></span><span><strong>Play</strong><small>Choose a game</small></span><ArrowRight size={18} /></button>
            </div>
            <span className={styles.disclosure}>A local guide to Vigneswer’s portfolio.</span>
          </div>
        </main>}

        {mode === "games" && <main className={styles.chooser}>
          <div className={styles.chooserIntro}><p className={styles.kicker}>Player one · choose a game</p><h1>Pick your game</h1><p>Choose your next run.</p><PixelSprite pose="idle" className={styles.chooserCharacter} /></div>
          <div className={styles.gameCards} data-arcade-menu>
            <button className={styles.gameCardRun} type="button" onClick={() => setMode("run")}><span className={styles.gamePreviewRun}><span className={styles.sunBlock} /><span className={styles.hillBack} /><PixelSprite pose="run" className={styles.previewCharacter} decorative /><span className={styles.groundBlocks} /></span><span className={styles.gameCardCopy}><strong>Checkout Sprint</strong><small>Run · jump · collect</small><span className={styles.gameStart}>Start game <ArrowRight size={15} /></span></span></button>
            <button className={styles.gameCardQuest} type="button" onClick={() => setMode("quest")}><span className={styles.gamePreviewQuest}><span className={styles.questWater} /><span className={styles.questPath} /><span className={styles.questPalm}>♣</span><PixelSprite pose="idle" className={styles.questPreviewCharacter} decorative /><span className={styles.questHouse}>⌂</span></span><span className={styles.gameCardCopy}><strong>Project Trail</strong><small>Explore · discover · collect</small><span className={styles.gameStart}>Start game <ArrowRight size={15} /></span></span></button>
            <button className={styles.gameCardRun} type="button" onClick={() => setMode("stealth")}><span className={`${styles.gamePreviewRun} ${styles.rooftopPreview}`}><span className={styles.sunBlock} /><span className={styles.rooftops} /><PixelSprite pose="run" className={styles.previewCharacter} decorative /></span><span className={styles.gameCardCopy}><strong>Order Dash</strong><small>Sneak · leap · escape</small><span className={styles.gameStart}>Start game <ArrowRight size={15} /></span></span></button>
          </div>
          <button className={styles.chatFromGames} type="button" onClick={openChat}><MessageCircle size={17} /> Chat with me instead</button>
        </main>}

        {(mode === "chat" || chatOverlay) && <main className={`${styles.arcadeChat} ${chatOverlay ? styles.arcadeChatOverlay : ""}`}>
          <header className={styles.dialogueHeader}>
            <div><h1>Chat with Vigneswer</h1><span>Your local portfolio guide</span></div>
            {chatOverlay && <button type="button" className={styles.returnToGame} onClick={endChat}><Play size={13} fill="currentColor" /> Resume game</button>}
          </header>
          <section ref={conversationRef} className={styles.dialogueLog} aria-label="Conversation" role="log" aria-live="polite" aria-relevant="additions" aria-busy={busy} tabIndex={0}>
            {messages.length === 0 && <>
              <article className={`${styles.dialogueBubble} ${styles.companionBubble}`}><span className={styles.dialogueSpeaker}>Vigneswer</span><p>Hey, player one! Ask me about my projects, skills, or experience.</p></article>
              <div className={styles.dialogueStarters} aria-label="Suggested questions">
                <button type="button" onClick={() => { setDraft("What is the Petition Platform?"); inputRef.current?.focus(); }}>What is the Petition Platform?</button>
                <button type="button" onClick={() => { setDraft("What are you building at Druvino Systems?"); inputRef.current?.focus(); }}>What are you building?</button>
              </div>
            </>}
            {messages.map((message, index) => <article className={`${styles.dialogueBubble} ${message.role === "user" ? styles.playerBubble : styles.companionBubble}`} key={`${index}-${message.role}`}>
              <span className={styles.dialogueSpeaker}>{message.role === "user" ? "You" : "Vigneswer"}</span><p>{message.content}</p>
            </article>)}
            {busy && <article className={`${styles.dialogueBubble} ${styles.companionBubble} ${styles.pendingBubble}`}><span className={styles.dialogueSpeaker}>Vigneswer</span><p>Thinking<span className={styles.thinkingDots} aria-hidden="true">...</span></p></article>}
          </section>
          <div className={styles.dialogueStage}>
            <span className={styles.dialoguePlatform} aria-hidden="true" />
            <PixelSprite pose={busy ? "think" : pose} className={styles.dialogueStageCharacter} />
          </div>
          <div className={styles.dialogueComposerArea}>
            {notice && <p className={styles.dialogueNotice} role="alert">{notice}</p>}
            <form className={styles.pixelComposer} onSubmit={sendMessage}>
              <label className={styles.inputPrompt} htmlFor="pixel-message"><span aria-hidden="true">&gt;</span><span className={styles.visuallyHidden}>Message Vigneswer</span></label>
              <input id="pixel-message" ref={inputRef} value={draft} onChange={event => { setDraft(event.target.value); if (notice) setNotice(""); }} onKeyDown={onComposerKeyDown} maxLength={500} placeholder="Type your message..." autoComplete="off" disabled={busy} />
              <button className={styles.pixelSend} type="submit" disabled={!draft.trim() || busy} aria-label="Send message"><span>Send</span><span aria-hidden="true">▶</span></button>
            </form>
            <div className={styles.composerMeta}><span>{busy ? "Waiting for a reply..." : "Enter to send"}</span><span>{draft.length}/500</span></div>
          </div>
        </main>}


        {mode === "run" && <div className={styles.gameWrap} inert={chatOverlay}><CheckoutSprintGame immersive chatOpen={chatOverlay} onBack={() => setMode("games")} onChat={openChat} onClose={close} /></div>}
        {mode === "quest" && <div className={styles.gameWrap} inert={chatOverlay}><ProjectTrailGame immersive chatOpen={chatOverlay} onBack={() => setMode("games")} onChat={openChat} onClose={close} /></div>}
        {mode === "stealth" && <div className={styles.gameWrap} inert={chatOverlay}><CheckoutSprintGame key="stealth" variant="stealth" immersive chatOpen={chatOverlay} onBack={() => setMode("games")} onChat={openChat} onClose={close} /></div>}
        </div>
        </Suspense>
        {mode !== "chat" && !chatOverlay && <ArcadeControls inGame={inGame} actionLabels={mode === "quest" ? { a: "Talk", b: "Back" } : mode === "stealth" ? { a: "Jump", b: "Sneak" } : mode === "run" ? { a: "Jump", b: "Jump" } : { a: "Choose", b: "Back" }} hint={mode === "quest" ? "A: talk · B: back" : mode === "stealth" ? "A: jump · B: sneak" : mode === "run" ? "A / B: jump" : "A: choose · B: back"} onBack={() => setMode(inGame ? "games" : "home")} onMenuInput={(key, down) => {
          if (!down) return;
          const buttons = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[data-arcade-menu] button') ?? []);
          const index = buttons.findIndex(button => button === document.activeElement);
          if (key === "b") { setMode("home"); return; }
          if (key === "a" || key === "start") { (buttons[index] ?? buttons[0])?.click(); return; }
          const step = key === "left" || key === "up" ? -1 : 1;
          const current = index < 0 && step < 0 ? 0 : index;
          buttons[(current + step + buttons.length) % buttons.length]?.focus();
        }} />}
      </section>
    </div></ArcadeInputProvider>
  );
}
