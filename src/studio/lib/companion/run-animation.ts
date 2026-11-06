/** Complete image-generated poses. Each draw copies one intact sprite cell.
 * No limbs are assembled, rotated, stretched, or procedurally repositioned.
 * Atlas: four columns, three rows; eight running poses followed by four jump poses.
 */
export const RUN_ATLAS = '/studio/vignesh/character/vignesh-motion-frames-v2.png';
export const RUN_FRAME_COUNT = 8;
export const RUN_FRAME_MS = 85;
export type MotionState = { action: 'run' | 'jump' | 'land'; velocityY?: number; landingProgress?: number };

export function motionFrame(time: number, reducedMotion = false, motion: MotionState = { action: 'run' }) {
  if (motion.action === 'land') return 11;
  if (motion.action === 'jump') {
    const velocity = motion.velocityY ?? 0;
    return velocity < -180 ? 8 : velocity > 160 ? 10 : 9;
  }
  return reducedMotion ? 1 : Math.floor(Math.max(0, time) / RUN_FRAME_MS) % RUN_FRAME_COUNT;
}

export function drawRunningSprite(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | null, time: number, x: number, bottom: number, size: number, facing = 1, reducedMotion = false, motion: MotionState = { action: 'run' }) {
  if (!atlas?.complete || !atlas.naturalWidth) return false;
  const frame = motionFrame(time, reducedMotion, motion);
  const cellWidth = atlas.naturalWidth / 4;
  const cellHeight = atlas.naturalHeight / 3;
  const width = size * cellWidth / cellHeight;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, bottom);
  ctx.scale(facing < 0 ? -1 : 1, 1);
  ctx.drawImage(atlas, frame % 4 * cellWidth, Math.floor(frame / 4) * cellHeight, cellWidth, cellHeight, -width / 2, -size, width, size);
  ctx.restore();
  return true;
}
