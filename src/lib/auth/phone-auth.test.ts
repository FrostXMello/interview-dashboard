import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  UNAUTHORIZED_PHONE_MESSAGE,
  canManageAllowlist,
  mapRegisterEligibilityMessage,
  mapResetEligibilityMessage
} from '@/lib/auth/eligibility';
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  canResendOtp,
  createOtpFlowState,
  isCompleteOtp,
  mapOtpProviderError,
  normalizeOtpInput,
  otpFlowReducer
} from '@/lib/auth/otp-flow';
import { validateNewPassword } from '@/lib/auth/password';
import { maskPhoneE164, normalizePhoneE164, phonesMatch } from '@/lib/auth/phone';
import { resolveProtectedRoute } from '@/lib/auth/route-guard';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260814140000_allowed_phones.sql'),
  'utf8'
);
const completeRegistrationSource = readFileSync(
  resolve(process.cwd(), 'src/lib/auth/phone-auth.ts'),
  'utf8'
);

describe('phone normalization', () => {
  it('normalizes Indian 10-digit, spaced, and dashed input to E.164', () => {
    expect(normalizePhoneE164('9876543210')).toBe('+919876543210');
    expect(normalizePhoneE164('+91 9876543210')).toBe('+919876543210');
    expect(normalizePhoneE164('+91-9876543210')).toBe('+919876543210');
    expect(phonesMatch('9876543210', '+919876543210')).toBe(true);
  });

  it('keeps explicit non-India E.164 unchanged', () => {
    expect(normalizePhoneE164('+15551234567')).toBe('+15551234567');
  });

  it('masks numbers without exposing the full national number', () => {
    expect(maskPhoneE164('+919876543210')).toBe('+91 XXXXX 3210');
  });
});

describe('allowlist eligibility mapping (client never holds the list)', () => {
  it('accepts can_register with no user-facing error', () => {
    expect(mapRegisterEligibilityMessage('can_register')).toBeNull();
  });

  it('rejects unauthorized phones with a generic message', () => {
    expect(mapRegisterEligibilityMessage('not_authorized')).toBe(UNAUTHORIZED_PHONE_MESSAGE);
    expect(mapRegisterEligibilityMessage('not_authorized')).not.toMatch(/allowed_phones/i);
  });

  it('treats already_registered as a conflict, not an allowlist dump', () => {
    expect(mapRegisterEligibilityMessage('already_registered')).toMatch(/already exists/i);
  });

  it('uses a generic reset denial that does not enumerate accounts', () => {
    expect(mapResetEligibilityMessage('not_eligible')).toMatch(/administrator/i);
  });
});

describe('allowlist authorization helpers', () => {
  it('panelists cannot manage the allowlist', () => {
    expect(canManageAllowlist('panelist')).toBe(false);
    expect(canManageAllowlist('senior_panelist')).toBe(false);
  });

  it('admin-level roles can manage the allowlist', () => {
    expect(canManageAllowlist('admin')).toBe(true);
    expect(canManageAllowlist('super_admin')).toBe(true);
  });
});

describe('database allowlist / registration constraints (SQL review)', () => {
  it('does not grant anon SELECT on allowed_phones', () => {
    expect(migration).toMatch(/revoke all on public\.allowed_phones from anon/i);
  });

  it('restricts table policies to is_admin()', () => {
    expect(migration).toMatch(/using \(public\.is_admin\(\)\)/);
    expect(migration).toMatch(/with check \(public\.is_admin\(\)\)/);
  });

  it('uses a unique phone constraint and unique registered profile', () => {
    expect(migration).toMatch(/allowed_phones_phone_e164_uidx/);
    expect(migration).toMatch(/allowed_phones_one_profile_uidx/);
  });

  it('forces new profiles to panelist and does not take role from metadata', () => {
    expect(migration).toMatch(/'panelist'/);
    expect(migration).not.toMatch(/raw_user_meta_data->>'role'/);
  });

  it('complete_phone_onboarding accepts only display name, not role', () => {
    expect(migration).toMatch(/complete_phone_onboarding\(p_display_name text\)/);
    expect(migration).not.toMatch(/complete_phone_onboarding\([^)]*role/i);
  });
});

describe('registration cannot self-assign admin', () => {
  it('client onboarding RPC does not send a role argument', () => {
    expect(completeRegistrationSource).toMatch(/complete_phone_onboarding/);
    expect(completeRegistrationSource).toMatch(/p_display_name/);
    expect(completeRegistrationSource).not.toMatch(/p_role/);
    expect(completeRegistrationSource).not.toMatch(/role:\s*['"]admin['"]/);
  });
});

describe('OTP state transitions', () => {
  it('SEND → SENT starts cooldown; TICK then allows resend', () => {
    let state = createOtpFlowState('register');
    state = otpFlowReducer(state, { type: 'SEND' });
    expect(state.ui).toBe('sending');
    state = otpFlowReducer(state, { type: 'SENT' });
    expect(state.ui).toBe('sent');
    expect(state.cooldownSeconds).toBe(OTP_RESEND_COOLDOWN_SECONDS);
    expect(canResendOtp(state)).toBe(false);
    for (let i = 0; i < OTP_RESEND_COOLDOWN_SECONDS; i += 1) {
      state = otpFlowReducer(state, { type: 'TICK' });
    }
    expect(canResendOtp(state)).toBe(true);
  });

  it('VERIFY → VERIFIED and FAIL map provider errors', () => {
    let state = otpFlowReducer(createOtpFlowState('reset'), { type: 'VERIFY' });
    expect(state.ui).toBe('verifying');
    state = otpFlowReducer(state, { type: 'VERIFIED' });
    expect(state.ui).toBe('verified');
    expect(mapOtpProviderError('Token has expired')).toMatch(/expired/i);
    expect(mapOtpProviderError('Invalid token')).toMatch(/invalid/i);
    expect(mapOtpProviderError('Too many requests')).toMatch(/too many/i);
  });

  it('accepts pasted 6-digit OTP and strips non-digits', () => {
    expect(normalizeOtpInput('12 34-56')).toBe('123456');
    expect(isCompleteOtp('123456')).toBe(true);
    expect(isCompleteOtp('12345')).toBe(false);
  });
});

describe('password validation', () => {
  it('requires minimum length', () => {
    expect(validateNewPassword('short', 'short').ok).toBe(false);
  });

  it('rejects confirmation mismatch', () => {
    const result = validateNewPassword('longenough', 'different1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/do not match/i);
  });

  it('accepts a matching password of sufficient length', () => {
    expect(validateNewPassword('longenough', 'longenough')).toEqual({ ok: true });
  });
});

describe('existing route protection remains', () => {
  it('connected mode still gates /dashboard', () => {
    expect(
      resolveProtectedRoute({
        mode: 'connected',
        pathname: '/dashboard',
        hasAuthenticatedUser: false
      })
    ).toEqual({ action: 'redirect-login', redirectTo: '/' });
  });
});

describe('login uses Supabase Auth credentials, not local password compare', () => {
  it('remote repository signs in with phone+password via Auth API', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/lib/data-access/remote-repository.ts'), 'utf8');
    expect(source).toMatch(/signInWithPassword\(/);
    expect(source).toMatch(/\{ phone, password \}/);
    expect(source).not.toMatch(/allowed_phones/);
  });
});
