# Cuevora Demo Script

Use this when recording a short technical demo or walkthrough.

## Setup

- Use a real Android build when possible.
- Use a script with at least 300 words.
- Prepare one short rehearsal with speech recognition supported and one unsupported-device fallback note.
- Capture device model, Android version and build version.

## Demo Flow

1. Open Cuevora in guest mode.
2. Create or open a script.
3. Show fixed-speed teleprompter playback.
4. Change speed manually and show reset/seek.
5. Enable adaptive scroll and show that manual controls still win.
6. Open Rehearsal and start a practice session.
7. Stop and save the report.
8. Show WPM, pauses, filler words, completion and suggestions.
9. Open Settings and show accessibility profiles.
10. Show backup/export and privacy copy boundaries.

## Talk Track

Cuevora is an offline-first teleprompter built with React, TypeScript and Capacitor. The core prompt loop uses a shared `requestAnimationFrame` playback hook. The rehearsal layer uses transcript events where supported, but the first coach slice stays deterministic and local-first. Adaptive scrolling follows recent cadence only when confidence is high, and fixed speed remains the fallback.

## Evidence To Capture

- Short screen recording of fixed-speed playback.
- Short screen recording of adaptive/rehearsal flow.
- Screenshot of saved rehearsal report.
- Screenshot of accessibility profiles.
- Screenshot of privacy/local-data copy.
- Closed-test quote with explicit permission.
