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
  // Arcs are described RELATIVE to the screen so objects reach the same part of
  // the playfield on ANY device (small phones included) instead of overshooting.
  // The engine derives the actual launch velocity + gravity from these:
  //   PEAK    = how high the arc rises, as a fraction of screen height
  //             (1.0 ≈ near the top; 0.6 ≈ about mid-screen)
  //   AIRTIME = how long the object stays airborne, in seconds (bigger = floatier)
  // Raise PEAK to fly higher; raise AIRTIME to slow things down / add hang time.
  ARC_PEAK_MIN: 0.62,
  ARC_PEAK_MAX: 1.0,
  ARC_AIRTIME_MIN: 1.7,
  ARC_AIRTIME_MAX: 2.2,
  // Max sideways drift as a fraction of screen WIDTH per second (keeps objects
  // from flying off the sides on narrow screens).
  LAUNCH_VX_SPREAD_FRAC: 0.3,
  SPIN_SPEED: 180, // Max spin (degrees/sec) given to objects and halves

  // Giant wheel: rises high and hangs a bit longer so it's easy to slice several
  // times before it falls. Same relative units as above.
  WHEEL_PEAK_MIN: 0.78,
  WHEEL_PEAK_MAX: 0.92,
  WHEEL_AIRTIME_MIN: 2.5,
  WHEEL_AIRTIME_MAX: 3.1,
  WHEEL_SCALE: 1.8, // Wheel is drawn larger than normal cheese

  // --- Visuals ---
  OBJECT_SCALE: 0.55, // Base draw scale for the 256x256 sprites
  HALF_SPLIT_VX: 250, // How fast the two halves fly apart after a slice
} as const;

// Sprites are authored on a 256x256 canvas; this is the on-screen size of a
// normal object after OBJECT_SCALE is applied. Used for hit-testing.
export const SPRITE_SIZE = 256;
