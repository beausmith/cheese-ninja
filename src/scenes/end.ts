// End screen: "Time's up!", final score, high score (with "New best!"),
// and a Play Again button.

import type { KAPLAYCtx } from "kaplay";
import { getHighScore } from "../systems/score";
import { addButton, addMuteToggle } from "../systems/ui";

interface EndData {
  score: number;
  isNewBest: boolean;
}

export function registerEndScene(k: KAPLAYCtx): void {
  k.scene("end", (data: EndData) => {
    const cx = k.width() / 2;
    const { score, isNewBest } = data;

    k.add([
      k.text("TIME'S UP!", { size: 64 }),
      k.pos(cx, k.height() * 0.22),
      k.anchor("center"),
      k.color(245, 222, 140),
      k.outline(6, k.rgb(60, 36, 10)),
    ]);

    k.add([
      k.text(`Score: ${score}`, { size: 48 }),
      k.pos(cx, k.height() * 0.4),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    if (isNewBest) {
      // Pulsing "New best!" banner.
      const banner = k.add([
        k.text("NEW BEST!", { size: 44 }),
        k.pos(cx, k.height() * 0.5),
        k.anchor("center"),
        k.color(255, 210, 80),
        k.scale(1),
      ]);
      banner.onUpdate(() => {
        const s = 1 + 0.08 * Math.sin(k.time() * 6);
        banner.scale = k.vec2(s);
      });
    } else {
      k.add([
        k.text(`Best: ${getHighScore()}`, { size: 36 }),
        k.pos(cx, k.height() * 0.5),
        k.anchor("center"),
        k.color(245, 222, 140),
      ]);
    }

    addButton(k, {
      label: "PLAY AGAIN",
      pos: k.vec2(cx, k.height() * 0.68),
      onClick: () => k.go("game"),
    });

    addButton(k, {
      label: "MENU",
      pos: k.vec2(cx, k.height() * 0.8),
      width: 200,
      height: 70,
      color: [120, 80, 30],
      onClick: () => k.go("start"),
    });

    addMuteToggle(k, k.vec2(cx, k.height() * 0.92));

    k.onKeyPress("space", () => k.go("game"));
  });
}
