import { BrowserWindow } from 'electron'
import { join } from 'path'

let statesWindow: BrowserWindow | null = null

function windowIsDev(): boolean {
  return !!process.env.ELECTRON_RENDERER_URL
}

export function createStatesWindow(): BrowserWindow {
  if (statesWindow && !statesWindow.isDestroyed()) {
    statesWindow.show()
    statesWindow.focus()
    return statesWindow
  }

  const win = new BrowserWindow({
    width: 380,
    height: 620,
    minWidth: 320,
    minHeight: 420,
    title: 'All US States',
    frame: true,
    show: false,
    backgroundColor: '#17171c',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  if (windowIsDev()) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/src/states.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/src/states.html'))
  }

  win.once('ready-to-show', () => win.show())

  win.on('closed', () => {
    statesWindow = null
  })

  statesWindow = win
  return win
}
