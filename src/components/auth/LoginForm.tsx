'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { AuthCard, ErrorBanner, TextButton } from '@/components/auth/AuthChrome';

export function LoginForm({
  onLogin,
  onForgotPassword,
  onCreateAccount,
  error,
  subtitle
}: {
  onLogin: (phone: string, password: string) => Promise<boolean>;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
  error: string;
  subtitle: string;
}) {
  const [national, setNational] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = national.replace(/\D/g, '');
    if (digits.length !== 10) {
      setLocalError('Enter a valid 10-digit phone number.');
      return;
    }
    if (!password) {
      setLocalError('Enter your password.');
      return;
    }
    setLoading(true);
    setLocalError('');
    const ok = await onLogin(national, password);
    setLoading(false);
    if (!ok && !error) {
      setLocalError('Sign-in failed. Check your phone number and password.');
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle={subtitle}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <PhoneInput id="login-phone" value={national} onChange={setNational} autoFocus required />
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-10 bg-gray-950 border border-gray-700 rounded-lg py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
            >
              {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <TextButton onClick={onForgotPassword}>Forgot password?</TextButton>
          <TextButton onClick={onCreateAccount}>Create account</TextButton>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-lg bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Login'}
        </button>
      </form>
      <ErrorBanner message={error || localError} />
    </AuthCard>
  );
}
