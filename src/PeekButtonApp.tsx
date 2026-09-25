import { useAppSettings } from './hooks/useAppSettings'

export function PeekButtonApp(): JSX.Element | null {
  const settings = useAppSettings()

  if (!settings) return null

  const { peeked, dockSide } = settings.global
  // Arrow points toward the edge when collapsing (send away), and back
  // toward center when already peeked (bring back).
  const pointsRight = dockSide === 'right' ? !peeked : peeked
  const label = peeked ? 'Show all widgets' : 'Tuck all widgets away'

  return (
    <div className="peek-toggle-widget">
      <button
        className="peek-toggle-btn"
        aria-label={label}
        title={label}
        onClick={() => window.desktopAPI.toggleGlobalPeek()}
      >
        {pointsRight ? '›' : '‹'}
      </button>
    </div>
  )
}
