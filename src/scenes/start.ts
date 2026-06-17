// Start screen: title, Play button, high score, mute toggle, and a one-line hint.

import type { KAPLAYCtx } from "kaplay";
import { getHighScore } from "../systems/score";
import { addButton, addMuteButton } from "../systems/ui";

export function registerStartScene(k: KAPLAYCtx): void {
  k.scene("start", () => {
    const cx = k.width() / 2;

    // Title
    k.add([
      k.text("CHEESE\nNINJA", { size: 84, align: "center" }),
      k.pos(cx, k.height() * 0.26),
      k.anchor("center"),
      k.color(245, 222, 140),
      k.outline(6, k.rgb(60, 36, 10)),
    ]);

    // A friendly cheese emoji-ish mark (drawn cheddar sprite spinning a bit).
    k.add([
      k.sprite("cheese_cheddar_wedge"),
      k.pos(cx, k.height() * 0.46),
      k.anchor("center"),
      k.scale(0.7),
      k.rotate(0),
      {
        update(this: any) {
          this.angle += 30 * k.dt();
        },
      },
    ]);

    // Hint. `width` makes KAPLAY wrap the text so it never runs off a narrow
    // phone screen.
    k.add([
      k.text("Slice the cheese.\nDodge the wine.", {
        size: 26,
        align: "center",
        width: k.width() * 0.9,
      }),
      k.pos(cx, k.height() * 0.6),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    // High score
    k.add([
      k.text(`Best: ${getHighScore()}`, { size: 30 }),
      k.pos(cx, k.height() * 0.66),
      k.anchor("center"),
      k.color(245, 222, 140),
    ]);

    // Play button
    addButton(k, {
      label: "PLAY",
      pos: k.vec2(cx, k.height() * 0.78),
      onClick: () => k.go("game"),
    });

    // Mute toggle (speaker icon, top-right corner)
    addMuteButton(k);

    // Also allow a tap/space anywhere (besides the buttons) to start quickly.
    k.onKeyPress("space", () => k.go("game"));
  });
}
