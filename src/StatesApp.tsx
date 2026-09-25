import { useEffect } from 'react'
import { StatesList } from './components/StatesList'
import { useAppSettings } from './hooks/useAppSettings'

export function StatesApp(): JSX.Element | null {
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

  if (!settings) return null

  return (
    <div className="states-page">
      <h1 className="settings-title">All US States</h1>
      <StatesList use12Hour={settings.global.use12Hour} />
    </div>
  )
}
