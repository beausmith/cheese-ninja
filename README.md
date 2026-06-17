# 🧀 Cheese Ninja

A Fruit-Ninja-style swipe game: **slice the flying cheese** (each slice farts 💨),
**dodge the wine** 🍷, and chase the rare **giant cheese wheel** for bonus time.
Each round is 30 seconds. Built as an installable **Progressive Web App** with
TypeScript + [KAPLAY](https://kaplayjs.com/) + Vite.

### ▶️ Play it: **https://beausmith.github.io/cheese-ninja/**

On a phone, open that URL and "Add to Home Screen" to install it fullscreen and
play offline.

## Run it

```bash
npm install
npm run dev      # play at http://localhost:5173
```

Build / preview the production (installable, offline-capable) version:

```bash
npm run build
npm run preview -- --base /cheese-ninja/   # preview matches the Pages subpath
```

## Deployment

Pushing to `main` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml),
which builds the app and publishes `dist/` to GitHub Pages. The production build
is served under the `/cheese-ninja/` subpath, so all asset URLs are routed through
`import.meta.env.BASE_URL` (see [src/loadAssets.ts](src/loadAssets.ts)) and Vite's
`base` is set in [vite.config.ts](vite.config.ts). If you fork/rename the repo,
update `base` (and this README's URL) to match.

## How to play

- **Swipe** across cheeses to slice them — fast swipes only (a slow drag won't cut).
- Slice **2+ cheeses in one swipe** for a **combo bonus**.
- **Don't** slice the wine bottles/glasses — they shatter and cost points.
  Letting them fall off-screen is free.
- The **giant cheese wheel** is rare, big, and slow. Slice it several times for
  **extra time** and a big bonus when it finally shatters.

## Tweak the game

Every gameplay number lives in [`src/config.ts`](src/config.ts) — round length,
points, penalties, spawn rates, swipe speed, gravity, etc. Change one value,
reload, and you'll see the effect immediately. Great for experimenting.

## Project layout

```
public/assets/      cheese/ wine/ (SVG sprites), audio/ (sounds), icons/ (PWA)
src/
  main.ts           KAPLAY init + scene wiring
  config.ts         all the tunable numbers
  loadAssets.ts     registers every sprite + sound
  scenes/           start.ts, game.ts, end.ts
  systems/          spawner, slicer, audio, score, effects, ui
  entities/         cheese.ts, wine.ts, wheel.ts (+ common.ts helpers)
scripts/
  gen-assets.mjs    regenerates the swiss-cheese app icons (no deps)
  verify.mjs        headless smoke test (needs `npm run dev` running + Chrome)
```

## Audio note

The sounds in `public/assets/audio/` are **synthesized placeholders** so the game
is playable today. To use real CC0 clips, drop them in with the **same filenames**
— no code changes needed. See
[`public/assets/audio/CREDITS.md`](public/assets/audio/CREDITS.md).

## Tech

- **KAPLAY** — 2D game library (sprites, input, audio, scenes)
- **Vite** + **vite-plugin-pwa** — bundling, manifest, offline service worker
- **localStorage** — persists the high score and mute setting

> Known limitation: iOS Safari has no haptics/vibration. If native features or
> App Store distribution are wanted later, this PWA can be wrapped with Capacitor
> without a rewrite.
