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
  countryCode: 'US' | 'PK'
  /** Reserved for v2 business-hours indicator. */
  businessHours?: BusinessHours
}

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

/** Per-clock overrides for the four "quick" settings. Undefined means "use
 *  the global value". Set by that clock's own gear menu; cleared whenever
 *  the master settings widget changes the corresponding global value, so a
 *  master change always applies to every card. */
export interface ClockOverrides {
  showSeconds?: boolean
  use12Hour?: boolean
  alwaysOnTop?: boolean
  opacity?: number
}

export interface ClockState extends WindowBounds, ClockOverrides {
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
  /** Size multiplier applied to every widget (clock cards, states button,
   *  master panel) when resized all at once from the master settings panel. */
  cardScale: number
  /** Which edge of the primary display the widget stack docks to. */
  dockSide: 'left' | 'right'
  /** Free API key from api.census.gov/data/key_signup.html — the Census
   *  Bureau's place-level population queries require one. Empty until the
   *  user adds their own. */
  censusApiKey: string
  /** Whether the entire widget stack (all clock cards + the 3 buttons) is
   *  currently tucked off toward the dock edge, leaving only a sliver
   *  visible. Toggled together via the single peek arrow, not per-widget. */
  peeked: boolean
}

export interface EffectiveClockSettings {
  showSeconds: boolean
  use12Hour: boolean
  alwaysOnTop: boolean
  opacity: number
}

/** Persisted size of the master settings panel while expanded, so a manual
 *  resize sticks across launches even though the panel starts collapsed. */
export interface MasterPanelState {
  width: number
  height: number
}

export interface AppSettings {
  clocks: Record<ClockId, ClockState>
  global: GlobalSettings
  masterPanel: MasterPanelState
}

export interface PopulationResult {
  name: string
  population: number
  year: number
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
  openStatesWindow: () => Promise<void>
  setClockMenuOpen: (id: ClockId, open: boolean) => Promise<void>
  toggleGlobalPeek: () => Promise<AppSettings>
  openMasterSettingsWindow: () => Promise<void>
  setCardScale: (scale: number) => Promise<AppSettings>
  setDockSide: (side: 'left' | 'right') => Promise<AppSettings>
  openPopulationWindow: () => Promise<void>
  lookupPopulation: (
    city: string,
    stateAbbr: string
  ) => Promise<{ ok: true; result: PopulationResult | null } | { ok: false; error: string }>
  listStateCities: (
    stateAbbr: string
  ) => Promise<{ ok: true; results: PopulationResult[] } | { ok: false; error: string }>
  searchCitiesNationwide: (
    query: string
  ) => Promise<{ ok: true; results: PopulationResult[] } | { ok: false; error: string }>
  onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void
  onClockMenuClosed: (callback: () => void) => () => void
}

declare global {
  interface Window {
    desktopAPI: DesktopAPI
  }
}
