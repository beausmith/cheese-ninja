// Little juice: particle bursts and floating score/time text.
// Kept separate so entities can call these without caring how they're drawn.

import type { KAPLAYCtx, Vec2, Color } from "kaplay";
import { config } from "../config";

/** Spray a handful of small colored squares outward from a point, then fade. */
export function burstParticles(
  k: KAPLAYCtx,
  pos: Vec2,
  color: Color,
  count = 10,
): void {
  for (let i = 0; i < count; i++) {
    const dir = k.Vec2.fromAngle(k.rand(0, 360)).scale(k.rand(80, 320));
    k.add([
      k.rect(k.rand(4, 10), k.rand(4, 10)),
      k.pos(pos),
      k.anchor("center"),
      k.color(color),
      k.rotate(k.rand(0, 360)),
      k.opacity(1),
      k.z(50),
      // Each particle gets its own velocity + gravity, then self-destructs.
      {
        vel: dir,
        update(this: any) {
          this.vel.y += config.GRAVITY * 0.6 * k.dt();
          this.pos = this.pos.add(this.vel.scale(k.dt()));
        },
      },
      k.lifespan(0.6, { fade: 0.4 }),
    ]);
  }
}

/** Floating "+10" / "+2s" / "-15" text that drifts up and fades. */
export function floatingText(
  k: KAPLAYCtx,
  pos: Vec2,
  msg: string,
  color: Color,
): void {
  k.add([
    k.text(msg, { size: 40 }),
    k.pos(pos),
    k.anchor("center"),
    k.color(color),
    k.outline(4, k.rgb(0, 0, 0)),
    k.opacity(1),
    k.z(60),
    {
      update(this: any) {
        this.pos.y -= 90 * k.dt(); // drift upward
      },
    },
    k.lifespan(0.8, { fade: 0.5 }),
  ]);
}
