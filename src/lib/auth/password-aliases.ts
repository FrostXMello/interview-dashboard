/**
 * Alternate login strings that map to one Auth password.
 * Supabase stores a single password per user, so short aliases are expanded here.
 */
const LOGIN_PASSWORD_ALIASES: Record<string, string> = {
  '@cd': '@CreativeDirector'
};

export function expandLoginPasswords(password: string): string[] {
  const trimmed = password.trim();
  if (!trimmed) return [];
  const alias = LOGIN_PASSWORD_ALIASES[trimmed.toLowerCase()];
  if (alias && alias !== trimmed) return [trimmed, alias];
  return [trimmed];
}
