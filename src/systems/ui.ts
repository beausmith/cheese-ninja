// Small reusable UI bits: a tappable button and the mute toggle.
// Kept tiny and framework-flavored so the scenes stay readable.

import type { KAPLAYCtx, Vec2, GameObj } from "kaplay";
import { initAudio, isMuted, toggleMute } from "./audio";
import { safeInsets } from "./safeArea";

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

// Sample points along a circular arc (degrees), for drawing the sound waves.
function arcPts(
  k: KAPLAYCtx,
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  steps = 14,
): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + (a1 - a0) * (i / steps)) * Math.PI) / 180;
    pts.push(k.vec2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return pts;
}

// Draws a speaker glyph centered on the object's origin. Shows sound waves when
// unmuted, or a red slash when muted.
function speakerIcon(k: KAPLAYCtx) {
  return {
    id: "speakerIcon",
    draw() {
      const muted = isMuted();
      const fg = muted ? k.rgb(150, 138, 104) : k.rgb(245, 222, 140);
      // Speaker body: back box + flaring cone, as one polygon.
      k.drawPolygon({
        pts: [
          k.vec2(-12, -5),
          k.vec2(-6, -5),
          k.vec2(1, -11),
          k.vec2(1, 11),
          k.vec2(-6, 5),
          k.vec2(-12, 5),
        ],
        color: fg,
      });
      if (muted) {
        // Diagonal "no sound" slash with a dark backing for contrast.
        k.drawLine({ p1: k.vec2(-13, -13), p2: k.vec2(15, 15), width: 7, color: k.rgb(40, 24, 8) });
        k.drawLine({ p1: k.vec2(-13, -13), p2: k.vec2(15, 15), width: 4, color: k.rgb(235, 90, 80) });
      } else {
        // Two sound-wave arcs radiating from the cone.
        for (const r of [13, 19]) {
          k.drawLines({ pts: arcPts(k, 1, 0, r, -42, 42), width: 3, color: fg, cap: "round" });
        }
      }
    },
  };
}

/**
 * Add the mute toggle as a small speaker icon pinned to the top-right corner,
 * clear of the device safe-area inset. Tapping it toggles sound; the glyph
 * flips between a speaker (on) and a slashed speaker (off).
 */
export function addMuteButton(k: KAPLAYCtx): GameObj {
  const OFFSET = 34; // distance of the icon center from the screen edge
  const TAP = 30; // half-size of the (generous) tap target

  // Where the icon center sits right now, given the live viewport + insets.
  const center = () => {
    const ins = safeInsets();
    return k.vec2(k.width() - ins.right - OFFSET, ins.top + OFFSET);
  };

  const btn = k.add([
    k.pos(center()),
    k.anchor("center"),
    k.fixed(),
    k.z(100),
    speakerIcon(k),
    {
      // Re-pin every frame so it stays correct through rotation / resize.
      update(this: GameObj) {
        this.pos = center();
      },
    },
  ]);

  // Hit-test taps ourselves — reliable for a fixed, canvas-drawn icon. A quick
  // tap is too slow to register as a slice, so this won't fight the slicer.
  k.onMousePress(() => {
    const c = center();
    const m = k.mousePos();
    if (Math.abs(m.x - c.x) <= TAP && Math.abs(m.y - c.y) <= TAP) {
      toggleMute(k);
    }
  });

  return btn;
}

// Re-export so scenes can pull audio init from one place if they want.
export { initAudio };
