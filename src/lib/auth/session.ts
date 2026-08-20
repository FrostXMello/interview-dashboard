export function isAuthCookieName(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized.startsWith('sb-') || normalized.includes('auth-token');
}

/** Immediate logout: never wait on Auth network. `/logout` expires session cookies. */
export function leaveSession() {
  if (typeof document !== 'undefined') {
    document.cookie.split(';').forEach((part) => {
      const name = part.split('=')[0]?.trim();
      if (!name || !isAuthCookieName(name)) return;
      document.cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  }
  window.location.replace('/logout');
}
