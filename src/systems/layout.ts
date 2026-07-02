// Responsive layout helper.
//
// The menus lay their content out in "reference pixels" (as if on a ~420x760
// portrait phone) and multiply every size/offset by this scale. Taking the
// SMALLER of the width- and height-ratios means the whole block shrinks to fit
// whichever dimension is tight — so nothing is cut off on a small phone or in a
// short landscape window. Clamped so it never gets comically tiny or huge.

import type { KAPLAYCtx } from "kaplay";

const REF_W = 420;
const REF_H = 760;

export function layoutScale(k: KAPLAYCtx): number {
  const s = Math.min(k.width() / REF_W, k.height() / REF_H);
  return Math.max(0.35, Math.min(1.15, s));
}
