import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';

const Index = () => {
  const navigate = useNavigate();
  const settings = getSettings();
  const { user, loading, isGuest } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Not authenticated and not guest → go to login
    if (!user && !isGuest) {
      navigate('/login', { replace: true });
      return;
    }

    // Authenticated or guest → check onboarding
    if (settings.onboardingComplete) {
      navigate('/home', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  }, [loading, user, isGuest, navigate, settings.onboardingComplete]);

  return null;
};

export default Index;
