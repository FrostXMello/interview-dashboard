'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '@/context/DataProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterFlow } from '@/components/auth/RegisterFlow';
import { ForgotPasswordFlow } from '@/components/auth/ForgotPasswordFlow';
import { ErrorBanner, SessionLoading } from '@/components/auth/AuthChrome';

type AuthView = 'login' | 'register' | 'forgot';

function goToDashboard() {
  window.location.replace('/dashboard');
}

export default function LoginPage() {
  const {
    appMode,
    currentUser,
    loginWithPassword,
    logout,
    lastError,
    clearError
  } = useData();

  const [view, setView] = useState<AuthView>('login');
  const [attemptedLogin, setAttemptedLogin] = useState(false);
  const [opening, setOpening] = useState(false);
  const [stayOnLogin, setStayOnLogin] = useState(false);
  const forcedLogoutRef = useRef(false);
  const isDemoMode = appMode === 'offline-demo';

  const errorText = useMemo(
    () => (attemptedLogin ? lastError?.message || '' : ''),
    [attemptedLogin, lastError]
  );

  useEffect(() => {
    if (forcedLogoutRef.current) return;
    if (new URLSearchParams(window.location.search).get('loggedOut') !== '1') return;
    forcedLogoutRef.current = true;
    setStayOnLogin(true);
    void logout();
  }, [logout]);

  useEffect(() => {
    if (!currentUser || opening || stayOnLogin) return;
    setOpening(true);
    goToDashboard();
  }, [currentUser, opening, stayOnLogin]);

  const handleLogin = async (phone: string, password: string) => {
    setAttemptedLogin(true);
    setStayOnLogin(false);
    clearError();
    const ok = await loginWithPassword(phone, password);
    if (ok) {
      setOpening(true);
      goToDashboard();
    }
    return ok;
  };

  if ((currentUser || opening) && !stayOnLogin) {
    return <SessionLoading label="Opening dashboard…" />;
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {isDemoMode && (
        <div className="mb-4 w-full max-w-md">
          <ErrorBanner message="Sign-in is unavailable in this environment until Supabase Auth is configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the app." />
        </div>
      )}
      {view === 'register' ? (
        <RegisterFlow onBackToLogin={() => { clearError(); setView('login'); }} />
      ) : view === 'forgot' ? (
        <ForgotPasswordFlow onBackToLogin={() => { clearError(); setView('login'); }} />
      ) : (
        <LoginForm
          subtitle={isDemoMode ? 'Sign in with your authorized phone number once connected mode is configured.' : 'Sign in with your authorized phone number.'}
          error={errorText}
          onLogin={handleLogin}
          onForgotPassword={() => { clearError(); setView('forgot'); }}
          onCreateAccount={() => { clearError(); setView('register'); }}
        />
      )}
    </div>
  );
}
