import { describe, expect, it } from 'vitest';
import { getAppMode, getSupabaseConfigDiagnostics, isSupabaseConfigured } from '@/lib/mode';

function env(vars: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return { ...vars } as NodeJS.ProcessEnv;
}

describe('mode / configuration', () => {
  it('stays offline-demo when anon key is not a JWT or publishable key', () => {
    const diagnostics = getSupabaseConfigDiagnostics(
      env({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'not-a-jwt'
      })
    );
    expect(diagnostics.supabaseConfigured).toBe(false);
    expect(diagnostics.mode).toBe('offline-demo');
    expect(diagnostics.issues.some((i) => i.code === 'ANON_KEY_NOT_JWT')).toBe(true);
  });

  it('accepts sb_publishable_ keys as configured', () => {
    expect(
      isSupabaseConfigured(
        env({
          NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_examplekeyvalue_abcdefghijklmnop'
        })
      )
    ).toBe(true);
  });

  it('rejects sb_secret_ keys as anon keys', () => {
    const diagnostics = getSupabaseConfigDiagnostics(
      env({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_secret_examplekeyvalue_abcdefghijklmnop'
      })
    );
    expect(diagnostics.supabaseConfigured).toBe(false);
    expect(diagnostics.issues.some((i) => i.code === 'SERVICE_ROLE_KEY_DETECTED')).toBe(true);
  });

  it('does not treat forced connected + invalid env as connected', () => {
    const mode = getAppMode(
      env({
        NEXT_PUBLIC_APP_MODE: 'connected',
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'short-key'
      })
    );
    expect(mode).toBe('offline-demo');
    const diagnostics = getSupabaseConfigDiagnostics(
      env({
        NEXT_PUBLIC_APP_MODE: 'connected',
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'short-key'
      })
    );
    expect(diagnostics.issues.some((i) => i.code === 'FORCED_CONNECTED_BUT_INVALID')).toBe(true);
  });

  it('accepts JWT-shaped anon key + URL as configured', () => {
    const key = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
      JSON.stringify({ role: 'anon', ref: 'demo' })
    )}.sig`;
    expect(
      isSupabaseConfigured(
        env({
          NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: key
        })
      )
    ).toBe(true);
  });

  it('rejects service_role JWT as anon key', () => {
    const key = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
      JSON.stringify({ role: 'service_role' })
    )}.sig`;
    const diagnostics = getSupabaseConfigDiagnostics(
      env({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: key
      })
    );
    expect(diagnostics.supabaseConfigured).toBe(false);
    expect(diagnostics.issues.some((i) => i.code === 'SERVICE_ROLE_KEY_DETECTED')).toBe(true);
  });

  it('allows forcing offline-demo even when configured', () => {
    const key = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
      JSON.stringify({ role: 'anon' })
    )}.sig`;
    expect(
      getAppMode(
        env({
          NEXT_PUBLIC_APP_MODE: 'demo',
          NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: key
        })
      )
    ).toBe('offline-demo');
  });
});
