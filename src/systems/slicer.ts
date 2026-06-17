// Swipe tracking + slice detection + the fading blade trail.
//
// How a slice registers (matches the spec):
//   - We sample the pointer every frame while it's pressed.
//   - The segment from last frame's point to this frame's point is the "blade".
//   - If the blade is moving fast enough (MIN_SWIPE_SPEED) AND crosses an
//     object's circular hit area, that object is sliced.
// Slicing several cheeses without lifting the pointer builds a combo.

import type { KAPLAYCtx, Vec2, GameObj } from "kaplay";
import { config } from "../config";
import type { SliceResult } from "../entities/common";

// Context passed to the game scene for each successful slice.
export interface SliceContext {
  /** How many cheeses have been sliced in this single swipe so far (incl. this). */
  combo: number;
  /** Where on screen the cut landed (for floating text / particles). */
  pos: Vec2;
}

export type OnSlice = (result: SliceResult, ctx: SliceContext) => void;

/** Shortest distance from point c to the segment p1→p2. */
function pointToSegmentDist(c: Vec2, p1: Vec2, p2: Vec2): number {
  const ab = p2.sub(p1);
  const lenSq = ab.dot(ab);
  if (lenSq === 0) return c.dist(p1); // p1 and p2 are the same point
  // Project c onto the segment, clamped to [0,1].
  let t = c.sub(p1).dot(ab) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closest = p1.add(ab.scale(t));
  return c.dist(closest);
}

export function createSlicer(k: KAPLAYCtx, onSlice: OnSlice): void {
  // Recent pointer points (newest last) for drawing the trail.
  let trail: Vec2[] = [];
  let prev: Vec2 | null = null;
  let wasDown = false;
  let cheesesThisSwipe = 0;

  k.onUpdate(() => {
    const down = k.isMouseDown();
    const cur = k.mousePos();

    // Pointer just pressed: start a fresh swipe.
    if (down && !wasDown) {
      trail = [cur];
      prev = cur;
      cheesesThisSwipe = 0;
      wasDown = true;
      return;
    }
    // Pointer just released: end the swipe, fade the trail out.
    if (!down && wasDown) {
      wasDown = false;
      prev = null;
      return;
    }
    if (!down) return;

    // Record point for the trail (cap its length).
    trail.push(cur);
    if (trail.length > config.TRAIL_LENGTH) trail.shift();

    if (!prev) {
      prev = cur;
      return;
    }

    // Speed of this frame's blade segment, in px/sec.
    const dt = k.dt();
    const speed = dt > 0 ? prev.dist(cur) / dt : 0;

    if (speed >= config.MIN_SWIPE_SPEED) {
      // Test the blade segment against every sliceable object.
      const sliceables = k.get("sliceable") as GameObj[];
      for (const obj of sliceables) {
        const radius = (obj as any).hitRadius ?? 40;
        if (pointToSegmentDist(obj.pos, prev, cur) <= radius) {
          const result: SliceResult | null = (obj as any).slice?.(0);
          if (!result) continue;
          if (result.kind === "cheese") cheesesThisSwipe += 1;
          onSlice(result, { combo: cheesesThisSwipe, pos: obj.pos.clone() });
        }
      }
    }

    prev = cur;
  });

  // Draw the blade trail: a tapering, fading polyline of recent points.
  k.onDraw(() => {
    if (!wasDown || trail.length < 2) return;
    for (let i = 1; i < trail.length; i++) {
      const t = i / trail.length; // 0 (oldest) → 1 (newest)
      k.drawLine({
        p1: trail[i - 1],
        p2: trail[i],
        width: 4 + t * 14, // thicker toward the front of the blade
        color: k.rgb(255, 255, 255),
        opacity: t * 0.85,
      });
    }
  });
}
