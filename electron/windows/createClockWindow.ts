import { BrowserWindow } from 'electron'
import { join } from 'path'
import type { ClockId } from '../../src/types'
import { settingsStore } from '../services/settings'

const clockWindows = new Map<ClockId, BrowserWindow>()

function windowIsDev(): boolean {
  return !!process.env.ELECTRON_RENDERER_URL
}

export function createClockWindow(id: ClockId): BrowserWindow {
  const existing = clockWindows.get(id)
  if (existing && !existing.isDestroyed()) return existing

  const state = settingsStore.getClock(id)
  const global = settingsStore.getAll().global

  const win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: global.alwaysOnTop,
    skipTaskbar: true,
    resizable: true,
    show: false,
    hasShadow: false,
    roundedCorners: true,
    thickFrame: false,
    minWidth: 160,
    minHeight: 76,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.setAlwaysOnTop(global.alwaysOnTop, 'screen-saver')

  const query = `?clockId=${id}`
  if (windowIsDev()) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/src/clock.html${query}`)
  } else {
    win.loadFile(join(__dirname, '../renderer/src/clock.html'), { search: query.slice(1) })
  }

  win.once('ready-to-show', () => {
    if (state.visible && state.enabled) win.show()
  })

  let saveTimer: NodeJS.Timeout | null = null
  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      if (win.isDestroyed()) return
      const bounds = win.getBounds()
      settingsStore.updateClock(id, { ...bounds })
    }, 300)
  }

  win.on('move', scheduleSave)
  win.on('resize', scheduleSave)

  win.on('close', (e) => {
    e.preventDefault()
    settingsStore.updateClock(id, { visible: false })
    win.hide()
  })

  clockWindows.set(id, win)
  return win
}

export function getClockWindow(id: ClockId): BrowserWindow | undefined {
  return clockWindows.get(id)
}

export function getAllClockWindows(): Map<ClockId, BrowserWindow> {
  return clockWindows
}

export function destroyClockWindow(id: ClockId): void {
  const win = clockWindows.get(id)
  if (win && !win.isDestroyed()) win.destroy()
  clockWindows.delete(id)
}
