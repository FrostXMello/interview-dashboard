import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { resolveProtectedRoute, isPublicPath } from '@/lib/auth/route-guard';
import { getAppMode, isSupabaseConfigured } from '@/lib/mode';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Auth session cookie on each request when Supabase is configured.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured() || isPublicPath(request.nextUrl.pathname)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const hasAuthCookie = request.cookies.getAll().some((cookie) => {
    const name = cookie.name.toLowerCase();
    return name.includes('auth-token') || name.startsWith('sb-');
  });

  let user = null;
  let authProbeFailed = false;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('auth-probe-timeout')), 1200);
      })
    ]);
    user = result.data.user;
    authProbeFailed = Boolean(result.error) && !user;
  } catch {
    authProbeFailed = true;
  }

  const decision = resolveProtectedRoute({
    mode: getAppMode(),
    pathname: request.nextUrl.pathname,
    hasAuthenticatedUser: Boolean(user) || (authProbeFailed && hasAuthCookie)
  });

  if (decision.action === 'redirect-login') {
    const url = request.nextUrl.clone();
    url.pathname = decision.redirectTo || '/';
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
