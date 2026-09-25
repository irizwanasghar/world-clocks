import { useEffect, useState } from 'react'
import type { ClockDefinition, ClockId, GlobalSettings } from '../types'
import { useClock } from '../hooks/useClock'

interface ClockWidgetProps {
  definition: ClockDefinition
  global: GlobalSettings
  onUpdateGlobal: (partial: Partial<GlobalSettings>) => void
  onHide: (id: ClockId) => void
}

export function ClockWidget({ definition, global, onUpdateGlobal, onHide }: ClockWidgetProps): JSX.Element {
  const { time, date } = useClock(definition.timezone, global.use12Hour, global.showSeconds)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onClickAway = (): void => setMenuOpen(false)
    if (menuOpen) document.addEventListener('click', onClickAway)
    return () => document.removeEventListener('click', onClickAway)
  }, [menuOpen])

  return (
    <div
      className="clock-widget"
      style={{ ['--glass-alpha' as string]: String(global.opacity) }}
    >
      <div className="clock-drag-region">
        <button
          className="gear-button"
          aria-label="Clock settings"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
        >
          ⚙
        </button>

        <div className="clock-header">
          {definition.flagEmoji} {definition.label}
        </div>
        <div className="clock-city">{definition.city}</div>
        <div className="clock-time">{time}</div>
        <div className="clock-date">{date}</div>
      </div>

      {menuOpen && (
        <div className="gear-menu" onClick={(e) => e.stopPropagation()}>
          <button
            className="menu-item"
            onClick={() => onUpdateGlobal({ showSeconds: !global.showSeconds })}
          >
            {global.showSeconds ? '✓ ' : ''}Show seconds
          </button>
          <button className="menu-item" onClick={() => onUpdateGlobal({ use12Hour: !global.use12Hour })}>
            {global.use12Hour ? '12-hour' : '24-hour'} (toggle)
          </button>
          <button
            className="menu-item"
            onClick={() => onUpdateGlobal({ alwaysOnTop: !global.alwaysOnTop })}
          >
            {global.alwaysOnTop ? '✓ ' : ''}Always on top
          </button>
          <div className="menu-item opacity-row">
            <span>Opacity</span>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={global.opacity}
              onChange={(e) => onUpdateGlobal({ opacity: Number(e.target.value) })}
            />
          </div>
          <button className="menu-item danger" onClick={() => onHide(definition.id)}>
            Hide this clock
          </button>
        </div>
      )}
    </div>
  )
}
