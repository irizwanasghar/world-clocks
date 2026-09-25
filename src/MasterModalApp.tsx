import { useEffect, useState } from 'react'
import type { AppSettings, GlobalSettings } from './types'
import { Toggle } from './components/Toggle'

export function MasterModalApp(): JSX.Element | null {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [liveScale, setLiveScale] = useState<number | null>(null)

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

  const commitScale = (scale: number): void => {
    setLiveScale(null)
    window.desktopAPI.setCardScale(scale).then(setSettings)
  }

  const g = settings.global
  const displayScale = liveScale ?? g.cardScale
  const isDark =
    g.theme === 'dark' || (g.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="settings-app">
      <div className="settings-panel">
        <h1 className="settings-title">All Clocks</h1>

        <section className="settings-section">
          <Toggle label="Show seconds" checked={g.showSeconds} onChange={(v) => updateGlobal({ showSeconds: v })} />
          <Toggle label="12-hour format" checked={g.use12Hour} onChange={(v) => updateGlobal({ use12Hour: v })} />
          <Toggle label="Always on top" checked={g.alwaysOnTop} onChange={(v) => updateGlobal({ alwaysOnTop: v })} />
          <Toggle
            label="Dark theme"
            checked={isDark}
            onChange={(v) => updateGlobal({ theme: v ? 'dark' : 'light' })}
          />
          <Toggle
            label="Dock on right"
            checked={g.dockSide === 'right'}
            onChange={(v) => window.desktopAPI.setDockSide(v ? 'right' : 'left').then(setSettings)}
          />
        </section>

        <section className="settings-section">
          <div className="opacity-control">
            <label>Opacity: {Math.round(g.opacity * 100)}%</label>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={g.opacity}
              onChange={(e) => updateGlobal({ opacity: Number(e.target.value) })}
            />
          </div>

          <div className="opacity-control">
            <label>Widget Size: {Math.round(displayScale * 100)}%</label>
            <input
              type="range"
              min={0.75}
              max={1.6}
              step={0.05}
              value={displayScale}
              onChange={(e) => setLiveScale(Number(e.target.value))}
              onMouseUp={(e) => commitScale(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) => commitScale(Number((e.target as HTMLInputElement).value))}
              onKeyUp={(e) => commitScale(Number((e.target as HTMLInputElement).value))}
            />
            <p className="modal-hint">Resizes every card and both buttons together</p>
          </div>
        </section>

        <section className="settings-section actions">
          <button className="btn" onClick={() => window.desktopAPI.resetPositions().then(setSettings)}>
            Reset Positions &amp; Size
          </button>
        </section>
      </div>
    </div>
  )
}
