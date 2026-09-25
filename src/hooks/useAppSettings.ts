import { useEffect, useState } from 'react'
import type { AppSettings } from '../types'

const RETRY_DELAY_MS = 500
const MAX_ATTEMPTS = 10

/** Every widget window fetches its own copy of settings once on load via
 *  IPC, then stays in sync via the settings-changed broadcast. The initial
 *  fetch used to be a bare `getSettings().then(setSettings)` with no
 *  `.catch()` anywhere — if that one IPC round-trip ever failed or simply
 *  never resolved (e.g. contention from every widget window requesting
 *  settings at once during startup), the window's `settings` state stayed
 *  null forever and its component permanently rendered null: a silently
 *  blank, invisible widget with no error and no retry. Retrying with
 *  backoff here means a single dropped/slow IPC call can no longer
 *  permanently blank out a widget. */
export function useAppSettings(): AppSettings | null {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    let cancelled = false
    let attempt = 0

    const fetchSettings = (): void => {
      window.desktopAPI
        .getSettings()
        .then((s) => {
          if (!cancelled) setSettings(s)
        })
        .catch(() => {
          attempt += 1
          if (cancelled || attempt >= MAX_ATTEMPTS) return
          setTimeout(fetchSettings, RETRY_DELAY_MS)
        })
    }
    fetchSettings()

    const unsubscribe = window.desktopAPI.onSettingsChanged((s) => {
      if (!cancelled) setSettings(s)
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return settings
}
