// src/loadAssets.ts
// Registers every game sprite with KAPLAY using stable, predictable keys.
// The SVGs are served from /assets/... (they live in public/assets/).
//
// Usage in main.ts:
//   import kaplay from "kaplay";
//   import { loadGameAssets } from "./loadAssets";
//   const k = kaplay({ /* ...options... */ });
//   loadGameAssets(k);
//
// Then elsewhere: k.add([k.sprite("cheese_cheddar_wedge"), ...]);

import type { KAPLAYCtx } from "kaplay";

// Regular cheeses (the giant bonus wheel is handled separately below).
// Each of these has a whole sprite plus matching _l / _r halves.
export const CHEESE_TYPES = [
  "cheddar_wedge",
  "provolone_round",
  "swiss_square",
  "brie_wheel",
] as const;

// The bonus object: whole + halves + a full-shatter "broken" sprite.
export const GIANT_WHEEL = "giant_wheel";

// Wine objects (the "avoid these"). Each has a whole sprite + a _broken sprite.
export const WINE_TYPES = [
  "bottle",
  "glass",
  "carafe",
] as const;

// --- Audio manifest -------------------------------------------------------
// Files live in public/assets/audio/. Listed here so adding a fart or swapping
// in a different CC0 clip is a one-line change. See public/assets/audio/CREDITS.md.
export const FART_KEYS = [
  "fart1",
  "fart2",
  "fart3",
  "fart4",
  "fart5",
  "fart6",
] as const;

// Glass-break pool: 4 distinct shatters split from one CC0 source. Picked at
// random (no immediate repeat) whenever a glass item breaks, like the farts.
export const GLASS_KEYS = [
  "glass_break1",
  "glass_break2",
  "glass_break3",
  "glass_break4",
] as const;

// Stable keys for the remaining single-shot sound effects.
export const SFX = {
  whoosh: "sfx_whoosh",
  explosion: "sfx_explosion", // plays when the giant wheel fully shatters
  roundEnd: "sfx_round_end",
} as const;

// Vite sets BASE_URL to "/" during dev and "/cheese-ninja/" for the GitHub Pages
// build. Routing every asset URL through it keeps paths correct in both places —
// otherwise "/assets/..." would 404 when the site is served under a subpath.
const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

// The whimsical display font (Lilita One, OFL), bundled locally so it works
// offline. Registered under this key and set as KAPLAY's default font in main.ts.
export const GAME_FONT = "lilita";

/** Load every sprite, sound, and font the game needs. Call once, right after creating the KAPLAY context. */
export function loadGameAssets(k: KAPLAYCtx): void {
  k.loadFont(GAME_FONT, asset("assets/fonts/LilitaOne-Regular.ttf"));

  // --- Cheese: whole + left/right halves ---
  for (const t of CHEESE_TYPES) {
    k.loadSprite(`cheese_${t}`,   asset(`assets/cheese/cheese_${t}.svg`));
    k.loadSprite(`cheese_${t}_l`, asset(`assets/cheese/cheese_${t}_l.svg`));
    k.loadSprite(`cheese_${t}_r`, asset(`assets/cheese/cheese_${t}_r.svg`));
  }

  // --- Giant cheese wheel: whole + halves + full shatter ---
  k.loadSprite(`cheese_${GIANT_WHEEL}`,        asset(`assets/cheese/cheese_${GIANT_WHEEL}.svg`));
  k.loadSprite(`cheese_${GIANT_WHEEL}_l`,      asset(`assets/cheese/cheese_${GIANT_WHEEL}_l.svg`));
  k.loadSprite(`cheese_${GIANT_WHEEL}_r`,      asset(`assets/cheese/cheese_${GIANT_WHEEL}_r.svg`));
  k.loadSprite(`cheese_${GIANT_WHEEL}_broken`, asset(`assets/cheese/cheese_${GIANT_WHEEL}_broken.svg`));

  // --- Wine: whole + broken ---
  for (const t of WINE_TYPES) {
    k.loadSprite(`wine_${t}`,        asset(`assets/wine/wine_${t}.svg`));
    k.loadSprite(`wine_${t}_broken`, asset(`assets/wine/wine_${t}_broken.svg`));
  }

  // --- Audio: fart pool + glass pool + sfx (real CC0 clips, mp3) ---
  for (const key of FART_KEYS) {
    k.loadSound(key, asset(`assets/audio/farts/${key}.mp3`));
  }
  for (const key of GLASS_KEYS) {
    k.loadSound(key, asset(`assets/audio/sfx/${key}.mp3`));
  }
  k.loadSound(SFX.whoosh,    asset("assets/audio/sfx/whoosh.mp3"));
  k.loadSound(SFX.explosion, asset("assets/audio/sfx/explosion.mp3"));
  k.loadSound(SFX.roundEnd,  asset("assets/audio/sfx/round_end.mp3"));
}

/** Random regular-cheese sprite key, e.g. "cheese_swiss_square" (excludes the giant wheel). */
export function randomCheeseKey(k: KAPLAYCtx): string {
  return `cheese_${k.choose([...CHEESE_TYPES])}`;
}

/** Random wine sprite key, e.g. "wine_bottle". */
export function randomWineKey(k: KAPLAYCtx): string {
  return `wine_${k.choose([...WINE_TYPES])}`;
}

/** Given a base key like "cheese_swiss_square", return its two half keys. */
export function halfKeys(baseKey: string): { left: string; right: string } {
  return { left: `${baseKey}_l`, right: `${baseKey}_r` };
}

// Note: the swipe blade trail does NOT need an image asset — it's cheaper and
// sharper to draw it procedurally each frame from the recent pointer positions
// (e.g. k.drawLine / a fading polyline). Keep that in systems/slicer.ts.
