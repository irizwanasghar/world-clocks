import { useEffect, useState } from 'react'
import type { AppSettings, GlobalSettings } from './types'
import { Toggle } from './components/Toggle'

export function MasterSettingsApp(): JSX.Element | null {
  const [settings, setSettings] = useState<AppSettings | null>(null)

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

  if (!settings) return null

  const updateGlobal = (partial: Partial<GlobalSettings>): void => {
    window.desktopAPI.saveGlobalSettings(partial).then(setSettings)
  }

  const g = settings.global

  return (
    <div className="clock-widget-outer">
      <div className="master-panel">
        <div className="master-panel-header">
          <span className="master-panel-icon">⚙</span>
          <span className="master-panel-title">All Clocks</span>
        </div>

        <Toggle label="Show seconds" checked={g.showSeconds} onChange={(v) => updateGlobal({ showSeconds: v })} />
        <Toggle label="12-hour format" checked={g.use12Hour} onChange={(v) => updateGlobal({ use12Hour: v })} />
        <Toggle label="Always on top" checked={g.alwaysOnTop} onChange={(v) => updateGlobal({ alwaysOnTop: v })} />

        <div className="master-opacity-row">
          <span>Opacity</span>
          <span className="master-opacity-value">{Math.round(g.opacity * 100)}%</span>
        </div>
        <input
          className="master-opacity-slider"
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={g.opacity}
          onChange={(e) => updateGlobal({ opacity: Number(e.target.value) })}
        />
      </div>
    </div>
  )
}
