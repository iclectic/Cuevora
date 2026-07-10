import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccessibleControlsPanel } from './AccessibleControlsPanel';

describe('AccessibleControlsPanel', () => {
  it('renders labeled actions with pressed state', async () => {
    const play = vi.fn();
    render(
      <AccessibleControlsPanel
        title="Prompt controls"
        actions={[{ id: 'play', label: 'Play', pressed: true, onAction: play }]}
      />,
    );

    const button = screen.getByRole('button', { name: 'Play' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(play).toHaveBeenCalledOnce();
  });
});
