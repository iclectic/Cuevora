import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpeechEvents } from './use-speech-events';

class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];

  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  emitResult(transcript: string, isFinal: boolean, confidence = 0.9) {
    this.onresult?.({
      results: [
        {
          0: { transcript, confidence },
          isFinal,
          length: 1,
        },
      ],
    });
  }
}

describe('useSpeechEvents', () => {
  beforeEach(() => {
    MockSpeechRecognition.instances = [];
    vi.setSystemTime(new Date('2026-07-10T12:00:00Z'));
    vi.useFakeTimers();
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      writable: true,
      value: MockSpeechRecognition,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  });

  it('emits interim and final transcript events', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechEvents({ enabled: true, onTranscript }));

    act(() => result.current.start());
    const recognition = MockSpeechRecognition.instances[0];

    act(() => recognition.emitResult('hello', false, 0.4));
    act(() => recognition.emitResult('hello world', true, 0.8));

    expect(result.current.supported).toBe(true);
    expect(result.current.lastTranscript).toBe('hello world');
    expect(onTranscript).toHaveBeenCalledWith({
      transcript: 'hello',
      confidence: 0.4,
      isFinal: false,
      timestamp: Date.now(),
      source: 'web-speech',
    });
    expect(onTranscript).toHaveBeenLastCalledWith({
      transcript: 'hello world',
      confidence: 0.8,
      isFinal: true,
      timestamp: Date.now(),
      source: 'web-speech',
    });
  });

  it('does not start when disabled', () => {
    const { result } = renderHook(() => useSpeechEvents({ enabled: false }));

    act(() => result.current.start());

    expect(MockSpeechRecognition.instances).toHaveLength(0);
    expect(result.current.listening).toBe(false);
  });

  it('reports unsupported capability when recognition is unavailable', () => {
    delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    const { result } = renderHook(() => useSpeechEvents({ enabled: true }));

    act(() => result.current.start());

    expect(result.current.supported).toBe(false);
    expect(result.current.capability.unavailableReason).toContain('not supported');
  });
});
