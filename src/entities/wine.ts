// A wine object: the hazard. Bottle, glass, and carafe all fly through.
// The skill is to AVOID slicing these — cutting one shatters it and costs points.
// Letting it fall off-screen is free.

import type { KAPLAYCtx, GameObj } from "kaplay";
import { config, SPRITE_SIZE } from "../config";
import { WINE_TYPES } from "../loadAssets";
import {
  physics,
  spin,
  launchVelocity,
  randomSpawnX,
  type SliceResult,
} from "./common";
import { burstParticles } from "../systems/effects";

// Greenish glass shards.
const GLASS_PARTICLE = [120, 160, 110] as const;

/** Launch one random wine object in an arc from the bottom edge. */
export function spawnWine(k: KAPLAYCtx): GameObj {
  const type = k.choose([...WINE_TYPES]);
  const baseKey = `wine_${type}`;
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
    "wine",
    {
      hitRadius: radius * 0.8,
      slice(this: GameObj): SliceResult | null {
        // Swap to the pre-shattered sprite in place, spray shards, then fall off.
        this.use(k.sprite(`${baseKey}_broken`));
        burstParticles(k, this.pos, k.rgb(...GLASS_PARTICLE), 14);
        // Stop it from being sliced again while it falls away.
        this.unuse("sliceable");
        k.wait(0.6, () => k.destroy(this));
        return { kind: "wine" };
      },
    },
  ]);

  return obj;
}
