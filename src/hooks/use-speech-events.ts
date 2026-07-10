import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechCapability, SpeechTranscriptEvent } from '@/types/studio';

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultEntry {
  isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResultEntry;
}

interface SpeechRecognitionEventPayload {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionAPI {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventPayload) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface UseSpeechEventsOptions {
  enabled: boolean;
  lang?: string;
  onTranscript?: (event: SpeechTranscriptEvent) => void;
}

const SPEECH_PRIVACY_NOTE = 'Speech recognition may be processed by your browser, operating system, or device provider. Cuevora only uses emitted transcript events for enabled local app features.';

function getSpeechRecognitionConstructor() {
  const win = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionAPI;
    webkitSpeechRecognition?: new () => SpeechRecognitionAPI;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition;
}

function getCapability(): SpeechCapability {
  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  if (isAndroidNative) {
    return {
      supported: false,
      unavailableReason: 'Speech recognition is not enabled in the Android native build.',
      privacyNote: SPEECH_PRIVACY_NOTE,
    };
  }

  if (!getSpeechRecognitionConstructor()) {
    return {
      supported: false,
      unavailableReason: 'Speech recognition is not supported by this browser or device.',
      privacyNote: SPEECH_PRIVACY_NOTE,
    };
  }

  return {
    supported: true,
    privacyNote: SPEECH_PRIVACY_NOTE,
  };
}

export function useSpeechEvents({ enabled, lang = 'en-US', onTranscript }: UseSpeechEventsOptions) {
  const [listening, setListening] = useState(false);
  const [capability, setCapability] = useState<SpeechCapability>(() => ({
    supported: false,
    privacyNote: SPEECH_PRIVACY_NOTE,
  }));
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastEvent, setLastEvent] = useState<SpeechTranscriptEvent | null>(null);
  const recognitionRef = useRef<SpeechRecognitionAPI | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    setCapability(getCapability());
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      try { recognition.stop(); } catch { /* noop */ }
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const currentCapability = getCapability();
    setCapability(currentCapability);
    if (!currentCapability.supported || !enabled) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEventPayload) => {
      const last = event.results[event.results.length - 1];
      if (!last || last.length === 0) return;

      const transcriptEvent: SpeechTranscriptEvent = {
        transcript: last[0].transcript,
        confidence: last[0].confidence,
        isFinal: last.isFinal,
        timestamp: Date.now(),
        source: 'web-speech',
      };

      setLastTranscript(transcriptEvent.transcript);
      setLastEvent(transcriptEvent);
      onTranscriptRef.current?.(transcriptEvent);
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
          setListening(true);
        } catch {
          recognitionRef.current = null;
          setListening(false);
        }
      }
    };

    recognition.onerror = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      setListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  }, [enabled, lang]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => stop, [stop]);

  return {
    listening,
    supported: capability.supported,
    capability,
    lastTranscript,
    lastEvent,
    start,
    stop,
    toggle,
  };
}
