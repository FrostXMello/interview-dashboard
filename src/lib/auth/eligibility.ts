import { isAppRole, hasAdminPrivileges } from '@/lib/auth/roles';

export type PhoneEligibility = 'invalid' | 'not_authorized' | 'already_registered' | 'can_register';
export type PhoneResetEligibility = 'invalid' | 'not_eligible' | 'can_reset';

export const UNAUTHORIZED_PHONE_MESSAGE =
  'This phone number is not authorized to create an account. Please contact your administrator.';

export const RESET_NOT_ELIGIBLE_MESSAGE =
  'If this number is registered, you can continue. Otherwise contact your administrator.';

export function mapRegisterEligibilityMessage(status: PhoneEligibility): string | null {
  switch (status) {
    case 'can_register':
      return null;
    case 'already_registered':
      return 'An account already exists for this number. Please log in or reset your password.';
    case 'invalid':
      return 'Enter a valid phone number.';
    default:
      return UNAUTHORIZED_PHONE_MESSAGE;
  }
}

export function mapResetEligibilityMessage(status: PhoneResetEligibility): string | null {
  switch (status) {
    case 'can_reset':
      return null;
    case 'invalid':
      return 'Enter a valid phone number.';
    default:
      return RESET_NOT_ELIGIBLE_MESSAGE;
  }
}

export function canManageAllowlist(role: string): boolean {
  return isAppRole(role) ? hasAdminPrivileges(role) : false;
}
