// The game scene: spawn objects, track swipes, score slices, run the countdown,
// and hand off to the end screen when time runs out.

import type { KAPLAYCtx } from "kaplay";
import { config } from "../config";
import { createSpawner } from "../systems/spawner";
import { createSlicer, type SliceContext } from "../systems/slicer";
import { createScore, saveHighScore } from "../systems/score";
import { floatingText } from "../systems/effects";
import {
  playRandomFart,
  playGlassBreak,
  playExplosion,
  playRoundEnd,
} from "../systems/audio";
import { addMuteButton } from "../systems/ui";
import { addKnifeCursor } from "../systems/cursor";
import { safeInsets } from "../systems/safeArea";
import type { SliceResult } from "../entities/common";

const YELLOW = [245, 222, 140] as const;
const RED = [235, 90, 80] as const;
const GOLD = [255, 210, 80] as const;
const CYAN = [150, 230, 230] as const;

export function registerGameScene(k: KAPLAYCtx): void {
  k.scene("game", () => {
    const score = createScore();
    let timeLeft = config.ROUND_SECONDS; // seconds remaining (wheel can extend it)
    let elapsed = 0; // real time played, drives the difficulty ramp
    let roundOver = false;

    const spawner = createSpawner(k);

    // --- HUD (fixed so it ignores object motion) ---
    // Offset by the safe-area insets so nothing hides under a notch / status bar.
    const ins = safeInsets();
    const topY = ins.top + 18;

    const scoreLabel = k.add([
      k.text("0", { size: 44 }),
      k.pos(ins.left + 22, topY),
      k.anchor("topleft"),
      k.color(...YELLOW),
      k.outline(4, k.rgb(0, 0, 0)),
      k.fixed(),
      k.z(100),
    ]);

    // Timer sits in the top-right corner.
    const timeLabel = k.add([
      k.text("30", { size: 44 }),
      k.pos(k.width() - ins.right - 22, topY),
      k.anchor("topright"),
      k.color(255, 255, 255),
      k.outline(4, k.rgb(0, 0, 0)),
      k.fixed(),
      k.z(100),
    ]);

    // Mute icon sits top-center (between score and timer).
    addMuteButton(k, "top-center");

    // Cheese-knife pointer.
    addKnifeCursor(k);

    // --- What happens when the slicer cuts something ---
    const handleSlice = (result: SliceResult, ctx: SliceContext) => {
      // Once the round is over, ignore any late slices (e.g. a swipe still in
      // progress during the end-of-round pause) so they can't change the score
      // after it's been tallied and saved.
      if (roundOver) return;

      if (result.kind === "cheese") {
        let pts = config.CHEESE_POINTS;
        const isCombo = ctx.combo >= 2;
        if (isCombo) pts += config.COMBO_BONUS;
        score.add(pts);
        playRandomFart(k);
        floatingText(k, ctx.pos, `+${pts}`, k.rgb(...YELLOW));
        if (isCombo) {
          floatingText(
            k,
            ctx.pos.add(0, -44),
            `COMBO x${ctx.combo}!`,
            k.rgb(...GOLD),
          );
        }
      } else if (result.kind === "wine") {
        score.add(config.WINE_PENALTY);
        playGlassBreak(k);
        floatingText(k, ctx.pos, `${config.WINE_PENALTY}`, k.rgb(...RED));
      } else if (result.kind === "wheel") {
        if (result.broke) {
          score.add(config.WHEEL_BREAK_POINTS);
          timeLeft += config.WHEEL_BREAK_TIME_BONUS;
          playExplosion(k);
          floatingText(
            k,
            ctx.pos,
            `+${config.WHEEL_BREAK_POINTS}  +${config.WHEEL_BREAK_TIME_BONUS}s`,
            k.rgb(...GOLD),
          );
        } else {
          score.add(config.WHEEL_SLICE_POINTS);
          timeLeft += config.WHEEL_TIME_BONUS;
          playRandomFart(k);
          floatingText(
            k,
            ctx.pos,
            `+${config.WHEEL_TIME_BONUS}s`,
            k.rgb(...CYAN),
          );
        }
      }
    };

    createSlicer(k, handleSlice);

    // --- Main loop: spawn, tick the clock, refresh HUD ---
    k.onUpdate(() => {
      if (roundOver) return;

      elapsed += k.dt();
      timeLeft -= k.dt();

      const progress = Math.min(1, elapsed / config.ROUND_SECONDS);
      spawner.update(progress);

      scoreLabel.text = `${score.value}`;
      timeLabel.text = `${Math.max(0, Math.ceil(timeLeft))}`;
      // Flash the timer red in the final 5 seconds.
      timeLabel.color =
        timeLeft <= 5 ? k.rgb(...RED) : k.rgb(255, 255, 255);

      if (timeLeft <= 0) {
        roundOver = true;
        // Capture the final score ONCE so the saved high score and the score
        // shown on the end screen are guaranteed to be the same number.
        const finalScore = score.value;
        const isNewBest = saveHighScore(finalScore);
        playRoundEnd(k);
        k.wait(0.4, () => {
          k.go("end", { score: finalScore, isNewBest });
        });
      }
    });
  });
}
