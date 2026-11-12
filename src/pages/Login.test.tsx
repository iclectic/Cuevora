import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Login from './Login';

const skipAuth = vi.fn();
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ signInWithGoogle: vi.fn(), signInWithApple: vi.fn(), skipAuth, loading: false, error: null, user: null, isGuest: false, firebaseAvailable: false }) }));

describe('Guest Mode', () => {
  it('explains local storage and allows continuing without Firebase', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByText(/Create and save scripts directly on your device/)).toBeInTheDocument();
    expect(screen.queryByText(/Firebase/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue without an account' }));
    expect(skipAuth).toHaveBeenCalledOnce();
  });
});
