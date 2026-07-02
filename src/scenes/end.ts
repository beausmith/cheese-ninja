// End screen: "Time's up!", final score, high score (with "New best!"),
// and a Play Again button. Content is centered and scaled so it stays fully
// visible on any screen size / orientation.

import type { KAPLAYCtx } from "kaplay";
import { getHighScore } from "../systems/score";
import { addButton, addMuteButton } from "../systems/ui";
import { addKnifeCursor } from "../systems/cursor";
import { layoutScale } from "../systems/layout";

interface EndData {
  score: number;
  isNewBest: boolean;
}

export function registerEndScene(k: KAPLAYCtx): void {
  k.scene("end", (data: EndData) => {
    const cx = k.width() / 2;
    const cy = k.height() / 2;
    const s = layoutScale(k);
    const at = (offset: number) => cy + offset * s;
    const { score, isNewBest } = data;

    k.add([
      k.text("Time’s Up!", { size: 64 * s }),
      k.pos(cx, at(-210)),
      k.anchor("center"),
      k.color(245, 222, 140),
      k.outline(Math.max(3, 6 * s), k.rgb(60, 36, 10)),
    ]);

    k.add([
      k.text(`Score: ${score}`, { size: 48 * s }),
      k.pos(cx, at(-70)),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    if (isNewBest) {
      // Pulsing "New best!" banner.
      const banner = k.add([
        k.text("NEW BEST!", { size: 44 * s }),
        k.pos(cx, at(0)),
        k.anchor("center"),
        k.color(255, 210, 80),
        k.scale(1),
      ]);
      banner.onUpdate(() => {
        const pulse = 1 + 0.08 * Math.sin(k.time() * 6);
        banner.scale = k.vec2(pulse);
      });
    } else {
      k.add([
        k.text(`High Score: ${getHighScore()}`, { size: 36 * s }),
        k.pos(cx, at(0)),
        k.anchor("center"),
        k.color(245, 222, 140),
      ]);
    }

    addButton(k, {
      label: "PLAY AGAIN",
      pos: k.vec2(cx, at(110)),
      width: 280 * s,
      height: 90 * s,
      textSize: 36 * s,
      onClick: () => k.go("game"),
    });

    addButton(k, {
      label: "MENU",
      pos: k.vec2(cx, at(200)),
      width: 200 * s,
      height: 70 * s,
      textSize: 30 * s,
      color: [120, 80, 30],
      onClick: () => k.go("start"),
    });

    addMuteButton(k);
    addKnifeCursor(k);

    k.onKeyPress("space", () => k.go("game"));
  });
}
