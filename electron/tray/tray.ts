import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'
import { CLOCK_DEFINITIONS } from '../../src/data/timezones'
import { settingsStore } from '../services/settings'
import { createClockWindow, getClockWindow, getAllClockWindows } from '../windows/createClockWindow'
import { createSettingsWindow } from '../windows/createSettingsWindow'
import { checkForUpdates } from '../services/updater'

let tray: Tray | null = null

function buildIcon() {
  const iconPath = join(__dirname, '../../resources/icon.png')
  const img = nativeImage.createFromPath(iconPath)
  if (!img.isEmpty()) return img
  // 16x16 transparent fallback so Tray never throws if the asset is missing
  return nativeImage.createEmpty()
}

function showAll(): void {
  CLOCK_DEFINITIONS.forEach((def) => {
    settingsStore.updateClock(def.id, { visible: true, enabled: true })
    createClockWindow(def.id).show()
  })
  refreshTrayMenu()
}

function hideAll(): void {
  CLOCK_DEFINITIONS.forEach((def) => {
    settingsStore.updateClock(def.id, { visible: false })
    const win = getClockWindow(def.id)
    if (win && !win.isDestroyed()) win.hide()
  })
  refreshTrayMenu()
}

function resetPositions(): void {
  settingsStore.resetPositions()
  getAllClockWindows().forEach((win, id) => {
    if (win.isDestroyed()) return
    const state = settingsStore.getClock(id)
    win.setBounds({ x: state.x, y: state.y, width: state.width, height: state.height })
  })
}

export function createTray(): Tray {
  tray = new Tray(buildIcon())
  tray.setToolTip('World Clocks')
  refreshTrayMenu()
  return tray
}

export function refreshTrayMenu(): void {
  if (!tray) return
  const settings = settingsStore.getAll()

  const clockItems = CLOCK_DEFINITIONS.map((def) => ({
    label: `${def.countryCode} — ${def.label}`,
    type: 'checkbox' as const,
    checked: settings.clocks[def.id].enabled,
    click: () => {
      const enabled = !settings.clocks[def.id].enabled
      settingsStore.updateClock(def.id, { enabled, visible: enabled })
      if (enabled) {
        createClockWindow(def.id).show()
      } else {
        const win = getClockWindow(def.id)
        if (win && !win.isDestroyed()) win.hide()
      }
      refreshTrayMenu()
    }
  }))

  const menu = Menu.buildFromTemplate([
    { label: 'Show All', click: showAll },
    { label: 'Hide All', click: hideAll },
    { type: 'separator' },
    ...clockItems,
    { type: 'separator' },
    { label: 'Settings', click: () => createSettingsWindow() },
    { label: 'Reset Positions', click: resetPositions },
    { type: 'separator' },
    { label: 'Check for Updates', click: checkForUpdates },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        ;(global as { appIsQuitting?: boolean }).appIsQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(menu)
}
