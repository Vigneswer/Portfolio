import sharp from "sharp";

/**
 * Generates public/opening-plate.jpg — the media inside the opening
 * ScrollExpand frame.
 *
 * It is drawn, not photographed: a flow field of fine strokes on ink, with a
 * signal-lime aperture where the field is disturbed. That is deliberately the
 * same visual language as the live <SignalField> canvas in the hero, so the
 * opening reads as the frozen still and the hero as the interactive version of
 * the same thing.
 *
 * It also solves the framing problem a photograph has here: ScrollExpand's
 * resting window is a small crop of the full-bleed composition, and a
 * generative texture reads well at *any* crop.
 *
 * One-off asset step, not part of the app build:
 *
 *     npm i -D sharp && node scripts/build-opening-plate.mjs
 *
 * sharp is intentionally NOT a saved dependency; it's ~30MB of native binaries
 * for something that runs once.
 */

const OUT = "/Users/druvinosystems/Documents/portfolio/public/opening-plate.jpg";

const W = 2400;
const H = 1350;

// The aperture sits at the centre of the plate because the resting window is
// centred — so it is the first thing visible, and it stays the focal point
// once the frame opens to full bleed.
const CX = W / 2;
const CY = H / 2 - 30;
const CR = 340;

const INK = "#14120F";
const BONE = "#EFEADC";
const SIGNAL = "#C8FF33";

// Deterministic PRNG so the plate is reproducible across runs.
let seed = 20260807;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

/** Layered trig field — the same shape of function the runtime canvas uses. */
const angleAt = (x, y) =>
  Math.sin(x * 0.0016) * 1.6 +
  Math.cos(y * 0.0021) * 1.6 +
  Math.sin((x + y) * 0.0009) * 0.9;

/** Inside the aperture the field gets a swirl, so the disturbance is visible. */
const angleDisturbed = (x, y) => {
  const dx = x - CX;
  const dy = y - CY;
  const d = Math.hypot(dx, dy);
  const swirl = Math.atan2(dy, dx) + Math.PI / 2;
  const t = Math.max(0, 1 - d / (CR * 1.35));
  return angleAt(x, y) * (1 - t) + swirl * t;
};

