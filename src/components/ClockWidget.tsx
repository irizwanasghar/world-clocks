import { useEffect, useState } from 'react'
import type { ClockDefinition, ClockId, ClockState, GlobalSettings } from '../types'
import { useClock } from '../hooks/useClock'
import { FlagIcon } from './FlagIcon'
import { getEffectiveSettings } from '../data/effectiveSettings'

interface ClockWidgetProps {
  definition: ClockDefinition
  clockState: ClockState
  global: GlobalSettings
  onUpdateClock: (partial: Partial<ClockState>) => void
  onHide: (id: ClockId) => void
}

export function ClockWidget({
  definition,
  clockState,
  global,
  onUpdateClock,
  onHide
}: ClockWidgetProps): JSX.Element {
  const effective = getEffectiveSettings(clockState, global)
  const { time, date } = useClock(definition.timezone, effective.use12Hour, effective.showSeconds)
  const [menuOpen, setMenuOpen] = useState(false)
  // Captured window height (minus the gutter) right before the menu opens, so
  // the card keeps its normal size while the window grows beneath it for the
  // menu, instead of the card itself stretching.
  const [cardHeight, setCardHeight] = useState<number | null>(null)

  const closeMenu = (): void => {
    setMenuOpen(false)
    setCardHeight(null)
    window.desktopAPI.setClockMenuOpen(definition.id, false)
  }

  const toggleMenu = (): void => {
    if (menuOpen) {
      closeMenu()
      return
    }
    setCardHeight(document.documentElement.clientHeight - 16)
    setMenuOpen(true)
    window.desktopAPI.setClockMenuOpen(definition.id, true)
  }

  useEffect(() => {
    if (!menuOpen) return
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen])

  return (
    <div className="clock-widget-outer">
      <div
        className="clock-widget"
        style={{
          ['--glass-alpha' as string]: String(effective.opacity),
          ...(cardHeight ? { height: `${cardHeight}px` } : {})
        }}
      >
        <div className="clock-drag-region">
          <button
            className="gear-button"
            aria-label="Clock settings"
            onClick={(e) => {
              e.stopPropagation()
              toggleMenu()
            }}
          >
            ⚙
          </button>

          <div className="clock-header">
            <FlagIcon countryCode={definition.countryCode} /> {definition.label}
          </div>
          <div className="clock-city">{definition.city}</div>
          <div className="clock-time">{time}</div>
          <div className="clock-date">{date}</div>
        </div>
      </div>

      {menuOpen && (
        <div
          className="gear-menu"
          onClick={(e) => e.stopPropagation()}
          style={cardHeight ? { top: `${cardHeight + 16}px` } : undefined}
        >
          <button
            className="menu-item"
            onClick={() => onUpdateClock({ showSeconds: !effective.showSeconds })}
          >
            {effective.showSeconds ? '✓ ' : ''}Show seconds
          </button>
          <button className="menu-item" onClick={() => onUpdateClock({ use12Hour: !effective.use12Hour })}>
            {effective.use12Hour ? '12-hour' : '24-hour'} (toggle)
          </button>
          <button
            className="menu-item"
            onClick={() => onUpdateClock({ alwaysOnTop: !effective.alwaysOnTop })}
          >
            {effective.alwaysOnTop ? '✓ ' : ''}Always on top
          </button>
          <div className="menu-item opacity-row">
            <span>Opacity</span>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={effective.opacity}
              onChange={(e) => onUpdateClock({ opacity: Number(e.target.value) })}
            />
          </div>
          <button
            className="menu-item danger"
            onClick={() => {
              closeMenu()
              onHide(definition.id)
            }}
          >
            Hide this clock
          </button>
        </div>
      )}
    </div>
  )
}
