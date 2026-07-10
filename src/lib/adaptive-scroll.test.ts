import { describe, expect, it } from 'vitest';
import { computeAdaptiveScrollSpeed } from './adaptive-scroll';
import { SpeechTranscriptEvent } from '@/types/studio';

function event(transcript: string, timestamp: number): SpeechTranscriptEvent {
  return {
    transcript,
    timestamp,
    confidence: 0.9,
    isFinal: true,
    source: 'web-speech',
  };
}

describe('computeAdaptiveScrollSpeed', () => {
  it('increases speed for faster speaking cadence', () => {
    const result = computeAdaptiveScrollSpeed({
      baseSpeed: 4,
      targetWpm: 120,
      now: 4000,
      transcriptEvents: [
        event('one two three four', 0),
        event('five six seven eight', 1000),
        event('nine ten eleven twelve', 2000),
        event('thirteen fourteen fifteen sixteen', 3000),
      ],
    });

    expect(result.reason).toBe('adaptive');
    expect(result.speed).toBeGreaterThan(4);
  });

  it('decreases speed for slower speaking cadence', () => {
    const result = computeAdaptiveScrollSpeed({
      baseSpeed: 6,
      targetWpm: 180,
      now: 20_000,
      transcriptEvents: [
        event('one two three', 0),
        event('four five six', 7000),
        event('seven eight nine', 14000),
        event('ten eleven twelve', 18000),
      ],
    });

    expect(result.reason).toBe('adaptive');
    expect(result.speed).toBeLessThan(6);
  });

  it('keeps fixed speed for stale transcript events', () => {
    const result = computeAdaptiveScrollSpeed({
      baseSpeed: 5,
      targetWpm: 140,
      now: 20_000,
      transcriptEvents: [
        event('one two three four', 0),
        event('five six seven eight', 1000),
      ],
    });

    expect(result).toMatchObject({ speed: 5, reason: 'stale-transcript' });
  });

  it('keeps fixed speed during a manual override window', () => {
    const result = computeAdaptiveScrollSpeed({
      baseSpeed: 5,
      targetWpm: 140,
      now: 2000,
      manualOverrideUntil: 5000,
      transcriptEvents: [
        event('one two three four', 0),
        event('five six seven eight', 1000),
      ],
    });

    expect(result).toMatchObject({ speed: 5, reason: 'manual-override' });
  });
});
