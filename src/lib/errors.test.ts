import { describe, expect, it } from 'vitest';
import { isMissingAuthSession, toAppError } from '@/lib/errors';

describe('isMissingAuthSession', () => {
  it('treats AuthSessionMissingError as logged out, not a failed login', () => {
    expect(isMissingAuthSession({ name: 'AuthSessionMissingError', message: 'Auth session missing!' })).toBe(true);
  });

  it('does not treat invalid credentials as a missing session', () => {
    expect(isMissingAuthSession({ message: 'Invalid login credentials' })).toBe(false);
  });
});

describe('toAppError', () => {
  it('does not map a missing session to the generic sign-in-failed copy', () => {
    const error = toAppError({ name: 'AuthSessionMissingError', message: 'Auth session missing!' });
    expect(error.userMessage).toBe('Sign in to continue.');
  });
});
