// All the gameplay "knobs" live here so they're easy to find and tweak.
// Change a number, reload the game, and you'll see the effect immediately.
// (This is on purpose — it's a great way to learn how the game is balanced.)

export const config = {
  // --- Round ---
  ROUND_SECONDS: 30, // Length of one round

  // --- Scoring ---
  CHEESE_POINTS: 10, // Per cheese sliced
  COMBO_BONUS: 5, // Extra per cheese when 2+ are sliced in a single swipe
  WINE_PENALTY: -15, // Per wine bottle sliced (negative = loses points)

  // --- Giant cheese wheel (the bonus object) ---
  WHEEL_SLICE_POINTS: 5, // Points per slice landed on the wheel
  WHEEL_TIME_BONUS: 2, // Seconds added per wheel slice
  WHEEL_SLICES_TO_BREAK: 3, // Slices needed to fully shatter the wheel
  WHEEL_BREAK_TIME_BONUS: 5, // Extra seconds when the wheel fully breaks
  WHEEL_BREAK_POINTS: 25, // Extra points when the wheel fully breaks

  // --- Spawning / difficulty ramp ---
  SPAWN_INTERVAL_START: 1.2, // Seconds between spawns at round start
  SPAWN_INTERVAL_END: 0.6, // Seconds between spawns by the end (faster = harder)
  WINE_SPAWN_CHANCE: 0.15, // Chance a normal spawn is wine instead of cheese
  WHEEL_SPAWN_CHANCE_PER_SEC: 0.07, // Per-second chance to roll a rare giant wheel

  // --- Swiping ---
  MIN_SWIPE_SPEED: 900, // Min pointer speed (px/sec) for a swipe to count as a slice
  TRAIL_LENGTH: 12, // How many recent pointer points the blade trail keeps

  // --- Object motion (launch arcs) ---
  // These three move together: to slow objects down WITHOUT making them fly off
  // the top, lower gravity and the launch velocities by similar amounts. Lower
  // gravity = more hang time (floatier); lower LAUNCH_VY = gentler arcs; lower
  // LAUNCH_VX_SPREAD = slower sideways travel. (Was 1800 / -1500..-1900 / 420.)
  GRAVITY: 1800, // Downward acceleration (px/sec^2) — lower = floatier/slower
  LAUNCH_VY_MIN: -1500, // Upward launch velocity range (negative = up)
  LAUNCH_VY_MAX: -1900,
  LAUNCH_VX_SPREAD: 400, // Max horizontal drift either direction
  SPIN_SPEED: 180, // Max spin (degrees/sec) given to objects and halves

  // Giant wheel: launches high (and stays airborne a while) so it's sliceable
  // several times. Make these MORE negative to fly higher, less to fly lower.
  WHEEL_VY_MIN: -1600,
  WHEEL_VY_MAX: -1850,
  WHEEL_SCALE: 1.8, // Wheel is drawn larger than normal cheese

  // --- Visuals ---
  OBJECT_SCALE: 0.55, // Base draw scale for the 256x256 sprites
  HALF_SPLIT_VX: 250, // How fast the two halves fly apart after a slice
} as const;

// Sprites are authored on a 256x256 canvas; this is the on-screen size of a
// normal object after OBJECT_SCALE is applied. Used for hit-testing.
export const SPRITE_SIZE = 256;
