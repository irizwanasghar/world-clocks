import { BrowserWindow } from 'electron'
import { join } from 'path'
import { DEFAULT_WIDTH, MASTER_COLLAPSED_HEIGHT, defaultMasterSettingsPosition } from '../services/settings'
import { applyRoundedShape } from '../services/windowShape'

let masterSettingsWindow: BrowserWindow | null = null

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
    height: MASTER_COLLAPSED_HEIGHT,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    show: false,
    hasShadow: false,
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

  win.once('ready-to-show', () => {
    applyRoundedShape(win, 14)
    win.show()
  })

  masterSettingsWindow = win
  return win
}

export function getMasterSettingsWindow(): BrowserWindow | null {
  return masterSettingsWindow
}
