import { useEffect, useState } from 'react'
import type { AppSettings, GlobalSettings } from './types'
import { Toggle } from './components/Toggle'

export function MasterSettingsApp(): JSX.Element | null {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [open, setOpen] = useState(false)
  // Local, instantly-updating copy of the size slider's value: the actual
  // resize (which moves every widget window) only commits on release, so
  // dragging doesn't spam window moves and cause visible jitter mid-drag.
  const [liveScale, setLiveScale] = useState<number | null>(null)

  useEffect(() => {
    window.desktopAPI.getSettings().then(setSettings)
    const unsubscribe = window.desktopAPI.onSettingsChanged(setSettings)
    return unsubscribe
  }, [])

  useEffect(() => {
    // Main process auto-collapses the window when it loses focus (clicking
    // elsewhere never reaches this window's own click handlers), so mirror
    // that back into this component's open/closed state.
    const unsubscribe = window.desktopAPI.onMasterPanelCollapsed(() => setOpen(false))
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

  const toggleOpen = (): void => {
    const next = !open
    setOpen(next)
    window.desktopAPI.setMasterMenuOpen(next)
  }

  const g = settings.global
  const displayScale = liveScale ?? g.cardScale
  const isDark = g.theme === 'dark' || (g.theme === 'system' && document.documentElement.dataset.theme === 'dark')

  if (!open) {
    return (
      <div className="clock-widget-outer">
        <div className="states-button-widget">
          <button className="states-launch-btn" onClick={toggleOpen}>
            ⚙ All Clocks Settings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="clock-widget-outer">
      <div className="master-panel">
        <div className="master-panel-header">
          <span className="master-panel-icon">⚙</span>
          <span className="master-panel-title">All Clocks</span>
          <button className="master-panel-close" onClick={toggleOpen} aria-label="Close">
            ✕
          </button>
        </div>

        <Toggle label="Show seconds" checked={g.showSeconds} onChange={(v) => updateGlobal({ showSeconds: v })} />
        <Toggle label="12-hour format" checked={g.use12Hour} onChange={(v) => updateGlobal({ use12Hour: v })} />
        <Toggle label="Always on top" checked={g.alwaysOnTop} onChange={(v) => updateGlobal({ alwaysOnTop: v })} />
        <Toggle label="Dark theme" checked={isDark} onChange={(v) => updateGlobal({ theme: v ? 'dark' : 'light' })} />
        <Toggle
          label="Dock on right"
          checked={g.dockSide === 'right'}
          onChange={(v) => window.desktopAPI.setDockSide(v ? 'right' : 'left').then(setSettings)}
        />

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

        <div className="master-opacity-row">
          <span>Widget Size</span>
          <span className="master-opacity-value">{Math.round(displayScale * 100)}%</span>
        </div>
        <input
          className="master-opacity-slider"
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
        <div className="master-panel-hint">Resizes every card and both buttons together</div>

        <button
          className="master-reset-btn"
          onClick={() => window.desktopAPI.resetPositions().then(setSettings)}
        >
          Reset Positions &amp; Size
        </button>
      </div>
    </div>
  )
}
