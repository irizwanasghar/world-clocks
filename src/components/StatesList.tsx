import { useEffect, useMemo, useState } from 'react'
import { US_STATES, type UsState, type UsTimeZone } from '../data/usStates'
import { formatTime } from '../hooks/useClock'
import { StateCitiesView } from './StateCitiesView'

interface StatesListProps {
  use12Hour: boolean
}

const ZONE_FILTERS: Array<UsTimeZone | 'All'> = ['All', 'Eastern', 'Central', 'Mountain', 'Pacific']

export function StatesList({ use12Hour }: StatesListProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [zoneFilter, setZoneFilter] = useState<UsTimeZone | 'All'>('All')
  const [selectedState, setSelectedState] = useState<UsState | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return US_STATES.filter((s) => {
      const matchesZone = zoneFilter === 'All' || s.zone === zoneFilter
      const matchesQuery =
        q.length === 0 || s.name.toLowerCase().includes(q) || s.abbreviation.toLowerCase().includes(q)
      return matchesZone && matchesQuery
    })
  }, [query, zoneFilter])

  if (selectedState) {
    return <StateCitiesView state={selectedState} onBack={() => setSelectedState(null)} />
  }

  return (
    <>
      <div className="modal-search-wrap">
        <span className="modal-search-icon">⌕</span>
        <input
          className="modal-search"
          type="text"
          placeholder="Search state or abbreviation…"
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

      <div className="modal-filters">
        {ZONE_FILTERS.map((zone) => (
          <button
            key={zone}
            className={`filter-pill zone-${zone.toLowerCase()} ${zoneFilter === zone ? 'active' : ''}`}
            onClick={() => setZoneFilter(zone)}
          >
            {zone}
          </button>
        ))}
      </div>

      <div className="modal-count">
        {filtered.length} {filtered.length === 1 ? 'state' : 'states'}
      </div>

      <div className="modal-list">
        {filtered.length === 0 && (
          <div className="modal-empty">
            <div className="modal-empty-icon">🔍</div>
            No states match your search.
          </div>
        )}
        {filtered.map((s) => (
          <button className="modal-row modal-row-clickable" key={s.abbreviation} onClick={() => setSelectedState(s)}>
            <span className={`modal-row-abbr zone-${s.zone.toLowerCase()}`}>{s.abbreviation}</span>
            <span className="modal-row-name">{s.name}</span>
            <span className={`modal-row-zone-tag zone-${s.zone.toLowerCase()}`}>{s.zone}</span>
            <span className="modal-row-time">{formatTime(s.timezone, use12Hour, false)}</span>
            <span className="modal-row-chevron">›</span>
          </button>
        ))}
      </div>
    </>
  )
}
