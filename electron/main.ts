import { app, BrowserWindow } from 'electron'
import { CLOCK_DEFINITIONS } from '../src/data/timezones'
import { settingsStore, initSettingsStore } from './services/settings'
import { createClockWindow } from './windows/createClockWindow'
import { createSettingsWindow, getSettingsWindow } from './windows/createSettingsWindow'
import { createStatesButtonWindow } from './windows/createStatesButtonWindow'
import { createMasterSettingsWindow } from './windows/createMasterSettingsWindow'
import { createTray } from './tray/tray'
import { registerIpcHandlers } from './ipc/handlers'

// Per-pixel alpha on transparent, frameless windows can render as opaque
// black/gray outside the rounded card instead of true transparency when GPU
// compositing mishandles layered-window alpha (a known Electron-on-Windows
// issue, especially inside VMs or with certain GPU drivers). Forcing
// software compositing is the standard workaround.
app.disableHardwareAcceleration()

;(global as { appIsQuitting?: boolean }).appIsQuitting = false

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = getSettingsWindow() ?? createSettingsWindow()
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  })

  app.whenReady().then(() => {
    initSettingsStore()
    registerIpcHandlers()
    createTray()

    const settings = settingsStore.getAll()
    CLOCK_DEFINITIONS.forEach((def) => {
      const state = settings.clocks[def.id]
      if (state.enabled) {
        const win = createClockWindow(def.id)
        if (state.visible) win.show()
      }
    })
    createStatesButtonWindow(settings.global.alwaysOnTop)
    createMasterSettingsWindow(settings.global.alwaysOnTop)

    app.setLoginItemSettings({
      openAtLogin: settings.global.launchAtStartup,
      openAsHidden: true
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createSettingsWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    // Widgets hide rather than close; keep running until tray Quit.
  })

  app.on('before-quit', () => {
    ;(global as { appIsQuitting?: boolean }).appIsQuitting = true
  })
}
