'use client';

import { useRef } from 'react';
import { OTP_LENGTH, normalizeOtpInput } from '@/lib/auth/otp-flow';

export function OtpInput({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const digits = normalizeOtpInput(value).split('');
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const setDigit = (index: number, char: string) => {
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] || '');
    next[index] = char.replace(/\D/g, '').slice(-1);
    onChange(next.join(''));
    if (char && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2" onPaste={(e) => {
      e.preventDefault();
      onChange(normalizeOtpInput(e.clipboardData.getData('text')));
    }}>
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          value={digits[index] || ''}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          className="h-12 w-10 rounded-lg border border-gray-700 bg-gray-950 text-center text-lg font-semibold text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
        />
      ))}
    </div>
  );
}
