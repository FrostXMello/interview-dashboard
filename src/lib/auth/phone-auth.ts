import { AppError, failure, success, toAppError, type OperationResult } from '@/lib/errors';
import {
  mapRegisterEligibilityMessage,
  mapResetEligibilityMessage,
  type PhoneEligibility,
  type PhoneResetEligibility
} from '@/lib/auth/eligibility';
import { mapOtpProviderError } from '@/lib/auth/otp-flow';
import { normalizePhoneE164 } from '@/lib/auth/phone';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

function client() {
  const sb = createBrowserSupabaseClient();
  if (!sb) {
    throw new AppError('OFFLINE', 'Supabase is not configured', {
      userMessage: 'Phone authentication is unavailable in offline demo mode.'
    });
  }
  return sb;
}

function parseEligibility(value: unknown): PhoneEligibility {
  if (value === 'can_register' || value === 'already_registered' || value === 'not_authorized' || value === 'invalid') {
    return value;
  }
  return 'not_authorized';
}

function parseResetEligibility(value: unknown): PhoneResetEligibility {
  if (value === 'can_reset' || value === 'not_eligible' || value === 'invalid') return value;
  return 'not_eligible';
}

export async function checkRegisterEligibility(rawPhone: string): Promise<OperationResult<{ phone: string }>> {
  const phone = normalizePhoneE164(rawPhone);
  if (!phone) {
    return failure(new AppError('VALIDATION_FAILURE', 'invalid phone', { userMessage: 'Enter a valid phone number.' }));
  }

  try {
    const { data, error } = await client().rpc('check_phone_eligibility', { p_phone: phone });
    if (error) return failure(toAppError(error, 'DATABASE_FAILURE'));
    const status = parseEligibility(data);
    const message = mapRegisterEligibilityMessage(status);
    if (message) {
      const code = status === 'already_registered' ? 'CONFLICT' : 'AUTHORIZATION_FAILURE';
      return failure(new AppError(code, status, { userMessage: message }));
    }
    return success({ phone });
  } catch (err) {
    return failure(toAppError(err));
  }
}

export async function checkResetEligibility(rawPhone: string): Promise<OperationResult<{ phone: string }>> {
  const phone = normalizePhoneE164(rawPhone);
  if (!phone) {
    return failure(new AppError('VALIDATION_FAILURE', 'invalid phone', { userMessage: 'Enter a valid phone number.' }));
  }

  try {
    const { data, error } = await client().rpc('check_phone_reset_eligibility', { p_phone: phone });
    if (error) return failure(toAppError(error, 'DATABASE_FAILURE'));
    const status = parseResetEligibility(data);
    const message = mapResetEligibilityMessage(status);
    if (message) {
      return failure(new AppError('AUTHORIZATION_FAILURE', status, { userMessage: message }));
    }
    return success({ phone });
  } catch (err) {
    return failure(toAppError(err));
  }
}

export async function sendPhoneOtp(phone: string): Promise<OperationResult<null>> {
  try {
    const { error } = await client().auth.signInWithOtp({ phone });
    if (error) {
      return failure(
        new AppError('AUTHENTICATION_FAILURE', error.message, {
          cause: error,
          userMessage: mapOtpProviderError(error.message)
        })
      );
    }
    return success(null);
  } catch (err) {
    return failure(toAppError(err, 'AUTHENTICATION_FAILURE'));
  }
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<OperationResult<null>> {
  try {
    const { error } = await client().auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) {
      return failure(
        new AppError('AUTHENTICATION_FAILURE', error.message, {
          cause: error,
          userMessage: mapOtpProviderError(error.message)
        })
      );
    }
    return success(null);
  } catch (err) {
    return failure(toAppError(err, 'AUTHENTICATION_FAILURE'));
  }
}

export async function completeRegistration(displayName: string, password: string): Promise<OperationResult<null>> {
  try {
    const sb = client();
    const { error: onboardError } = await sb.rpc('complete_phone_onboarding', {
      p_display_name: displayName.trim()
    });
    if (onboardError) {
      await sb.auth.signOut();
      return failure(
        new AppError('AUTHORIZATION_FAILURE', onboardError.message, {
          cause: onboardError,
          userMessage: 'This phone number is not authorized to create an account. Please contact your administrator.'
        })
      );
    }

    const { error: passwordError } = await sb.auth.updateUser({
      password,
      data: { display_name: displayName.trim() }
    });
    if (passwordError) {
      return failure(
        new AppError('AUTHENTICATION_FAILURE', passwordError.message, {
          cause: passwordError,
          userMessage: 'Account was verified but the password could not be saved. Try again.'
        })
      );
    }

    await sb.auth.signOut();
    return success(null);
  } catch (err) {
    return failure(toAppError(err));
  }
}

export async function completePasswordReset(password: string): Promise<OperationResult<null>> {
  try {
    const sb = client();
    const { error } = await sb.auth.updateUser({ password });
    if (error) {
      return failure(
        new AppError('AUTHENTICATION_FAILURE', error.message, {
          cause: error,
          userMessage: 'Could not update the password. Try again.'
        })
      );
    }
    await sb.auth.signOut();
    return success(null);
  } catch (err) {
    return failure(toAppError(err));
  }
}
