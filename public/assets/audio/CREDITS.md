# Audio credits & licenses

All clips below are **CC0 1.0 (public domain)** — sourced from
[freesound.org](https://freesound.org). CC0 requires no attribution, but we credit
the authors here as good practice. Clips are the API's high-quality mp3 previews;
some farts were trimmed/split from longer files with ffmpeg.

## Fart pool (`farts/`)

| File | Source sound | Author | Freesound | Notes |
|------|--------------|--------|-----------|-------|
| fart1.mp3 | Blubberfreak Fart 23 | Blubberfreak | [732936](https://freesound.org/s/732936/) | trimmed (toot 1 of file) |
| fart2.mp3 | Blubberfreak Fart 23 | Blubberfreak | [732936](https://freesound.org/s/732936/) | trimmed (toot 2 of file) |
| fart3.mp3 | fart 2.mp3 | Flash_Shumway | [113760](https://freesound.org/s/113760/) | — |
| fart4.mp3 | FART SOUND 50 | frenkfurth | [663636](https://freesound.org/s/663636/) | trimmed (one toot) |
| fart5.mp3 | FART.wav | C-V | [506994](https://freesound.org/s/506994/) | — |
| fart6.mp3 | FART… Buzzing Fart | designerschoice | [807507](https://freesound.org/s/807507/) | — |

## Sound effects (`sfx/`)

| File | Source sound | Author | Freesound | Notes |
|------|--------------|--------|-----------|-------|
| glass_break1.mp3 | Breaking Glass | ngruber | [204777](https://freesound.org/s/204777/) | shatter 1 of 4, split from file |
| glass_break2.mp3 | Breaking Glass | ngruber | [204777](https://freesound.org/s/204777/) | shatter 2 of 4, split from file |
| glass_break3.mp3 | Breaking Glass | ngruber | [204777](https://freesound.org/s/204777/) | shatter 3 of 4, split from file |
| glass_break4.mp3 | Breaking Glass | ngruber | [204777](https://freesound.org/s/204777/) | shatter 4 of 4, split from file |
| whoosh.mp3 | Sfx - Whoosh High 1 (4) | Sheyvan | [568299](https://freesound.org/s/568299/) | optional slice swoosh |
| explosion.mp3 | Real explosion recording (new year's eve, no effects) | modusmogulus | [784163](https://freesound.org/s/784163/) | giant-wheel break bonus |
| round_end.mp3 | Tada Fanfare A | plasterbrain | [397355](https://freesound.org/s/397355/) | celebratory end-of-round |

A random glass shatter (1–4) plays each time a wine item breaks.

## Source files for future editing

Original (untrimmed) downloads are kept outside the shipped build in
`/audio-sources/` so they aren't precached by the PWA:

- `732936.mp3` — Blubberfreak Fart 23 (CC0) — 2 toots, used for fart1/fart2
- `663636.mp3` — FART SOUND 50 by frenkfurth (CC0) — multiple toots, used for fart4
- `204777.mp3` — "Breaking Glass" by ngruber (CC0), 21.5s — first 4 shatters split
  out for glass_break1–4. Plenty more breaks remain if you want additional variants.

## Swapping in different clips

Replace a file **keeping the same filename** — no code changes needed (the loader
references these names in `src/loadAssets.ts`). To add more farts, drop them in and
extend `FART_KEYS` there. Re-fetch from Freesound any time with
`node scripts/fetch-sounds.mjs` (reads your token from `.env.local`).
