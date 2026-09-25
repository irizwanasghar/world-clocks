import { app, screen } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import type { AppSettings, ClockId, ClockState, GlobalSettings } from '../../src/types'
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

const DEFAULT_WIDTH = 280
const DEFAULT_HEIGHT = 130
const MARGIN = 16

/** Stacks widgets vertically along the right edge of the primary display's work area. */
function defaultPositionFor(index: number): { x: number; y: number } {
  const display = screen.getPrimaryDisplay()
  const { x: wx, y: wy, width, height } = display.workArea
  const x = wx + width - DEFAULT_WIDTH - MARGIN
  const totalHeight = CLOCK_DEFINITIONS.length * DEFAULT_HEIGHT + (CLOCK_DEFINITIONS.length - 1) * MARGIN
  const startY = wy + Math.max(MARGIN, (height - totalHeight) / 2)
  const y = startY + index * (DEFAULT_HEIGHT + MARGIN)
  return { x, y }
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
  return { clocks, global: { ...DEFAULT_GLOBAL } }
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
  return { clocks, global }
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
  resetPositions: (): AppSettings => getInstance().resetPositions()
}

function getInstance(): SettingsStore {
  if (!instance) instance = new SettingsStore()
  return instance
}
