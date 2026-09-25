export type ClockId = 'eastern' | 'central' | 'mountain' | 'pacific' | 'pakistan'

export type Theme = 'dark' | 'light' | 'system'

export interface BusinessHours {
  /** Reserved for v2. Not rendered or enabled in v1. */
  startHour: number
  endHour: number
  daysActive: number[]
}

export interface ClockDefinition {
  id: ClockId
  label: string
  city: string
  timezone: string
  flagEmoji: string
  /** Reserved for v2 business-hours indicator. */
  businessHours?: BusinessHours
}

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface ClockState extends WindowBounds {
  visible: boolean
  enabled: boolean
}

export interface GlobalSettings {
  alwaysOnTop: boolean
  showSeconds: boolean
  use12Hour: boolean
  opacity: number
  theme: Theme
  launchAtStartup: boolean
}

export interface AppSettings {
  clocks: Record<ClockId, ClockState>
  global: GlobalSettings
}

export interface DesktopAPI {
  getSettings: () => Promise<AppSettings>
  saveGlobalSettings: (settings: Partial<GlobalSettings>) => Promise<AppSettings>
  saveClockState: (id: ClockId, state: Partial<ClockState>) => Promise<AppSettings>
  showClock: (id: ClockId) => Promise<void>
  hideClock: (id: ClockId) => Promise<void>
  toggleClockEnabled: (id: ClockId, enabled: boolean) => Promise<AppSettings>
  showAll: () => Promise<void>
  hideAll: () => Promise<void>
  resetPositions: () => Promise<AppSettings>
  getClockId: () => Promise<ClockId | null>
  moveClockWindow: (id: ClockId, x: number, y: number) => Promise<void>
  resizeClockWindow: (id: ClockId, width: number, height: number) => Promise<void>
  closeSettingsWindow: () => Promise<void>
  onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void
}

declare global {
  interface Window {
    desktopAPI: DesktopAPI
  }
}
