import { useEffect, useState } from 'react'
import type { AppSettings, ClockId, GlobalSettings, Theme } from '../types'
import { CLOCK_DEFINITIONS } from '../data/timezones'
import { Toggle } from './Toggle'
import { FlagIcon } from './FlagIcon'
import { StatesModal } from './StatesModal'

export function ClockSettings(): JSX.Element | null {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [statesOpen, setStatesOpen] = useState(false)

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

  if (!settings) return <div className="settings-loading">Loading…</div>

  const updateGlobal = (partial: Partial<GlobalSettings>): void => {
    window.desktopAPI.saveGlobalSettings(partial).then(setSettings)
  }

  const toggleClock = (id: ClockId, enabled: boolean): void => {
    window.desktopAPI.toggleClockEnabled(id, enabled).then(setSettings)
  }

  return (
    <div className="settings-panel">
      <h1 className="settings-title">World Clocks</h1>

      <section className="settings-section">
        <h2>Clocks</h2>
        {CLOCK_DEFINITIONS.map((def) => (
          <Toggle
            key={def.id}
            label={
              <>
                <FlagIcon countryCode={def.countryCode} size={13} /> {def.label} — {def.city}
              </>
            }
            checked={settings.clocks[def.id].enabled}
            onChange={(checked) => toggleClock(def.id, checked)}
          />
        ))}
        <button className="btn btn-secondary see-all-states" onClick={() => setStatesOpen(true)}>
          See all states
        </button>
      </section>

      <section className="settings-section">
        <h2>Global</h2>
        <Toggle
          label="Always on top"
          checked={settings.global.alwaysOnTop}
          onChange={(v) => updateGlobal({ alwaysOnTop: v })}
        />
        <Toggle
          label="Show seconds"
          checked={settings.global.showSeconds}
          onChange={(v) => updateGlobal({ showSeconds: v })}
        />
        <Toggle
          label="12-hour format"
          checked={settings.global.use12Hour}
          onChange={(v) => updateGlobal({ use12Hour: v })}
        />
        <Toggle
          label="Launch at startup"
          checked={settings.global.launchAtStartup}
          onChange={(v) => updateGlobal({ launchAtStartup: v })}
        />

        <div className="opacity-control">
          <label htmlFor="opacity-slider">Opacity: {Math.round(settings.global.opacity * 100)}%</label>
          <input
            id="opacity-slider"
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={settings.global.opacity}
            onChange={(e) => updateGlobal({ opacity: Number(e.target.value) })}
          />
        </div>

        <div className="theme-control">
          <label htmlFor="theme-select">Theme</label>
          <select
            id="theme-select"
            value={settings.global.theme}
            onChange={(e) => updateGlobal({ theme: e.target.value as Theme })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </div>
      </section>

      <section className="settings-section actions">
        <button className="btn" onClick={() => window.desktopAPI.showAll()}>
          Show All
        </button>
        <button className="btn" onClick={() => window.desktopAPI.hideAll()}>
          Hide All
        </button>
        <button
          className="btn"
          onClick={() => window.desktopAPI.resetPositions().then(setSettings)}
        >
          Reset Positions
        </button>
      </section>

      {statesOpen && (
        <StatesModal use12Hour={settings.global.use12Hour} onClose={() => setStatesOpen(false)} />
      )}
    </div>
  )
}
