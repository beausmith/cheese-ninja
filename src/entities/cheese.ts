// A normal cheese: the good object you want to slice.
// Slicing it splits the sprite into two halves, sprays cheesy particles, and
// (the game scene handles) plays a random fart + awards points.

import type { KAPLAYCtx, GameObj } from "kaplay";
import { config, SPRITE_SIZE } from "../config";
import { CHEESE_TYPES, halfKeys } from "../loadAssets";
import {
  physics,
  spin,
  launchVelocity,
  randomSpawnX,
  spawnHalf,
  type SliceResult,
} from "./common";
import { burstParticles } from "../systems/effects";

// Cheesy yellow-orange for the particle burst.
const CHEESE_PARTICLE = [251, 181, 64] as const;

/** Launch one random cheese in an arc from the bottom edge. */
export function spawnCheese(k: KAPLAYCtx): GameObj {
  const type = k.choose([...CHEESE_TYPES]);
  const baseKey = `cheese_${type}`;
  const startX = randomSpawnX(k);
  const startPos = k.vec2(startX, k.height() + 80);
  const vel = launchVelocity(k, startX, config.LAUNCH_VY_MIN, config.LAUNCH_VY_MAX);
  const radius = (SPRITE_SIZE * config.OBJECT_SCALE) / 2;

  const obj = k.add([
    k.sprite(baseKey),
    k.pos(startPos),
    k.anchor("center"),
    k.scale(config.OBJECT_SCALE),
    k.rotate(0),
    k.z(20),
    physics(k, vel),
    spin(k, k.rand(-config.SPIN_SPEED, config.SPIN_SPEED)),
    "sliceable",
    "cheese",
    {
      hitRadius: radius * 0.85, // a touch forgiving
      slice(this: GameObj): SliceResult | null {
        // Split into halves at the current spin angle, burst particles, vanish.
        const { left, right } = halfKeys(baseKey);
        spawnHalf(k, left, this.pos, (this as any).vel, this.angle, config.OBJECT_SCALE, -1);
        spawnHalf(k, right, this.pos, (this as any).vel, this.angle, config.OBJECT_SCALE, +1);
        burstParticles(k, this.pos, k.rgb(...CHEESE_PARTICLE), 12);
        k.destroy(this);
        return { kind: "cheese" };
      },
    },
  ]);

  return obj;
}
