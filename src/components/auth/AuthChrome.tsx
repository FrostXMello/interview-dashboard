'use client';

import { Loader2 } from 'lucide-react';

export function AuthCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md space-y-5 sm:space-y-6 bg-gray-900 p-5 sm:p-8 rounded-2xl border border-gray-800 shadow-2xl">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-gray-400">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  loading,
  disabled,
  type = 'submit'
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'submit' | 'button';
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className="flex min-h-11 w-full justify-center rounded-lg bg-blue-600 py-3 px-4 text-base font-semibold text-white hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
    >
      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : children}
    </button>
  );
}

export function TextButton({
  children,
  onClick,
  disabled
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="text-sm font-medium text-blue-500 hover:text-blue-400 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded">{message}</div>;
}

export function SessionLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Loader2 className="mb-3 h-6 w-6 animate-spin text-blue-500" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
