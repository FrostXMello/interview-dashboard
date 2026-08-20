'use client';

import { nationalDigits, normalizePhoneE164 } from '@/lib/auth/phone';

const inputClass =
  'block w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none';

export function PhoneInput({
  id,
  value,
  onChange,
  disabled,
  autoFocus,
  required
}: {
  id: string;
  value: string;
  onChange: (national: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
}) {
  const national = value.startsWith('+') ? nationalDigits(value) : value.replace(/\D/g, '').slice(0, 10);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        Phone number
      </label>
      <div className="mt-1 flex gap-2">
        <div className="flex items-center rounded-lg border border-gray-700 bg-gray-950 px-3 text-sm text-gray-300">
          +91
        </div>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          disabled={disabled}
          required={required}
          minLength={10}
          value={national}
          onChange={(e) => {
            const raw = e.target.value;
            const parsed = normalizePhoneE164(raw);
            if (parsed) {
              onChange(nationalDigits(parsed));
              return;
            }
            onChange(raw.replace(/\D/g, '').slice(0, 10));
          }}
          className={`${inputClass} pl-3`}
          placeholder="98765 43210"
        />
      </div>
    </div>
  );
}
