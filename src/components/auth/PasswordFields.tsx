'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

const fieldClass =
  'block w-full min-h-11 pl-10 pr-12 bg-gray-950 border border-gray-700 rounded-lg py-3 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none';

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="mt-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-500" />
        </div>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

export function PasswordFields({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  disabled,
  passwordLabel = 'Password',
  confirmLabel = 'Confirm password'
}: {
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  disabled?: boolean;
  passwordLabel?: string;
  confirmLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <Field
        id="new-password"
        label={passwordLabel}
        value={password}
        onChange={onPasswordChange}
        autoComplete="new-password"
        disabled={disabled}
      />
      <Field
        id="confirm-password"
        label={confirmLabel}
        value={confirm}
        onChange={onConfirmChange}
        autoComplete="new-password"
        disabled={disabled}
      />
      <p className="text-xs text-gray-500">Use at least 8 characters. This is your permanent login password, not the SMS code.</p>
    </div>
  );
}
