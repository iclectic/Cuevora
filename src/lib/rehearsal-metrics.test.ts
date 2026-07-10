import { describe, expect, it } from 'vitest';
import { analyzeRehearsal } from './rehearsal-metrics';
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

describe('analyzeRehearsal', () => {
  it('calculates pacing, pauses, filler words and script coverage', () => {
    const metrics = analyzeRehearsal({
      scriptContent: 'one two three four five six seven eight nine ten',
      startedAt: 0,
      endedAt: 10_000,
      transcriptEvents: [
        event('one two um three', 1000),
        event('four five like six', 5000),
        event('seven eight', 7000),
      ],
      longPauseThresholdMs: 2500,
    });

    expect(metrics.wordsPerMinute).toBe(60);
    expect(metrics.longPauseCount).toBe(1);
    expect(metrics.fillerWordCount).toBe(2);
    expect(metrics.transcriptWordCount).toBe(10);
    expect(metrics.scriptCoverage).toBe(1);
    expect(metrics.completionPercent).toBe(100);
  });

  it('reports unavailable metrics for empty transcript input', () => {
    const metrics = analyzeRehearsal({
      scriptContent: 'one two three',
      startedAt: 0,
      endedAt: 5_000,
      transcriptEvents: [],
    });

    expect(metrics.wordsPerMinute).toBeNull();
    expect(metrics.scriptCoverage).toBeNull();
    expect(metrics.unavailableMetrics).toContain('Speech transcript');
    expect(metrics.unavailableMetrics).toContain('Words per minute');
    expect(metrics.suggestions[0]).toContain('speech recognition');
  });

  it('suggests shorter phrasing when long pauses are frequent', () => {
    const metrics = analyzeRehearsal({
      scriptContent: 'one two three four five',
      startedAt: 0,
      endedAt: 15_000,
      transcriptEvents: [
        event('one', 1000),
        event('two', 5000),
        event('three', 9000),
        event('four', 13000),
      ],
      longPauseThresholdMs: 2500,
    });

    expect(metrics.longPauseCount).toBe(3);
    expect(metrics.suggestions).toContain('Break long sections into shorter phrases to reduce pauses.');
  });
});
