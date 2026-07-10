import { RehearsalMetrics, SpeechTranscriptEvent } from '@/types/studio';
import { getWordCount } from './storage';

const FILLER_PATTERNS = [
  /\bum+\b/gi,
  /\buh+\b/gi,
  /\ber+\b/gi,
  /\bah+\b/gi,
  /\blike\b/gi,
  /\byou know\b/gi,
  /\bi mean\b/gi,
  /\bso\b/gi,
];

interface AnalyzeRehearsalInput {
  scriptContent: string;
  transcriptEvents: SpeechTranscriptEvent[];
  startedAt: number;
  endedAt: number;
  longPauseThresholdMs?: number;
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

function buildSuggestions(metrics: Omit<RehearsalMetrics, 'suggestions'>): string[] {
  const suggestions: string[] = [];

  if (metrics.wordsPerMinute !== null && metrics.wordsPerMinute > 175) {
    suggestions.push('Slow down slightly so key points have time to land.');
  }
  if (metrics.wordsPerMinute !== null && metrics.wordsPerMinute < 105 && metrics.transcriptWordCount > 0) {
    suggestions.push('Increase pace or shorten pauses to keep delivery moving.');
  }
  if (metrics.longPauseCount >= 3) {
    suggestions.push('Break long sections into shorter phrases to reduce pauses.');
  }
  if (metrics.fillerWordCount >= 5) {
    suggestions.push('Practice replacing filler words with short silent pauses.');
  }
  if (metrics.scriptCoverage !== null && metrics.scriptCoverage < 0.75) {
    suggestions.push('Rehearse more of the script before recording a final take.');
  }
  if (!suggestions.length && !metrics.unavailableMetrics.length) {
    suggestions.push('Delivery looks steady. Try another pass and compare consistency.');
  }
  if (!suggestions.length) {
    suggestions.push('Try another rehearsal with speech recognition available for fuller feedback.');
  }

  return suggestions;
}

export function analyzeRehearsal({
  scriptContent,
  transcriptEvents,
  startedAt,
  endedAt,
  longPauseThresholdMs = 2500,
}: AnalyzeRehearsalInput): RehearsalMetrics {
  const finalEvents = transcriptEvents
    .filter(event => event.isFinal && event.transcript.trim())
    .sort((a, b) => a.timestamp - b.timestamp);
  const transcript = finalEvents.map(event => event.transcript).join(' ');
  const transcriptWordCount = getWordCount(transcript);
  const scriptWordCount = getWordCount(scriptContent);
  const durationSeconds = Math.max(0, Math.round((endedAt - startedAt) / 1000));
  const unavailableMetrics: string[] = [];

  if (!finalEvents.length) {
    unavailableMetrics.push('Speech transcript');
  }

  const wordsPerMinute = transcriptWordCount > 0 && durationSeconds > 0
    ? Math.round((transcriptWordCount / durationSeconds) * 60)
    : null;

  if (wordsPerMinute === null) {
    unavailableMetrics.push('Words per minute');
  }

  const longPauseCount = finalEvents.reduce((count, event, index) => {
    if (index === 0) return count;
    const previous = finalEvents[index - 1];
    return event.timestamp - previous.timestamp >= longPauseThresholdMs ? count + 1 : count;
  }, 0);

  const fillerWordCount = FILLER_PATTERNS.reduce(
    (count, pattern) => count + countMatches(transcript, pattern),
    0,
  );

  const scriptCoverage = scriptWordCount > 0 && transcriptWordCount > 0
    ? Math.min(1, transcriptWordCount / scriptWordCount)
    : null;

  if (scriptCoverage === null) {
    unavailableMetrics.push('Script coverage');
  }

  const metricsWithoutSuggestions = {
    durationSeconds,
    transcriptWordCount,
    scriptWordCount,
    wordsPerMinute,
    longPauseCount,
    fillerWordCount,
    scriptCoverage,
    completionPercent: scriptCoverage === null ? 0 : Math.round(scriptCoverage * 100),
    unavailableMetrics,
  };

  return {
    ...metricsWithoutSuggestions,
    suggestions: buildSuggestions(metricsWithoutSuggestions),
  };
}
