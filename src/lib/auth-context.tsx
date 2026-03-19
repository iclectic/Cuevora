import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  getRedirectResult,
} from 'firebase/auth';
import { auth, googleProvider, appleProvider, firebaseConfigured } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  skipAuth: () => void;
  isGuest: boolean;
  firebaseAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const GUEST_KEY = 'cuevora_guest_mode';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(() => {
    try {
      return localStorage.getItem(GUEST_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // If Firebase isn't configured, skip auth entirely
    if (!firebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Check for redirect result (mobile-friendly auth)
    getRedirectResult(auth).catch(() => {
      // Silently handle - user may not have been redirected
    });

    // Safety timeout: never stay loading for more than 5s
    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) { setError('Firebase not configured'); return; }
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (popupError: unknown) {
      const err = popupError as { code?: string };
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth!, googleProvider);
        } catch (redirectError: unknown) {
          const rErr = redirectError as { message?: string };
          setError(rErr.message || 'Failed to sign in with Google');
        }
      } else {
        const pErr = popupError as { message?: string };
        setError(pErr.message || 'Failed to sign in with Google');
      }
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    if (!auth) { setError('Firebase not configured'); return; }
    setError(null);
    try {
      await signInWithPopup(auth, appleProvider);
    } catch (popupError: unknown) {
      const err = popupError as { code?: string };
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth!, appleProvider);
        } catch (redirectError: unknown) {
          const rErr = redirectError as { message?: string };
          setError(rErr.message || 'Failed to sign in with Apple');
        }
      } else {
        const pErr = popupError as { message?: string };
        setError(pErr.message || 'Failed to sign in with Apple');
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      if (auth) await firebaseSignOut(auth);
      setUser(null);
      setIsGuest(false);
      try { localStorage.removeItem(GUEST_KEY); } catch { /* noop */ }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to sign out');
    }
  }, []);

  const skipAuth = useCallback(() => {
    setIsGuest(true);
    try { localStorage.setItem(GUEST_KEY, 'true'); } catch { /* noop */ }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        signInWithApple,
        signOut,
        skipAuth,
        isGuest,
        firebaseAvailable: firebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
