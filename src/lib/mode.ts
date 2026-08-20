/**
 * Explicit Supabase / app-mode configuration diagnostics.
 * Connected mode requires a parseable URL and a valid client key:
 * either a legacy JWT anon key, or a publishable key (sb_publishable_...).
 * Never treats service-role / secret keys as client configuration.
 */

export type AppMode = 'offline-demo' | 'connected';

export type ConfigIssueCode =
  | 'MISSING_URL'
  | 'MISSING_ANON_KEY'
  | 'INVALID_URL'
  | 'ANON_KEY_NOT_JWT'
  | 'FORCED_CONNECTED_BUT_INVALID'
  | 'SERVICE_ROLE_KEY_DETECTED';

export interface SupabaseConfigDiagnostics {
  mode: AppMode;
  supabaseConfigured: boolean;
  forcedMode: string | null;
  issues: Array<{ code: ConfigIssueCode; message: string }>;
  /** Developer-facing summary; safe to show in UI banners. */
  summary: string;
}

function looksLikeJwt(value: string): boolean {
  const parts = value.split('.');
  return parts.length === 3 && value.startsWith('eyJ');
}

function looksLikePublishableKey(value: string): boolean {
  return value.startsWith('sb_publishable_') && value.length > 20;
}

function looksLikeSecretKey(value: string): boolean {
  return value.startsWith('sb_secret_') && value.length > 16;
}

function decodeJwtPayloadJson(value: string): string | null {
  try {
    const payload = value.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    const b64 = normalized + pad;
    if (typeof globalThis.atob !== 'function') return null;
    return globalThis.atob(b64);
  } catch {
    return null;
  }
}

function looksLikeServiceRoleKey(value: string): boolean {
  if (looksLikeSecretKey(value)) return true;
  if (!looksLikeJwt(value)) return false;
  const json = decodeJwtPayloadJson(value);
  return Boolean(json && /"role"\s*:\s*"service_role"/.test(json));
}

function looksLikeValidAnonKey(value: string): boolean {
  if (looksLikeServiceRoleKey(value)) return false;
  return looksLikePublishableKey(value) || looksLikeJwt(value);
}

export function getSupabaseConfigDiagnostics(
  env?: NodeJS.ProcessEnv
): SupabaseConfigDiagnostics {
  // Next.js inlines NEXT_PUBLIC_* only on direct `process.env.NEXT_PUBLIC_*` access.
  // Tests pass an explicit `env` object and must not leak the process environment.
  const url = (env ? env.NEXT_PUBLIC_SUPABASE_URL : process.env.NEXT_PUBLIC_SUPABASE_URL) || '';
  const key = (env ? env.NEXT_PUBLIC_SUPABASE_ANON_KEY : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || '';
  const forcedRaw = (
    (env ? env.NEXT_PUBLIC_APP_MODE : process.env.NEXT_PUBLIC_APP_MODE) || ''
  )
    .trim()
    .toLowerCase();
  const publicUrl = url.trim();
  const publicKey = key.trim();
  const forcedMode = forcedRaw || null;
  const issues: SupabaseConfigDiagnostics['issues'] = [];

  if (!publicUrl) {
    issues.push({ code: 'MISSING_URL', message: 'NEXT_PUBLIC_SUPABASE_URL is not set.' });
  } else {
    try {
      void new URL(publicUrl);
    } catch {
      issues.push({ code: 'INVALID_URL', message: 'NEXT_PUBLIC_SUPABASE_URL is not a valid URL.' });
    }
  }

  if (!publicKey) {
    issues.push({ code: 'MISSING_ANON_KEY', message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.' });
  } else if (looksLikeServiceRoleKey(publicKey)) {
    issues.push({
      code: 'SERVICE_ROLE_KEY_DETECTED',
      message:
        'NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be a service_role key. Refusing connected mode.'
    });
  } else if (!looksLikeValidAnonKey(publicKey)) {
    issues.push({
      code: 'ANON_KEY_NOT_JWT',
      message:
        'NEXT_PUBLIC_SUPABASE_ANON_KEY must be a JWT anon key (eyJ...) or a publishable key (sb_publishable_...).'
    });
  }

  const supabaseConfigured = issues.length === 0;

  if (
    (forcedRaw === 'connected' || forcedRaw === 'production') &&
    !supabaseConfigured
  ) {
    issues.push({
      code: 'FORCED_CONNECTED_BUT_INVALID',
      message:
        'NEXT_PUBLIC_APP_MODE requests connected mode, but Supabase configuration is invalid. Staying in offline-demo.'
    });
  }

  let mode: AppMode = 'offline-demo';
  if (forcedRaw === 'demo' || forcedRaw === 'offline-demo') {
    mode = 'offline-demo';
  } else if (supabaseConfigured) {
    mode = 'connected';
  } else {
    mode = 'offline-demo';
  }

  const summary = supabaseConfigured
    ? mode === 'connected'
      ? 'Connected mode: Supabase Auth + RLS expected.'
      : 'Offline demo forced by NEXT_PUBLIC_APP_MODE.'
    : `Offline demo: ${issues.map((i) => i.message).join(' ')}`;

  return { mode, supabaseConfigured, forcedMode, issues, summary };
}

export function isSupabaseConfigured(env?: NodeJS.ProcessEnv): boolean {
  return getSupabaseConfigDiagnostics(env).supabaseConfigured;
}

export function getAppMode(env?: NodeJS.ProcessEnv): AppMode {
  return getSupabaseConfigDiagnostics(env).mode;
}
