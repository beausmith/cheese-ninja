// Entry point: create the KAPLAY context, load assets, wire scenes, and start.

import kaplay from "kaplay";
import { loadGameAssets } from "./loadAssets";
import { initAudio } from "./systems/audio";
import { initSafeArea } from "./systems/safeArea";
import { registerStartScene } from "./scenes/start";
import { registerGameScene } from "./scenes/game";
import { registerEndScene } from "./scenes/end";

// Fill the whole window and stay responsive to any viewport. We use k.* methods
// (global: false) instead of polluting the global namespace — clearer for a
// teaching codebase.
const k = kaplay({
  background: [42, 26, 7], // deep cheese-rind brown
  touchToMouse: true, // treat touch as mouse so one input path covers both
  global: false,
  pixelDensity: Math.min(2, window.devicePixelRatio || 1),
  // No fixed width/height: the canvas fills the page and resizes with it.
});

// Register every sprite + sound, then set up audio unlock/mute + safe-area insets.
loadGameAssets(k);
initAudio(k);
initSafeArea();

// Wire up the three scenes.
registerStartScene(k);
registerGameScene(k);
registerEndScene(k);

// Wait for all assets to finish loading, then show the start screen.
k.onLoad(() => {
  k.go("start");
});
