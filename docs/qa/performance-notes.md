# Cuevora Performance Notes

## Current Gate

- Fixed-speed prompting uses a shared `requestAnimationFrame` playback hook.
- Adaptive scrolling is a pure cadence calculation feeding the same playback hook.
- No heavy ML, local STT, face-landmark or AI provider package is included in this release slice.
- Rehearsal metrics are deterministic local calculations over transcript events.

## Bundle Decision

Vendor chunk splitting is configured in `vite.config.ts` so React, UI libraries, Firebase and Capacitor do not inflate the main application chunk as one bundle.

Record the production build output here after each release-candidate build:

| Date | Command | Main chunk | Largest vendor chunk | Notes |
| --- | --- | --- | --- | --- |
| 2026-07-10 | `npm run build` | 108.25 kB / 29.94 kB gzip | 189.99 kB / 63.28 kB gzip | Vendor chunk splitting removed the prior large main chunk warning |

## Runtime QA Targets

- Prompt playback should remain smooth while changing speed, font size, focus line and mirror mode.
- Adaptive scroll must fall back to fixed speed when speech is unsupported, stale or manually overridden.
- Record Mode must stop media streams when leaving, stopping, or completing a script.
- Large scripts should remain scrollable without delayed controls.
- Rehearsal reports should save without blocking prompt playback or recording.

## Follow-Up Triggers

- Add dynamic route-level imports if the main application chunk remains large after vendor splitting.
- Do not add local STT, face-landmark or AI packages until a release build records their bundle impact.
- Re-test Android WebView memory behavior before enabling any heavier media or ML dependency by default.
