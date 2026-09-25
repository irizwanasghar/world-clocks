import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

let initialized = false

export function initAutoUpdater(): void {
  if (initialized) return
  initialized = true

  // Unpackaged (dev) runs have no update feed to check against.
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  checkForUpdates()
  // Check again periodically in case the app stays open for a long time.
  setInterval(checkForUpdates, 4 * 60 * 60 * 1000)
}

export function checkForUpdates(): void {
  if (!app.isPackaged) return
  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // Silently ignore — e.g. offline. It'll try again on the next interval.
  })
}
