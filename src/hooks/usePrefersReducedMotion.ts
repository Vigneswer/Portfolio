import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * Live-reactive reduced-motion flag. Components use this to render a composed
 * *static* frame rather than a frozen mid-animation state — a paused animation
 * usually looks broken, whereas a deliberate still frame reads as designed.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true, // SSR/first paint: assume reduced, upgrade after hydration.
  );
}
