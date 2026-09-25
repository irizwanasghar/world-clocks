import { BrowserWindow } from 'electron'
import { join } from 'path'
import { DEFAULT_WIDTH, MASTER_SETTINGS_HEIGHT, defaultMasterSettingsPosition } from '../services/settings'

let masterSettingsWindow: BrowserWindow | null = null

/** Same reasoning as the clock widgets' gear menu: a BrowserWindow can't
 *  paint outside its own bounds, so opening the panel grows the window
 *  downward (toward the top card) to make room, then shrinks back on close. */
const PANEL_EXTRA_HEIGHT = 230

function windowIsDev(): boolean {
  return !!process.env.ELECTRON_RENDERER_URL
}

export function createMasterSettingsWindow(alwaysOnTop: boolean): BrowserWindow {
  if (masterSettingsWindow && !masterSettingsWindow.isDestroyed()) return masterSettingsWindow

  const { x, y } = defaultMasterSettingsPosition()

  const win = new BrowserWindow({
    x,
    y,
    width: DEFAULT_WIDTH,
    height: MASTER_SETTINGS_HEIGHT,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    show: false,
    hasShadow: false,
    roundedCorners: true,
    thickFrame: false,
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

  masterSettingsWindow = win
  return win
}

export function getMasterSettingsWindow(): BrowserWindow | null {
  return masterSettingsWindow
}

export function setMasterSettingsExpanded(expanded: boolean): void {
  const win = masterSettingsWindow
  if (!win || win.isDestroyed()) return
  win.setSize(DEFAULT_WIDTH, expanded ? MASTER_SETTINGS_HEIGHT + PANEL_EXTRA_HEIGHT : MASTER_SETTINGS_HEIGHT)
}
