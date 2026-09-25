import { BrowserWindow } from 'electron'
import { join } from 'path'
import { popupPosition, settingsStore } from '../services/settings'

let populationWindow: BrowserWindow | null = null

function windowIsDev(): boolean {
  return !!process.env.ELECTRON_RENDERER_URL
}

export function createPopulationWindow(): BrowserWindow {
  if (populationWindow && !populationWindow.isDestroyed()) {
    populationWindow.show()
    populationWindow.focus()
    return populationWindow
  }

  const width = 340
  const height = 540
  const { x, y } = popupPosition(width, height, settingsStore.getAll().global.dockSide)

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: 300,
    minHeight: 420,
    title: 'City Population',
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
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/src/population.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/src/population.html'))
  }

  win.once('ready-to-show', () => win.show())

  win.on('closed', () => {
    populationWindow = null
  })

  populationWindow = win
  return win
}
