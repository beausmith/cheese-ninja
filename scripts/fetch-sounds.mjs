// Fetch CC0 sounds from the Freesound API and save them into public/assets/audio.
//
// Reads FREESOUND_API_KEY from .env.local (never printed). Uses token auth for
// search and downloads the high-quality mp3 PREVIEW for each pick (previews
// don't need the OAuth2 flow). Prints a credits summary at the end.
//
// Usage:
//   node scripts/fetch-sounds.mjs            # search + download
//   node scripts/fetch-sounds.mjs --check    # just verify the token works

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const FARTS = resolve(ROOT, "public/assets/audio/farts");
const SFX = resolve(ROOT, "public/assets/audio/sfx");
for (const d of [FARTS, SFX]) mkdirSync(d, { recursive: true });

// --- read the key from .env.local without exposing it ---
function readKey() {
  const env = readFileSync(resolve(ROOT, ".env.local"), "utf8");
  const m = env.match(/^\s*FREESOUND_API_KEY\s*=\s*(.+)\s*$/m);
  if (!m) throw new Error("FREESOUND_API_KEY not found in .env.local");
  return m[1].trim().replace(/^["']|["']$/g, "");
}
const KEY = readKey();
const AUTH = { Authorization: `Token ${KEY}` };
const API = "https://freesound.org/apiv2";

async function search(query, { maxDur = 3, minDur = 0.15, pageSize = 25 } = {}) {
  const filter = `license:"Creative Commons 0" duration:[${minDur} TO ${maxDur}]`;
  const url =
    `${API}/search/text/?query=${encodeURIComponent(query)}` +
    `&filter=${encodeURIComponent(filter)}` +
    `&fields=id,name,username,license,previews,duration,avg_rating,num_downloads` +
    `&sort=rating_desc&page_size=${pageSize}`;
  const res = await fetch(url, { headers: AUTH });
  if (!res.ok) throw new Error(`search "${query}" -> HTTP ${res.status}: ${await res.text()}`);
  return (await res.json()).results ?? [];
}

async function downloadPreview(sound, destPath) {
  const previewUrl = sound.previews?.["preview-hq-mp3"];
  if (!previewUrl) return false;
  // Previews are usually public; send the token too just in case.
  let res = await fetch(previewUrl, { headers: AUTH });
  if (!res.ok) res = await fetch(previewUrl); // retry unauthenticated
  if (!res.ok) throw new Error(`download ${sound.id} -> HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return true;
}

if (process.argv.includes("--check")) {
  const r = await search("fart", { pageSize: 1 });
  console.log(`Token OK. Sample CC0 result: ${r[0]?.name ?? "(none)"}`);
  process.exit(0);
}

// What we want: category -> { query, count, dir, baseName }
const PLAN = [
  { query: "fart", count: 6, dir: FARTS, base: (i) => `fart${i + 1}`, maxDur: 2.5 },
  { query: "glass break shatter", count: 1, dir: SFX, base: () => "glass_break", maxDur: 3 },
  { query: "whoosh swipe", count: 1, dir: SFX, base: () => "whoosh", maxDur: 1.5 },
  { query: "success chime bell", count: 1, dir: SFX, base: () => "chime", maxDur: 3 },
  { query: "game over buzzer", count: 1, dir: SFX, base: () => "round_end", maxDur: 3 },
];

const credits = [];
const usedIds = new Set();

for (const cat of PLAN) {
  const results = await search(cat.query, { maxDur: cat.maxDur });
  let picked = 0;
  for (const s of results) {
    if (picked >= cat.count) break;
    if (usedIds.has(s.id)) continue;
    if (!s.previews?.["preview-hq-mp3"]) continue;
    const name = `${cat.base(picked)}.mp3`;
    const dest = resolve(cat.dir, name);
    try {
      const ok = await downloadPreview(s, dest);
      if (!ok) continue;
    } catch (e) {
      console.warn(`  skip ${s.id}: ${e.message}`);
      continue;
    }
    usedIds.add(s.id);
    credits.push({
      file: cat.dir === FARTS ? `farts/${name}` : `sfx/${name}`,
      id: s.id,
      name: s.name,
      user: s.username,
      url: `https://freesound.org/s/${s.id}/`,
      dur: Number(s.duration).toFixed(2),
    });
    picked++;
    console.log(`  ✓ ${cat.dir === FARTS ? "farts" : "sfx"}/${name}  <- "${s.name}" by ${s.username} (${Number(s.duration).toFixed(1)}s)`);
  }
  if (picked < cat.count) {
    console.warn(`  ! only found ${picked}/${cat.count} for "${cat.query}"`);
  }
}

writeFileSync(resolve(ROOT, "scripts/.sound-credits.json"), JSON.stringify(credits, null, 2));
console.log(`\nDownloaded ${credits.length} clips. Credits written to scripts/.sound-credits.json`);
