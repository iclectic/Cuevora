import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccessibleStatus } from './AccessibleStatus';

describe('AccessibleStatus', () => {
  it('renders polite status messages by default', () => {
    render(<AccessibleStatus message="Saved" />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Saved');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('renders assertive alerts for urgent messages', () => {
    render(<AccessibleStatus message="Recording failed" assertive />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Recording failed');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});
