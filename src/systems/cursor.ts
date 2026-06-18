// Replaces the OS mouse pointer with a cheese-knife sprite, held as if by a hand
// on an arm reaching up from below the screen. The cutting tip tracks the
// pointer, and the knife tilts naturally: straight up when the pointer is
// horizontally centered, and leaning toward whichever side the pointer is on.
//
// We get that by aiming the knife along the line from a pivot point — centered
// horizontally, below the viewport (the imaginary shoulder/elbow) — to the
// pointer. (On touch it tracks your finger.)

import type { KAPLAYCtx, GameObj } from "kaplay";

const SCALE = 0.42; // size of the knife relative to the 256px sprite
// How far below the bottom edge the pivot sits, as a fraction of screen height.
// Larger = a longer "arm" = gentler tilt; smaller = more dramatic lean.
const PIVOT_BELOW = 0.4;

/**
 * Add the cheese-knife cursor to the current scene and hide the OS pointer.
 * Call once per scene (KAPLAY clears objects on scene change).
 */
export function addKnifeCursor(k: KAPLAYCtx): GameObj {
  k.setCursor("none"); // hide the default arrow over the canvas

  const knife = k.add([
    k.sprite("knife"),
    k.pos(k.mousePos()),
    // Sprite points right with its tip at the right edge; anchoring there keeps
    // the cutting tip on the pointer while the knife rotates about it.
    k.anchor(k.vec2(0.84, 0)),
    k.scale(SCALE),
    k.rotate(-90),
    k.fixed(),
    k.z(200), // above the HUD and everything else
    {
      update(this: GameObj) {
        const m = k.mousePos();
        this.pos = m;
        // Aim from the below-center pivot up to the pointer. atan2 gives -90°
        // (straight up) when m is horizontally centered, tilting toward the side
        // the pointer is on.
        const pivot = k.vec2(k.width() / 2, k.height() * (1 + PIVOT_BELOW));
        const d = m.sub(pivot);
        this.angle = (Math.atan2(d.y, d.x) * 180) / Math.PI;
      },
    },
  ]);

  return knife;
}
