import { BrowserWindow } from 'electron'
import { join } from 'path'
import { DEFAULT_WIDTH, STATES_BUTTON_HEIGHT, defaultStatesButtonPosition } from '../services/settings'

let statesButtonWindow: BrowserWindow | null = null

function windowIsDev(): boolean {
  return !!process.env.ELECTRON_RENDERER_URL
}

export function createStatesButtonWindow(alwaysOnTop: boolean): BrowserWindow {
  if (statesButtonWindow && !statesButtonWindow.isDestroyed()) return statesButtonWindow

  const { x, y } = defaultStatesButtonPosition()

  const win = new BrowserWindow({
    x,
    y,
    width: DEFAULT_WIDTH,
    height: STATES_BUTTON_HEIGHT,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop,
    skipTaskbar: true,
    resizable: false,
    movable: false,
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
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/src/statesButton.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/src/statesButton.html'))
  }

  win.once('ready-to-show', () => win.show())

  statesButtonWindow = win
  return win
}

export function getStatesButtonWindow(): BrowserWindow | null {
  return statesButtonWindow
}
