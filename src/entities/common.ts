// Shared building blocks for every flying object.
//
// KAPLAY lets us write small "components" — plain objects with an `id`, optional
// `update()`/`draw()` hooks, and any extra fields/methods. We attach them to a
// game object with k.add([...]). Here we hand-roll simple physics so the learner
// can see exactly how the launch arcs work (velocity + gravity, integrated each
// frame) instead of it being hidden inside the engine.

import type { KAPLAYCtx, Vec2 } from "kaplay";
import { config } from "../config";

// What the slicer learns when it cuts an object. The game scene uses this to
// award points/time, play the right sound, and show floating text.
export type SliceResult =
  | { kind: "cheese" }
  | { kind: "wine" }
  | { kind: "wheel"; broke: boolean };

// Every flying object carries these so the slicer can hit-test and cut it.
// (KAPLAY game objects are dynamically typed, so we describe the shape here.)
export interface Sliceable {
  hitRadius: number;
  /** Cut the object. Returns what happened, or null if it shouldn't count. */
  slice(swipeAngle: number): SliceResult | null;
}

/**
 * Gives an object a velocity and applies gravity every frame, then removes the
 * object once it has fallen well below the bottom of the screen.
 */
export function physics(k: KAPLAYCtx, vel: Vec2) {
  return {
    id: "physics",
    vel,
    update(this: any) {
      // v += g * dt   (gravity pulls down each frame)
      this.vel.y += config.GRAVITY * k.dt();
      // pos += v * dt (move by the current velocity)
      this.pos = this.pos.add(this.vel.scale(k.dt()));
      // Clean up objects that have left the playfield so they don't pile up.
      if (this.pos.y > k.height() + 400) {
        k.destroy(this);
      }
    },
  };
}

/** Spins the object at a fixed rate (degrees/second). Needs the rotate() comp. */
export function spin(k: KAPLAYCtx, degPerSec: number) {
  return {
    id: "spin",
    update(this: any) {
      this.angle += degPerSec * k.dt();
    },
  };
}

/**
 * Pick a launch velocity that arcs an object up from the bottom edge toward the
 * middle of the screen, with a little random horizontal drift.
 */
export function launchVelocity(
  k: KAPLAYCtx,
  startX: number,
  vyMin: number,
  vyMax: number,
): Vec2 {
  const vy = k.rand(vyMin, vyMax);
  // Bias horizontal drift back toward screen center so objects stay in view.
  const towardCenter = (k.width() / 2 - startX) / (k.width() / 2); // -1..1
  const vx =
    k.rand(-config.LAUNCH_VX_SPREAD, config.LAUNCH_VX_SPREAD) +
    towardCenter * config.LAUNCH_VX_SPREAD * 0.5;
  return k.vec2(vx, vy);
}

/** A random X near the bottom edge to launch a new object from. */
export function randomSpawnX(k: KAPLAYCtx): number {
  return k.rand(k.width() * 0.15, k.width() * 0.85);
}

/**
 * Spawn the two halves of a sliced object at the original position. They're
 * exact clips of the whole, so starting them in the same spot looks like the
 * object splitting apart. `dir` is -1 (left half) or +1 (right half).
 */
export function spawnHalf(
  k: KAPLAYCtx,
  spriteKey: string,
  pos: Vec2,
  inheritedVel: Vec2,
  angle: number,
  scale: number,
  dir: -1 | 1,
): void {
  const vel = k.vec2(
    inheritedVel.x + dir * config.HALF_SPLIT_VX,
    inheritedVel.y * 0.4 - 120, // a little upward kick so halves arc nicely
  );
  k.add([
    k.sprite(spriteKey),
    k.pos(pos),
    k.anchor("center"),
    k.scale(scale),
    k.rotate(angle),
    k.opacity(1),
    k.z(20),
    physics(k, vel),
    spin(k, dir * k.rand(config.SPIN_SPEED, config.SPIN_SPEED * 2)),
    k.lifespan(1.4, { fade: 0.6 }),
  ]);
}
