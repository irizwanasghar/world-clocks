import { ipcMain, BrowserWindow } from 'electron'
import type { ClockId, ClockOverrides, ClockState, GlobalSettings } from '../../src/types'
import { settingsStore, defaultStatesButtonPosition } from '../services/settings'
import { CLOCK_DEFINITIONS } from '../../src/data/timezones'
import {
  createClockWindow,
  getClockWindow,
  getAllClockWindows,
  setClockMenuExpanded
} from '../windows/createClockWindow'
import { getSettingsWindow } from '../windows/createSettingsWindow'
import { createStatesWindow } from '../windows/createStatesWindow'
import { getStatesButtonWindow } from '../windows/createStatesButtonWindow'
import { getMasterSettingsWindow, setMasterSettingsExpanded } from '../windows/createMasterSettingsWindow'
import { refreshTrayMenu } from '../tray/tray'

function broadcastSettings(): void {
  const settings = settingsStore.getAll()
  const settingsWin = getSettingsWindow()
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.webContents.send('settings-changed', settings)
  }
  refreshTrayMenu()
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
    const settings = settingsStore.resetPositions()
    getAllClockWindows().forEach((win, id) => {
      if (win.isDestroyed()) return
      const state = settingsStore.getClock(id)
      win.setBounds({ x: state.x, y: state.y, width: state.width, height: state.height })
    })
    const statesButtonWin = getStatesButtonWindow()
    if (statesButtonWin && !statesButtonWin.isDestroyed()) {
      const { x, y } = defaultStatesButtonPosition()
      statesButtonWin.setPosition(x, y)
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
    setClockMenuExpanded(id, open)
  })

  ipcMain.handle('set-master-menu-open', (_e, open: boolean) => {
    setMasterSettingsExpanded(open)
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
