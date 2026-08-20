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

  const isDashboard = args.pathname === '/dashboard' || args.pathname.startsWith('/dashboard/');
  if (isDashboard && !args.hasAuthenticatedUser) {
    return { action: 'redirect-login', redirectTo: '/' };
  }

  return { action: 'next' };
}
