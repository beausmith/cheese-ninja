// Small reusable UI bits: a tappable button and the mute toggle.
// Kept tiny and framework-flavored so the scenes stay readable.

import type { KAPLAYCtx, Vec2, GameObj } from "kaplay";
import { initAudio, isMuted, toggleMute } from "./audio";

interface ButtonOpts {
  label: string;
  pos: Vec2;
  width?: number;
  height?: number;
  color?: [number, number, number];
  onClick: () => void;
}

/** Add a rounded rectangular button with centered text. Returns the button obj. */
export function addButton(k: KAPLAYCtx, opts: ButtonOpts): GameObj {
  const w = opts.width ?? 280;
  const h = opts.height ?? 90;
  const [r, g, b] = opts.color ?? [201, 135, 26];

  const btn = k.add([
    k.rect(w, h, { radius: 16 }),
    k.pos(opts.pos),
    k.anchor("center"),
    k.color(r, g, b),
    k.outline(4, k.rgb(60, 36, 10)),
    k.area(),
    k.scale(1),
    k.fixed(),
    k.z(100),
  ]);

  btn.add([
    k.text(opts.label, { size: 36 }),
    k.anchor("center"),
    k.color(255, 255, 255),
  ]);

  // Gentle press feedback + the actual action.
  btn.onClick(() => {
    k.tween(0.9, 1, 0.12, (s) => (btn.scale = k.vec2(s)), k.easings.easeOutBack);
    opts.onClick();
  });

  return btn;
}

/**
 * Add the mute toggle in the top area. Label flips between ON/MUTED.
 * Position it yourself via `pos`.
 */
export function addMuteToggle(k: KAPLAYCtx, pos: Vec2): GameObj {
  const label = () => (isMuted() ? "SOUND: OFF" : "SOUND: ON");

  const btn = k.add([
    k.rect(220, 56, { radius: 12 }),
    k.pos(pos),
    k.anchor("center"),
    k.color(60, 36, 10),
    k.outline(3, k.rgb(201, 135, 26)),
    k.area(),
    k.fixed(),
    k.z(100),
  ]);

  const txt = btn.add([
    k.text(label(), { size: 24 }),
    k.anchor("center"),
    k.color(245, 222, 140),
  ]);

  btn.onClick(() => {
    toggleMute(k);
    txt.text = label();
  });

  return btn;
}

// Re-export so scenes can pull audio init from one place if they want.
export { initAudio };
