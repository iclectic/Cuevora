# Cuevora Android Closed-Test Matrix

Run this matrix before public Play release and after any change to recording, prompting, speech, backup, auth or Android packaging.

## Device Coverage

| Device class | Required coverage | Result |
| --- | --- | --- |
| Small Android phone | Install, onboarding, edit, prompt, record, share | Pending |
| Large Android phone | Install, prompt, camera overlay, record, backup | Pending |
| Tablet or foldable | Layout, prompt readability, split view, record | Pending |
| Low-memory device or emulator | Launch, large script, record failure handling | Pending |

## Core Journeys

| Journey | Expected outcome | Result |
| --- | --- | --- |
| Guest onboarding to script creation | User can create and edit without sign-in | Pending |
| Editor autosave | Saving, Saved, Offline and Error states remain visible | Pending |
| Prompt playback | Fixed-speed scrolling is smooth; reset, seek and countdown work | Pending |
| Adaptive scroll | Default is off; when enabled, unsupported speech falls back to fixed speed | Pending |
| Voice controls | Supported browsers handle final commands; unsupported Android native state is clear | Pending |
| Accessibility profiles | Profiles persist and affect Player, Record Mode and rehearsal surfaces | Pending |
| Camera overlay | Permission denial, retry and stream cleanup work | Pending |
| Record Mode | Permission rationale, recording, preview, stop-at-end and share/export work | Pending |
| Rehearsal | Start, unsupported state, transcript metrics and saved report work | Pending |
| Backup/restore | Scripts, revisions, settings and rehearsal sessions round-trip | Pending |
| Clear local data | Scripts, settings, revisions and rehearsal sessions are removed | Pending |
| Firebase unavailable | Guest flow remains usable with missing Firebase config | Pending |
| Google sign-in | Works only when a valid Android Firebase config is present | Pending |

## Evidence Capture

- Device model:
- Android version:
- Build version:
- Tester alias:
- Permission outcomes:
- Recording/share outcome:
- Playback or adaptive-scroll stutter:
- Backup/restore outcome:
- Quote permission: yes / no
- Notes:
