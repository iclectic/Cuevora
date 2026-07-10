import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLocalData,
  deleteScript,
  exportBackup,
  getRehearsalSessions,
  getScript,
  getScripts,
  getSettings,
  importBackup,
  restoreScript,
  saveRehearsalSession,
  saveScript,
  saveSettings,
} from '@/lib/storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates, updates, deletes and restores scripts', () => {
    const script = saveScript({ title: 'Launch script', content: 'Hello creators', tags: ['video'] });

    expect(getScripts()).toHaveLength(1);
    expect(getScript(script.id)?.title).toBe('Launch script');

    saveScript({ id: script.id, title: 'Updated script', content: 'Hello creators again' });
    expect(getScript(script.id)?.content).toBe('Hello creators again');

    const deleted = deleteScript(script.id);
    expect(deleted?.title).toBe('Updated script');
    expect(getScripts()).toHaveLength(0);

    restoreScript(deleted!);
    expect(getScript(script.id)?.title).toBe('Updated script');
  });

  it('falls back safely when stored scripts are corrupted', () => {
    localStorage.setItem('cuevora_scripts', '{bad json');

    expect(getScripts()).toEqual([]);
  });

  it('persists settings over defaults', () => {
    saveSettings({ defaultSpeed: 6, hapticsEnabled: false });

    expect(getSettings()).toMatchObject({
      defaultSpeed: 6,
      hapticsEnabled: false,
      gestureControlsEnabled: true,
    });
  });

  it('exports and imports validated backups', () => {
    saveScript({ title: 'Backup me', content: 'One two three' });
    saveSettings({ defaultFontSize: 44 });
    saveRehearsalSession({
      scriptId: 'script-1',
      scriptTitle: 'Backup me',
      startedAt: 1000,
      endedAt: 4000,
      transcriptEvents: [],
      metrics: {
        durationSeconds: 3,
        transcriptWordCount: 0,
        scriptWordCount: 3,
        wordsPerMinute: null,
        longPauseCount: 0,
        fillerWordCount: 0,
        scriptCoverage: null,
        completionPercent: 0,
        unavailableMetrics: ['Speech transcript'],
        suggestions: ['Try another rehearsal with speech recognition available for fuller feedback.'],
      },
    });
    const backup = exportBackup();

    clearLocalData();
    expect(getScripts()).toHaveLength(0);
    expect(getRehearsalSessions()).toHaveLength(0);

    expect(importBackup(backup)).toBe(true);
    expect(getScripts()[0].title).toBe('Backup me');
    expect(getSettings().defaultFontSize).toBe(44);
    expect(getRehearsalSessions()[0].scriptTitle).toBe('Backup me');
  });

  it('rejects corrupted backup files without overwriting data', () => {
    const script = saveScript({ title: 'Keep me', content: 'Safe' });

    expect(importBackup(JSON.stringify({ scripts: [{ id: 1 }] }))).toBe(false);
    expect(getScript(script.id)?.title).toBe('Keep me');
  });

  it('rejects malformed rehearsal session imports without overwriting data', () => {
    const session = saveRehearsalSession({
      scriptId: 'script-1',
      scriptTitle: 'Keep rehearsal',
      startedAt: 1000,
      endedAt: 2000,
      transcriptEvents: [],
      metrics: {
        durationSeconds: 1,
        transcriptWordCount: 0,
        scriptWordCount: 1,
        wordsPerMinute: null,
        longPauseCount: 0,
        fillerWordCount: 0,
        scriptCoverage: null,
        completionPercent: 0,
        unavailableMetrics: ['Speech transcript'],
        suggestions: ['Try another rehearsal with speech recognition available for fuller feedback.'],
      },
    });

    const invalidBackup = JSON.stringify({
      scripts: [],
      rehearsalSessions: [{ id: 'bad', scriptId: 'script-2', metrics: null }],
    });

    expect(importBackup(invalidBackup)).toBe(false);
    expect(getRehearsalSessions()[0].id).toBe(session.id);
  });

  it('clears rehearsal sessions with local data', () => {
    saveRehearsalSession({
      scriptId: 'script-1',
      scriptTitle: 'Clear me',
      startedAt: 1000,
      endedAt: 2000,
      transcriptEvents: [],
      metrics: {
        durationSeconds: 1,
        transcriptWordCount: 0,
        scriptWordCount: 1,
        wordsPerMinute: null,
        longPauseCount: 0,
        fillerWordCount: 0,
        scriptCoverage: null,
        completionPercent: 0,
        unavailableMetrics: ['Speech transcript'],
        suggestions: ['Try another rehearsal with speech recognition available for fuller feedback.'],
      },
    });

    clearLocalData();

    expect(getRehearsalSessions()).toEqual([]);
  });

  it('emits a settings event when settings change', () => {
    const listener = vi.fn();
    window.addEventListener('cuevora-settings-changed', listener);

    saveSettings({ focusLineEnabled: false });

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('cuevora-settings-changed', listener);
  });
});
