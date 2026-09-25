import { app, BrowserWindow, Menu } from 'electron'
import { CLOCK_DEFINITIONS } from '../src/data/timezones'
import { settingsStore, initSettingsStore } from './services/settings'
import { createClockWindow, getClockWindow } from './windows/createClockWindow'
import { createSettingsWindow, getSettingsWindow } from './windows/createSettingsWindow'
import { createStatesButtonWindow, getStatesButtonWindow } from './windows/createStatesButtonWindow'
import { createMasterSettingsWindow, getMasterSettingsWindow } from './windows/createMasterSettingsWindow'
import { createPopulationButtonWindow, getPopulationButtonWindow } from './windows/createPopulationButtonWindow'
import { createPeekButtonWindow, getPeekButtonWindow } from './windows/createPeekButtonWindow'
import { createTray } from './tray/tray'
import { registerIpcHandlers, applyPeekState } from './ipc/handlers'
import { initAutoUpdater, checkForUpdates } from './services/updater'

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
    // Applies to every frame:true window (All Clocks Settings, All US
    // States, City Population) — the widget cards and buttons are all
    // frame:false and never show a menu bar regardless.
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: 'View',
          submenu: [
            { label: 'Check for Updates', click: () => checkForUpdates() },
            { type: 'separator' },
            { role: 'reload' },
            { role: 'toggleDevTools' }
          ]
        }
      ])
    )

    initSettingsStore()
    registerIpcHandlers()
    createTray()

    const settings = settingsStore.getAll()
    CLOCK_DEFINITIONS.forEach((def) => {
      const state = settings.clocks[def.id]
      // createClockWindow already shows the window itself, once ready —
      // via a 'ready-to-show' handler that applies the rounded-corner clip
      // shape first and only shows afterward. Calling win.show() again
      // here, synchronously, would show the window in its raw unshaped
      // state before that handler ever runs, racing against it for no
      // reason (creating the window is enough; showing is its own job).
      if (state.enabled) createClockWindow(def.id)
    })
    createStatesButtonWindow(settings.global.alwaysOnTop)
    createMasterSettingsWindow(settings.global.alwaysOnTop)
    createPopulationButtonWindow(settings.global.alwaysOnTop)
    createPeekButtonWindow(settings.global.alwaysOnTop, settings.global.cardScale, settings.global.dockSide)

    if (settings.global.peeked) {
      applyPeekState(true)
    }

    // Defensive re-assertion: every widget's alwaysOnTop is already set at
    // construction, but doing one more pass after the whole startup
    // sequence (all 5 clocks + 4 buttons created, shown, and positioned)
    // guarantees the final z-order state is consistent, rather than
    // depending on however the OS happened to interleave each window's own
    // async ready-to-show/show calls during the loop above.
    setTimeout(() => {
      const alwaysOnTop = settingsStore.getAll().global.alwaysOnTop
      const allWidgetWindows = [
        ...CLOCK_DEFINITIONS.map((def) => getClockWindow(def.id)),
        getStatesButtonWindow(),
        getMasterSettingsWindow(),
        getPopulationButtonWindow(),
        getPeekButtonWindow()
      ]
      allWidgetWindows.forEach((win) => {
        if (win && !win.isDestroyed() && win.isVisible()) {
          win.setAlwaysOnTop(alwaysOnTop, 'screen-saver')
          win.moveTop()
        }
      })
    }, 500)

    initAutoUpdater()

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
