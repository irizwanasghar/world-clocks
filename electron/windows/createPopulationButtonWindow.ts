import { BrowserWindow } from 'electron'
import { join } from 'path'
import { DEFAULT_WIDTH, POPULATION_BUTTON_HEIGHT, defaultPopulationButtonPosition } from '../services/settings'
import { applyRoundedShape } from '../services/windowShape'

let populationButtonWindow: BrowserWindow | null = null

function windowIsDev(): boolean {
  return !!process.env.ELECTRON_RENDERER_URL
}

export function createPopulationButtonWindow(alwaysOnTop: boolean): BrowserWindow {
  if (populationButtonWindow && !populationButtonWindow.isDestroyed()) return populationButtonWindow

  const { x, y } = defaultPopulationButtonPosition()

  const win = new BrowserWindow({
    x,
    y,
    width: DEFAULT_WIDTH,
    height: POPULATION_BUTTON_HEIGHT,
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
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/src/populationButton.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/src/populationButton.html'))
  }

  win.once('ready-to-show', () => {
    applyRoundedShape(win, 14)
    win.show()
  })

  populationButtonWindow = win
  return win
}

export function getPopulationButtonWindow(): BrowserWindow | null {
  return populationButtonWindow
}
