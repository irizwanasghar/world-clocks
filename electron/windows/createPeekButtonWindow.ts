import { BrowserWindow } from 'electron'
import { join } from 'path'
import { PEEK_BUTTON_WIDTH, PEEK_BUTTON_HEIGHT, getScaledLayout } from '../services/settings'
import { applyRoundedShape } from '../services/windowShape'

let peekButtonWindow: BrowserWindow | null = null

function windowIsDev(): boolean {
  return !!process.env.ELECTRON_RENDERER_URL
}

export function createPeekButtonWindow(
  alwaysOnTop: boolean,
  scale: number,
  side: 'left' | 'right'
): BrowserWindow {
  if (peekButtonWindow && !peekButtonWindow.isDestroyed()) return peekButtonWindow

  const layout = getScaledLayout(scale, side)

  const win = new BrowserWindow({
    x: layout.peekButtonX,
    y: layout.peekButtonY,
    width: PEEK_BUTTON_WIDTH,
    height: PEEK_BUTTON_HEIGHT,
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
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/src/peekButton.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/src/peekButton.html'))
  }

  win.once('ready-to-show', () => {
    applyRoundedShape(win, 15)
    win.show()
  })

  peekButtonWindow = win
  return win
}

export function getPeekButtonWindow(): BrowserWindow | null {
  return peekButtonWindow
}
