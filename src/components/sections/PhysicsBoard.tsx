import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Project } from "../../content/profile";
import { useMagnetic } from "../../hooks/useMagnetic";
import { DecodeText } from "../ui/DecodeText";

type Props = {
  projects: Project[];
  onOpen: (id: string, from?: DOMRect) => void;
};

/**
 * Draggable, throwable project cards with real collision and momentum.
 *
 * The bodies live in Matter.js but the *cards are real DOM* — each one is a
 * focusable <button> that a rAF loop positions from its body's transform. That
 * means the physics is genuinely tactile for pointer users while the section
 * stays a plain, tabbable list of buttons for keyboard and screen-reader users,
 * which a canvas-rendered version could never be.
 *
 * matter-js is imported dynamically so ~90kB of engine never touches the
 * hero's critical path — it loads when this section first scrolls into view.
 */
export function PhysicsBoard({ projects, onOpen }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  // Magnetic so the button leans toward the cursor before it is even clicked.
  const resetBtnRef = useMagnetic<HTMLButtonElement>(0.3, 55);
  // Every press winds the icon another full turn.
  const [spins, setSpins] = useState(0);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  const resetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const Matter = await import("matter-js");
      if (disposed) return;

      const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Body, Events } =
        Matter;

      const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 } });
      const runner = Runner.create();

      let width = scene.clientWidth;
      let height = scene.clientHeight;

      const WALL = 200; // Thick walls so fast throws can't tunnel through.
      const wallOpts = { isStatic: true, restitution: 0.4, friction: 0.4 };

      let walls = [
        Bodies.rectangle(width / 2, height + WALL / 2, width * 3, WALL, wallOpts),
        Bodies.rectangle(-WALL / 2, height / 2, WALL, height * 3, wallOpts),
        Bodies.rectangle(width + WALL / 2, height / 2, WALL, height * 3, wallOpts),
        // Ceiling sits far above so cards can be flung up and fall back in.
        Bodies.rectangle(width / 2, -height - WALL / 2, width * 3, WALL, wallOpts),
      ];
      Composite.add(engine.world, walls);

      const cards = cardRefs.current.filter(Boolean) as HTMLButtonElement[];

      const makeBodies = () =>
        cards.map((el, i) => {
          const w = el.offsetWidth;
          const h = el.offsetHeight;
          const body = Bodies.rectangle(
            width * (0.22 + (i % 3) * 0.28),
            -160 - i * 190, // Stagger the drop so they cascade in.
            w,
            h,
            {
              restitution: 0.42,
              friction: 0.28,
              frictionAir: 0.012,
              density: 0.0014,
              chamfer: { radius: 2 },
            },
          );
          Body.setAngle(body, (Math.random() - 0.5) * 0.5);
          return body;
        });

      let bodies = makeBodies();
      Composite.add(engine.world, bodies);

      /* --- Pointer control -------------------------------------------------
         Matter's default touch handling calls preventDefault on every
         touchmove, which would trap the page scroll inside this section on
         mobile. We unbind it and only forward the event while a card is
         actually grabbed, so a plain swipe still scrolls the page. */
      const mouse = Mouse.create(scene);
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0.16, damping: 0.06, render: { visible: false } },
      });
      Composite.add(engine.world, mouseConstraint);

      const nativeTouchMove = (mouse as unknown as { mousemove: (e: Event) => void })
        .mousemove;
      scene.removeEventListener("touchmove", nativeTouchMove);
      const guardedTouchMove = (e: Event) => {
        if (mouseConstraint.body) nativeTouchMove(e);
      };
      scene.addEventListener("touchmove", guardedTouchMove, { passive: false });

      // Matter's wheel capture would otherwise swallow scroll over the board.
      const nativeWheel = (mouse as unknown as { mousewheel: (e: Event) => void })
        .mousewheel;
      scene.removeEventListener("wheel", nativeWheel);

      // Distinguish a click from a throw, so dragging never opens a case study.
      let downAt = 0;
      let downPos = { x: 0, y: 0 };
      Events.on(mouseConstraint, "mousedown", () => {
        downAt = performance.now();
        downPos = { ...mouse.position };
      });
      Events.on(mouseConstraint, "mouseup", () => {
        const dt = performance.now() - downAt;
        const moved = Math.hypot(
          mouse.position.x - downPos.x,
          mouse.position.y - downPos.y,
        );
        if (dt < 260 && moved < 6) {
          const hit = bodies.findIndex((b) => {
            const v = b.vertices;
            return Matter.Vertices.contains(v, mouse.position);
          });
          if (hit >= 0)
            onOpen(projects[hit].id, cards[hit]?.getBoundingClientRect());
        }
      });

      /* --- DOM sync ------------------------------------------------------- */
      let raf = 0;
      let running = false;

      const syncOnce = () => {
        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i];
          const el = cards[i];
          if (!el) continue;
          el.style.transform = `translate3d(${b.position.x - el.offsetWidth / 2}px, ${
            b.position.y - el.offsetHeight / 2
          }px, 0) rotate(${b.angle}rad)`;
        }
      };

      /* Cursor light, lerped toward the pointer inside the existing loop
         rather than on its own rAF — the board already runs a frame loop, so
         this costs two multiplies. */
      const glow = glowRef.current;
      let gx = 0;
      let gy = 0;
      let gtx = 0;
      let gty = 0;

      const onGlowMove = (e: PointerEvent) => {
        const r = scene.getBoundingClientRect();
        gtx = e.clientX - r.left;
        gty = e.clientY - r.top;
        if (glow) glow.style.opacity = "1";
        start();
      };
      const onGlowLeave = () => {
        if (glow) glow.style.opacity = "0";
      };
      scene.addEventListener("pointermove", onGlowMove, { passive: true });
      scene.addEventListener("pointerleave", onGlowLeave);

      const loop = () => {
        syncOnce();
        if (glow) {
          gx += (gtx - gx) * 0.12;
          gy += (gty - gy) * 0.12;
          glow.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`;
        }
        raf = requestAnimationFrame(loop);
      };

      const start = () => {
        if (running) return;
        running = true;
        Runner.run(runner, engine);
        raf = requestAnimationFrame(loop);
      };
      const stop = () => {
        if (!running) return;
        running = false;
        Runner.stop(runner);
        cancelAnimationFrame(raf);
      };

      // Place the cards at their start positions, but *don't* simulate yet —
      // the IntersectionObserver below starts the engine the first time the
      // board is actually on screen, so the drop cascade is something the user
      // sees rather than something that already happened above the fold.
      syncOnce();
      setReady(true);

      /* --- Reset ----------------------------------------------------------- */
      resetRef.current = () => {
        bodies.forEach((b, i) => {
          Body.setPosition(b, {
            x: width * (0.22 + (i % 3) * 0.28),
            y: -160 - i * 190,
          });
          Body.setVelocity(b, { x: 0, y: 0 });
          Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.16);
          Body.setAngle(b, (Math.random() - 0.5) * 0.5);
        });
        syncOnce();
      };

      /* --- Resize ---------------------------------------------------------- */
      const ro = new ResizeObserver(() => {
        const w = scene.clientWidth;
        const h = scene.clientHeight;
        if (w === width && h === height) return;
        width = w;
        height = h;

        Composite.remove(engine.world, walls);
        walls = [
          Bodies.rectangle(width / 2, height + WALL / 2, width * 3, WALL, wallOpts),
          Bodies.rectangle(-WALL / 2, height / 2, WALL, height * 3, wallOpts),
          Bodies.rectangle(width + WALL / 2, height / 2, WALL, height * 3, wallOpts),
          Bodies.rectangle(width / 2, -height - WALL / 2, width * 3, WALL, wallOpts),
        ];
        Composite.add(engine.world, walls);
        resetRef.current?.();
      });
      ro.observe(scene);

      // Only simulate while the board is on screen and the tab is focused.
      const io = new IntersectionObserver(
        ([e]) => (e.isIntersecting && !document.hidden ? start() : stop()),
        { threshold: 0 },
      );
      io.observe(scene);

      const onVisibility = () => {
        if (document.hidden) stop();
      };
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        stop();
        ro.disconnect();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        scene.removeEventListener("touchmove", guardedTouchMove);
        scene.removeEventListener("pointermove", onGlowMove);
        scene.removeEventListener("pointerleave", onGlowLeave);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [projects, onOpen]);

  return (
    <div className="relative">
      <div
        ref={sceneRef}
        data-cursor-label="drag"
        className="relative h-[26rem] w-full touch-pan-y overflow-hidden border border-ink/15 bg-paper-deep/40 sm:h-[30rem]"
      >
        {/* Cursor light. Follows the pointer across the board on its own
            spring, so the surface the cards land on reacts too — without it
            the backdrop reads as dead space around live objects. */}
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full opacity-0 transition-opacity duration-500 will-change-transform"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--signal) 34%, transparent), transparent 68%)",
          }}
        />

        {/* Drafting surface. A single flat mesh reads as filler; a minor grid
            under a heavier major grid every fifth line gives the board a sense
            of scale, and the radial mask keeps the edges quiet so the cards
            stay the subject. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "linear-gradient(to right, color-mix(in srgb, var(--color-ink) 6%, transparent) 1px, transparent 1px)",
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-ink) 6%, transparent) 1px, transparent 1px)",
              "linear-gradient(to right, color-mix(in srgb, var(--color-ink) 12%, transparent) 1px, transparent 1px)",
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-ink) 12%, transparent) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "28px 28px, 28px 28px, 140px 140px, 140px 140px",
            maskImage:
              "radial-gradient(ellipse 78% 78% at 50% 45%, #000 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 78% 78% at 50% 45%, #000 40%, transparent 100%)",
          }}
        />

        {/* Measurement ticks along the top edge — the detail that makes it read
            as a drawing surface rather than graph paper. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-3 opacity-70"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, color-mix(in srgb, var(--color-ink) 22%, transparent) 0 1px, transparent 1px 28px)",
          }}
        />

        {/* Corner brackets — crop marks around the play area. */}
        {[
          "left-3 top-3 border-l-2 border-t-2",
          "right-3 top-3 border-r-2 border-t-2",
          "left-3 bottom-3 border-b-2 border-l-2",
          "right-3 bottom-3 border-b-2 border-r-2",
        ].map((pos) => (
          <span
            key={pos}
            aria-hidden="true"
            className={`absolute h-4 w-4 border-ink/30 ${pos}`}
          />
        ))}

        {/* The floor the cards come to rest on, drawn so the pile has a line to
            sit against instead of just stopping. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, color-mix(in srgb, var(--color-ink) 30%, transparent) 0 6px, transparent 6px 12px)",
          }}
        />

        <ul className="contents">
          {projects.map((p, i) => (
            <li key={p.id} className="contents">
              <button
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                type="button"
                onClick={(e) => onOpen(p.id, e.currentTarget.getBoundingClientRect())}
                data-cursor-label="open"
                style={{ opacity: ready ? 1 : 0 }}
                className="absolute left-0 top-0 w-[15rem] cursor-grab select-none border border-ink bg-paper p-4 text-left shadow-[4px_4px_0_0_var(--color-ink)] transition-opacity duration-500 will-change-transform active:cursor-grabbing sm:w-[17rem]"
              >
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="type-label text-ink-faint">{p.index}</span>
                  <span className="type-label text-ink-faint">{p.year}</span>
                </div>
                <h3 className="type-display-tight mb-2 text-xl leading-tight text-ink">
                  {p.name}
                </h3>
                <p className="type-body text-[0.8125rem] text-ink-soft">{p.blurb}</p>
                <span
                  className="mt-3 inline-block px-1.5 py-0.5 text-[0.625rem] tracking-[0.18em] uppercase"
                  style={{ backgroundColor: "var(--signal)" }}
                >
                  case study →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="type-label text-ink-faint">
          <DecodeText text="drag them · throw them · click to open" />
        </p>

        <div className="relative shrink-0">
          {/* Ping ring. Fires on a long cycle so the button catches the eye in
              peripheral vision without ever nagging — the previous outline
              button simply disappeared into the page. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[1px] border motion-safe:animate-[ping-out_4.5s_cubic-bezier(0,0,0.2,1)_infinite]"
            style={{ borderColor: "var(--signal)" }}
          />

          <button
            ref={resetBtnRef}
            type="button"
            onClick={() => {
              setSpins((n) => n + 1);
              resetRef.current?.();
            }}
            className="group relative block overflow-hidden border-2 border-ink bg-paper px-5 py-2.5 shadow-[3px_3px_0_0_var(--color-ink)] transition-[box-shadow,transform] duration-200 hover:shadow-[5px_5px_0_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)]"
          >
            {/* Signal fill wipes in from the left on hover. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full transition-transform duration-300 ease-[var(--ease-snap)] group-hover:translate-x-0"
              style={{ backgroundColor: "var(--signal)" }}
            />

            {/* Periodic sheen — idle for most of the cycle, then a quick sweep. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 motion-safe:animate-[sheen_6s_ease-in-out_infinite]"
              style={{
                background:
                  "linear-gradient(105deg, transparent 35%, color-mix(in srgb, var(--signal) 70%, transparent) 50%, transparent 65%)",
              }}
            />

            <span className="type-label relative flex items-center gap-2 text-ink">
              <motion.span
                aria-hidden="true"
                animate={{ rotate: spins * -360 }}
                transition={{ type: "spring", stiffness: 180, damping: 18 }}
                className="inline-block text-[0.875rem] leading-none"
              >
                ↻
              </motion.span>
              drop again
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
