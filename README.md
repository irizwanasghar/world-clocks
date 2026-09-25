# World Clocks

Five floating, frameless, always-on-top glassmorphism clock widgets (New York,
Chicago, Denver, Los Angeles, Karachi) plus a "World Clocks" settings window,
built with Electron + React + TypeScript + Vite. Fully offline, no backend.

## Development

```bash
npm install
npm run dev
```

This starts Vite's dev server for the two renderer entry points (clock widget,
settings window) and launches Electron pointed at them with hot reload.

## Type-check & production build

```bash
npm run build
```

Runs `tsc --noEmit` followed by `electron-vite build`, producing
`out/main`, `out/preload`, and `out/renderer`.

## Windows installer (NSIS)

```bash
npm run dist:win
```

Builds the app then runs `electron-builder --win nsis`, producing
`release/WorldClocks Setup.exe`.

> electron-builder downloads a small `winCodeSign` helper archive even for an
> unsigned Windows build, and extracting it requires the
> `SeCreateSymbolicLinkPrivilege` privilege (Developer Mode enabled, or an
> elevated/Administrator shell). If that privilege isn't available, `dist:win`
> will fail at the download/extract step even though `npm run build` succeeds
> cleanly. See SUMMARY.md for details.

## macOS DMG (documented only — cannot be run or tested on Windows)

```bash
npm run dist:mac
```

Runs `electron-builder --mac dmg`, producing `release/WorldClocks.dmg`. This
must be run on macOS (electron-builder cannot produce a `.dmg` from Windows).
No Apple Developer signing/notarization is configured — `identity: null` in
the `build.mac` section of `package.json` skips codesigning, which is fine
for local testing but the app will show an "unidentified developer" warning
on first launch on macOS. Add `notarize`/`identity` config and an Apple
Developer certificate for distribution.

## Project layout

See `SUMMARY.md` for the full file tree and feature summary.
