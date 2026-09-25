import type { BrowserWindow, Rectangle } from 'electron'

/** Builds a scanline approximation of a rounded rectangle as a list of 1px-tall
 *  rects, for use with BrowserWindow.setShape(). This clips the window's real
 *  OS-level paint/hit-test region to the rounded shape, so nothing — a stray
 *  compositor artifact, a focus border, a resize grip — can ever render
 *  outside it, regardless of what's happening in the page's own CSS. */
function roundedRectShape(width: number, height: number, radius: number): Rectangle[] {
  const r = Math.min(radius, Math.floor(Math.min(width, height) / 2))
  const rects: Rectangle[] = []
  for (let y = 0; y < height; y++) {
    let inset = 0
    if (y < r) {
      const dy = r - (y + 0.5)
      inset = Math.round(r - Math.sqrt(Math.max(0, r * r - dy * dy)))
    } else if (y >= height - r) {
      const dy = y + 0.5 - (height - r)
      inset = Math.round(r - Math.sqrt(Math.max(0, r * r - dy * dy)))
    }
    const w = Math.max(1, width - inset * 2)
    rects.push({ x: inset, y, width: w, height: 1 })
  }
  return rects
}

/** Applies (and keeps applied) a rounded-rect window shape matching the
 *  window's current size. Call once after the window is shown, and again on
 *  every resize. */
export function applyRoundedShape(win: BrowserWindow, radius = 18): void {
  if (win.isDestroyed()) return
  const [width, height] = win.getSize()
  try {
    win.setShape(roundedRectShape(width, height, radius))
  } catch {
    // setShape is a best-effort visual polish; never let it crash the app.
  }
}
