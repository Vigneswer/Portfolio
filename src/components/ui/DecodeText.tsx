import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

const GLYPHS = "▓▒░<>/\\|=+*#%@abcdef0123456789";

/**
 * Text that resolves out of glyph noise, left to right — the site's labels
 * arrive the way its terminal output does. Runs once when the element first
 * enters the viewport (or on mount), then leaves the real string in the DOM.
 *
 * The scramble swaps characters inside a fixed-length string, so layout never
 * shifts. Screen readers only ever see the final text via aria-label.
 */
export function DecodeText({
  text,
  className,
  duration = 0.9,
  trigger = "view",
}: {
  text: string;
  className?: string;
  duration?: number;
  trigger?: "view" | "mount";
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(reduced ? text : "");
  const started = useRef(false);

  useEffect(() => {
    if (reduced) {
      setDisplay(text);
      return;
    }

    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const run = () => {
      if (started.current) return;
      started.current = true;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - t0) / (duration * 1000), 1);
        // Sharp left-to-right resolve front with a short noisy band behind it.
        const front = Math.floor(p * (text.length + 4));
        let out = "";
        for (let i = 0; i < text.length; i++) {
          if (text[i] === " ") out += " ";
          else if (i < front - 4) out += text[i];
          else if (i < front)
            out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          else out += " ";
        }
        setDisplay(p >= 1 ? text : out);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    if (trigger === "mount") {
      run();
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, duration, trigger, reduced]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">{display || " "}</span>
    </span>
  );
}
