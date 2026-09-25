export function MasterSettingsApp(): JSX.Element {
  return (
    <div className="clock-widget-outer">
      <div className="states-button-widget">
        <button className="states-launch-btn" onClick={() => window.desktopAPI.openMasterSettingsWindow()}>
          ⚙ All Clocks Settings
        </button>
      </div>
    </div>
  )
}
