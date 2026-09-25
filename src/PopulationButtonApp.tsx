export function PopulationButtonApp(): JSX.Element {
  return (
    <div className="clock-widget-outer">
      <div className="states-button-widget">
        <button className="states-launch-btn" onClick={() => window.desktopAPI.openPopulationWindow()}>
          👥 Population
        </button>
      </div>
    </div>
  )
}
