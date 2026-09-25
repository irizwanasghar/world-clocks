import { useEffect, useState } from 'react'
import type { AppSettings, ClockId, ClockState } from './types'
import { CLOCK_MAP } from './data/timezones'
import { ClockWidget } from './components/ClockWidget'

function getClockIdFromQuery(): ClockId | null {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('clockId')
  return id && id in CLOCK_MAP ? (id as ClockId) : null
}

export function ClockApp(): JSX.Element | null {
  const clockId = getClockIdFromQuery()
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

  if (!clockId || !settings) return null

  const definition = CLOCK_MAP[clockId]
  const clockState = settings.clocks[clockId]

  const onUpdateClock = (partial: Partial<ClockState>): void => {
    window.desktopAPI.saveClockState(clockId, partial).then(setSettings)
  }

  const onHide = (id: ClockId): void => {
    window.desktopAPI.hideClock(id)
  }

  const onTogglePeek = (id: ClockId): void => {
    window.desktopAPI.toggleClockPeek(id).then(setSettings)
  }

  return (
    <ClockWidget
      definition={definition}
      clockState={clockState}
      global={settings.global}
      onUpdateClock={onUpdateClock}
      onHide={onHide}
      onTogglePeek={onTogglePeek}
    />
  )
}
