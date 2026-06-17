// Reads the device "safe area" insets (the notch / Dynamic Island / rounded
// corners / home indicator margins) so the on-canvas HUD can stay clear of them.
//
// The browser only exposes these via CSS `env(safe-area-inset-*)`, and only when
// the viewport is `viewport-fit=cover` (set in index.html). Since the game draws
// its HUD on a canvas (not with CSS), we read the values into JS by measuring a
// hidden probe element whose padding is set to those env() values.

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

let insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
let probe: HTMLDivElement | null = null;

function measure(): Insets {
  if (!probe) {
    probe = document.createElement("div");
    probe.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      "width:0",
      "height:0",
      "visibility:hidden",
      "pointer-events:none",
      "padding-top:env(safe-area-inset-top)",
      "padding-right:env(safe-area-inset-right)",
      "padding-bottom:env(safe-area-inset-bottom)",
      "padding-left:env(safe-area-inset-left)",
    ].join(";");
    document.body.appendChild(probe);
  }
  const cs = getComputedStyle(probe);
  return {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
}

/** Call once at startup. Reads the insets and keeps them fresh on rotate/resize. */
export function initSafeArea(): void {
  insets = measure();
  const refresh = () => {
    insets = measure();
  };
  window.addEventListener("resize", refresh);
  window.addEventListener("orientationchange", refresh);
}

/** Current safe-area insets in CSS pixels (which match KAPLAY's coordinate units). */
export function safeInsets(): Insets {
  return insets;
}
