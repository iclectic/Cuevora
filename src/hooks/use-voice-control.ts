import { useCallback, useRef } from 'react';
import { useSpeechEvents } from './use-speech-events';
import { SpeechTranscriptEvent } from '@/types/studio';

export type VoiceCommand = 'play' | 'pause' | 'stop' | 'faster' | 'slower' | 'reset' | 'unknown';

interface UseVoiceControlOptions {
  onCommand: (command: VoiceCommand) => void;
  enabled: boolean;
  onTranscript?: (event: SpeechTranscriptEvent) => void;
}

const COMMAND_MAP: Record<string, VoiceCommand> = {
  play: 'play',
  start: 'play',
  go: 'play',
  begin: 'play',
  resume: 'play',
  pause: 'pause',
  wait: 'pause',
  hold: 'pause',
  stop: 'stop',
  end: 'stop',
  faster: 'faster',
  'speed up': 'faster',
  quicker: 'faster',
  slower: 'slower',
  'slow down': 'slower',
  reset: 'reset',
  restart: 'reset',
  'go back': 'reset',
};

export function parseCommand(transcript: string): VoiceCommand {
  const lower = transcript.toLowerCase().trim();
  for (const [phrase, cmd] of Object.entries(COMMAND_MAP)) {
    if (lower.includes(phrase)) return cmd;
  }
  return 'unknown';
}

export function useVoiceControl({ onCommand, enabled, onTranscript }: UseVoiceControlOptions) {
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  const speech = useSpeechEvents({
    enabled,
    onTranscript: useCallback((event) => {
      onTranscript?.(event);
      if (!event.isFinal) return;
      const cmd = parseCommand(event.transcript);
      if (cmd !== 'unknown') onCommandRef.current(cmd);
    }, [onTranscript]),
  });

  const toggle = useCallback(() => {
    speech.toggle();
  }, [speech]);

  return {
    listening: speech.listening,
    supported: speech.supported,
    lastTranscript: speech.lastTranscript,
    start: speech.start,
    stop: speech.stop,
    toggle,
  };
}
