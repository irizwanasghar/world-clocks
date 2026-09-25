import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, ClockId, ClockState, DesktopAPI, GlobalSettings } from '../src/types'

const api: DesktopAPI = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveGlobalSettings: (settings: Partial<GlobalSettings>) =>
    ipcRenderer.invoke('save-global-settings', settings),
  saveClockState: (id: ClockId, state: Partial<ClockState>) =>
    ipcRenderer.invoke('save-clock-state', id, state),
  showClock: (id: ClockId) => ipcRenderer.invoke('show-clock', id),
  hideClock: (id: ClockId) => ipcRenderer.invoke('hide-clock', id),
  toggleClockEnabled: (id: ClockId, enabled: boolean) =>
    ipcRenderer.invoke('toggle-clock-enabled', id, enabled),
  showAll: () => ipcRenderer.invoke('show-all'),
  hideAll: () => ipcRenderer.invoke('hide-all'),
  resetPositions: () => ipcRenderer.invoke('reset-positions'),
  getClockId: () => ipcRenderer.invoke('get-clock-id'),
  moveClockWindow: (id: ClockId, x: number, y: number) =>
    ipcRenderer.invoke('move-clock-window', id, x, y),
  resizeClockWindow: (id: ClockId, width: number, height: number) =>
    ipcRenderer.invoke('resize-clock-window', id, width, height),
  closeSettingsWindow: () => ipcRenderer.invoke('close-settings-window'),
  openStatesWindow: () => ipcRenderer.invoke('open-states-window'),
  setClockMenuOpen: (id: ClockId, open: boolean) => ipcRenderer.invoke('set-clock-menu-open', id, open),
  openMasterSettingsWindow: () => ipcRenderer.invoke('open-master-settings-window'),
  setCardScale: (scale: number) => ipcRenderer.invoke('set-card-scale', scale),
  setDockSide: (side: 'left' | 'right') => ipcRenderer.invoke('set-dock-side', side),
  openPopulationWindow: () => ipcRenderer.invoke('open-population-window'),
  lookupPopulation: (city: string, stateAbbr: string) =>
    ipcRenderer.invoke('lookup-population', city, stateAbbr),
  onSettingsChanged: (callback: (settings: AppSettings) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, settings: AppSettings): void =>
      callback(settings)
    ipcRenderer.on('settings-changed', listener)
    return () => ipcRenderer.removeListener('settings-changed', listener)
  },
  onClockMenuClosed: (callback: () => void) => {
    const listener = (): void => callback()
    ipcRenderer.on('clock-menu-closed', listener)
    return () => ipcRenderer.removeListener('clock-menu-closed', listener)
  }
}

contextBridge.exposeInMainWorld('desktopAPI', api)
