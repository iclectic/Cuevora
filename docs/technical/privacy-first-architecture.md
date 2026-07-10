# Privacy-First Architecture

Cuevora's product boundary is local-first prompting. The app should be useful without an account, analytics, sync or AI provider.

## Current Local Data

- Scripts
- Script revisions
- App settings
- Guest-mode state
- Saved rehearsal reports
- User-exported backups
- User-saved recordings

## Current Third-Party Boundaries

- Firebase Authentication is optional and only handles account identity when configured.
- Browser or platform speech recognition may process audio when voice or rehearsal features are enabled.
- Cuevora does not send scripts to AI providers in the current release.
- Cuevora does not sync scripts across devices in the current release.

## User-Controlled Actions

- Export backup
- Restore backup
- Clear local data
- Save or share recording
- Sign in or continue as guest
- Start or stop rehearsal

## Release Rule

Any future AI, sync, local STT, eye-contact or producer-control feature must update `PRIVACY_DATA_INVENTORY.md`, `public/privacy.html`, `PLAY_STORE_RELEASE_CHECKLIST.md` and `STORE_LISTING_DRAFT.md`.

The store listing should only claim behavior that exists in the app and has been tested on real Android devices.
