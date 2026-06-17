// Decides WHEN and WHAT to launch. The game scene calls update() every frame
// with the round progress (0 at start → 1 at the end) so difficulty can ramp:
// spawns get faster as the round goes on.

import type { KAPLAYCtx } from "kaplay";
import { config } from "../config";
import { spawnCheese } from "../entities/cheese";
import { spawnWine } from "../entities/wine";
import { spawnWheel } from "../entities/wheel";

export function createSpawner(k: KAPLAYCtx) {
  // Countdown to the next normal spawn (cheese or wine).
  let timeToNextSpawn: number = config.SPAWN_INTERVAL_START;

  /** Spawn interval shrinks linearly from START to END as the round progresses. */
  function currentInterval(progress: number): number {
    return k.lerp(config.SPAWN_INTERVAL_START, config.SPAWN_INTERVAL_END, progress);
  }

  return {
    update(progress: number) {
      const dt = k.dt();

      // --- Normal spawns: cheese most of the time, wine sometimes ---
      timeToNextSpawn -= dt;
      if (timeToNextSpawn <= 0) {
        if (k.chance(config.WINE_SPAWN_CHANCE)) {
          spawnWine(k);
        } else {
          spawnCheese(k);
        }
        timeToNextSpawn = currentInterval(progress);
      }

      // --- Rare giant wheel: roll a small chance each second, max one at a time ---
      const wheelChanceThisFrame = config.WHEEL_SPAWN_CHANCE_PER_SEC * dt;
      if (k.chance(wheelChanceThisFrame) && k.get("wheel").length === 0) {
        spawnWheel(k);
      }
    },
  };
}
