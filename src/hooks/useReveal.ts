import { useEffect, useRef, useState } from "react";

/**
 * Intersection-observer reveal. Fires once, then disconnects — no scroll
 * listener, no re-observing, nothing left running after the element has done
 * its job.
 *
 * `rootMargin` pulls the trigger line up from the true viewport bottom so the
 * reveal has finished by the time the element is comfortably in view, rather
 * than animating under the user's nose.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  rootMargin = "0px 0px -12% 0px",
) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.05 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, shown };
}

/**
 * Stagger built from a seeded pseudo-random offset rather than `index * step`.
 * Uniform stagger reads mechanical; a small deterministic jitter on top of the
 * ordered delay makes a group feel like it's arriving rather than marching.
 */
export function staggerDelay(index: number, step = 0.055, jitter = 0.03) {
  const seeded = Math.sin(index * 12.9898) * 43758.5453;
  const noise = (seeded - Math.floor(seeded)) * jitter;
  return index * step + noise;
}
