# 60fps Offline Teleprompter Architecture

Cuevora's prompt playback is local-first and frame-driven. Scripts, revisions, settings and saved rehearsal reports live in browser or app storage, while the teleprompter loop updates scroll position with `requestAnimationFrame`.

## Playback Model

- `src/hooks/use-prompt-playback.ts` owns play, pause, reset, seek, elapsed time, progress and completion.
- `src/pages/Player.tsx` and `src/pages/RecordMode.tsx` consume the same hook instead of maintaining separate RAF loops.
- Speed remains user-controlled. Adaptive scrolling can feed an effective speed into the same hook, but manual speed, seek and reset actions remain authoritative.

## Why RAF

CSS animations are hard to adjust precisely while a speaker is live. The hook uses elapsed frame time so scroll distance remains proportional to time even when frames are delayed.

## Offline Boundary

- Scripts and settings are loaded from `src/lib/storage.ts`.
- Backup export/import is JSON-based and user-initiated.
- Recordings are saved or shared only after user action.
- No analytics or script sync runs by default.

## Verification Points

- Fixed-speed playback advances by speed and frame time.
- Pause preserves progress.
- Reset returns progress and elapsed time to zero.
- Completion stops playback once.
- Player and Record Mode share the same playback engine.
