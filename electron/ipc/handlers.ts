import { ipcMain, BrowserWindow, screen } from 'electron'
import type { ClockId, ClockOverrides, ClockState, GlobalSettings } from '../../src/types'
import {
  settingsStore,
  defaultStatesButtonPosition,
  defaultMasterSettingsPosition,
  defaultPopulationButtonPosition,
  getScaledLayout,
  peekedX,
  DEFAULT_WIDTH,
  STATES_BUTTON_HEIGHT,
  MASTER_COLLAPSED_HEIGHT,
  POPULATION_BUTTON_HEIGHT,
  PEEK_BUTTON_WIDTH,
  PEEK_BUTTON_GAP
} from '../services/settings'
import { applyRoundedShape } from '../services/windowShape'
import { CLOCK_DEFINITIONS } from '../../src/data/timezones'
import {
  createClockWindow,
  getClockWindow,
  getAllClockWindows,
  setClockMenuExpanded,
  suppressClockSave
} from '../windows/createClockWindow'
import { getSettingsWindow } from '../windows/createSettingsWindow'
import { createStatesWindow } from '../windows/createStatesWindow'
import { getStatesButtonWindow } from '../windows/createStatesButtonWindow'
import { getMasterSettingsWindow } from '../windows/createMasterSettingsWindow'
import { createMasterModalWindow } from '../windows/createMasterModalWindow'
import { getPopulationButtonWindow } from '../windows/createPopulationButtonWindow'
import { createPopulationWindow } from '../windows/createPopulationWindow'
import { getPeekButtonWindow } from '../windows/createPeekButtonWindow'
import { lookupCityPopulation, MissingApiKeyError } from '../services/census'
import { refreshTrayMenu } from '../tray/tray'

/** Pushes the latest settings to every window that reads them, not just the
 *  settings window — otherwise a change made in one widget (e.g. the master
 *  settings panel) never reaches the clock cards, which only fetch settings
 *  once on load and then rely entirely on this push to stay in sync. */
function broadcastSettings(): void {
  const settings = settingsStore.getAll()
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.webContents.send('settings-changed', settings)
  })
  refreshTrayMenu()
}

// Only one clock's gear menu can be open at a time. Each card is its own
// BrowserWindow with no shared renderer state, so the main process is the
// only place that can know "another one is open" and close it.
let openMenuOwner: ClockId | null = null

function closeOpenMenu(): void {
  if (openMenuOwner === null) return
  setClockMenuExpanded(openMenuOwner, false)
  const win = getClockWindow(openMenuOwner)
  if (win && !win.isDestroyed()) win.webContents.send('clock-menu-closed')
  openMenuOwner = null
}

/** Moves every widget window (5 clock cards + 3 buttons + the peek arrow
 *  itself) to either its normal position or its peeked-away position, all
 *  at once. Only x moves; y and size are untouched. Used by the toggle
 *  handler and again at startup if the app launched with peeked already
 *  true from last session. Button windows don't persist their own x — it's
 *  always recomputed fresh from the current scale/dockSide via
 *  getScaledLayout, same as everywhere else those windows are positioned. */
export function applyPeekState(peeked: boolean): void {
  const global = settingsStore.getAll().global
  const side = global.dockSide
  const layout = getScaledLayout(global.cardScale, side)
  const workArea = screen.getPrimaryDisplay().workArea

  getAllClockWindows().forEach((win, id) => {
    if (win.isDestroyed()) return
    const state = settingsStore.getClock(id)
    // Prevent the move listener (which persists user drags) from saving
    // this programmatic move as the card's new "normal" position — without
    // this, un-peeking would restore to the peeked position itself, since
    // that's what got persisted the moment it was peeked.
    suppressClockSave(id)
    const x = peeked ? peekedX(state.width, side, workArea) : state.x
    win.setPosition(x, state.y)
  })

  const buttons: Array<[ReturnType<typeof getStatesButtonWindow>, number]> = [
    [getStatesButtonWindow(), layout.statesButtonY],
    [getMasterSettingsWindow(), layout.masterY],
    [getPopulationButtonWindow(), layout.populationButtonY]
  ]
  buttons.forEach(([win, y]) => {
    if (!win || win.isDestroyed()) return
    const x = peeked ? peekedX(layout.cardWidth, side, workArea) : layout.x
    win.setPosition(x, y)
  })

  // The arrow itself also follows the stack, staying just outside whichever
  // position (normal or peeked) the stack currently occupies, so it's never
  // left stranded far from the visible content.
  const peekBtnWin = getPeekButtonWindow()
  if (peekBtnWin && !peekBtnWin.isDestroyed()) {
    const stackX = peeked ? peekedX(layout.cardWidth, side, workArea) : layout.x
    const peekBtnX =
      side === 'right' ? stackX - PEEK_BUTTON_WIDTH - PEEK_BUTTON_GAP : stackX + layout.cardWidth + PEEK_BUTTON_GAP
    peekBtnWin.setPosition(peekBtnX, layout.peekButtonY)
  }
}

