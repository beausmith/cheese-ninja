# Cheese Ninja — Game Spec

A Fruit Ninja–style swipe game where **cheeses** fly across the screen and you slice them with your finger. Slicing cheese makes a random **fart sound** and scores points. **Wine bottles** also fly through — slice one and it shatters, costing you points. A rare **giant cheese wheel** can be sliced multiple times to earn bonus **time**. Each round is **30 seconds**; the score is tallied at the end.

This doc is the build brief for Claude Code. It's written to be built in **incremental milestones** so a younger co-developer can follow along and ship a playable core early.

---

## 1. Platform & tech stack (decided)

- **Target:** Progressive Web App (PWA). Runs in any modern mobile/desktop browser and installs to the iPhone/Android home screen as a fullscreen app. No App Store account or review needed.
- **Language:** TypeScript.
- **Game framework:** [KAPLAY](https://kaplayjs.com/) — TypeScript-native, beginner-friendly 2D game library. Handles sprites, gravity, collisions, input, and audio with little boilerplate, which suits a teaching project.
- **Build tool:** [Vite](https://vitejs.dev/) + [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (generates the manifest + service worker for installability and offline play).
- **Audio:** Use KAPLAY's built-in audio, or [Howler.js](https://howlerjs.com/) if more control over overlapping sounds is needed. **Important:** mobile Safari requires audio to be "unlocked" by the first user tap — initialize/resume the audio context on the first pointer event.
- **Persistence:** `localStorage` for the high score.

**Why PWA over native iOS:** one codebase across web + phone, instant distribution via URL, open standards. Known limitation: **no haptics in iOS Safari**. If App Store distribution or native haptics are wanted later, this PWA can be wrapped with **Capacitor** without a rewrite.

---

## 2. Tunable parameters (gameplay knobs)

Put these in a single `config.ts` so they're easy to tweak. Defaults below.

| Parameter | Default | Notes |
|---|---|---|
| `ROUND_SECONDS` | 30 | Length of one round |
| `CHEESE_POINTS` | +10 | Per cheese sliced |
| `COMBO_BONUS` | +5 each | Extra per cheese when 2+ are sliced in a single swipe |
| `WINE_PENALTY` | −15 | Per wine bottle sliced |
| `WHEEL_SLICE_POINTS` | +5 | Per slice landed on the giant cheese wheel |
| `WHEEL_TIME_BONUS` | +2s | Time added per wheel slice |
| `WHEEL_SLICES_TO_BREAK` | 4 | Slices needed to fully shatter the wheel |
| `WHEEL_BREAK_BONUS` | +5s, +25pts | Bonus when the wheel is fully broken |
| `MISS_PENALTY` | none | Missed cheese is just lost (no life system; it's timed) |
| `SPAWN_INTERVAL_START` | 1.2s | Time between spawns at round start |
| `SPAWN_INTERVAL_END` | 0.6s | Spawn interval by end of round (ramps difficulty) |
| `WHEEL_SPAWN_CHANCE` | ~1 per round | Rare; random timing |
| `MIN_SWIPE_SPEED` | tune | Min pointer speed for a swipe to count as a slice |

---

## 3. Core gameplay

1. **Start screen** → tap **Play**.
2. Objects launch from the **bottom edge** in arcs (upward velocity + gravity), with random horizontal drift and spin, fly up, and fall back off-screen.
3. The player **swipes** a finger/mouse across objects to slice them. A fading **blade trail** follows the pointer.
4. A slice registers when the swipe segment (previous point → current point) crosses an object's hit area **while moving fast enough** (`MIN_SWIPE_SPEED`).
5. **30-second timer** counts down (extendable only by the cheese wheel).
6. At 0, show the **end screen** with score and high score, plus **Play Again**.

### Object types

- **Cheese (good):** several visual variants (e.g. cheddar wedge, swiss with holes, brie, blue). Slicing → splits into two halves that fly apart, plays a **random fart sound**, awards `CHEESE_POINTS`. Slicing 2+ cheeses in one swipe → combo bonus.
- **Wine bottle (bad):** slicing → **shatters** (glass-break sound + shard particles), applies `WINE_PENALTY`. **Skill is to avoid it.** Letting it fall off-screen = no penalty.
- **Giant cheese wheel (bonus):** larger, spawns rarely, moves more slowly. Can be sliced **multiple times**; each slice gives `WHEEL_SLICE_POINTS` and `WHEEL_TIME_BONUS`. After `WHEEL_SLICES_TO_BREAK` slices it shatters for `WHEEL_BREAK_BONUS`. Show a floating "+2s" each slice.

### Slice visuals
- On a normal cheese: split the sprite into two halves at the swipe angle; each half gets opposite velocity + gravity + spin, then fades/falls off.
- On wine: swap to a "shattered" state with falling shard particles.
- Small particle burst + floating score/time text at each slice point.

---

## 4. Audio

- **Fart pool:** 5–8 distinct fart clips; pick one at **random** per cheese slice (avoid immediate repeats). Keep them short so overlapping slices sound good.
- **Other SFX:** glass break (wine), optional slice "whoosh", bonus chime (wheel break), round-end sound.
- **Music (optional):** light loop, with a mute toggle.
- **Mobile unlock:** resume the audio context on the first user tap; preload/decode all clips at load so there's no first-play delay.
- **Sourcing:** use royalty-free / CC0 clips (e.g. freesound.org). Keep a credits/licenses note in the repo.

---

## 5. Art / assets

The art is **SVG vector** (crisp at any scale, tiny files, splits cleanly). All sprites are authored on a uniform **256×256** transparent canvas. These files are included in this package under `assets/cheese/` and `assets/wine/`.

### Asset inventory (already created)

**Cheese** (`assets/cheese/`):

| Type | Whole | Left half | Right half | Notes |
|---|---|---|---|---|
| Cheddar wedge | `cheese_cheddar_wedge.svg` | `..._l.svg` | `..._r.svg` | Flagship, orange triangle |
| Provolone round | `cheese_provolone_round.svg` | `..._l.svg` | `..._r.svg` | Pale yellow circle |
| Swiss square | `cheese_swiss_square.svg` | `..._l.svg` | `..._r.svg` | Square with holes |
| Brie wheel | `cheese_brie_wheel.svg` | `..._l.svg` | `..._r.svg` | White-rind small wheel |
| Giant wheel (bonus) | `cheese_giant_wheel.svg` | `..._l.svg` | `..._r.svg` | Large; `cheese_giant_wheel_broken.svg` = full-shatter wedges |

**Wine** (`assets/wine/`):

| Type | Whole | Broken |
|---|---|---|
| Bottle | `wine_bottle.svg` | `wine_bottle_broken.svg` |
| Glass | `wine_glass.svg` | `wine_glass_broken.svg` |
| Carafe (optional) | `wine_carafe.svg` | `wine_carafe_broken.svg` |

### How the slice/break states are used

- **Cheese sliced:** despawn the whole sprite; spawn its `_l` and `_r` halves **at the same position** (they're exact clips of the original, so they reform the whole), then give them opposite horizontal velocity + gravity + a little spin so they fly apart. Play a random fart, award points.
- **Wine sliced:** swap the whole sprite for its `_broken` sprite (spill + shards baked in), play the glass-break sound, apply the penalty, then fade/fall it off-screen.
- **Giant wheel:** each slice can spawn a `_l`/`_r` pair for that cut; when it's fully broken (after `WHEEL_SLICES_TO_BREAK`), show `cheese_giant_wheel_broken.svg` and grant the time/point bonus.

### Still to source (not blocking)
- **Fart sounds** (5–8 clips) + glass-break / whoosh / bonus SFX — CC0 from e.g. freesound.org.
- Optional slice-particle / blade-trail textures (KAPLAY can also draw the trail procedurally — see loader notes).
- **PWA icons** (192px, 512px) + maskable icon — can be generated from the cheddar wedge.

**Placeholder-first is fine:** if you start before wiring art, KAPLAY can render emoji (🧀 🍷) or colored shapes; swap in these SVGs at the "real art" milestone.

---

## 6. PWA requirements

- `manifest.webmanifest`: name, short_name, icons (192/512), `display: "standalone"`, `orientation: "portrait"`, theme/background colors.
- **Service worker** (via `vite-plugin-pwa`) precaching all assets for **offline play**.
- **Installable** and launches fullscreen with no browser chrome.
- **Mobile-first, portrait-first**, responsive to any viewport; scale the playfield so gameplay is consistent across screen sizes.
- Prevent default touch behaviors (scroll, pull-to-refresh, double-tap zoom) on the game canvas.

---

## 7. Screens / UI

- **Start:** title, Play button, high score, mute toggle, brief "slice cheese, dodge wine" hint.
- **In-game (HUD):** score (top-left), countdown timer (top-right), mute toggle.
- **End:** "Time's up!", final score, high score (with "New best!" if beaten), Play Again.

---

## 8. Suggested project structure

```
cheese-ninja/
  index.html
  vite.config.ts          # + vite-plugin-pwa
  public/
    assets/
      cheese/             # cheese sprites (whole + _l/_r halves + giant _broken)
      wine/               # wine sprites (whole + _broken)
      audio/              # farts/, sfx/   (to be added)
      icons/              # PWA icons      (to be added)
  src/
    main.ts               # KAPLAY init, scene wiring
    config.ts             # all tunables from section 2
    loadAssets.ts         # registers every sprite (included in this package)
    scenes/
      start.ts
      game.ts             # main loop: spawn, slice, timer, score
      end.ts
    systems/
      spawner.ts          # spawn timing & object launch arcs
      slicer.ts           # swipe tracking, trail, hit detection
      audio.ts            # unlock, random fart picker, sfx
      score.ts            # scoring + localStorage high score
    entities/
      cheese.ts
      wine.ts
      wheel.ts
```

> **Note:** the SVGs live in `public/assets/` so Vite serves them at a stable URL (`/assets/...`). Copy the `assets/cheese` and `assets/wine` folders from this package into `public/assets/`.

---

## 9. Build milestones (ship a playable core early)

Designed so the co-developer sees something fun fast, then layers polish.

1. **Hello KAPLAY:** Vite + KAPLAY + TS running; blank canvas, fullscreen, prevent touch scrolling.
2. **One falling object:** a cheese launches in an arc with gravity; falls off-screen.
3. **Swipe to slice:** track pointer, draw blade trail, detect slice on the cheese; it disappears on slice.
4. **Score + sound:** add score HUD; slicing cheese plays a random fart and adds points.
5. **Spawner:** continuous spawning at intervals; difficulty ramp.
6. **Wine bottles:** spawn wine; slicing it shatters + subtracts points.
7. **Timer + end screen:** 30s countdown; show final score; Play Again.
8. **Giant cheese wheel:** rare spawn; multi-slice for +time and bonus.
9. **Split visuals & particles:** proper two-piece cheese splitting, shards, floating text.
10. **Real art + audio:** swap placeholders for final assets.
11. **PWA polish:** manifest, service worker, icons, install + offline; high score in localStorage; mute toggle.
12. **Tuning:** balance spawn rates, points, and time bonuses for fun.

---

## 10. Open / future ideas (not required for v1)

- Combo multipliers and on-screen combo flair.
- Special cheeses (e.g. a "stinky" cheese worth bonus points or a louder fart).
- Per-device or family **shared leaderboard** (would need a small backend; local high score is fine for v1).
- Difficulty modes; longer rounds.
- Haptics on Android (`navigator.vibrate`); note iOS Safari does not support this.
- Optional Capacitor wrapper for App Store distribution.

---

## 11. Coding guidance for the build (teaching-friendly)

- Favor **clear, readable code** and small functions over cleverness.
- Keep all numbers in `config.ts` so the learner can experiment by changing one value and immediately seeing the effect.
- Add brief comments explaining the "why" at each system.
- Commit at each milestone so progress is visible and reversible.

---

## 12. Asset loading (KAPLAY)

The SVGs live in `public/assets/cheese/` and `public/assets/wine/`. They all have explicit `width`/`height` so they load at a deterministic size. This loader registers every sprite under a stable key. It's also included as a ready-to-use file: **`src/loadAssets.ts`**.

```ts
// src/loadAssets.ts
import type { KAPLAYCtx } from "kaplay";

// Regular cheeses (whole + _l / _r halves each).
export const CHEESE_TYPES = [
  "cheddar_wedge",
  "provolone_round",
  "swiss_square",
  "brie_wheel",
] as const;

export const GIANT_WHEEL = "giant_wheel"; // whole + halves + _broken

// Wine objects (whole + _broken each).
export const WINE_TYPES = ["bottle", "glass", "carafe"] as const;

export function loadGameAssets(k: KAPLAYCtx): void {
  for (const t of CHEESE_TYPES) {
    k.loadSprite(`cheese_${t}`,   `/assets/cheese/cheese_${t}.svg`);
    k.loadSprite(`cheese_${t}_l`, `/assets/cheese/cheese_${t}_l.svg`);
    k.loadSprite(`cheese_${t}_r`, `/assets/cheese/cheese_${t}_r.svg`);
  }
  k.loadSprite(`cheese_${GIANT_WHEEL}`,        `/assets/cheese/cheese_${GIANT_WHEEL}.svg`);
  k.loadSprite(`cheese_${GIANT_WHEEL}_l`,      `/assets/cheese/cheese_${GIANT_WHEEL}_l.svg`);
  k.loadSprite(`cheese_${GIANT_WHEEL}_r`,      `/assets/cheese/cheese_${GIANT_WHEEL}_r.svg`);
  k.loadSprite(`cheese_${GIANT_WHEEL}_broken`, `/assets/cheese/cheese_${GIANT_WHEEL}_broken.svg`);
  for (const t of WINE_TYPES) {
    k.loadSprite(`wine_${t}`,        `/assets/wine/wine_${t}.svg`);
    k.loadSprite(`wine_${t}_broken`, `/assets/wine/wine_${t}_broken.svg`);
  }
}

export function randomCheeseKey(k: KAPLAYCtx): string {
  return `cheese_${k.choose([...CHEESE_TYPES])}`;
}
export function randomWineKey(k: KAPLAYCtx): string {
  return `wine_${k.choose([...WINE_TYPES])}`;
}
export function halfKeys(baseKey: string) {
  return { left: `${baseKey}_l`, right: `${baseKey}_r` };
}
```

**Sprite key reference**

- Cheese whole: `cheese_cheddar_wedge`, `cheese_provolone_round`, `cheese_swiss_square`, `cheese_brie_wheel`, `cheese_giant_wheel`
- Cheese halves: append `_l` / `_r` (e.g. `cheese_swiss_square_l`)
- Giant wheel shatter: `cheese_giant_wheel_broken`
- Wine whole: `wine_bottle`, `wine_glass`, `wine_carafe`
- Wine broken: append `_broken` (e.g. `wine_bottle_broken`)

**Slice example (sketch)**

```ts
// when a cheese object `obj` is sliced:
const base = obj.spriteKey;                 // e.g. "cheese_cheddar_wedge"
const { left, right } = halfKeys(base);
spawnHalf(left,  obj.pos, -1);              // push left  (negative x velocity, spin)
spawnHalf(right, obj.pos, +1);              // push right (positive x velocity, spin)
obj.destroy();
playRandomFart();
addScore(CHEESE_POINTS);

// when a wine object is sliced:
obj.use(sprite(`${obj.spriteKey}_broken`)); // swap to broken state in place
playGlassBreak();
addScore(WINE_PENALTY);                      // negative
wait(0.5, () => obj.destroy());
```

The blade trail needs **no image** — draw it procedurally from recent pointer positions (a fading polyline) in `systems/slicer.ts`.
