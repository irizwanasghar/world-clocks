import { app, screen } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import type {
  AppSettings,
  ClockId,
  ClockOverrides,
  ClockState,
  GlobalSettings,
  MasterPanelState
} from '../../src/types'
import { CLOCK_DEFINITIONS } from '../../src/data/timezones'

const STORE_FILE = join(app.getPath('userData'), 'world-clocks-settings.json')

const DEFAULT_GLOBAL: GlobalSettings = {
  alwaysOnTop: true,
  showSeconds: false,
  use12Hour: true,
  opacity: 0.9,
  theme: 'dark',
  launchAtStartup: false
}

export const DEFAULT_WIDTH = 236
const DEFAULT_HEIGHT = 104
const MARGIN = 12
const RIGHT_MARGIN = 22
export const STATES_BUTTON_HEIGHT = 54
/** Height of the master settings widget in its default, collapsed (button-only)
 *  state — this is what the layout stacks around. Expanding it grows the
 *  window downward without affecting the other widgets' positions. */
export const MASTER_COLLAPSED_HEIGHT = STATES_BUTTON_HEIGHT
export const MASTER_DEFAULT_EXPANDED_HEIGHT = 200

const DEFAULT_MASTER_PANEL: MasterPanelState = {
  width: DEFAULT_WIDTH,
  height: MASTER_DEFAULT_EXPANDED_HEIGHT
}

// Row 0 = master settings widget (collapsed height), rows 1..N = clock
// cards, last row = "See all states".
const ROW_HEIGHTS = [
  MASTER_COLLAPSED_HEIGHT,
  ...CLOCK_DEFINITIONS.map(() => DEFAULT_HEIGHT),
  STATES_BUTTON_HEIGHT
]
const MASTER_ROW = 0
const FIRST_CLOCK_ROW = 1
const STATES_BUTTON_ROW = ROW_HEIGHTS.length - 1

/** Stacks all widgets (master panel, clock cards, states button) as one
 *  vertical group along the right edge of the primary display's work area,
 *  so the whole group is centered/clamped together — the master panel can
 *  never end up pushed off the top of the screen on its own. */
function defaultPositionForRow(row: number): { x: number; y: number } {
  const display = screen.getPrimaryDisplay()
  const { x: wx, y: wy, width, height } = display.workArea
  const x = wx + width - DEFAULT_WIDTH - RIGHT_MARGIN
  const totalHeight = ROW_HEIGHTS.reduce((sum, h) => sum + h, 0) + (ROW_HEIGHTS.length - 1) * MARGIN
  const startY = wy + Math.max(MARGIN, (height - totalHeight) / 2)
  let y = startY
  for (let i = 0; i < row; i++) {
    y += ROW_HEIGHTS[i] + MARGIN
  }
  return { x, y }
}

function defaultPositionFor(clockIndex: number): { x: number; y: number } {
  return defaultPositionForRow(FIRST_CLOCK_ROW + clockIndex)
}

export function defaultStatesButtonPosition(): { x: number; y: number } {
  return defaultPositionForRow(STATES_BUTTON_ROW)
}

export function defaultMasterSettingsPosition(): { x: number; y: number } {
  return defaultPositionForRow(MASTER_ROW)
}

function defaultClockState(index: number): ClockState {
  const { x, y } = defaultPositionFor(index)
  return {
    x,
    y,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    visible: true,
    enabled: true
  }
}

function buildDefaultSettings(): AppSettings {
  const clocks = {} as Record<ClockId, ClockState>
  CLOCK_DEFINITIONS.forEach((def, i) => {
    clocks[def.id] = defaultClockState(i)
  })
  return { clocks, global: { ...DEFAULT_GLOBAL }, masterPanel: { ...DEFAULT_MASTER_PANEL } }
}

function isValidMasterPanel(value: unknown): value is MasterPanelState {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.width === 'number' && typeof v.height === 'number'
}

function isValidClockState(value: unknown): value is ClockState {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.x === 'number' &&
    typeof v.y === 'number' &&
    typeof v.width === 'number' &&
    typeof v.height === 'number' &&
    typeof v.visible === 'boolean' &&
    typeof v.enabled === 'boolean'
  )
}

function isValidSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (!v.clocks || typeof v.clocks !== 'object') return false
  if (!v.global || typeof v.global !== 'object') return false
  if (!isValidMasterPanel(v.masterPanel)) return false
  const clocks = v.clocks as Record<string, unknown>
  for (const def of CLOCK_DEFINITIONS) {
    if (!isValidClockState(clocks[def.id])) return false
  }
  return true
}

