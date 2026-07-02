// The giant cheese wheel: a rare bonus object. It's bigger and slower, and you
// can slice it several times — each slice grants points AND extra time. After
// WHEEL_SLICES_TO_BREAK hits it fully shatters for a juicy bonus.

import type { KAPLAYCtx, GameObj } from "kaplay";
import { config, SPRITE_SIZE } from "../config";
import { GIANT_WHEEL, halfKeys } from "../loadAssets";
import {
  physics,
  spin,
  makeArc,
  randomSpawnX,
  spawnHalf,
  type SliceResult,
} from "./common";
import { burstParticles } from "../systems/effects";

const WHEEL_PARTICLE = [245, 222, 140] as const;

/** Launch the giant wheel: large, slow, and worth several slices. */
export function spawnWheel(k: KAPLAYCtx): GameObj {
  const baseKey = `cheese_${GIANT_WHEEL}`;
  const startX = randomSpawnX(k);
  const startPos = k.vec2(startX, k.height() + 120);
  const arc = makeArc(
    k, startX,
    config.WHEEL_PEAK_MIN, config.WHEEL_PEAK_MAX,
    config.WHEEL_AIRTIME_MIN, config.WHEEL_AIRTIME_MAX,
  );
  const scale = config.OBJECT_SCALE * config.WHEEL_SCALE;
  const radius = (SPRITE_SIZE * scale) / 2;

  const obj = k.add([
    k.sprite(baseKey),
    k.pos(startPos),
    k.anchor("center"),
    k.scale(scale),
    k.rotate(0),
    k.z(25),
    physics(k, arc.vel, arc.gravity),
    spin(k, k.rand(-config.SPIN_SPEED * 0.5, config.SPIN_SPEED * 0.5)),
    "sliceable",
    "wheel",
    {
      hitRadius: radius * 0.9,
      slicesLeft: config.WHEEL_SLICES_TO_BREAK,
      cooldown: 0, // brief gap so one swipe can't instantly break it
      update(this: GameObj) {
        const self = this as any;
        if (self.cooldown > 0) self.cooldown -= k.dt();
      },
      slice(this: GameObj): SliceResult | null {
        const self = this as any;
        if (self.cooldown > 0) return null; // ignore hits during cooldown
        self.cooldown = 0.12;
        self.slicesLeft -= 1;

        burstParticles(k, this.pos, k.rgb(...WHEEL_PARTICLE), 10);

        if (self.slicesLeft > 0) {
          // Not broken yet: a satisfying little punch, keep it sliceable.
          this.scale = this.scale.scale(0.92);
          return { kind: "wheel", broke: false };
        }

        // Final slice: split into halves, swap to the shattered sprite, bonus!
        const { left, right } = halfKeys(baseKey);
        spawnHalf(k, left, this.pos, self.vel, self.gravity, this.angle, scale, -1);
        spawnHalf(k, right, this.pos, self.vel, self.gravity, this.angle, scale, +1);
        burstParticles(k, this.pos, k.rgb(...WHEEL_PARTICLE), 20);
        this.unuse("sliceable");
        k.destroy(this);
        return { kind: "wheel", broke: true };
      },
    },
  ]);

  return obj;
}
