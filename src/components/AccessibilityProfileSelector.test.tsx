import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccessibilityProfileSelector } from './AccessibilityProfileSelector';

describe('AccessibilityProfileSelector', () => {
  it('selects a profile', () => {
    const onChange = vi.fn();
    render(<AccessibilityProfileSelector value="default" onChange={onChange} />);

    fireEvent.click(screen.getByText('Low vision'));

    expect(onChange).toHaveBeenCalledWith('low-vision');
  });
});
