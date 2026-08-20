'use client';

import { useEffect, useReducer, useState } from 'react';
import { maskPhoneE164 } from '@/lib/auth/phone';
import { validateNewPassword } from '@/lib/auth/password';
import { canResendOtp, createOtpFlowState, isCompleteOtp, otpFlowReducer } from '@/lib/auth/otp-flow';
import {
  checkRegisterEligibility,
  completeRegistration,
  sendPhoneOtp,
  verifyPhoneOtp
} from '@/lib/auth/phone-auth';
import { AuthCard, ErrorBanner, PrimaryButton, TextButton } from '@/components/auth/AuthChrome';
import { OtpInput } from '@/components/auth/OtpInput';
import { PasswordFields } from '@/components/auth/PasswordFields';
import { PhoneInput } from '@/components/auth/PhoneInput';

type Step = 'phone' | 'name' | 'otp' | 'password' | 'success';

export function RegisterFlow({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [step, setStep] = useState<Step>('phone');
  const [national, setNational] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [otpState, dispatchOtp] = useReducer(otpFlowReducer, createOtpFlowState('register'));

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
    const result = await checkRegisterEligibility(national);
    setBusy(false);
    if (!result.ok) {
      setError(result.error.userMessage);
      return;
    }
    setPhone(result.data.phone);
    setStep('name');
  };

  const handleName = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = fullName.trim();
    if (name.length < 2) {
      setError('Enter your full name.');
      return;
    }
    setBusy(true);
    setError('');
    const ok = await sendCode(phone);
    setBusy(false);
    if (ok) setStep('otp');
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateNewPassword(password, confirm);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setBusy(true);
    setError('');
    const created = await completeRegistration(fullName, password);
    setBusy(false);
    setPassword('');
    setConfirm('');
    if (!created.ok) {
      setError(created.error.userMessage);
      return;
    }
    setStep('success');
  };

  const titles: Record<Step, { title: string; subtitle: string }> = {
    phone: { title: 'Create your account', subtitle: 'Only authorized phone numbers can register.' },
    name: { title: 'Your name', subtitle: 'This name will appear to other panelists.' },
    otp: { title: 'Verify your phone', subtitle: `We've sent a verification code to ${maskPhoneE164(phone)}` },
    password: {
      title: 'Set your password',
      subtitle: 'Choose a password you will use to sign in. The SMS code is not your password.'
    },
    success: { title: 'Account created', subtitle: 'You can now sign in with your phone number and password.' }
  };

  return (
    <AuthCard title={titles[step].title} subtitle={titles[step].subtitle}>
      {step === 'phone' && (
        <form onSubmit={handlePhone} className="space-y-5">
          <PhoneInput id="register-phone" value={national} onChange={setNational} autoFocus required />
          <PrimaryButton loading={busy} disabled={national.replace(/\D/g, '').length !== 10}>Continue</PrimaryButton>
          <div className="text-center">
            <TextButton onClick={onBackToLogin}>Back to login</TextButton>
          </div>
        </form>
      )}

      {step === 'name' && (
        <form onSubmit={handleName} className="space-y-5">
          <div>
            <label htmlFor="full-name" className="block text-sm font-medium text-gray-300">
              Full name
            </label>
            <input
              id="full-name"
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-950 py-2.5 px-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>
          <PrimaryButton loading={busy || otpState.ui === 'sending'} disabled={fullName.trim().length < 2}>
            Continue
          </PrimaryButton>
          <div className="text-center">
            <TextButton onClick={() => { setError(''); setStep('phone'); }}>Change number</TextButton>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerify} className="space-y-5">
          <OtpInput value={otp} onChange={setOtp} disabled={otpState.ui === 'verifying'} />
          <PrimaryButton loading={otpState.ui === 'verifying'} disabled={!isCompleteOtp(otp)}>
            Verify
          </PrimaryButton>
          <div className="flex items-center justify-between">
            <TextButton
              disabled={otpState.cooldownSeconds > 0}
              onClick={() => {
                if (!canResendOtp(otpState) && otpState.cooldownSeconds > 0) return;
                void sendCode(phone);
              }}
            >
              {otpState.cooldownSeconds > 0 ? `Resend OTP in ${otpState.cooldownSeconds}s` : 'Resend OTP'}
            </TextButton>
            <TextButton
              onClick={() => {
                dispatchOtp({ type: 'RESET' });
                setOtp('');
                setStep('phone');
              }}
            >
              Change number
            </TextButton>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleCreate} className="space-y-5">
          <PasswordFields
            password={password}
            confirm={confirm}
            onPasswordChange={setPassword}
            onConfirmChange={setConfirm}
            disabled={busy}
          />
          <PrimaryButton loading={busy}>Create account</PrimaryButton>
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
