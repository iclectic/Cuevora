# Adaptive Rehearsal Coach

Cuevora's first rehearsal-coach slice is deterministic and local-first. It uses transcript events when browser speech recognition is available, but it does not require cloud AI or local speech-to-text model downloads.

## Data Flow

1. `src/hooks/use-speech-events.ts` exposes speech capability, listening state and transcript events.
2. `src/hooks/use-voice-control.ts` consumes the same transcript events for commands such as play, pause and reset.
3. `src/lib/rehearsal-metrics.ts` converts final transcript events into WPM, pauses, filler words, script coverage and suggestions.
4. `src/lib/adaptive-scroll.ts` computes a bounded adaptive speed from recent speaking cadence.
5. `src/pages/Rehearsal.tsx` saves local rehearsal reports through `src/lib/storage.ts`.

## Adaptive Scroll Rules

- Adaptive scroll is disabled by default.
- Stale, missing or low-confidence transcript data falls back to fixed speed.
- Manual speed, seek, gesture, keyboard and voice-command actions open an override window.
- The adaptive controller blends toward target speed instead of jumping.

## Local Coaching Metrics

Saved rehearsal reports can include session duration, transcript word count, words per minute, long-pause count, filler-word count, script completion estimate and local suggestions.

Unsupported speech recognition produces unavailable states rather than fake zeroes.

## Deferred Work

The current slice does not include cloud AI coaching, local STT models, eye-contact analysis, producer remote control or encrypted cloud sync.
