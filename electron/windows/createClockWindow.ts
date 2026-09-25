import { BrowserWindow } from 'electron'
import { join } from 'path'
import type { ClockId } from '../../src/types'
import { settingsStore } from '../services/settings'
import { applyRoundedShape } from '../services/windowShape'
import { logDebug } from '../services/debugLog'

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
  const load = (): void => {
    if (windowIsDev()) {
      win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/src/clock.html${query}`)
    } else {
      win.loadFile(join(__dirname, '../renderer/src/clock.html'), { search: query.slice(1) })
    }
  }
  load()

  // With 5 clock cards + 4 buttons all creating their own BrowserWindow at
  // startup, an individual window's renderer can occasionally fail to load
  // or crash outright under resource contention — silently, with no error
  // surfaced anywhere, leaving that one card permanently blank while every
  // other widget is fine. Recovering automatically (reload on load failure,
  // full recreate-and-reload on a renderer crash) means a single widget's
  // bad luck on any given launch doesn't require the user to notice,
  // diagnose, and manually restart the whole app.
  win.webContents.on('did-fail-load', (_e, errorCode, errorDescription) => {
    logDebug(`[clock:${id}] did-fail-load errorCode=${errorCode} desc=${errorDescription}`)
    if (win.isDestroyed()) return
    if (errorCode === -3) return // ERR_ABORTED — usually a benign cancelled navigation
    load()
  })
  win.webContents.on('render-process-gone', (_e, details) => {
    logDebug(`[clock:${id}] render-process-gone reason=${details.reason} exitCode=${details.exitCode}`)
    if (win.isDestroyed() || details.reason === 'clean-exit') return
    load()
  })
  // Surfaces any renderer-side JS error (e.g. a React crash that prevents
  // the card from ever painting) directly to the debug log, instead of it
  // vanishing into a devtools console nobody's looking at.
  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) {
      logDebug(`[clock:${id}] console(level=${level}): ${message} (${sourceId}:${line})`)
    }
  })
  win.on('show', () => logDebug(`[clock:${id}] show event, bounds=${JSON.stringify(win.getBounds())}`))
  win.on('hide', () => logDebug(`[clock:${id}] hide event`))

  let shown = false
  win.once('ready-to-show', () => {
    shown = true
    logDebug(`[clock:${id}] ready-to-show, willShow=${state.visible && state.enabled}`)
    applyRoundedShape(win)
    if (state.visible && state.enabled) win.show()
  })
  // Safety net: if content never finishes loading (and 'ready-to-show'
  // never fires as a result), the window would otherwise stay invisible
  // forever with nothing to prompt a retry. Showing it anyway after a
  // generous timeout at least surfaces *something* instead of a silently
  // missing card, and any in-flight did-fail-load retry above will still
  // reload it properly once the underlying issue clears.
  setTimeout(() => {
    if (!shown && !win.isDestroyed() && state.visible && state.enabled) {
      applyRoundedShape(win)
      win.show()
    }
  }, 4000)

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
  win.on('resize', () => {
    applyRoundedShape(win)
    scheduleSave()
  })

  win.on('close', (e) => {
    // The real "hide this card" action is hideClock's IPC handler, which
    // calls win.hide() directly and never triggers this native close event
    // at all — so persisting visible:false here was never actually needed
    // for that legitimate flow.
    //
    // What it WAS doing: any external close signal reaching this window —
    // Task Manager's "End Task" (which sends a close request to each
    // top-level window before the process is force-terminated, entirely
    // bypassing app.quit()'s before-quit event), Alt+F4, a Windows
    // shutdown/logoff — got misinterpreted as "the user wants this card
    // permanently hidden" and immediately wrote that to disk. Reinstalling
    // this app for testing meant ending its task in Task Manager first,
    // every single time, which is exactly the scenario above: a race
    // between however many windows' close handlers finished running
    // before the process died, silently corrupting a random subset of
    // clocks' persisted visibility on almost every single test cycle.
    //
    // Just hide without writing anything. Whatever's already on disk stays
    // accurate regardless of how or why this window is closing.
    e.preventDefault()
    win.hide()
  })

  clockWindows.set(id, win)
  return win
}

export function getClockWindow(id: ClockId): BrowserWindow | undefined {
  return clockWindows.get(id)
}

/** Exposed so callers that programmatically move/resize a clock window
 *  (menu expand, peek) can avoid the move/resize listeners persisting that
 *  temporary position as if the user had dragged the window there. */
export function suppressClockSave(id: ClockId): void {
  suppressSaveBriefly(id)
}

export function setClockMenuExpanded(id: ClockId, expanded: boolean): void {
  const win = clockWindows.get(id)
  if (!win || win.isDestroyed()) return
  const state = settingsStore.getClock(id)
  suppressSaveBriefly(id)
  win.setSize(state.width, expanded ? state.height + MENU_EXTRA_HEIGHT : state.height)
  if (expanded) win.moveTop()
}

export function getAllClockWindows(): Map<ClockId, BrowserWindow> {
  return clockWindows
}

export function destroyClockWindow(id: ClockId): void {
  const win = clockWindows.get(id)
  if (win && !win.isDestroyed()) win.destroy()
  clockWindows.delete(id)
}
