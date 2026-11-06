/** Every frame is a complete generated drawing; timing only selects atlas cells. */
export const FRONT_SOCIAL_ATLAS = '/studio/vignesh/character/vignesh-front-social-v2.png';
export const FRONT_MOVEMENT_ATLAS = '/studio/vignesh/character/vignesh-front-movement-v2.png';
export type FrontPose = 'idle' | 'wave' | 'talk' | 'celebrate' | 'listen' | 'think' | 'walkFront' | 'walkBack';
type PoseDefinition = { atlas: string; row: number; durations: readonly number[]; rest: number };
export const FRONT_POSES: Record<FrontPose, PoseDefinition> = {
  idle: { atlas: FRONT_SOCIAL_ATLAS, row: 0, durations: [1800, 650, 120, 1100], rest: 0 },
  wave: { atlas: FRONT_SOCIAL_ATLAS, row: 1, durations: [320, 180, 180, 850], rest: 0 },
  talk: { atlas: FRONT_SOCIAL_ATLAS, row: 2, durations: [260, 180, 160, 400], rest: 0 },
  celebrate: { atlas: FRONT_SOCIAL_ATLAS, row: 3, durations: [180, 180, 300, 280], rest: 1 },
  listen: { atlas: FRONT_MOVEMENT_ATLAS, row: 0, durations: [900, 550, 170, 700], rest: 0 },
  think: { atlas: FRONT_MOVEMENT_ATLAS, row: 1, durations: [850, 650, 600, 650], rest: 0 },
  walkFront: { atlas: FRONT_MOVEMENT_ATLAS, row: 2, durations: [160, 120, 160, 120], rest: 1 },
  walkBack: { atlas: FRONT_MOVEMENT_ATLAS, row: 3, durations: [160, 120, 160, 120], rest: 1 },
};
export function frontFrame(pose: FrontPose, time: number, still = false) {
  const definition = FRONT_POSES[pose];
  if (still) return definition.row * 4 + definition.rest;
  let remaining = Math.max(0, time) % definition.durations.reduce((a, b) => a + b, 0);
  for (let column = 0; column < 4; column++) {
    if (remaining < definition.durations[column]) return definition.row * 4 + column;
    remaining -= definition.durations[column];
  }
  return definition.row * 4;
}
export function drawFrontSprite(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | null, pose: FrontPose, time: number, x: number, bottom: number, size: number, still = false) {
  if (!atlas?.complete || !atlas.naturalWidth) return false;
  const frame = frontFrame(pose, time, still);
  const cw = atlas.naturalWidth / 4, ch = atlas.naturalHeight / 4;
  const width = size * cw / ch;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas, frame % 4 * cw, Math.floor(frame / 4) * ch, cw, ch, x - width / 2, bottom - size, width, size);
  ctx.restore();
  return true;
}