function stroke(x0, y0, steps, step, disturbed) {
  let x = x0;
  let y = y0;
  const pts = [`${x.toFixed(1)},${y.toFixed(1)}`];
  for (let i = 0; i < steps; i++) {
    const a = disturbed ? angleDisturbed(x, y) : angleAt(x, y);
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    if (x < -40 || x > W + 40 || y < -40 || y > H + 40) break;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.length > 3 ? pts.join(" ") : null;
}

const parts = [];

// Base field across the whole plate.
for (let i = 0; i < 2600; i++) {
  const x = rand() * W;
  const y = rand() * H;
  const d = Math.hypot(x - CX, y - CY);

  // Thin out where the aperture will sit so the lime reads cleanly.
  if (d < CR * 1.1 && rand() < 0.72) continue;

  const pts = stroke(x, y, 26 + Math.floor(rand() * 46), 4.2, false);
  if (!pts) continue;

  const o = (0.05 + rand() * 0.2).toFixed(3);
  const w = (0.5 + rand() * 1.0).toFixed(2);
  parts.push(
    `<polyline points="${pts}" fill="none" stroke="${BONE}" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`,
  );
}

// The aperture: dense, brighter, swirling, clipped to its circle.
const inner = [];
for (let i = 0; i < 1500; i++) {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * CR;
  const pts = stroke(
    CX + Math.cos(a) * r,
    CY + Math.sin(a) * r,
    18 + Math.floor(rand() * 34),
    3.4,
    true,
  );
  if (!pts) continue;

  const o = (0.14 + rand() * 0.55).toFixed(3);
  const w = (0.45 + rand() * 1.15).toFixed(2);
  inner.push(
    `<polyline points="${pts}" fill="none" stroke="${SIGNAL}" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`,
  );
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="aperture"><circle cx="${CX}" cy="${CY}" r="${CR}"/></clipPath>
    <radialGradient id="halo" cx="50%" cy="${((CY / H) * 100).toFixed(1)}%" r="42%">
      <stop offset="0%" stop-color="${SIGNAL}" stop-opacity="0.14"/>
      <stop offset="60%" stop-color="${SIGNAL}" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="${SIGNAL}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
      <stop offset="55%" stop-color="${INK}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0.8"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${INK}"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>
  ${parts.join("\n")}
  <g clip-path="url(#aperture)">${inner.join("\n")}</g>
  <circle cx="${CX}" cy="${CY}" r="${CR}" fill="none" stroke="${SIGNAL}" stroke-opacity="0.28" stroke-width="1.5"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;

// librsvg renders above the nominal size at this density; resampling back down
// both fixes the dimensions and anti-aliases the hairlines, which lets the JPEG
// quality drop a long way without visible artefacts. 855kB -> ~240kB.
await sharp(Buffer.from(svg), { density: 96 })
  .resize(2000, 1125)
  .jpeg({ quality: 72, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`wrote ${OUT} — ${meta.width}x${meta.height}`);

/* ---------------------------------------------------------------------------
   public/heading-fill.jpg — the fill showing through <MaskedHeading>.

   The opening plate cannot double as this. Its aperture sits dead centre, but
   a masked heading cover-fits the fill to a wide, short box and left-aligned
   headings only ever crop the left third — so short ones ("Work") would show
   no signal colour at all while long ones ("Experience") would. Distributing
   several smaller apertures across the width means every heading, at every
   length and viewport, catches some.
--------------------------------------------------------------------------- */

const HW = 2000;
const HH = 420;

const hAngle = (x, y) =>
  Math.sin(x * 0.0022) * 1.5 + Math.cos(y * 0.009) * 1.2 + Math.sin((x + y) * 0.0016) * 0.8;

function hStroke(x0, y0, steps, step) {
  let x = x0;
  let y = y0;
  const pts = [`${x.toFixed(1)},${y.toFixed(1)}`];
  for (let i = 0; i < steps; i++) {
    const a = hAngle(x, y);
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    if (x < -30 || x > HW + 30 || y < -30 || y > HH + 30) break;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.length > 3 ? pts.join(" ") : null;
}

const hBase = [];
for (let i = 0; i < 2200; i++) {
  const pts = hStroke(rand() * HW, rand() * HH, 20 + Math.floor(rand() * 34), 3.6);
  if (!pts) continue;
  hBase.push(
    `<polyline points="${pts}" fill="none" stroke="${BONE}" stroke-opacity="${(0.06 + rand() * 0.22).toFixed(3)}" stroke-width="${(0.5 + rand() * 0.9).toFixed(2)}" stroke-linecap="round"/>`,
  );
}

// Five apertures, evenly spaced, radii varied so the rhythm isn't mechanical.
const VEINS = [0.1, 0.3, 0.5, 0.7, 0.9].map((f, i) => ({
  x: f * HW,
  y: HH * (0.42 + ((i % 2) - 0.5) * 0.22),
  r: 120 + (i % 3) * 34,
}));

const hVeins = VEINS.map((v, vi) => {
  const strokes = [];
  for (let i = 0; i < 420; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * v.r;
    const pts = hStroke(
      v.x + Math.cos(a) * r,
      v.y + Math.sin(a) * r,
      14 + Math.floor(rand() * 26),
      3,
    );
    if (!pts) continue;
    strokes.push(
      `<polyline points="${pts}" fill="none" stroke="${SIGNAL}" stroke-opacity="${(0.18 + rand() * 0.6).toFixed(3)}" stroke-width="${(0.5 + rand() * 1.1).toFixed(2)}" stroke-linecap="round"/>`,
    );
  }
  return `<g clip-path="url(#vein${vi})">${strokes.join("")}</g>`;
}).join("\n");

const headingSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${HW}" height="${HH}" viewBox="0 0 ${HW} ${HH}">
  <defs>
    ${VEINS.map((v, i) => `<clipPath id="vein${i}"><circle cx="${v.x}" cy="${v.y}" r="${v.r}"/></clipPath>`).join("")}
    ${VEINS.map(
      (v, i) =>
        `<radialGradient id="vg${i}" gradientUnits="userSpaceOnUse" cx="${v.x}" cy="${v.y}" r="${v.r * 1.7}">
          <stop offset="0%" stop-color="${SIGNAL}" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="${SIGNAL}" stop-opacity="0"/>
        </radialGradient>`,
    ).join("")}
  </defs>
  <rect width="${HW}" height="${HH}" fill="${INK}"/>
  ${VEINS.map((_, i) => `<rect width="${HW}" height="${HH}" fill="url(#vg${i})"/>`).join("")}
  ${hBase.join("\n")}
  ${hVeins}
</svg>`;

const HOUT = "/Users/druvinosystems/Documents/portfolio/public/heading-fill.jpg";
await sharp(Buffer.from(headingSvg), { density: 96 })
  .resize(HW, HH)
  .jpeg({ quality: 74, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(HOUT);

const hMeta = await sharp(HOUT).metadata();
console.log(`wrote ${HOUT} — ${hMeta.width}x${hMeta.height}`);
