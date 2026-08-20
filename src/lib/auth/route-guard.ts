import type { AppMode } from '@/lib/mode';

export type RouteGuardAction = 'next' | 'redirect-login';

/**
 * Pure routing decision used by middleware.
 * WHY extract this: middleware cannot be live-tested without a running Next + Auth stack;
 * the security-relevant decision (connected /dashboard requires a session) can still be unit-tested.
 */
export function resolveProtectedRoute(args: {
  mode: AppMode;
  pathname: string;
  hasAuthenticatedUser: boolean;
}): { action: RouteGuardAction; redirectTo?: string } {
  if (args.mode === 'offline-demo') {
    return { action: 'next' };
  }

  if (isDashboardPath(args.pathname) && !args.hasAuthenticatedUser) {
    return { action: 'redirect-login', redirectTo: '/' };
  }

  return { action: 'next' };
}

export function isDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
}

/** Login and other unauthenticated pages — skip Auth network probes here. */
export function isPublicPath(pathname: string): boolean {
  return pathname === '/' || pathname === '' || pathname === '/logout';
}
