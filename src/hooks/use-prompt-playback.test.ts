import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RefObject } from 'react';
import { usePromptPlayback } from './use-prompt-playback';

function createScrollElement() {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 1000 });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: 100 });
  return el;
}

describe('usePromptPlayback', () => {
  let frameCallback: FrameRequestCallback | undefined;

  beforeEach(() => {
    frameCallback = undefined;
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frameCallback = cb;
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('advances scroll position from speed and frame time', () => {
    const scrollRef = { current: createScrollElement() } as RefObject<HTMLDivElement>;

    const { result } = renderHook(() => usePromptPlayback({ scrollRef, speed: 2 }));

    act(() => result.current.play());
    act(() => frameCallback?.(1000));
    act(() => frameCallback?.(2000));

    expect(scrollRef.current.scrollTop).toBe(40);
    expect(result.current.scrollProgress).toBeCloseTo(40 / 900);
  });

  it('pauses playback and preserves progress', () => {
    const scrollRef = { current: createScrollElement() } as RefObject<HTMLDivElement>;

    const { result } = renderHook(() => usePromptPlayback({ scrollRef, speed: 3 }));

    act(() => result.current.play());
    act(() => frameCallback?.(1000));
    act(() => frameCallback?.(2000));
    act(() => result.current.pause());

    expect(result.current.playing).toBe(false);
    expect(scrollRef.current.scrollTop).toBe(60);
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('resets scroll position, progress and elapsed time', () => {
    const scrollRef = { current: createScrollElement() } as RefObject<HTMLDivElement>;

    const { result } = renderHook(() => usePromptPlayback({ scrollRef, speed: 1 }));

    act(() => result.current.play());
    act(() => {
      vi.advanceTimersByTime(1000);
      scrollRef.current.scrollTop = 250;
      result.current.handleScroll();
    });
    act(() => result.current.reset());

    expect(scrollRef.current.scrollTop).toBe(0);
    expect(result.current.scrollProgress).toBe(0);
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.playing).toBe(false);
  });

  it('seeks by pixels and clamps within the scrollable range', () => {
    const scrollRef = { current: createScrollElement() } as RefObject<HTMLDivElement>;

    const { result } = renderHook(() => usePromptPlayback({ scrollRef, speed: 1 }));

    act(() => result.current.seekByPixels(950));
    expect(scrollRef.current.scrollTop).toBe(900);
    expect(result.current.scrollProgress).toBe(1);

    act(() => result.current.seekByPixels(-1000));
    expect(scrollRef.current.scrollTop).toBe(0);
    expect(result.current.scrollProgress).toBe(0);
  });

  it('stops and calls completion when the script reaches the end', () => {
    const onComplete = vi.fn();
    const scrollRef = { current: createScrollElement() } as RefObject<HTMLDivElement>;
    scrollRef.current.scrollTop = 880;

    const { result } = renderHook(() => usePromptPlayback({ scrollRef, speed: 2, onComplete }));

    act(() => result.current.play());
    act(() => frameCallback?.(1000));
    act(() => frameCallback?.(2000));

    expect(result.current.playing).toBe(false);
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
