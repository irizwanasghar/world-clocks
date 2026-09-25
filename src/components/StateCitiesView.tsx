import { useEffect, useState } from 'react'
import type { PopulationResult } from '../types'
import type { UsState } from '../data/usStates'

interface StateCitiesViewProps {
  state: UsState
  onBack: () => void
}

type Status = 'loading' | 'ready' | 'missing-key' | 'error'

const MAX_ROWS = 150

export function StateCitiesView({ state, onBack }: StateCitiesViewProps): JSX.Element {
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [cities, setCities] = useState<PopulationResult[]>([])
  const [query, setQuery] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [keySaved, setKeySaved] = useState(false)

  const load = (): void => {
    setStatus('loading')
    window.desktopAPI.listStateCities(state.abbreviation).then((response) => {
      if (!response.ok) {
        if (response.error === 'missing-api-key') {
          setStatus('missing-key')
        } else {
          setErrorMessage(response.error)
          setStatus('error')
        }
        return
      }
      setCities(response.results)
      setStatus('ready')
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.abbreviation])

  const saveKey = async (): Promise<void> => {
    await window.desktopAPI.saveGlobalSettings({ censusApiKey: keyInput.trim() })
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 1500)
    load()
  }

  const filtered = query.trim()
    ? cities.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    : cities

  return (
    <>
      <button className="modal-back-btn" onClick={onBack}>
        ← Back to states
      </button>
      <h2 className="modal-subtitle">{state.name} cities</h2>

      {status === 'missing-key' && (
        <div className="settings-section">
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
        </div>
      )}

      {status === 'error' && (
        <p className="population-error">{errorMessage || 'Could not load cities. Check your connection.'}</p>
      )}

      {status === 'loading' && <p className="modal-hint">Loading cities…</p>}

      {status === 'ready' && (
        <>
          <div className="modal-search-wrap">
            <span className="modal-search-icon">⌕</span>
            <input
              className="modal-search"
              type="text"
              placeholder={`Search ${state.name} cities…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query.length > 0 && (
              <button className="modal-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                ✕
              </button>
            )}
          </div>

          <div className="modal-count">
            {filtered.length} {filtered.length === 1 ? 'city' : 'cities'}
            {filtered.length > MAX_ROWS ? ` (showing top ${MAX_ROWS} by population)` : ''}
          </div>

          <div className="modal-list">
            {filtered.length === 0 && <div className="modal-empty">No cities match your search.</div>}
            {filtered.slice(0, MAX_ROWS).map((c) => (
              <div className="modal-row" key={c.name}>
                <span className="modal-row-name">{c.name}</span>
                <span className="modal-row-time">{c.population.toLocaleString('en-US')}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
