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
 * Gives an object a velocity + its own gravity and integrates them every frame,
 * then removes the object once it has fallen well below the bottom of the screen.
 * (Each object carries its own gravity so arcs can be sized per screen — see
 * makeArc — rather than sharing one global value.)
 */
export function physics(k: KAPLAYCtx, vel: Vec2, gravity: number) {
  return {
    id: "physics",
    vel,
    gravity,
    update(this: any) {
      // v += g * dt   (gravity pulls down each frame)
      this.vel.y += this.gravity * k.dt();
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

// A launch velocity plus the gravity that produces the intended arc.
export interface Arc {
  vel: Vec2;
  gravity: number;
}

/**
 * Build a launch velocity + gravity so the object rises `peak` (a fraction of
 * screen height) and stays airborne for `airtime` seconds — regardless of screen
 * size. Physics: for a rise h over air-time T, gravity g = 8h/T² and the upward
 * launch speed is 4h/T. Horizontal drift is a fraction of screen WIDTH, biased
 * back toward center so things stay in view on narrow screens.
 */
export function makeArc(
  k: KAPLAYCtx,
  startX: number,
  peakMin: number,
  peakMax: number,
  airMin: number,
  airMax: number,
): Arc {
  const peak = k.rand(peakMin, peakMax) * k.height(); // rise, in px
  const T = k.rand(airMin, airMax); // seconds airborne
  const gravity = (8 * peak) / (T * T);
  const vy = -(4 * peak) / T;

  const spread = config.LAUNCH_VX_SPREAD_FRAC * k.width();
  const towardCenter = (k.width() / 2 - startX) / (k.width() / 2); // -1..1
  const vx = k.rand(-spread, spread) + towardCenter * spread * 0.5;

  return { vel: k.vec2(vx, vy), gravity };
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
  gravity: number,
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
    physics(k, vel, gravity),
    spin(k, dir * k.rand(config.SPIN_SPEED, config.SPIN_SPEED * 2)),
    k.lifespan(1.4, { fade: 0.6 }),
  ]);
}
