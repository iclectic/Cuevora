# Cuevora Play Store Release Checklist

## App Identity

- App name: Cuevora
- Package name: `app.cuevora.teleprompter`
- Version name: `1.0.0`
- Version code: confirm in `android/app/build.gradle` before upload
- Target SDK: Android 15 / API 35 or newer
- Minimum SDK: keep aligned with Capacitor Android defaults unless plugin requirements change

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

## Permissions

- `CAMERA`: required for camera overlay and record mode.
- `RECORD_AUDIO`: required for record mode audio.
- `INTERNET`: required only for optional Firebase Auth, legal pages and hosted assets.
- No location, contacts, SMS, call log or background sensor permissions should be requested.
- Confirm `android:usesCleartextTraffic="false"` before release.
- Confirm mixed content is disabled in `capacitor.config.ts`.

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
  - Camera overlay permission denial and retry
  - Record mode permission denial, recording, preview and share
  - Backup export and restore
  - Clear local data
  - Firebase unavailable guest fallback
  - Google sign-in when Firebase Android config is present

## Known Limitations For First Release

- Cloud script sync is not implemented and must not be claimed.
- Passwordless email sign-in UI is prepared but remains disabled until Firebase action-code URLs are configured.
- Account deletion is a request path unless Firebase self-service deletion is added before enabling public account creation.
