# Cuevora Privacy And Data Inventory

Cuevora is offline-first. The core teleprompter, editor, library, settings and recording workflows work without an account or server.

## Stored Locally On Device

- Scripts: title, content, tags, markers, highlights, created time and updated time.
- Script revisions: recent local content snapshots for version history.
- App settings: teleprompter defaults, appearance, haptics, gestures, voice-control preference and onboarding state.
- Guest mode flag.
- Player gesture-guide seen flag.
- Backup files only when the user exports them.
- Recordings only when the user records and saves or shares them.

## Transmitted By Default

- None of the user's script content is transmitted by default.
- No analytics are collected by default.
- No ads or subscription SDKs are included.

## Optional Firebase Auth

When Firebase configuration is present and the user signs in, Firebase Authentication may process:

- Email address
- Display name
- Profile photo URL
- Provider ID
- Firebase UID
- Authentication tokens and session metadata

Cuevora currently uses sign-in for account identity and future sync readiness. Script sync is not implemented in this release, so script content remains local unless a future sync feature is built and disclosed.

## Camera And Microphone

- Camera preview is used locally for overlay and record mode.
- Microphone is used only in record mode.
- Browser or Android permission prompts gate access.
- Media streams are stopped when the view unmounts or camera use ends.
- Recordings are saved or shared only after user action.

## Backup And Restore

- Backup export creates a JSON file containing local scripts, revisions and settings.
- Backup import validates the file shape before replacing local data.
- Users control where exported backup files are stored or shared.

## Account Deletion

Settings includes an account deletion request path. Before enabling public account creation at scale, Cuevora should add a self-service Firebase account deletion flow or a public web deletion URL that satisfies Google Play policy.
