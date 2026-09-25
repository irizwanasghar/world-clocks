import { useEffect, useState } from 'react'
import type { AppSettings, GlobalSettings } from './types'

export function MasterSettingsApp(): JSX.Element | null {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [open, setOpen] = useState(false)
  const [panelHeight, setPanelHeight] = useState<number | null>(null)

  useEffect(() => {
    window.desktopAPI.getSettings().then(setSettings)
    const unsubscribe = window.desktopAPI.onSettingsChanged(setSettings)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!settings) return
    const theme = settings.global.theme
    const root = document.documentElement
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.dataset.theme = prefersDark ? 'dark' : 'light'
    } else {
      root.dataset.theme = theme
    }
  }, [settings?.global.theme])

  const closePanel = (): void => {
    setOpen(false)
    setPanelHeight(null)
    window.desktopAPI.setMasterMenuOpen(false)
  }

  const togglePanel = (): void => {
    if (open) {
      closePanel()
      return
    }
    setPanelHeight(document.documentElement.clientHeight - 16)
    setOpen(true)
    window.desktopAPI.setMasterMenuOpen(true)
  }

  useEffect(() => {
    if (!open) return
    document.addEventListener('click', closePanel)
    return () => document.removeEventListener('click', closePanel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!settings) return null

  const updateGlobal = (partial: Partial<GlobalSettings>): void => {
    window.desktopAPI.saveGlobalSettings(partial).then(setSettings)
  }

  const g = settings.global

  return (
    <div className="clock-widget-outer">
      <div className="states-button-widget">
        <button
          className="states-launch-btn"
          onClick={(e) => {
            e.stopPropagation()
            togglePanel()
          }}
        >
          ⚙ Settings (All)
        </button>
      </div>

      {open && (
        <div
          className="gear-menu"
          onClick={(e) => e.stopPropagation()}
          style={panelHeight ? { top: `${panelHeight + 16}px` } : undefined}
        >
          <button className="menu-item" onClick={() => updateGlobal({ showSeconds: !g.showSeconds })}>
            {g.showSeconds ? '✓ ' : ''}Show seconds
          </button>
          <button className="menu-item" onClick={() => updateGlobal({ use12Hour: !g.use12Hour })}>
            {g.use12Hour ? '12-hour' : '24-hour'} (toggle)
          </button>
          <button className="menu-item" onClick={() => updateGlobal({ alwaysOnTop: !g.alwaysOnTop })}>
            {g.alwaysOnTop ? '✓ ' : ''}Always on top
          </button>
          <div className="menu-item opacity-row">
            <span>Opacity</span>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={g.opacity}
              onChange={(e) => updateGlobal({ opacity: Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
