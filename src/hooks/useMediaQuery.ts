import { useSyncExternalStore } from "react";

/**
 * Live-reactive media query flag, same mechanism as usePrefersReducedMotion.
 * Used to *not mount* interactions that only earn their keep on larger
 * viewports (the skills dial, the physics board's pointer light), rather than
 * mounting them and hiding the wreckage with CSS.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
