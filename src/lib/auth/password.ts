export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;

export type PasswordValidation =
  | { ok: true }
  | { ok: false; message: string };

export function validateNewPassword(password: string, confirm: string): PasswordValidation {
  if (!password) return { ok: false, message: 'Enter a password.' };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters.` };
  }
  if (/\s/.test(password)) {
    return { ok: false, message: 'Password cannot contain spaces.' };
  }
  if (password !== confirm) {
    return { ok: false, message: 'Passwords do not match.' };
  }
  return { ok: true };
}
