// Replaces the OS mouse pointer with a cheese-knife sprite that follows the
// pointer and angles itself along the direction you're swiping — so it looks
// like the knife is doing the cutting. (On touch there's no pointer, so the
// knife simply tracks your finger while you slice.)

import type { KAPLAYCtx, GameObj } from "kaplay";

const SCALE = 0.42; // size of the knife relative to the 256px sprite
const MOVE_EPS = 1.5; // min pointer move (px) before we re-aim the blade
const TURN = 0.35; // how quickly the blade swings toward the swipe direction

// Lerp between two angles (degrees) along the shortest path, so the blade never
// spins the long way around.
function lerpAngle(a: number, b: number, t: number): number {
  const diff = (((b - a + 180) % 360) + 360) % 360 - 180;
  return a + diff * t;
}

/**
 * Add the cheese-knife cursor to the current scene and hide the OS pointer.
 * Call once per scene (KAPLAY clears objects on scene change).
 */
export function addKnifeCursor(k: KAPLAYCtx): GameObj {
  k.setCursor("none"); // hide the default arrow over the canvas

  let angle = -90; // start pointing up
  let prev = k.mousePos();

  const knife = k.add([
    k.sprite("knife"),
    k.pos(k.mousePos()),
    // The knife sprite points right with its tip at the right edge; this custom
    // anchor puts that tip on the pointer and makes it the rotation pivot.
    k.anchor(k.vec2(0.84, 0)),
    k.scale(SCALE),
    k.rotate(angle),
    k.fixed(),
    k.z(200), // above the HUD and everything else
    {
      update(this: GameObj) {
        const m = k.mousePos();
        this.pos = m;
        const d = m.sub(prev);
        if (d.len() > MOVE_EPS) {
          const target = (Math.atan2(d.y, d.x) * 180) / Math.PI;
          angle = lerpAngle(angle, target, TURN);
          this.angle = angle;
        }
        prev = m;
      },
    },
  ]);

  return knife;
}
