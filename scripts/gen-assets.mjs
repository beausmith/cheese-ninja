// Generates the PWA app icons (PNG) with zero dependencies.
// Run: node scripts/gen-assets.mjs
//
// Audio is real CC0 from freesound.org (see public/assets/audio/CREDITS.md), so
// this script only draws the icons. Tweak drawIcon() and re-run to refresh them.

import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ICONS = resolve(ROOT, "public/assets/icons");
mkdirSync(ICONS, { recursive: true });

// --- PNG encoding (truecolor + alpha) ------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type RGBA
  // raw scanlines with filter byte 0 per row
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// TEMPORARY app icon: the whole icon is a piece of swiss cheese — a pale-yellow
// rounded slice that fills the tile, dotted with holes. Maskable fills edge to
// edge (holes pulled into the safe zone); the regular icon leaves a thin brown
// border so the rounded slice reads on light backgrounds.
function drawIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b, a) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
  };

  const bg = [42, 26, 7]; // cheese-rind brown backdrop
  const swiss = [245, 222, 140]; // pale emmental yellow
  const holeRim = [201, 161, 74]; // darker ring around each hole
  const holeInner = [120, 86, 28]; // shadowed hole interior

  // Fill the backdrop.
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) set(x, y, bg[0], bg[1], bg[2], 255);

  // The cheese slice: a rounded square. Full-bleed for maskable, slight margin
  // otherwise.
  const margin = maskable ? 0 : size * 0.06;
  const r = size * (maskable ? 0.16 : 0.2); // corner radius
  const lo = margin, hi = size - margin;
  const inRounded = (px, py) => {
    if (px < lo || px > hi || py < lo || py > hi) return false;
    // Corner circles: only the rounded corners are excluded.
    const cxL = lo + r, cxR = hi - r, cyT = lo + r, cyB = hi - r;
    if (px < cxL && py < cyT) return (px - cxL) ** 2 + (py - cyT) ** 2 <= r * r;
    if (px > cxR && py < cyT) return (px - cxR) ** 2 + (py - cyT) ** 2 <= r * r;
    if (px < cxL && py > cyB) return (px - cxL) ** 2 + (py - cyB) ** 2 <= r * r;
    if (px > cxR && py > cyB) return (px - cxR) ** 2 + (py - cyB) ** 2 <= r * r;
    return true;
  };

  // Holes (fractions of the icon). Kept inside the maskable safe zone (~10–90%).
  const holes = [
    [0.34, 0.32, 0.11],
    [0.66, 0.28, 0.08],
    [0.5, 0.55, 0.13],
    [0.27, 0.68, 0.09],
    [0.74, 0.66, 0.10],
    [0.5, 0.84, 0.06],
  ].map(([fx, fy, fr]) => [fx * size, fy * size, fr * size]);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5, py = y + 0.5;
      if (!inRounded(px, py)) continue;
      let color = swiss;
      for (const [hx, hy, hr] of holes) {
        const d2 = (px - hx) ** 2 + (py - hy) ** 2;
        if (d2 <= hr * hr) {
          // Darker rim for the outer ~25% of the hole, shadow within.
          color = d2 >= (hr * 0.78) ** 2 ? holeRim : holeInner;
          break;
        }
      }
      set(x, y, color[0], color[1], color[2], 255);
    }
  }
  return rgba;
}

writeFileSync(resolve(ICONS, "icon-192.png"), encodePng(192, 192, drawIcon(192)));
writeFileSync(resolve(ICONS, "icon-512.png"), encodePng(512, 512, drawIcon(512)));
writeFileSync(
  resolve(ICONS, "icon-maskable-512.png"),
  encodePng(512, 512, drawIcon(512, { maskable: true })),
);

console.log("Generated app icons.");
