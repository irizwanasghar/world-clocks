import { BrowserWindow } from 'electron'
import { join } from 'path'
import {
  DEFAULT_WIDTH,
  MASTER_COLLAPSED_HEIGHT,
  defaultMasterSettingsPosition,
  settingsStore
} from '../services/settings'

let masterSettingsWindow: BrowserWindow | null = null
let isExpanded = false
let suppressSave = false
let suppressTimer: NodeJS.Timeout | null = null

function windowIsDev(): boolean {
  return !!process.env.ELECTRON_RENDERER_URL
}

function suppressSaveBriefly(): void {
  if (suppressTimer) clearTimeout(suppressTimer)
  suppressSave = true
  suppressTimer = setTimeout(() => {
    suppressSave = false
  }, 500)
}

export function createMasterSettingsWindow(alwaysOnTop: boolean): BrowserWindow {
  if (masterSettingsWindow && !masterSettingsWindow.isDestroyed()) return masterSettingsWindow

  const { x, y } = defaultMasterSettingsPosition()

  const win = new BrowserWindow({
    x,
    y,
    width: DEFAULT_WIDTH,
    height: MASTER_COLLAPSED_HEIGHT,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop,
    skipTaskbar: true,
    resizable: true,
    movable: false,
    // Never takes OS keyboard focus: besides not needing it (it's all mouse
    // interaction), Windows 11 can draw an accent-colored focus border
    // around a focused frameless window that ignores its CSS border-radius,
    // which shows up as a hard rectangular edge around the rounded card.
    focusable: false,
    show: false,
    hasShadow: false,
    thickFrame: false,
    minWidth: 176,
    minHeight: MASTER_COLLAPSED_HEIGHT,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.setAlwaysOnTop(alwaysOnTop, 'screen-saver')

  if (windowIsDev()) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/src/masterSettings.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/src/masterSettings.html'))
  }

  win.once('ready-to-show', () => win.show())

  // A frameless popup can't reliably use a same-window "click away to
  // close" listener, because clicking anywhere outside this tiny window
  // (another card, another app, the desktop) never dispatches an event to
  // it at all. Losing OS focus is the correct cross-window signal instead —
  // though this window is non-focusable itself, `blur` still fires when the
  // user interacts elsewhere while it's the active popup.
  win.on('blur', () => {
    if (!isExpanded) return
    collapse()
    if (!win.isDestroyed()) win.webContents.send('master-panel-collapsed')
  })

  let saveTimer: NodeJS.Timeout | null = null
  win.on('resize', () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      if (win.isDestroyed() || suppressSave || !isExpanded) return
      const [width, height] = win.getSize()
      settingsStore.updateMasterPanel({ width, height })
    }, 300)
  })

  masterSettingsWindow = win
  return win
}

function collapse(): void {
  const win = masterSettingsWindow
  if (!win || win.isDestroyed()) return
  isExpanded = false
  suppressSaveBriefly()
  win.setSize(DEFAULT_WIDTH, MASTER_COLLAPSED_HEIGHT)
}

export function setMasterPanelExpanded(expanded: boolean): void {
  const win = masterSettingsWindow
  if (!win || win.isDestroyed()) return
  isExpanded = expanded
  suppressSaveBriefly()
  if (expanded) {
    const panel = settingsStore.getMasterPanel()
    win.setSize(panel.width, panel.height)
    // Among windows at the same alwaysOnTop level, stacking order follows
    // activation history — since the clock cards were created after this
    // window, they could otherwise end up drawn above the expanded panel,
    // covering the dropdown. Force it to the front of its current band
    // every time it expands (without changing whether it's topmost at all).
    win.moveTop()
  } else {
    win.setSize(DEFAULT_WIDTH, MASTER_COLLAPSED_HEIGHT)
  }
}

export function getMasterSettingsWindow(): BrowserWindow | null {
  return masterSettingsWindow
}
