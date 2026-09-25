import { useEffect, useState } from 'react'
import type { AppSettings, PopulationResult } from './types'
import { US_STATES } from './data/usStates'

type Status = 'idle' | 'loading' | 'found' | 'not-found' | 'error' | 'missing-key'

export function PopulationApp(): JSX.Element | null {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [city, setCity] = useState('')
  const [stateAbbr, setStateAbbr] = useState('CA')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<PopulationResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [keySaved, setKeySaved] = useState(false)

  useEffect(() => {
    window.desktopAPI.getSettings().then((s) => {
      setSettings(s)
      setKeyInput(s.global.censusApiKey)
    })
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
      if (response.error === 'missing-api-key') {
        setStatus('missing-key')
      } else {
        setStatus('error')
        setErrorMessage(response.error)
      }
      return
    }
    if (!response.result) {
      setStatus('not-found')
      return
    }
    setResult(response.result)
    setStatus('found')
  }

  const saveKey = async (): Promise<void> => {
    const updated = await window.desktopAPI.saveGlobalSettings({ censusApiKey: keyInput.trim() })
    setSettings(updated)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  if (!settings) return null

  const hasKey = settings.global.censusApiKey.trim().length > 0

  return (
    <div className="settings-app">
      <div className="settings-panel">
        <h1 className="settings-title">City Population</h1>

        {(!hasKey || status === 'missing-key') && (
          <section className="settings-section">
            <h2>Census API Key Required</h2>
            <p className="modal-hint">
              The Census Bureau requires a free API key for this lookup. Get one at{' '}
              <strong>api.census.gov/data/key_signup.html</strong>, then paste it below.
            </p>
            <div className="population-form" style={{ marginTop: 8 }}>
              <input
                className="modal-search"
                type="text"
                placeholder="Paste your Census API key"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
              <button className="btn" onClick={saveKey} disabled={!keyInput.trim()}>
                {keySaved ? 'Saved ✓' : 'Save Key'}
              </button>
            </div>
          </section>
        )}

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
            {status === 'missing-key' && (
              <p className="population-error">Add your Census API key above, then search again.</p>
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
