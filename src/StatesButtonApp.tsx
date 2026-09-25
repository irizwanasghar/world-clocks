export function StatesButtonApp(): JSX.Element {
  return (
    <div className="states-button-widget">
      <button className="states-launch-btn" onClick={() => window.desktopAPI.openStatesWindow()}>
        🗺 See all states
      </button>
    </div>
  )
}
