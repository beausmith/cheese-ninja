// Generates placeholder audio (WAV) + PWA icons (PNG) with zero dependencies.
// Run: node scripts/gen-assets.mjs
//
// The WAVs are synthesized "good enough" sounds so the game is fully playable
// before real CC0 clips are dropped in (same filenames -> just overwrite).
// The PNGs are simple cheese-wedge icons for installability.

import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const FARTS = resolve(ROOT, "public/assets/audio/farts");
const SFX = resolve(ROOT, "public/assets/audio/sfx");
const ICONS = resolve(ROOT, "public/assets/icons");
for (const d of [FARTS, SFX, ICONS]) mkdirSync(d, { recursive: true });

const SR = 22050; // sample rate

// --- WAV encoding (16-bit PCM mono) --------------------------------------
function encodeWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE((s * 32767) | 0, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const noise = () => Math.random() * 2 - 1;

// A buzzy descending "fart": sum of a few detuned saw-ish tones + a touch of
// noise, with a quick attack and a longer decay. Params vary per clip.
function makeFart({ f0 = 180, f1 = 70, dur = 0.32, buzz = 7 }) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = f0 + (f1 - f0) * t; // glide down
    phase += (2 * Math.PI * freq) / SR;
    // Saw-ish via summed harmonics -> buzzy.
    let s = 0;
    for (let h = 1; h <= buzz; h++) s += Math.sin(phase * h) / h;
    s = s / Math.log(buzz + 1);
    // Amplitude modulation gives the "sputter".
    const flutter = 0.6 + 0.4 * Math.sin(2 * Math.PI * 28 * (i / SR));
    const env = Math.min(1, t * 30) * Math.pow(1 - t, 1.6); // fast attack, decay
    out[i] = (s * flutter + noise() * 0.05) * env * 0.9;
  }
  return out;
}

function makeGlassBreak() {
  const dur = 0.4;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.pow(1 - t, 3);
    // Bright noise + a couple of high ringing tones for "shatter" sparkle.
    const ring =
      Math.sin((2 * Math.PI * 2400 * i) / SR) * 0.3 +
      Math.sin((2 * Math.PI * 3700 * i) / SR) * 0.2;
    out[i] = (noise() * 0.8 + ring) * env;
  }
  return out;
}

function makeWhoosh() {
  const dur = 0.25;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.sin(Math.PI * t); // swell in and out
    // Low-pass filtered noise that opens up over time.
    const a = 0.02 + 0.25 * t;
    lp += a * (noise() - lp);
    out[i] = lp * env * 0.8;
  }
  return out;
}

function tone(freq, i) {
  return Math.sin((2 * Math.PI * freq * i) / SR);
}

function makeChime() {
  const dur = 0.7;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  // A bright major triad that rings out.
  const freqs = [659, 830, 988]; // E5, G#5, B5
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.pow(1 - t, 2);
    let s = 0;
    for (const f of freqs) s += tone(f, i);
    out[i] = (s / freqs.length) * env * 0.9;
  }
  return out;
}

function makeRoundEnd() {
  const steps = [523, 415, 330]; // descending C5, G#4, E4
  const stepDur = 0.16;
  const out = [];
  for (let s = 0; s < steps.length; s++) {
    const n = Math.floor(SR * stepDur);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const env = Math.min(1, t * 20) * Math.pow(1 - t, 1.5);
      out.push(tone(steps[s], i) * env * 0.8);
    }
  }
  return Float32Array.from(out);
}

// Pass --icons-only to regenerate just the icons (e.g. after a design tweak)
// WITHOUT overwriting the real CC0 audio clips with synthesized placeholders.
const ICONS_ONLY = process.argv.includes("--icons-only");

// Six distinct farts.
const fartParams = [
  { f0: 200, f1: 70, dur: 0.30, buzz: 6 },
  { f0: 150, f1: 55, dur: 0.42, buzz: 9 },
  { f0: 240, f1: 90, dur: 0.22, buzz: 5 },
  { f0: 120, f1: 50, dur: 0.5, buzz: 11 },
  { f0: 300, f1: 110, dur: 0.18, buzz: 4 },
  { f0: 175, f1: 60, dur: 0.36, buzz: 8 },
];
if (!ICONS_ONLY) {
  fartParams.forEach((p, idx) => {
    writeFileSync(resolve(FARTS, `fart${idx + 1}.wav`), encodeWav(makeFart(p)));
  });
  writeFileSync(resolve(SFX, "glass_break.wav"), encodeWav(makeGlassBreak()));
  writeFileSync(resolve(SFX, "whoosh.wav"), encodeWav(makeWhoosh()));
  writeFileSync(resolve(SFX, "chime.wav"), encodeWav(makeChime()));
  writeFileSync(resolve(SFX, "round_end.wav"), encodeWav(makeRoundEnd()));
}

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

console.log(ICONS_ONLY ? "Regenerated icons." : "Generated placeholder audio + icons.");
