import { BrowserWindow } from 'electron'
import { join } from 'path'

let settingsWindow: BrowserWindow | null = null

function windowIsDev(): boolean {
  return !!process.env.ELECTRON_RENDERER_URL
}

export function createSettingsWindow(): BrowserWindow {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return settingsWindow
  }

  const win = new BrowserWindow({
    width: 420,
    height: 640,
    minWidth: 380,
    minHeight: 480,
    title: 'World Clocks',
    frame: true,
    show: false,
    backgroundColor: '#1a1a1f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  if (windowIsDev()) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/src/settings.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/src/settings.html'))
  }

  win.once('ready-to-show', () => win.show())

  win.on('close', (e) => {
    const quitting = (global as { appIsQuitting?: boolean }).appIsQuitting
    if (!quitting) {
      e.preventDefault()
      win.hide()
    }
  })

  settingsWindow = win
  return win
}

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow
}
