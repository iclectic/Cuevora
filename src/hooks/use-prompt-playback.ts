import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const SPEED_TO_PIXELS_PER_SECOND = 20;
const END_THRESHOLD_PX = 10;

type ScrollContainerRef = RefObject<HTMLElement>;

interface UsePromptPlaybackOptions {
  scrollRef: ScrollContainerRef;
  speed: number;
  onComplete?: () => void;
}

export interface PromptPlaybackControls {
  playing: boolean;
  scrollProgress: number;
  elapsedSeconds: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  jumpToEnd: () => void;
  seekByPixels: (pixels: number) => void;
  handleScroll: () => void;
}

function getScrollProgress(el: HTMLElement): number {
  const maxScroll = el.scrollHeight - el.clientHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(1, Math.max(0, el.scrollTop / maxScroll));
}

export function usePromptPlayback({
  scrollRef,
  speed,
  onComplete,
}: UsePromptPlaybackOptions): PromptPlaybackControls {
  const [playing, setPlaying] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const animRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [playing]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollProgress(getScrollProgress(el));
  }, [scrollRef]);

  const scrollStep = useCallback((timestamp: number) => {
    const el = scrollRef.current;
    if (!el) return;

    if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const pxPerSecond = speed * SPEED_TO_PIXELS_PER_SECOND;
    el.scrollTop += (pxPerSecond * delta) / 1000;
    setScrollProgress(getScrollProgress(el));

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - END_THRESHOLD_PX) {
      setPlaying(false);
      onCompleteRef.current?.();
      return;
    }

    animRef.current = requestAnimationFrame(scrollStep);
  }, [scrollRef, speed]);

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = 0;
      animRef.current = requestAnimationFrame(scrollStep);
    } else if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [playing, scrollStep]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => setPlaying(p => !p), []);

  const reset = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
    setPlaying(false);
    setElapsedSeconds(0);
    setScrollProgress(0);
  }, [scrollRef]);

  const jumpToEnd = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setScrollProgress(1);
    setPlaying(false);
  }, [scrollRef]);

  const seekByPixels = useCallback((pixels: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    el.scrollTop = Math.min(maxScroll, Math.max(0, el.scrollTop + pixels));
    setScrollProgress(getScrollProgress(el));
  }, [scrollRef]);

  return useMemo(() => ({
    playing,
    scrollProgress,
    elapsedSeconds,
    play,
    pause,
    toggle,
    reset,
    jumpToEnd,
    seekByPixels,
    handleScroll,
  }), [
    elapsedSeconds,
    handleScroll,
    jumpToEnd,
    pause,
    play,
    playing,
    reset,
    scrollProgress,
    seekByPixels,
    toggle,
  ]);
}
