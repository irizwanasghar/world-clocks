import type { ClockState, EffectiveClockSettings, GlobalSettings } from '../types'

export function getEffectiveSettings(
  clockState: ClockState,
  global: GlobalSettings
): EffectiveClockSettings {
  return {
    showSeconds: clockState.showSeconds ?? global.showSeconds,
    use12Hour: clockState.use12Hour ?? global.use12Hour,
    alwaysOnTop: clockState.alwaysOnTop ?? global.alwaysOnTop,
    opacity: clockState.opacity ?? global.opacity
  }
}
