import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLocalData,
  deleteScript,
  exportBackup,
  getScript,
  getScripts,
  getSettings,
  importBackup,
  restoreScript,
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
    const backup = exportBackup();

    clearLocalData();
    expect(getScripts()).toHaveLength(0);

    expect(importBackup(backup)).toBe(true);
    expect(getScripts()[0].title).toBe('Backup me');
    expect(getSettings().defaultFontSize).toBe(44);
  });

  it('rejects corrupted backup files without overwriting data', () => {
    const script = saveScript({ title: 'Keep me', content: 'Safe' });

    expect(importBackup(JSON.stringify({ scripts: [{ id: 1 }] }))).toBe(false);
    expect(getScript(script.id)?.title).toBe('Keep me');
  });

  it('emits a settings event when settings change', () => {
    const listener = vi.fn();
    window.addEventListener('cuevora-settings-changed', listener);

    saveSettings({ focusLineEnabled: false });

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('cuevora-settings-changed', listener);
  });
});