function applyAlwaysOnTopToAll(alwaysOnTop: boolean): void {
  getAllClockWindows().forEach((win) => {
    if (!win.isDestroyed()) win.setAlwaysOnTop(alwaysOnTop, 'screen-saver')
  })
  const statesButtonWin = getStatesButtonWindow()
  if (statesButtonWin && !statesButtonWin.isDestroyed()) {
    statesButtonWin.setAlwaysOnTop(alwaysOnTop, 'screen-saver')
  }
  const masterWin = getMasterSettingsWindow()
  if (masterWin && !masterWin.isDestroyed()) {
    masterWin.setAlwaysOnTop(alwaysOnTop, 'screen-saver')
  }
  const populationBtnWin = getPopulationButtonWindow()
  if (populationBtnWin && !populationBtnWin.isDestroyed()) {
    populationBtnWin.setAlwaysOnTop(alwaysOnTop, 'screen-saver')
  }
  const peekBtnWin = getPeekButtonWindow()
  if (peekBtnWin && !peekBtnWin.isDestroyed()) {
    peekBtnWin.setAlwaysOnTop(alwaysOnTop, 'screen-saver')
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle('get-settings', () => settingsStore.getAll())

  ipcMain.handle('save-global-settings', (_e, partial: Partial<GlobalSettings>) => {
    let settings = settingsStore.updateGlobal(partial)
    // A master settings change always wins over any per-card override for
    // the fields it touches, so every card reflects it uniformly.
    const overrideKeys = (['showSeconds', 'use12Hour', 'alwaysOnTop', 'opacity'] as const).filter(
      (key) => key in partial
    ) as Array<keyof ClockOverrides>
    if (overrideKeys.length > 0) {
      settings = settingsStore.clearClockOverrides(overrideKeys)
    }
    if (typeof partial.alwaysOnTop === 'boolean') {
      applyAlwaysOnTopToAll(partial.alwaysOnTop)
    }
    broadcastSettings()
    return settings
  })

  ipcMain.handle('save-clock-state', (_e, id: ClockId, partial: Partial<ClockState>) => {
    const settings = settingsStore.updateClock(id, partial)
    if (typeof partial.alwaysOnTop === 'boolean') {
      const win = getClockWindow(id)
      if (win && !win.isDestroyed()) win.setAlwaysOnTop(partial.alwaysOnTop, 'screen-saver')
    }
    broadcastSettings()
    return settings
  })

  ipcMain.handle('show-clock', (_e, id: ClockId) => {
    settingsStore.updateClock(id, { visible: true })
    const win = createClockWindow(id)
    win.show()
    broadcastSettings()
  })

  ipcMain.handle('hide-clock', (_e, id: ClockId) => {
    settingsStore.updateClock(id, { visible: false })
    const win = getClockWindow(id)
    if (win && !win.isDestroyed()) win.hide()
    broadcastSettings()
  })

  ipcMain.handle('toggle-clock-enabled', (_e, id: ClockId, enabled: boolean) => {
    const settings = settingsStore.updateClock(id, { enabled, visible: enabled })
    const win = getClockWindow(id)
    if (enabled) {
      const w = createClockWindow(id)
      w.show()
    } else if (win && !win.isDestroyed()) {
      win.hide()
    }
    broadcastSettings()
    return settings
  })

  ipcMain.handle('show-all', () => {
    CLOCK_DEFINITIONS.forEach((def) => {
      settingsStore.updateClock(def.id, { visible: true, enabled: true })
      const win = createClockWindow(def.id)
      win.show()
    })
    broadcastSettings()
  })

  ipcMain.handle('hide-all', () => {
    CLOCK_DEFINITIONS.forEach((def) => {
      settingsStore.updateClock(def.id, { visible: false })
      const win = getClockWindow(def.id)
      if (win && !win.isDestroyed()) win.hide()
    })
    broadcastSettings()
  })

  ipcMain.handle('reset-positions', () => {
    openMenuOwner = null
    const settings = settingsStore.resetPositions()
    getAllClockWindows().forEach((win, id) => {
      if (win.isDestroyed()) return
      const state = settingsStore.getClock(id)
      win.setBounds({ x: state.x, y: state.y, width: state.width, height: state.height })
    })
    const statesButtonWin = getStatesButtonWindow()
    if (statesButtonWin && !statesButtonWin.isDestroyed()) {
      const { x, y } = defaultStatesButtonPosition(settings.global.dockSide)
      statesButtonWin.setBounds({ x, y, width: DEFAULT_WIDTH, height: STATES_BUTTON_HEIGHT })
      applyRoundedShape(statesButtonWin, 14)
    }
    const masterWin = getMasterSettingsWindow()
    if (masterWin && !masterWin.isDestroyed()) {
      const { x, y } = defaultMasterSettingsPosition(settings.global.dockSide)
      masterWin.setBounds({ x, y, width: DEFAULT_WIDTH, height: MASTER_COLLAPSED_HEIGHT })
      applyRoundedShape(masterWin, 14)
    }
    const populationBtnWin = getPopulationButtonWindow()
    if (populationBtnWin && !populationBtnWin.isDestroyed()) {
      const { x, y } = defaultPopulationButtonPosition(settings.global.dockSide)
      populationBtnWin.setBounds({ x, y, width: DEFAULT_WIDTH, height: POPULATION_BUTTON_HEIGHT })
      applyRoundedShape(populationBtnWin, 14)
    }
    const peekBtnWin = getPeekButtonWindow()
    if (peekBtnWin && !peekBtnWin.isDestroyed()) {
      const layout = getScaledLayout(1, settings.global.dockSide)
      peekBtnWin.setPosition(layout.peekButtonX, layout.peekButtonY)
    }
    broadcastSettings()
    return settings
  })

  ipcMain.handle('move-clock-window', (_e, id: ClockId, x: number, y: number) => {
    const win = getClockWindow(id)
    if (win && !win.isDestroyed()) win.setPosition(Math.round(x), Math.round(y))
  })

  ipcMain.handle('resize-clock-window', (_e, id: ClockId, width: number, height: number) => {
    const win = getClockWindow(id)
    if (win && !win.isDestroyed()) win.setSize(Math.round(width), Math.round(height))
  })

  ipcMain.handle('close-settings-window', () => {
    const win = getSettingsWindow()
    if (win && !win.isDestroyed()) win.hide()
  })

  ipcMain.handle('open-states-window', () => {
    createStatesWindow()
  })

  ipcMain.handle('set-clock-menu-open', (_e, id: ClockId, open: boolean) => {
    if (open) {
      if (openMenuOwner !== null && openMenuOwner !== id) closeOpenMenu()
      openMenuOwner = id
    } else if (openMenuOwner === id) {
      openMenuOwner = null
    }
    setClockMenuExpanded(id, open)
  })

  ipcMain.handle('toggle-global-peek', () => {
    const nextPeeked = !settingsStore.getAll().global.peeked
    const settings = settingsStore.updateGlobal({ peeked: nextPeeked })
    applyPeekState(nextPeeked)
    broadcastSettings()
    return settings
  })

  ipcMain.handle('open-master-settings-window', () => {
    createMasterModalWindow()
  })

  ipcMain.handle('open-population-window', () => {
    createPopulationWindow()
  })

  ipcMain.handle('lookup-population', async (_e, city: string, stateAbbr: string) => {
    try {
      const apiKey = settingsStore.getAll().global.censusApiKey
      const result = await lookupCityPopulation(city, stateAbbr, apiKey)
      return { ok: true as const, result }
    } catch (err) {
      if (err instanceof MissingApiKeyError) {
        return { ok: false as const, error: 'missing-api-key' }
      }
      return { ok: false as const, error: err instanceof Error ? err.message : 'Lookup failed' }
    }
  })

  ipcMain.handle('set-card-scale', (_e, scale: number) => {
    const settings = settingsStore.applyCardScale(scale)
    const layout = getScaledLayout(settings.global.cardScale, settings.global.dockSide)

    getAllClockWindows().forEach((win, id) => {
      if (win.isDestroyed()) return
      const state = settingsStore.getClock(id)
      win.setBounds({ x: state.x, y: state.y, width: state.width, height: state.height })
      applyRoundedShape(win)
    })

    const statesButtonWin = getStatesButtonWindow()
    if (statesButtonWin && !statesButtonWin.isDestroyed()) {
      statesButtonWin.setBounds({
        x: layout.x,
        y: layout.statesButtonY,
        width: layout.cardWidth,
        height: layout.buttonHeight
      })
      applyRoundedShape(statesButtonWin, 14)
    }

    const masterWin = getMasterSettingsWindow()
    if (masterWin && !masterWin.isDestroyed()) {
      masterWin.setBounds({
        x: layout.x,
        y: layout.masterY,
        width: layout.cardWidth,
        height: layout.buttonHeight
      })
      applyRoundedShape(masterWin, 14)
    }

    const populationBtnWin = getPopulationButtonWindow()
    if (populationBtnWin && !populationBtnWin.isDestroyed()) {
      populationBtnWin.setBounds({
        x: layout.x,
        y: layout.populationButtonY,
        width: layout.cardWidth,
        height: layout.buttonHeight
      })
      applyRoundedShape(populationBtnWin, 14)
    }

    const peekBtnWin = getPeekButtonWindow()
    if (peekBtnWin && !peekBtnWin.isDestroyed()) {
      peekBtnWin.setPosition(layout.peekButtonX, layout.peekButtonY)
    }

    broadcastSettings()
    return settings
  })

  ipcMain.handle('set-dock-side', (_e, side: 'left' | 'right') => {
    const settings = settingsStore.applyDockSide(side)
    const layout = getScaledLayout(settings.global.cardScale, settings.global.dockSide)

    getAllClockWindows().forEach((win, id) => {
      if (win.isDestroyed()) return
      const state = settingsStore.getClock(id)
      // Only x/y change here, not size, so the window's clip shape (which
      // depends solely on width/height) doesn't need reapplying — doing so
      // anyway was a redundant setShape call on every dock-side switch.
      win.setPosition(state.x, state.y)
    })

    const statesButtonWin = getStatesButtonWindow()
    if (statesButtonWin && !statesButtonWin.isDestroyed()) {
      statesButtonWin.setPosition(layout.x, layout.statesButtonY)
    }

    const masterWin = getMasterSettingsWindow()
    if (masterWin && !masterWin.isDestroyed()) {
      masterWin.setPosition(layout.x, layout.masterY)
    }

    const populationBtnWin = getPopulationButtonWindow()
    if (populationBtnWin && !populationBtnWin.isDestroyed()) {
      populationBtnWin.setPosition(layout.x, layout.populationButtonY)
    }

    const peekBtnWin = getPeekButtonWindow()
    if (peekBtnWin && !peekBtnWin.isDestroyed()) {
      peekBtnWin.setPosition(layout.peekButtonX, layout.peekButtonY)
    }

    broadcastSettings()
    return settings
  })

  ipcMain.handle('get-clock-id', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    for (const [id, w] of getAllClockWindows()) {
      if (w === win) return id
    }
    return null
  })
}
