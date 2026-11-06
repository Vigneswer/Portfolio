
import { useRef, type CSSProperties, type ReactNode } from "react";
import { usePageVisible, usePointerParallax, useReducedMotion } from "../../hooks/use-motion";

/** Text and details are children of each tilted surface, inheriting its depth. */
export function DepthScene({ children, className = "", motion = true, decorative = true, tilt }: {
  children: ReactNode; className?: string; motion?: boolean; decorative?: boolean; tilt?: { x: number; y: number };
}) {
  const stage = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const visible = usePageVisible();
  usePointerParallax(stage, motion && !reducedMotion && visible, 0);
  const tiltStyle: CSSProperties | undefined = tilt ? {
    "--tilt-x": `${tilt.x * 7}px`,
    "--tilt-y": `${tilt.y * 6}px`,
    "--tilt-rx": `${tilt.y * 2}deg`,
    "--tilt-ry": `${tilt.x * 2.5}deg`,
  } as CSSProperties : undefined;
  return <div ref={stage} className={`depth-scene ${className}`} style={tiltStyle} aria-hidden={decorative || undefined}>
    <div className="depth-world">{children}</div>
  </div>;
}
