import { useEffect, useState } from 'react'
import type { AppSettings, PopulationResult } from './types'
import { US_STATES } from './data/usStates'

type Status = 'idle' | 'loading' | 'found' | 'not-found' | 'error'

export function PopulationApp(): JSX.Element | null {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [city, setCity] = useState('')
  const [stateAbbr, setStateAbbr] = useState('CA')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<PopulationResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

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

  const search = async (): Promise<void> => {
    if (!city.trim()) return
    setStatus('loading')
    setResult(null)
    setErrorMessage('')
    const response = await window.desktopAPI.lookupPopulation(city.trim(), stateAbbr)
    if (!response.ok) {
      setStatus('error')
      setErrorMessage(response.error)
      return
    }
    if (!response.result) {
      setStatus('not-found')
      return
    }
    setResult(response.result)
    setStatus('found')
  }

  if (!settings) return null

  return (
    <div className="settings-app">
      <div className="settings-panel">
        <h1 className="settings-title">City Population</h1>

        <section className="settings-section">
          <div className="population-form">
            <input
              className="modal-search"
              type="text"
              placeholder="City name (e.g. Austin)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') search()
              }}
              autoFocus
            />
            <select
              className="population-state-select"
              value={stateAbbr}
              onChange={(e) => setStateAbbr(e.target.value)}
            >
              {US_STATES.map((s) => (
                <option key={s.abbreviation} value={s.abbreviation}>
                  {s.name}
                </option>
              ))}
            </select>
            <button className="btn" onClick={search} disabled={status === 'loading' || !city.trim()}>
              {status === 'loading' ? 'Searching…' : 'Search'}
            </button>
          </div>

          <div className="population-result">
            {status === 'idle' && (
              <p className="modal-hint">Enter a city and state, then search. Live data from the U.S. Census Bureau.</p>
            )}
            {status === 'loading' && <p className="modal-hint">Looking up population…</p>}
            {status === 'not-found' && (
              <p className="modal-hint">No match found for that city in {stateAbbr}. Check the spelling and try again.</p>
            )}
            {status === 'error' && <p className="population-error">{errorMessage || 'Lookup failed. Check your internet connection.'}</p>}
            {status === 'found' && result && (
              <div className="population-card">
                <div className="population-card-name">{result.name}</div>
                <div className="population-card-value">{result.population.toLocaleString('en-US')}</div>
                <div className="population-card-meta">
                  U.S. Census Bureau · ACS 5-Year Estimate ({result.year})
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
