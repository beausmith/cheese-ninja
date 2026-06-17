// Audio: mobile unlock, the random "no immediate repeat" fart picker, sound
// effects, and a persistent mute toggle.
//
// Mobile Safari starts the Web Audio context "suspended" and only lets it
// resume inside a real user gesture. We listen for the first tap/click/key and
// resume it then, so the first slice isn't silent.

import type { KAPLAYCtx } from "kaplay";
import { FART_KEYS, GLASS_KEYS, SFX } from "../loadAssets";

const MUTE_KEY = "cheese-ninja:muted";

let muted = false;
let lastFartIndex = -1;
let lastGlassIndex = -1;

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMuted(value: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Call once at startup. Restores the saved mute state and wires audio unlock. */
export function initAudio(k: KAPLAYCtx): void {
  muted = readMuted();
  k.setVolume(muted ? 0 : 1);

  // Resume the suspended audio context on the very first user interaction.
  const resume = () => {
    const ctx = k.audioCtx;
    if (ctx && ctx.state === "suspended") ctx.resume();
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("touchstart", resume);
    window.removeEventListener("keydown", resume);
  };
  window.addEventListener("pointerdown", resume, { once: false });
  window.addEventListener("touchstart", resume, { once: false });
  window.addEventListener("keydown", resume, { once: false });
}

export function isMuted(): boolean {
  return muted;
}

/** Flip mute on/off, persist it, and apply it to the master volume. */
export function toggleMute(k: KAPLAYCtx): boolean {
  muted = !muted;
  writeMuted(muted);
  k.setVolume(muted ? 0 : 1);
  return muted;
}

/** Play a random fart, never the same one twice in a row. */
export function playRandomFart(k: KAPLAYCtx): void {
  if ((FART_KEYS as readonly string[]).length === 0) {
    k.burp(); // built-in fallback if no clips are registered
    return;
  }
  let i = k.randi(0, FART_KEYS.length);
  if (FART_KEYS.length > 1) {
    while (i === lastFartIndex) i = k.randi(0, FART_KEYS.length);
  }
  lastFartIndex = i;
  // A little random detune/speed keeps repeats from sounding identical.
  k.play(FART_KEYS[i], { volume: 1, detune: k.rand(-200, 200) });
}

/** Play a random glass-break shatter, never the same one twice in a row. */
export function playGlassBreak(k: KAPLAYCtx): void {
  let i = k.randi(0, GLASS_KEYS.length);
  if (GLASS_KEYS.length > 1) {
    while (i === lastGlassIndex) i = k.randi(0, GLASS_KEYS.length);
  }
  lastGlassIndex = i;
  // Slight detune so even a repeat picked clip sounds a bit different.
  k.play(GLASS_KEYS[i], { volume: 1, detune: k.rand(-100, 100) });
}

export function playWhoosh(k: KAPLAYCtx): void {
  k.play(SFX.whoosh, { volume: 0.5 });
}

export function playChime(k: KAPLAYCtx): void {
  k.play(SFX.chime, { volume: 1 });
}

export function playRoundEnd(k: KAPLAYCtx): void {
  k.play(SFX.roundEnd, { volume: 1 });
}
