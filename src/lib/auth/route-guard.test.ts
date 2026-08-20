import { describe, expect, it } from 'vitest';
import { resolveProtectedRoute, isPublicPath } from '@/lib/auth/route-guard';

describe('connected-mode middleware decisions', () => {
  it('redirects unauthenticated /dashboard to login', () => {
    expect(
      resolveProtectedRoute({
        mode: 'connected',
        pathname: '/dashboard',
        hasAuthenticatedUser: false
      })
    ).toEqual({ action: 'redirect-login', redirectTo: '/' });
  });

  it('allows authenticated /dashboard', () => {
    expect(
      resolveProtectedRoute({
        mode: 'connected',
        pathname: '/dashboard',
        hasAuthenticatedUser: true
      })
    ).toEqual({ action: 'next' });
  });

  it('does not treat login as a protected route', () => {
    expect(
      resolveProtectedRoute({
        mode: 'connected',
        pathname: '/',
        hasAuthenticatedUser: false
      })
    ).toEqual({ action: 'next' });
  });

  it('marks login as a public path', () => {
    expect(isPublicPath('/')).toBe(true);
    expect(isPublicPath('/dashboard')).toBe(false);
  });
});

describe('offline-demo middleware decisions', () => {
  it('does not claim production auth — /dashboard is not session-gated', () => {
    expect(
      resolveProtectedRoute({
        mode: 'offline-demo',
        pathname: '/dashboard',
        hasAuthenticatedUser: false
      })
    ).toEqual({ action: 'next' });
  });
});
