import { NextResponse, type NextRequest } from 'next/server';
import { resolveProtectedRoute, isPublicPath } from '@/lib/auth/route-guard';
import { getAppMode, isSupabaseConfigured } from '@/lib/mode';

function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => {
    const name = cookie.name.toLowerCase();
    return name.includes('auth-token') || name.startsWith('sb-');
  });
}

/**
 * Gate protected routes using the Auth cookie only.
 * Do not call Auth getUser() here: a slow or failed probe bounces a successful
 * login back to `/` and leaves the UI stuck on "Opening dashboard".
 * Token validity is still enforced by Supabase RLS on data requests.
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured() || isPublicPath(request.nextUrl.pathname)) {
    return supabaseResponse;
  }

  const decision = resolveProtectedRoute({
    mode: getAppMode(),
    pathname: request.nextUrl.pathname,
    hasAuthenticatedUser: hasAuthCookie(request)
  });

  if (decision.action === 'redirect-login') {
    const url = request.nextUrl.clone();
    url.pathname = decision.redirectTo || '/';
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
