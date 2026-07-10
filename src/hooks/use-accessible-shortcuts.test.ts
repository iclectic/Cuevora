import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAccessibleShortcuts } from './use-accessible-shortcuts';

describe('useAccessibleShortcuts', () => {
  it('runs registered shortcuts', () => {
    const handler = vi.fn();
    renderHook(() => useAccessibleShortcuts({ p: handler }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));

    expect(handler).toHaveBeenCalledOnce();
  });

  it('ignores shortcuts while typing in text fields', () => {
    const handler = vi.fn();
    renderHook(() => useAccessibleShortcuts({ p: handler }));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
    input.remove();
  });
});
