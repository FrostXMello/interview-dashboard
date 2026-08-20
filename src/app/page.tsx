'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterFlow } from '@/components/auth/RegisterFlow';
import { ForgotPasswordFlow } from '@/components/auth/ForgotPasswordFlow';
import { ErrorBanner, SessionLoading } from '@/components/auth/AuthChrome';

type AuthView = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const {
    appMode,
    currentUser,
    loginWithPassword,
    lastError,
    clearError
  } = useData();

  const [view, setView] = useState<AuthView>('login');
  const [attemptedLogin, setAttemptedLogin] = useState(false);
  const isDemoMode = appMode === 'offline-demo';

  const errorText = useMemo(
    () => (attemptedLogin ? lastError?.message || '' : ''),
    [attemptedLogin, lastError]
  );

  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

  useEffect(() => {
    if (currentUser) router.replace('/dashboard');
  }, [currentUser, router]);

  const handleLogin = async (phone: string, password: string) => {
    setAttemptedLogin(true);
    clearError();
    const ok = await loginWithPassword(phone, password);
    if (ok) router.replace('/dashboard');
    return ok;
  };

  if (currentUser) {
    return <SessionLoading label="Opening dashboard…" />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
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
