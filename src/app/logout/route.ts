import { NextRequest, NextResponse } from 'next/server';
import { isAuthCookieName } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * Clears Auth cookies and returns to login.
 * WHY a route: client signOut() can hang on the network, which blocked every logout.
 */
export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.search = 'loggedOut=1';
  const response = NextResponse.redirect(url);

  for (const cookie of request.cookies.getAll()) {
    if (!isAuthCookieName(cookie.name)) continue;
    response.cookies.set({
      name: cookie.name,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    });
  }

  return response;
}
