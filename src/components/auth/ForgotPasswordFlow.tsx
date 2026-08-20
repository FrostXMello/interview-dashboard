'use client';

import { useEffect, useReducer, useState } from 'react';
import { maskPhoneE164 } from '@/lib/auth/phone';
import { validateNewPassword } from '@/lib/auth/password';
import { createOtpFlowState, isCompleteOtp, otpFlowReducer } from '@/lib/auth/otp-flow';
import {
  checkResetEligibility,
  completePasswordReset,
  sendPhoneOtp,
  verifyPhoneOtp
} from '@/lib/auth/phone-auth';
import { AuthCard, ErrorBanner, PrimaryButton, TextButton } from '@/components/auth/AuthChrome';
import { OtpInput } from '@/components/auth/OtpInput';
import { PasswordFields } from '@/components/auth/PasswordFields';
import { PhoneInput } from '@/components/auth/PhoneInput';

type Step = 'phone' | 'otp' | 'password' | 'success';

export function ForgotPasswordFlow({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [step, setStep] = useState<Step>('phone');
  const [national, setNational] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [otpState, dispatchOtp] = useReducer(otpFlowReducer, createOtpFlowState('reset'));

  useEffect(() => {
    if (otpState.cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => dispatchOtp({ type: 'TICK' }), 1000);
    return () => window.clearInterval(timer);
  }, [otpState.cooldownSeconds]);

  const sendCode = async (e164: string) => {
    dispatchOtp({ type: 'SEND' });
    const sent = await sendPhoneOtp(e164);
    if (!sent.ok) {
      dispatchOtp({ type: 'FAIL', message: sent.error.userMessage });
      setError(sent.error.userMessage);
      return false;
    }
    dispatchOtp({ type: 'SENT' });
    setError('');
    return true;
  };

  const handlePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const eligible = await checkResetEligibility(national);
    if (!eligible.ok) {
      setBusy(false);
      setError(eligible.error.userMessage);
      return;
    }
    const ok = await sendCode(eligible.data.phone);
    setBusy(false);
    if (ok) {
      setPhone(eligible.data.phone);
      setStep('otp');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCompleteOtp(otp)) {
      setError('Enter the 6-digit code.');
      return;
    }
    dispatchOtp({ type: 'VERIFY' });
    const verified = await verifyPhoneOtp(phone, otp);
    if (!verified.ok) {
      dispatchOtp({ type: 'FAIL', message: verified.error.userMessage });
      setError(verified.error.userMessage);
      return;
    }
    dispatchOtp({ type: 'VERIFIED' });
    setError('');
    setStep('password');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateNewPassword(password, confirm);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setBusy(true);
    const updated = await completePasswordReset(password);
    setBusy(false);
    setPassword('');
    setConfirm('');
    if (!updated.ok) {
      setError(updated.error.userMessage);
      return;
    }
    setStep('success');
  };

  const titles: Record<Step, { title: string; subtitle: string }> = {
    phone: { title: 'Reset your password', subtitle: 'Enter the phone number on your account.' },
    otp: { title: 'Verify your phone', subtitle: `We've sent a verification code to ${maskPhoneE164(phone)}` },
    password: { title: 'Create new password', subtitle: 'Choose a new password for phone sign-in.' },
    success: { title: 'Password updated', subtitle: 'You can now sign in with your new password.' }
  };

  return (
    <AuthCard title={titles[step].title} subtitle={titles[step].subtitle}>
      {step === 'phone' && (
        <form onSubmit={handlePhone} className="space-y-5">
          <PhoneInput id="reset-phone" value={national} onChange={setNational} autoFocus required />
          <PrimaryButton loading={busy || otpState.ui === 'sending'} disabled={national.replace(/\D/g, '').length !== 10}>
            Send OTP
          </PrimaryButton>
          <div className="text-center">
            <TextButton onClick={onBackToLogin}>Back to login</TextButton>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerify} className="space-y-5">
          <OtpInput value={otp} onChange={setOtp} disabled={otpState.ui === 'verifying'} />
          <PrimaryButton loading={otpState.ui === 'verifying'} disabled={!isCompleteOtp(otp)}>
            Verify OTP
          </PrimaryButton>
          <div className="flex justify-between">
            <TextButton disabled={otpState.cooldownSeconds > 0} onClick={() => void sendCode(phone)}>
              {otpState.cooldownSeconds > 0 ? `Resend OTP in ${otpState.cooldownSeconds}s` : 'Resend OTP'}
            </TextButton>
            <TextButton onClick={() => { dispatchOtp({ type: 'RESET' }); setOtp(''); setError(''); setStep('phone'); }}>
              Change number
            </TextButton>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleReset} className="space-y-5">
          <PasswordFields
            password={password}
            confirm={confirm}
            onPasswordChange={setPassword}
            onConfirmChange={setConfirm}
            disabled={busy}
            passwordLabel="New password"
          />
          <PrimaryButton loading={busy}>Reset password</PrimaryButton>
          <div className="text-center">
            <TextButton onClick={onBackToLogin}>Back to login</TextButton>
          </div>
        </form>
      )}

      {step === 'success' && (
        <button
          type="button"
          onClick={onBackToLogin}
          className="flex w-full justify-center rounded-lg bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Continue to login
        </button>
      )}

      <ErrorBanner message={error} />
    </AuthCard>
  );
}