function loadRaw(): AppSettings {
  try {
    if (!existsSync(STORE_FILE)) return buildDefaultSettings()
    const raw = readFileSync(STORE_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!isValidSettings(parsed)) {
      return mergeWithDefaults(parsed)
    }
    return parsed
  } catch {
    return buildDefaultSettings()
  }
}

/** Best-effort merge for partially corrupt/older settings files. */
function mergeWithDefaults(parsed: unknown): AppSettings {
  const defaults = buildDefaultSettings()
  if (!parsed || typeof parsed !== 'object') return defaults
  const p = parsed as Partial<AppSettings>
  const clocks = { ...defaults.clocks }
  if (p.clocks) {
    for (const def of CLOCK_DEFINITIONS) {
      const c = (p.clocks as Record<string, unknown>)[def.id]
      if (isValidClockState(c)) clocks[def.id] = c
    }
  }
  const global = { ...defaults.global, ...(p.global ?? {}) }
  const masterPanel = isValidMasterPanel(p.masterPanel) ? p.masterPanel : defaults.masterPanel
  return { clocks, global, masterPanel }
}

function persist(settings: AppSettings): void {
  const dir = dirname(STORE_FILE)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(STORE_FILE, JSON.stringify(settings, null, 2), 'utf-8')
}

class SettingsStore {
  private settings: AppSettings

  constructor() {
    this.settings = loadRaw()
    this.validatePositions()
  }

  private validatePositions(): void {
    const displays = screen.getAllDisplays()
    CLOCK_DEFINITIONS.forEach((def, i) => {
      const state = this.settings.clocks[def.id]
      const withinDisplay = displays.some((d) => {
        const b = d.bounds
        return (
          state.x >= b.x - state.width &&
          state.x <= b.x + b.width &&
          state.y >= b.y - state.height &&
          state.y <= b.y + b.height
        )
      })
      if (!withinDisplay) {
        const { x, y } = defaultPositionFor(i)
        this.settings.clocks[def.id] = { ...state, x, y }
      }
    })
    persist(this.settings)
  }

  getAll(): AppSettings {
    return this.settings
  }

  getClock(id: ClockId): ClockState {
    return this.settings.clocks[id]
  }

  updateClock(id: ClockId, partial: Partial<ClockState>): AppSettings {
    this.settings.clocks[id] = { ...this.settings.clocks[id], ...partial }
    persist(this.settings)
    return this.settings
  }

  updateGlobal(partial: Partial<GlobalSettings>): AppSettings {
    this.settings.global = { ...this.settings.global, ...partial }
    persist(this.settings)
    return this.settings
  }

  /** Removes the given per-clock overrides from every clock, so a master
   *  settings change always applies uniformly across all cards. */
  clearClockOverrides(keys: Array<keyof ClockOverrides>): AppSettings {
    CLOCK_DEFINITIONS.forEach((def) => {
      const clock = { ...this.settings.clocks[def.id] }
      keys.forEach((key) => delete clock[key])
      this.settings.clocks[def.id] = clock
    })
    persist(this.settings)
    return this.settings
  }

  getMasterPanel(): MasterPanelState {
    return this.settings.masterPanel
  }

  updateMasterPanel(partial: Partial<MasterPanelState>): AppSettings {
    this.settings.masterPanel = { ...this.settings.masterPanel, ...partial }
    persist(this.settings)
    return this.settings
  }

  resetPositions(): AppSettings {
    CLOCK_DEFINITIONS.forEach((def, i) => {
      const { x, y } = defaultPositionFor(i)
      this.settings.clocks[def.id] = {
        ...this.settings.clocks[def.id],
        x,
        y,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT
      }
    })
    this.settings.masterPanel = { ...DEFAULT_MASTER_PANEL }
    persist(this.settings)
    return this.settings
  }
}

let instance: SettingsStore | null = null

export function initSettingsStore(): void {
  if (!instance) instance = new SettingsStore()
}

export const settingsStore = {
  getAll: (): AppSettings => getInstance().getAll(),
  getClock: (id: ClockId): ClockState => getInstance().getClock(id),
  updateClock: (id: ClockId, partial: Partial<ClockState>): AppSettings =>
    getInstance().updateClock(id, partial),
  updateGlobal: (partial: Partial<GlobalSettings>): AppSettings =>
    getInstance().updateGlobal(partial),
  clearClockOverrides: (keys: Array<keyof ClockOverrides>): AppSettings =>
    getInstance().clearClockOverrides(keys),
  getMasterPanel: (): MasterPanelState => getInstance().getMasterPanel(),
  updateMasterPanel: (partial: Partial<MasterPanelState>): AppSettings =>
    getInstance().updateMasterPanel(partial),
  resetPositions: (): AppSettings => getInstance().resetPositions()
}

function getInstance(): SettingsStore {
  if (!instance) instance = new SettingsStore()
  return instance
}
