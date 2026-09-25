import { useEffect } from 'react'
import type { ClockId, ClockState } from './types'
import { CLOCK_MAP } from './data/timezones'
import { ClockWidget } from './components/ClockWidget'
import { useAppSettings } from './hooks/useAppSettings'

function getClockIdFromQuery(): ClockId | null {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('clockId')
  return id && id in CLOCK_MAP ? (id as ClockId) : null
}

export function ClockApp(): JSX.Element | null {
  const clockId = getClockIdFromQuery()
  const settings = useAppSettings()

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
    // No need to chain the response into local state — the main process
    // broadcasts settings-changed to every window after a save, which
    // useAppSettings is already subscribed to.
    window.desktopAPI.saveClockState(clockId, partial)
  }

  const onHide = (id: ClockId): void => {
    window.desktopAPI.hideClock(id)
  }

  return (
    <ClockWidget
      definition={definition}
      clockState={clockState}
      global={settings.global}
      onUpdateClock={onUpdateClock}
      onHide={onHide}
    />
  )
}
