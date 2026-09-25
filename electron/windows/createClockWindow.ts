import { BrowserWindow } from 'electron'
import { join } from 'path'
import type { ClockId } from '../../src/types'
import { settingsStore } from '../services/settings'

const clockWindows = new Map<ClockId, BrowserWindow>()
const suppressedSaves = new Set<ClockId>()
const suppressTimers = new Map<ClockId, NodeJS.Timeout>()

/** Menus need more screen space than a widget's normal card height, but a
 *  BrowserWindow can't paint content outside its own bounds. Growing the
 *  window while the menu is open (and shrinking it back after) lets the menu
 *  render without being clipped, while keeping the persisted size unaffected. */
const MENU_EXTRA_HEIGHT = 235

function windowIsDev(): boolean {
  return !!process.env.ELECTRON_RENDERER_URL
}

function suppressSaveBriefly(id: ClockId): void {
  const existing = suppressTimers.get(id)
  if (existing) clearTimeout(existing)
  suppressedSaves.add(id)
  suppressTimers.set(
    id,
    setTimeout(() => suppressedSaves.delete(id), 500)
  )
}

export function createClockWindow(id: ClockId): BrowserWindow {
  const existing = clockWindows.get(id)
  if (existing && !existing.isDestroyed()) return existing

  const state = settingsStore.getClock(id)
  const global = settingsStore.getAll().global
  const effectiveAlwaysOnTop = state.alwaysOnTop ?? global.alwaysOnTop

  const win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: effectiveAlwaysOnTop,
    skipTaskbar: true,
    resizable: true,
    show: false,
    hasShadow: false,
    thickFrame: false,
    minWidth: 176,
    minHeight: 92,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.setAlwaysOnTop(effectiveAlwaysOnTop, 'screen-saver')

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
      if (win.isDestroyed() || suppressedSaves.has(id)) return
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

export function setClockMenuExpanded(id: ClockId, expanded: boolean): void {
  const win = clockWindows.get(id)
  if (!win || win.isDestroyed()) return
  const state = settingsStore.getClock(id)
  suppressSaveBriefly(id)
  win.setSize(state.width, expanded ? state.height + MENU_EXTRA_HEIGHT : state.height)
}

export function getAllClockWindows(): Map<ClockId, BrowserWindow> {
  return clockWindows
}

export function destroyClockWindow(id: ClockId): void {
  const win = clockWindows.get(id)
  if (win && !win.isDestroyed()) win.destroy()
  clockWindows.delete(id)
}
