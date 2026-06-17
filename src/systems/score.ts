// Scoring + the persistent high score (saved in the browser's localStorage so it
// survives reloads and works offline).

const HIGH_SCORE_KEY = "cheese-ninja:highScore";

/** Read the saved high score (0 if none yet, or if storage is unavailable). */
export function getHighScore(): number {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0; // e.g. private mode with storage disabled
  }
}

/**
 * Save `score` if it beats the stored high score.
 * Returns true if a new record was set.
 */
export function saveHighScore(score: number): boolean {
  const best = getHighScore();
  if (score > best) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
    } catch {
      /* ignore storage failures — the round still ends normally */
    }
    return true;
  }
  return false;
}

/**
 * Tiny mutable score tracker for a single round. Keeps the running total and
 * never lets it drop below zero (slicing wine can subtract points).
 */
export function createScore() {
  let total = 0;
  return {
    get value() {
      return total;
    },
    add(points: number) {
      total = Math.max(0, total + points);
      return total;
    },
  };
}
