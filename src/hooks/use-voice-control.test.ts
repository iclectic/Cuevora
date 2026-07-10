import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseCommand, useVoiceControl } from './use-voice-control';

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

  emitResult(transcript: string, isFinal: boolean) {
    this.onresult?.({
      results: [
        {
          0: { transcript, confidence: 0.9 },
          isFinal,
          length: 1,
        },
      ],
    });
  }
}

describe('voice control', () => {
  beforeEach(() => {
    MockSpeechRecognition.instances = [];
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
    vi.restoreAllMocks();
    delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  });

  it('parses supported command phrases', () => {
    expect(parseCommand('please pause now')).toBe('pause');
    expect(parseCommand('speed up')).toBe('faster');
    expect(parseCommand('something unrelated')).toBe('unknown');
  });

  it('triggers commands only for final transcript events', () => {
    const onCommand = vi.fn();
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoiceControl({ enabled: true, onCommand, onTranscript }));

    act(() => result.current.start());
    const recognition = MockSpeechRecognition.instances[0];

    act(() => recognition.emitResult('pause', false));
    expect(onCommand).not.toHaveBeenCalled();
    expect(onTranscript).toHaveBeenCalledWith(expect.objectContaining({ transcript: 'pause', isFinal: false }));

    act(() => recognition.emitResult('pause', true));
    expect(onCommand).toHaveBeenCalledWith('pause');
    expect(result.current.lastTranscript).toBe('pause');
  });
});
