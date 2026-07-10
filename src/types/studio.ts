export type SpeechEventSource = 'web-speech';

export interface SpeechTranscriptEvent {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  source: SpeechEventSource;
}

export interface SpeechCapability {
  supported: boolean;
  unavailableReason?: string;
  privacyNote: string;
}

export interface RehearsalMetrics {
  durationSeconds: number;
  transcriptWordCount: number;
  scriptWordCount: number;
  wordsPerMinute: number | null;
  longPauseCount: number;
  fillerWordCount: number;
  scriptCoverage: number | null;
  completionPercent: number;
  unavailableMetrics: string[];
  suggestions: string[];
}

export interface RehearsalSession {
  id: string;
  scriptId: string;
  scriptTitle: string;
  startedAt: number;
  endedAt: number;
  transcriptEvents: SpeechTranscriptEvent[];
  metrics: RehearsalMetrics;
}
