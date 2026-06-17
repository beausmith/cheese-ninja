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

// TEMPORARY app icon: a cheddar wedge — brown backdrop, a cheese-orange triangle
// (inset more for the maskable safe zone) with a couple of darker holes.
function drawIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b, a) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
  };
  // Background
  const bg = [42, 26, 7];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) set(x, y, bg[0], bg[1], bg[2], 255);

  // A big triangle wedge (cheese). Inset more for maskable safe zone.
  const pad = maskable ? size * 0.22 : size * 0.16;
  const ax = pad, ay = size - pad; // bottom-left
  const bx = size - pad, by = size - pad; // bottom-right
  const cx = size - pad, cy = pad; // top-right
  const sign = (px, py, qx, qy, rx, ry) =>
    (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  const inTri = (px, py) => {
    const d1 = sign(px, py, ax, ay, bx, by);
    const d2 = sign(px, py, bx, by, cx, cy);
    const d3 = sign(px, py, cx, cy, ax, ay);
    const neg = d1 < 0 || d2 < 0 || d3 < 0;
    const pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  };
  const cheese = [251, 181, 64];
  const rind = [201, 135, 26];
  const holes = [
    [size * 0.62, size * 0.5, size * 0.07],
    [size * 0.78, size * 0.68, size * 0.05],
    [size * 0.7, size * 0.82, size * 0.045],
  ];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inTri(x + 0.5, y + 0.5)) continue;
      let inHole = false;
      for (const [hx, hy, hr] of holes) {
        if ((x - hx) ** 2 + (y - hy) ** 2 <= hr * hr) inHole = true;
      }
      if (inHole) set(x, y, rind[0], rind[1], rind[2], 255);
      else set(x, y, cheese[0], cheese[1], cheese[2], 255);
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
