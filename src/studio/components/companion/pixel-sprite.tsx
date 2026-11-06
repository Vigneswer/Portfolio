
import { useEffect, useRef } from "react";
import { drawRunningSprite, RUN_ATLAS } from "../../lib/companion/run-animation";
import { drawFrontSprite, FRONT_POSES, type FrontPose } from "../../lib/companion/front-animation";
import styles from "./pixel-sprite.module.css";

export type PixelPose = FrontPose | "run" | "jump";
const labels: Record<PixelPose, string> = {
  idle: "standing", wave: "waving", run: "running", jump: "jumping", listen: "listening",
  think: "thinking", talk: "gesturing", celebrate: "celebrating", walkFront: "walking toward you", walkBack: "walking away",
};

export function PixelSprite({ pose = "idle", className = "", decorative = false, paused = false }: { pose?: PixelPose; className?: string; decorative?: boolean; paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    let request = 0, elapsed = 0, previous = 0;
    let disposed = false;
    const atlas = new Image();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isSide = pose === "run" || pose === "jump";
    const draw = (now: number) => {
      if (disposed) return;
      const still = motion.matches || paused;
      if (previous && !still && !document.hidden) elapsed += Math.min(now - previous, 80);
      previous = now;
      context.clearRect(0, 0, 192, 192);
      if (isSide) {
        const progress = elapsed % 1200 / 1200;
        const airborne = pose === "jump" && progress < .8;
        const lift = airborne && !still ? Math.sin(progress / .8 * Math.PI) * 28 : 0;
        drawRunningSprite(context, atlas, elapsed, 96, 184 - lift, pose === "jump" ? 145 : 180, 1, still, { action: airborne ? "jump" : pose === "jump" ? "land" : "run", velocityY: (progress / .8 - .5) * 1200, landingProgress: (progress - .8) / .2 });
      } else {
        drawFrontSprite(context, atlas, pose, elapsed, 96, 184, 180, still);
      }
      if (!still && !document.hidden) request = requestAnimationFrame(draw);
    };
    const sync = () => { cancelAnimationFrame(request); previous = 0; draw(performance.now()); };
    atlas.onload = sync;
    atlas.src = isSide ? RUN_ATLAS : FRONT_POSES[pose].atlas;
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => { disposed = true; atlas.onload = null; cancelAnimationFrame(request); motion.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, [pose, paused]);
  return <canvas ref={canvasRef} width={192} height={192} className={`${styles.sprite} ${className}`} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : `Vigneswer ${labels[pose]}`} aria-hidden={decorative || undefined} data-pose={pose} />;
}
