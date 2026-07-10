import { SpeechTranscriptEvent } from '@/types/studio';
import { getWordCount } from './storage';

interface AdaptiveScrollInput {
  baseSpeed: number;
  targetWpm: number;
  transcriptEvents: SpeechTranscriptEvent[];
  now: number;
  manualOverrideUntil?: number;
  minSpeed?: number;
  maxSpeed?: number;
  staleAfterMs?: number;
}

export interface AdaptiveScrollResult {
  speed: number;
  confidence: number;
  reason: 'adaptive' | 'manual-override' | 'stale-transcript' | 'insufficient-transcript';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeAdaptiveScrollSpeed({
  baseSpeed,
  targetWpm,
  transcriptEvents,
  now,
  manualOverrideUntil = 0,
  minSpeed = 1,
  maxSpeed = 10,
  staleAfterMs = 5000,
}: AdaptiveScrollInput): AdaptiveScrollResult {
  if (manualOverrideUntil > now) {
    return { speed: baseSpeed, confidence: 0, reason: 'manual-override' };
  }

  const finalEvents = transcriptEvents
    .filter(event => event.isFinal && event.transcript.trim())
    .sort((a, b) => a.timestamp - b.timestamp);
  const lastEvent = finalEvents[finalEvents.length - 1];

  if (!lastEvent || finalEvents.length < 2) {
    return { speed: baseSpeed, confidence: 0, reason: 'insufficient-transcript' };
  }

  if (now - lastEvent.timestamp > staleAfterMs) {
    return { speed: baseSpeed, confidence: 0, reason: 'stale-transcript' };
  }

  const firstEvent = finalEvents[0];
  const elapsedMinutes = (lastEvent.timestamp - firstEvent.timestamp) / 60000;
  const wordCount = getWordCount(finalEvents.map(event => event.transcript).join(' '));

  if (elapsedMinutes <= 0 || wordCount < 3 || targetWpm <= 0) {
    return { speed: baseSpeed, confidence: 0, reason: 'insufficient-transcript' };
  }

  const spokenWpm = wordCount / elapsedMinutes;
  const confidence = clamp((finalEvents.length / 4) * Math.min(1, wordCount / 12), 0, 1);
  if (confidence < 0.5) {
    return { speed: baseSpeed, confidence, reason: 'insufficient-transcript' };
  }

  const targetSpeed = clamp(baseSpeed * (spokenWpm / targetWpm), minSpeed, maxSpeed);
  const blendedSpeed = baseSpeed + (targetSpeed - baseSpeed) * 0.35;

  return {
    speed: Number(clamp(blendedSpeed, minSpeed, maxSpeed).toFixed(2)),
    confidence,
    reason: 'adaptive',
  };
}
