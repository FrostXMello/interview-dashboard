export const OTP_LENGTH = 6;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

export type OtpPurpose = 'register' | 'reset';

export type OtpUiState =
  | 'idle'
  | 'sending'
  | 'sent'
  | 'verifying'
  | 'verified'
  | 'error';

export interface OtpFlowState {
  purpose: OtpPurpose;
  ui: OtpUiState;
  cooldownSeconds: number;
  lastError: string | null;
}

export type OtpFlowEvent =
  | { type: 'SEND' }
  | { type: 'SENT' }
  | { type: 'VERIFY' }
  | { type: 'VERIFIED' }
  | { type: 'FAIL'; message: string }
  | { type: 'TICK' }
  | { type: 'RESET' };

export function createOtpFlowState(purpose: OtpPurpose): OtpFlowState {
  return { purpose, ui: 'idle', cooldownSeconds: 0, lastError: null };
}

export function otpFlowReducer(state: OtpFlowState, event: OtpFlowEvent): OtpFlowState {
  switch (event.type) {
    case 'SEND':
      return { ...state, ui: 'sending', lastError: null };
    case 'SENT':
      return { ...state, ui: 'sent', cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS, lastError: null };
    case 'VERIFY':
      return { ...state, ui: 'verifying', lastError: null };
    case 'VERIFIED':
      return { ...state, ui: 'verified', lastError: null };
    case 'FAIL':
      return { ...state, ui: 'error', lastError: event.message };
    case 'TICK':
      return {
        ...state,
        cooldownSeconds: Math.max(0, state.cooldownSeconds - 1)
      };
    case 'RESET':
      return createOtpFlowState(state.purpose);
    default:
      return state;
  }
}

export function canResendOtp(state: OtpFlowState): boolean {
  return (state.ui === 'sent' || state.ui === 'error') && state.cooldownSeconds === 0;
}

export function normalizeOtpInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export function isCompleteOtp(value: string): boolean {
  return normalizeOtpInput(value).length === OTP_LENGTH;
}

export function mapOtpProviderError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('expired')) return 'That code has expired. Request a new one.';
  if (lower.includes('invalid') || lower.includes('token')) return 'That code is invalid. Try again.';
  if (lower.includes('rate') || lower.includes('too many')) {
    return 'Too many attempts. Wait a moment before trying again.';
  }
  return 'Could not verify the code. Try again.';
}
