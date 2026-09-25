import { BrowserWindow } from 'electron'
import { join } from 'path'
import { popupPosition, settingsStore } from '../services/settings'

let masterModalWindow: BrowserWindow | null = null

function windowIsDev(): boolean {
  return !!process.env.ELECTRON_RENDERER_URL
}

export function createMasterModalWindow(): BrowserWindow {
  if (masterModalWindow && !masterModalWindow.isDestroyed()) {
    masterModalWindow.show()
    masterModalWindow.focus()
    return masterModalWindow
  }

  const width = 340
  const height = 640
  const { x, y } = popupPosition(width, height, settingsStore.getAll().global.dockSide)

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: 300,
    minHeight: 500,
    title: 'All Clocks Settings',
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
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/src/masterModal.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/src/masterModal.html'))
  }

  win.once('ready-to-show', () => win.show())

  win.on('closed', () => {
    masterModalWindow = null
  })

  masterModalWindow = win
  return win
}

export function getMasterModalWindow(): BrowserWindow | null {
  return masterModalWindow
}
