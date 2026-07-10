# Cuevora Play Store Release Checklist

## App Identity

- App name: Cuevora
- Package name: `app.cuevora.teleprompter`
- Version name: `1.0.0`
- Version code: `1` in `android/app/build.gradle`
- Target SDK: `36`
- Compile SDK: `36`
- Minimum SDK: `24`
- Capacitor: `8.x`

## Build Commands

```bash
npm install
npm run lint
npm run test
npm run build
npx cap sync android
cd android && ./gradlew lint
cd android && ./gradlew test
cd android && ./gradlew bundleRelease
```

Release signing is required for a Play-uploadable `.aab`. Create `android/keystore.properties` locally from `android/keystore.properties.example`, or provide these environment variables in CI:

- `CUEVORA_UPLOAD_STORE_FILE`
- `CUEVORA_UPLOAD_STORE_PASSWORD`
- `CUEVORA_UPLOAD_KEY_ALIAS`
- `CUEVORA_UPLOAD_KEY_PASSWORD`

Do not commit keystore files, `android/keystore.properties`, passwords or upload-key credentials.

Release bundle path:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

## Permissions

- `CAMERA`: required for camera overlay and record mode.
- `RECORD_AUDIO`: required for record mode audio.
- `INTERNET`: required only for optional Firebase Auth, legal pages and hosted assets.
- Camera and microphone hardware are marked `required="false"` so the app can remain available on devices without those features.
- No location, contacts, SMS, call log or background sensor permissions should be requested.
- `android:usesCleartextTraffic="false"` is set.
- Mixed content is disabled in `capacitor.config.ts`.

## Feature Verification

- Home:
  - Pull-to-refresh reloads local scripts/settings and shows a toast.
  - Script deletion requires confirmation and offers undo.
  - Sorting works for recently updated, recently created, A to Z and longest script.
  - Compact and detailed card views both work.
- Editor:
  - Autosave shows Saving, Saved, Offline and Error saving states.
  - Import/export/copy controls are labelled.
  - Leaving during an active save warns the user.
- Player:
  - RAF scrolling remains smooth.
  - Gesture guide appears on first run.
  - Space, arrows, R, M, F and Esc hardware keyboard controls work.
  - Haptics trigger on native Android and no-op on web.
  - Missing/deleted script state has recovery actions.
- Record mode:
  - Camera/microphone rationale is shown before requesting access.
  - Permission denial shows what happened, retry and back actions.
  - Streams are stopped when leaving the page.
- Settings:
  - Account, Appearance, Teleprompter defaults, Recording and controls, Storage and backup, Privacy and legal, Feedback, Reset and About sections are present.
  - Export backup, import backup and clear local data work.

## Claims Verification

Before submitting store copy, screenshots or release notes, verify that every public claim matches implemented behavior:

- OK to claim: offline-first script editing, local storage, smooth teleprompter playback, camera overlay, record mode, gestures, keyboard shortcuts, haptics, backup/restore and guest mode.
- Do not claim yet: adaptive voice-follow scrolling, AI rehearsal coaching, cloud AI script writing, local speech-to-text, eye-contact coaching, producer remote control or cloud script sync.
- If a screenshot, caption or release note mentions a future feature, remove it from the Play submission until the feature is implemented, tested and reflected in `PRIVACY_DATA_INVENTORY.md`.

## Store Assets

- App icon: verify `playstore-icon-512.png` and generated Android mipmaps.
- Feature graphic: verify `feature-graphic-1024x500.png`.
- Screenshots: update `docs/screenshots/` from the final Android build.
- Short description: see `STORE_LISTING_DRAFT.md`.
- Full description: see `STORE_LISTING_DRAFT.md`.
- Release notes: see `STORE_LISTING_DRAFT.md`.

## Legal And Policy

- Privacy policy URL: set final hosted URL in Play Console and `VITE_PRIVACY_URL`.
- Terms URL: set final hosted URL in `VITE_TERMS_URL`.
- Data Safety answers to review:
  - Scripts are stored locally by default.
  - Firebase Auth, when configured, processes account identifiers such as name, email and provider ID.
  - Cuevora does not collect analytics by default.
  - Script content is not transmitted unless future sync is implemented and disclosed.
- Account deletion flow:
  - Current app exposes an account deletion request mail link in Settings.
  - Before public launch with account creation enabled, provide a public account deletion URL or in-app self-service deletion path that satisfies Google Play policy.
- Passwordless email sign-in:
  - UI is prepared, but Firebase action-code URLs must be configured and tested before enabling this as a production sign-in method.
- Firebase Android config:
  - If Android Google sign-in or native Firebase services are enabled, download a fresh `google-services.json` for package `app.cuevora.teleprompter` and place it locally at `android/app/google-services.json`.
  - Do not reuse configs for old package names such as `app.openprompt.teleprompter`.
- Cloud sync:
  - Not implemented. Do not mention script sync in Play listing copy until a real sync service exists.

## Testing Plan

- Closed testing: prepare at least 12 testers for 14 days if the Play Console account is subject to the current personal developer testing requirement.
- Test devices:
  - Small Android phone
  - Large Android phone
  - Tablet or foldable if available
  - Low-memory device or emulator
- Manual journeys:
  - Guest onboarding to script creation
  - Edit, auto-save, leave and return
  - Prompt playback with gestures and Bluetooth keyboard
  - Rehearsal start/stop, unsupported speech fallback and saved report
  - Adaptive scroll disabled-by-default state and fixed-speed fallback
  - Accessibility profiles in Player, Record Mode and Rehearsal
  - `docs/qa/accessibility-test-matrix.md` completed for TalkBack, Switch Access, Voice Access, keyboard, reduced motion and large-text checks
  - Android Accessibility Scanner and Play pre-launch accessibility findings reviewed
  - Camera overlay permission denial and retry
  - Record mode permission denial, recording, preview and share
  - Backup export and restore
  - Clear local data
  - Firebase unavailable guest fallback
  - Google sign-in when Firebase Android config is present
- Evidence to collect:
  - Device model, Android version and screen size for each tester.
  - Permission outcomes for camera, microphone and share/export.
  - Any recording failures, playback stutter, offline issues or backup/restore errors.
  - Quotes or testimonials only with tester permission.

## Known Limitations For First Release

- Cloud script sync is not implemented and must not be claimed.
- AI rehearsal coaching, local speech-to-text, eye-contact coaching and producer remote control are not implemented and must not be claimed.
- Passwordless email sign-in UI is prepared but remains disabled until Firebase action-code URLs are configured.
- Account deletion is a request path unless Firebase self-service deletion is added before enabling public account creation.
- Android release signing is not configured in source control. Configure signing securely through Android Studio, Play App Signing or CI secrets.
