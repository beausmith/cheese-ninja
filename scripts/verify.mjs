// Headless smoke test: load the game, click Play, simulate a swipe, screenshot.
import { chromium } from "playwright";

const URL = "http://localhost:5173/";
const errors = [];
const logs = [];

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 414, height: 896 } });
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => errors.push(String(e)));
const missing = [];
page.on("response", (r) => { if (r.status() === 404) missing.push(r.url()); });

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1500); // let KAPLAY load assets + show start scene
await page.screenshot({ path: "/tmp/cn-start.png" });

// Click roughly where the PLAY button is (center, ~78% down).
const box = page.viewportSize();
await page.mouse.click(box.width / 2, box.height * 0.78);
await page.waitForTimeout(1200);

// Simulate several fast swipes across the playfield to slice things.
for (let s = 0; s < 12; s++) {
  const y = box.height * (0.35 + 0.04 * (s % 6));
  await page.mouse.move(20, y);
  await page.mouse.down();
  for (let i = 0; i <= 8; i++) {
    await page.mouse.move(20 + (box.width - 40) * (i / 8), y, { steps: 1 });
  }
  await page.mouse.up();
  await page.waitForTimeout(180);
}
await page.screenshot({ path: "/tmp/cn-game.png" });

await browser.close();

console.log("=== 404s ===");
console.log(missing.length ? missing.join("\n") : "(none)");
console.log("\n=== PAGE ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
console.log("\n=== CONSOLE (last 25) ===");
console.log(logs.slice(-25).join("\n") || "(none)");
