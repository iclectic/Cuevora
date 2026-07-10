# Cuevora Privacy And Data Inventory

Cuevora is offline-first. The core teleprompter, editor, library, settings and recording workflows work without an account or server.

## Stored Locally On Device

- Scripts: title, content, tags, markers, highlights, created time and updated time.
- Script revisions: recent local content snapshots for version history.
- App settings: teleprompter defaults, appearance, haptics, gestures, voice-control preference and onboarding state.
- Rehearsal sessions: script ID, script title, transcript events, timing, pacing metrics, pause counts, filler-word counts, script coverage and local suggestions when rehearsal features are enabled.
- Guest mode flag.
- Player gesture-guide seen flag.
- Home library preferences such as sort and view mode are held in React state for the current session.
- Backup files only when the user exports them.
- Recordings only when the user records and saves or shares them.

## Transmitted By Default

- None of the user's script content is transmitted by default.
- No analytics are collected by default.
- No ads or subscription SDKs are included.
- No AI, rehearsal-coach or sync provider receives script content in the current release.

## Optional Firebase Auth

When Firebase configuration is present and the user signs in, Firebase Authentication may process:

- Email address
- Display name
- Profile photo URL
- Provider ID
- Firebase UID
- Authentication tokens and session metadata

Cuevora currently uses sign-in for account identity and future sync readiness. Script sync is not implemented in this release, so script content remains local unless a future sync feature is built and disclosed.

Passwordless email sign-in UI is prepared but not production-enabled. Enabling it requires Firebase action-code URL configuration, authorised domains and another privacy review.

## Camera And Microphone

- Camera preview is used locally for overlay and record mode.
- Microphone is used only in record mode.
- Browser or Android permission prompts gate access.
- Cuevora shows an in-app rationale before requesting camera and microphone access.
- Media streams are stopped when the view unmounts or camera use ends.
- Recordings are saved or shared only after user action.

## Voice Controls And Future Rehearsal Features

- Voice controls use browser or device speech-recognition capabilities where supported.
- Android native builds currently disable Web Speech voice controls unless a supported path is added later.
- Depending on the browser, operating system or device, speech recognition may be processed by the platform provider and may not be entirely on-device.
- Cuevora stores rehearsal transcripts and metrics locally only when a rehearsal feature saves a session.
- Cuevora does not currently store adaptive-scroll metrics or eye-contact metrics.
- If adaptive scrolling, eye-contact coaching or AI features are added later, update this inventory before release and describe exactly what is stored locally, what is transmitted, and what is unavailable on unsupported devices.

## Backup And Restore

- Backup export creates a JSON file containing local scripts, revisions, settings and saved rehearsal sessions.
- Backup import validates the file shape before replacing local data.
- Users control where exported backup files are stored or shared.
- Clearing local data removes scripts, revisions, settings and guest-mode state from the current device.

## Account Deletion

Settings includes an account deletion request path. Before enabling public account creation at scale, Cuevora should add a self-service Firebase account deletion flow or a public web deletion URL that satisfies Google Play policy.

## Explicit Non-Claims For The Current Release

- Cloud script sync is not implemented.
- AI writing, AI rehearsal coaching and cloud transcript analysis are not implemented.
- Local speech-to-text model bundling is not implemented.
- Producer remote control is not implemented.
- Eye-contact or face-landmark coaching is not implemented.
