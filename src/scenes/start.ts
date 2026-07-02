// Start screen: title, Play button, high score, mute toggle, and a one-line hint.
//
// The whole content block is centered and scaled to the viewport, so it stays
// fully visible on tall phones, small phones, AND short landscape windows.

import type { KAPLAYCtx } from "kaplay";
import { getHighScore } from "../systems/score";
import { addButton, addMuteButton } from "../systems/ui";
import { addKnifeCursor } from "../systems/cursor";
import { layoutScale } from "../systems/layout";

export function registerStartScene(k: KAPLAYCtx): void {
  k.scene("start", () => {
    const cx = k.width() / 2;
    const cy = k.height() / 2;
    const s = layoutScale(k); // shrinks content on small/short screens so it fits
    // Vertical position of each element: an offset (in reference px) from the
    // screen center, scaled by `s`. Centering guarantees the stack fits.
    const at = (offset: number) => cy + offset * s;

    // Title
    k.add([
      k.text("CHEESE\nNINJA", { size: 84 * s, align: "center" }),
      k.pos(cx, at(-235)),
      k.anchor("center"),
      k.color(245, 222, 140),
      k.outline(Math.max(3, 6 * s), k.rgb(60, 36, 10)),
    ]);

    // A friendly cheese mark (drawn cheddar sprite spinning a bit).
    k.add([
      k.sprite("cheese_cheddar_wedge"),
      k.pos(cx, at(-70)),
      k.anchor("center"),
      k.scale(0.7 * s),
      k.rotate(0),
      {
        update(this: any) {
          this.angle += 30 * k.dt();
        },
      },
    ]);

    // Hint
    k.add([
      k.text("Cut the cheese.\nDodge the wine.", {
        size: 26 * s,
        align: "center",
        width: k.width() * 0.9,
      }),
      k.pos(cx, at(55)),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    // High score
    k.add([
      k.text(`High Score: ${getHighScore()}`, { size: 30 * s }),
      k.pos(cx, at(120)),
      k.anchor("center"),
      k.color(245, 222, 140),
    ]);

    // Play button
    addButton(k, {
      label: "PLAY",
      pos: k.vec2(cx, at(205)),
      width: 280 * s,
      height: 90 * s,
      textSize: 36 * s,
      onClick: () => k.go("game"),
    });

    // Mute toggle (speaker icon, top-right corner) + cheese-knife pointer.
    addMuteButton(k);
    addKnifeCursor(k);

    // Also allow a tap/space anywhere (besides the buttons) to start quickly.
    k.onKeyPress("space", () => k.go("game"));
  });
}
