import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getScript, saveScript, saveSettings } from '@/lib/storage';
import Player from './Player';

vi.mock('@/lib/haptics', () => ({ haptic: vi.fn() }));
vi.mock('@/hooks/use-voice-control', () => ({ useVoiceControl: () => ({ listening: false, start: vi.fn(), stop: vi.fn() }) }));

function mountPlayer(id: string) {
  return render(<MemoryRouter initialEntries={[`/player/${id}`]}><Routes><Route path="/player/:id" element={<Player />} /></Routes></MemoryRouter>);
}

function swipe(element: Element) {
  fireEvent.touchStart(element, { touches: [{ clientX: 100, clientY: 200 }] });
  fireEvent.touchEnd(element, { changedTouches: [{ clientX: 100, clientY: 100 }] });
}

describe('Player', () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  const frame = (time: number) => act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach(callback => callback(time));
  });

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    frames = new Map(); nextFrame = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { frames.set(++nextFrame, cb); return nextFrame; });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { frames.delete(id); });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('isolates guide touches and restores configured gestures after dismissal', () => {
    const script = saveScript({ title: 'Guide', content: 'hello' });
    const { container } = mountPlayer(script.id);
    const dialog = screen.getByRole('dialog', { name: 'Gesture guide' });
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
    swipe(dialog);
    expect(screen.getByText('3x speed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    swipe(container.firstElementChild!);
    expect(screen.getByText('3.5x speed')).toBeInTheDocument();
  });

  it('plays a 59-word local script after countdown, pauses, resumes and retains storage', () => {
    const content = Array.from({ length: 59 }, (_, i) => `word${i}`).join(' ');
    const script = saveScript({ title: 'Practice', content });
    localStorage.setItem('cuevora_player_gesture_guide_seen', 'true');
    const { container, unmount } = mountPlayer(script.id);
    const scroller = container.querySelector('.overflow-y-auto') as HTMLElement;
    Object.defineProperties(scroller, { scrollHeight: { value: 1300 }, clientHeight: { value: 748 } });
    fireEvent.click(screen.getByRole('button', { name: 'Play teleprompter' }));
    for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', { name: 'Pause teleprompter' })).toBeInTheDocument();
    frame(1000); frame(2000);
    expect(scroller.scrollTop).toBe(60);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getAllByText('0:01').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Pause teleprompter' }));
    expect(frames.size).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Play teleprompter' }));
    frame(3000); frame(4000);
    expect(scroller.scrollTop).toBe(120);
    unmount();
    expect(frames.size).toBe(0);
    expect(getScript(script.id)).toMatchObject({ title: 'Practice', content });
  });

  it('replays after reaching the end and cancels a countdown on reset', () => {
    saveSettings({ countdownDuration: 3 });
    const script = saveScript({ title: 'Replay', content: 'Hello' });
    localStorage.setItem('cuevora_player_gesture_guide_seen', 'true');
    const { container } = mountPlayer(script.id);
    const scroller = container.querySelector('.overflow-y-auto') as HTMLElement;
    Object.defineProperties(scroller, { scrollHeight: { value: 800 }, clientHeight: { value: 748 } });
    fireEvent.click(screen.getByRole('button', { name: 'Play teleprompter' }));
    fireEvent.keyDown(window, { key: 'r' });
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole('button', { name: 'Play teleprompter' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play teleprompter' }));
    for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(1000));
    frame(1000); frame(2000);
    expect(scroller.scrollTop).toBe(52);
    expect(screen.getByRole('button', { name: 'Play teleprompter' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play teleprompter' }));
    expect(scroller.scrollTop).toBe(0);
    for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', { name: 'Pause teleprompter' })).toBeInTheDocument();
  });

  it('starts immediately with a zero countdown', () => {
    saveSettings({ countdownDuration: 0 });
    const script = saveScript({ title: 'Short', content: 'Hello' });
    localStorage.setItem('cuevora_player_gesture_guide_seen', 'true');
    mountPlayer(script.id);
    fireEvent.click(screen.getByRole('button', { name: 'Play teleprompter' }));
    expect(screen.getByRole('button', { name: 'Pause teleprompter' })).toBeInTheDocument();
  });
});
