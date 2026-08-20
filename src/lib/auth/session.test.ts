import { describe, expect, it } from 'vitest';
import { isAuthCookieName } from '@/lib/auth/session';

describe('isAuthCookieName', () => {
  it('matches Supabase Auth cookies including chunks', () => {
    expect(isAuthCookieName('sb-example-auth-token')).toBe(true);
    expect(isAuthCookieName('sb-example-auth-token.0')).toBe(true);
    expect(isAuthCookieName('sb-example-auth-token.1')).toBe(true);
  });

  it('does not match unrelated cookies', () => {
    expect(isAuthCookieName('theme')).toBe(false);
  });
});
