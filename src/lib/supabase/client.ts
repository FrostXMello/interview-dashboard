import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured } from '@/lib/mode';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser Supabase client (anon key). Session cookies are managed by @supabase/ssr.
 * Returns null when the project is not configured for connected mode.
 */
export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) return null;

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        }
      }
    );
  }

  return browserClient;
}

/** @deprecated Prefer createBrowserSupabaseClient(); kept for gradual migration. */
export const supabase = typeof window !== 'undefined' ? createBrowserSupabaseClient() : null;

export default supabase;
