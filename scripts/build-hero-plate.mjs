import sharp from "sharp";

/**
 * Builds public/hero-portrait.jpg — the plate behind the opening ScrollExpand.
 *
 * One-off asset step, not part of the app build. To re-run after changing the
 * source photo or the framing constants:
 *
 *     npm i -D sharp && node scripts/build-hero-plate.mjs
 *
 * sharp is intentionally NOT a saved dependency; it's ~30MB of native binaries
 * for something that runs once.
 *
 * ScrollExpand cover-fits the media to the whole stage, so a tall 2:3 headshot
 * gets upscaled ~1.8x on a 16:9 viewport and the resting window becomes a
 * peephole onto one eye.
 *
 * Fix the source instead of the frame: build a 16:9 plate that already matches
 * the full-bleed aspect, with the sharp portrait sitting on a heavily blurred
 * extension of itself so the fill is seamless rather than a flat colour seam.
 */

const SRC = "/Users/druvinosystems/Documents/portfolio/Vigneswer_Photo.png.jpg";
const OUT = "/Users/druvinosystems/Documents/portfolio/public/hero-portrait.jpg";

const W = 2400;
const H = 1350;
// Sized and seated high on purpose: the lower ~26% of the plate is left as
// clear dark field so the full-bleed overlay copy has somewhere to sit that
// isn't across the face.
const PORTRAIT_H = 830;
const PORTRAIT_TOP = 215;

/* Pushed down to near-ink and desaturated. A merely blurred fill reads as a
   mistake — the sharp/blur seam looks accidental. Dropped this far it becomes
   a dark stage the portrait is deliberately lit against, and it matches the
   site's ink tone so the full-bleed state belongs to the same design. */
const backdrop = await sharp(SRC)
  .resize(W, H, { fit: "cover", position: "top" })
  .blur(64)
  .modulate({ saturation: 0.3, brightness: 0.3 })
  .toBuffer();

const portrait = await sharp(SRC)
  .resize({ height: PORTRAIT_H })
  .toBuffer();

const { width: pw, height: ph } = await sharp(portrait).metadata();

await sharp(backdrop)
  .composite([
    {
      input: portrait,
      left: Math.round((W - pw) / 2),
      top: PORTRAIT_TOP,
    },
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`wrote ${OUT} — ${meta.width}x${meta.height}, portrait ${pw}x${ph}`);
