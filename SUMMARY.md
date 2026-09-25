# World Clocks - Build Summary

Floating world-clock widgets for someone working with US clients from
Pakistan. Five independent, always-on-top, frameless glassmorphism clock
windows (Eastern, Central, Mountain, Pacific, Pakistan) plus a "World Clocks"
controller/settings window and a system tray. Electron + React + TypeScript +
Vite, fully offline, no backend/database.

## What was built

- 5 independent BrowserWindows, one per clock (electron/windows/createClockWindow.ts),
  each frameless, transparent, always-on-top, draggable, resizable, with its
  own persisted {x, y, width, height, visible, enabled} restored on launch.
- Settings/controller window (electron/windows/createSettingsWindow.ts +
  src/components/ClockSettings.tsx): per-clock on/off toggles, global
  always-on-top / show-seconds / 12h / launch-at-startup toggles, opacity
  slider (default 90%), theme select (dark/light/system, default dark), Show
  All / Hide All / Reset Positions buttons. Closing it hides it; only tray
  "Quit" exits the app.
- System tray (electron/tray/tray.ts): Show All, Hide All, per-clock
  checkboxes, Settings, Reset Positions, Quit.
- Secure preload/IPC: contextIsolation true, nodeIntegration false,
  sandbox true; window.desktopAPI is a small typed surface
  (src/types/index.ts DesktopAPI) exposed via contextBridge; renderer
  never touches ipcRenderer or Node APIs directly.
- Persistence: hand-rolled JSON file in app.getPath('userData')
  (electron/services/settings.ts), no electron-store dependency needed.
  Validates each saved clock position against screen.getAllDisplays() on
  startup and repositions onto the primary display's work area if the saved
  position is off-screen (e.g. a disconnected monitor). Corrupt or partially
  missing JSON falls back to sane defaults field-by-field.
- Time formatting: all via Intl.DateTimeFormat with IANA timezone names
  (src/hooks/useClock.ts) - no manual UTC-offset math anywhere.
- Single instance lock: second launch focuses/shows the settings window.
- Launch at startup: app.setLoginItemSettings. Same API works on macOS;
  untestable on this Windows machine.
- Business-hours data model: BusinessHours + optional ClockDefinition.businessHours
  field exist in src/types/index.ts for forward compatibility, but nothing
  renders or computes an OPEN/CLOSED indicator in v1 (see "v2" below).

## Project structure

```
electron/
  main.ts                       app bootstrap, single-instance lock, window/tray wiring
  preload.ts                    contextBridge-exposed desktopAPI
  windows/
    createClockWindow.ts        per-clock BrowserWindow factory + bounds persistence
    createSettingsWindow.ts     settings BrowserWindow (hide-on-close)
  tray/
    tray.ts                     tray icon + menu (Show/Hide All, per-clock, Settings, Reset, Quit)
  services/
    settings.ts                 JSON persistence, defaults, corrupt-file recovery, position validation
    displayManager.ts           display bounds helpers
  ipc/
    handlers.ts                 all ipcMain.handle() endpoints
src/
  components/
    ClockWidget.tsx             glass widget: time/date/gear menu
    ClockSettings.tsx           World Clocks settings panel
    Toggle.tsx                  reusable switch control
  data/timezones.ts             the 5 ClockDefinition entries (IANA tz, flag, city)
  hooks/useClock.ts             Intl.DateTimeFormat-driven ticking clock hook
  types/index.ts                ClockId, AppSettings, DesktopAPI, BusinessHours, etc.
  styles/globals.css            glassmorphism + dark/light theme tokens
  ClockApp.tsx / clock-main.tsx / clock.html         clock widget renderer entry
  SettingsApp.tsx / settings-main.tsx / settings.html  settings renderer entry
resources/icon.png              placeholder tray/app icon
package.json, tsconfig.json, electron.vite.config.ts, .gitignore, README.md
```

## Exact commands

```bash
npm install                 # install dependencies
npm run dev                 # Vite + Electron together, hot reload
npm run build                # tsc --noEmit, then electron-vite build (renderer + main + preload)
npm run dist:win             # build, then electron-builder --win nsis -> release/WorldClocks Setup.exe
npm run dist:mac             # build, then electron-builder --mac dmg  -> release/WorldClocks.dmg (macOS only)
```

## Verification results

- npm install - succeeds (378 packages). Electron/esbuild postinstall
  scripts approved via npm approve-scripts.
- npm run dev - launches cleanly, no renderer or main-process errors in the
  log after starting; verified via log output and confirming electron.exe
  processes were running, then terminated cleanly.
- npx tsc --noEmit - zero TypeScript errors.
- npm run build - succeeds: main (15.6 kB), preload (1.4 kB), and both
  renderer entry points (clock.html, settings.html) all built cleanly.
- npm run dist:win - cannot complete in this environment. electron-builder
  downloads a small winCodeSign helper archive even for an unsigned NSIS
  build, and extracting it needs the SeCreateSymbolicLinkPrivilege Windows
  privilege (Developer Mode enabled, or an elevated Administrator shell).
  This sandboxed shell does not have that privilege, so the 7-Zip extraction
  fails with "Cannot create symbolic link: A required privilege is not held
  by the client". This is an environment/tooling limitation, not a code
  defect - npm run build (the actual compile/type-check step) is clean.
  To produce the installer: enable Windows Developer Mode (Settings -> Privacy
  and security -> For developers) or run npm run dist:win from an elevated
  terminal, then re-run.
- npm run dist:mac - not run (requires macOS); documented above.

## Errors hit during the build and how they were fixed

1. package.json's "main" pointed at out/main/main.js, but electron-vite's
   default main entry name is "index" (matching the main.build.rollupOptions.input.index
   config), producing out/main/index.js. Fixed by pointing main at
   out/main/index.js.
2. app.getLoginItemSettings truthiness check tripped
   noUnusedLocals/TS2774 ("this condition will always return true"). Removed
   the redundant guard since the method always exists on app.
3. SettingsStore was constructed at module load time and called
   screen.getAllDisplays() before Electron's app.whenReady() fired,
   throwing "The screen module cannot be used before the app ready event".
   Fixed by lazily constructing the store's singleton from inside
   app.whenReady() via an explicit initSettingsStore() call.
4. Declared an electron-store dependency initially per the spec's suggested
   toolset, but implemented a hand-rolled JSON store instead (simpler, zero
   extra dependency surface, and the spec explicitly allows either) - removed
   the unused dependency from package.json.

## What's left for v2

- Business-hours OPEN/CLOSED indicator: the data model
  (BusinessHours on ClockDefinition) is in place but not wired into
  ClockWidget.tsx or the settings UI. v2 would add: a per-clock business
  hours config UI, a computed open/closed badge next to the city line (using
  the same Intl.DateTimeFormat-based approach, checking day-of-week and
  hour in the target timezone), and a settings toggle to show/hide it.
- Custom, non-placeholder tray/app icon (currently a minimal placeholder PNG).
- macOS-specific testing (login item behavior, DMG build, notarization) since
  this was built and verified on Windows only.
- Signed Windows installer (currently unsigned NSIS; would need a code-signing
  certificate wired into electron-builder's win.certificateFile / CSC env vars).
