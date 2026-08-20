/**
 * E.164-compatible phone normalization.
 * Local 10-digit input defaults to India (+91) without making the stored format India-only.
 */

export const DEFAULT_COUNTRY_CALLING_CODE = '91';

export function normalizePhoneE164(
  input: string,
  defaultCountryCallingCode: string = DEFAULT_COUNTRY_CALLING_CODE
): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  const cc = defaultCountryCallingCode.replace(/\D/g, '') || '91';

  if (digits.length < 8) return null;

  if (hasPlus) {
    if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
    return null;
  }

  if (cc === '91' && digits.length === 10) return `+91${digits}`;
  if (cc === '91' && digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (cc === '91' && digits.length === 12 && digits.startsWith('91')) return `+${digits}`;

  if (digits.length >= 8 && digits.length + cc.length <= 15) {
    return `+${cc}${digits}`;
  }

  if (digits.length <= 15) return `+${digits}`;
  return null;
}

export function nationalDigits(e164: string, countryCallingCode = DEFAULT_COUNTRY_CALLING_CODE): string {
  const digits = e164.replace(/\D/g, '');
  const cc = countryCallingCode.replace(/\D/g, '');
  if (digits.startsWith(cc)) return digits.slice(cc.length);
  return digits;
}

export function maskPhoneE164(e164: string): string {
  const normalized = normalizePhoneE164(e164);
  if (!normalized) return 'your number';
  const digits = normalized.slice(1);
  if (digits.length < 6) return normalized;
  const visibleTail = digits.slice(-4);
  const ccLength = digits.length === 12 && digits.startsWith('91') ? 2 : Math.min(3, digits.length - 4);
  const cc = digits.slice(0, ccLength);
  return `+${cc} XXXXX ${visibleTail}`;
}

export function phonesMatch(a: string, b: string): boolean {
  const left = normalizePhoneE164(a);
  const right = normalizePhoneE164(b);
  return Boolean(left && right && left === right);
}
