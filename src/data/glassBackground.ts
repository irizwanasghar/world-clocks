/** Computes the card's translucent glass background directly as an rgba
 *  gradient string, with the opacity value baked in. This sidesteps relying
 *  on a CSS custom property nested inside rgba() (`rgba(r,g,b,var(--a)))`)
 *  for anything opacity-sensitive, so a slider change can never fail to
 *  visually apply due to a custom-property resolution edge case. */
export function glassGradient(isDark: boolean, opacity: number): string {
  const a = Math.min(1, Math.max(0, opacity))
  const [from, to] = isDark ? (['42,42,52', '24,24,30'] as const) : (['255,255,255', '240,241,247'] as const)
  return `linear-gradient(160deg, rgba(${from},${a}), rgba(${to},${a}))`
}
