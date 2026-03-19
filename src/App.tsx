import { useState, useCallback, useEffect } from "react";
import { getSettings } from "@/lib/storage";
import type { ColorMode } from "@/types/script";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import SplashScreen from "./pages/SplashScreen";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import Player from "./pages/Player";
import RecordMode from "./pages/RecordMode";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const resolveTheme = (mode: ColorMode): boolean => {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const App = () => {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);
  const [isDark, setIsDark] = useState(() => resolveTheme(getSettings().colorMode));

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      const mode = getSettings().colorMode;
      if (mode === 'system') setIsDark(mq.matches);
    };
    mq.addEventListener('change', onSystemChange);

    // Listen for settings changes from other components
    const onStorage = () => setIsDark(resolveTheme(getSettings().colorMode));
    window.addEventListener('cuevora-settings-changed', onStorage);

    return () => {
      mq.removeEventListener('change', onSystemChange);
      window.removeEventListener('cuevora-settings-changed', onStorage);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
          <BrowserRouter>
            <div className={isDark ? 'dark' : ''}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/editor/:id" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
                <Route path="/player/:id" element={<ProtectedRoute><Player /></ProtectedRoute>} />
                <Route path="/record/:id" element={<ProtectedRoute><RecordMode /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
