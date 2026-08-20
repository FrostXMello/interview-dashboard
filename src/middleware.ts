import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { resolveProtectedRoute } from '@/lib/auth/route-guard';
import { getAppMode } from '@/lib/mode';

/**
 * Session-aware gate for connected mode.
 * Offline-demo mode does not use Supabase Auth cookies; dashboard UX guard remains client-side.
 *
 * Next.js 16 deprecates the `middleware` file name in favor of `proxy`.
 * This file is kept for now: @supabase/ssr session refresh still works, and renaming
 * is a convention change rather than a security fix. Migrate when upgrading the Auth
 * integration docs, not as part of live RLS verification.
 */
export async function middleware(request: NextRequest) {
  const mode = getAppMode();
  if (mode === 'offline-demo') {
    const decision = resolveProtectedRoute({
      mode,
      pathname: request.nextUrl.pathname,
      hasAuthenticatedUser: false
    });
    void decision;
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
