import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/service';

export async function requireSuperAdmin() {
  const sb = await createServerSupabaseClient();
  if (!sb) {
    return { ok: false as const, status: 503, message: 'Supabase is not configured.' };
  }

  const {
    data: { user },
    error: userError
  } = await sb.auth.getUser();
  if (userError || !user) {
    return { ok: false as const, status: 401, message: 'Authentication required.' };
  }

  const { data: profile, error: profileError } = await sb
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false as const, status: 403, message: 'Profile not found.' };
  }
  if (profile.is_active === false) {
    return { ok: false as const, status: 403, message: 'User is deactivated.' };
  }
  if (profile.role !== 'super_admin') {
    return { ok: false as const, status: 403, message: 'Super admin role required.' };
  }

  return { ok: true as const, user, profile, sb };
}

export function requireServiceRoleClient() {
  const admin = createServiceRoleSupabaseClient();
  if (!admin) return { ok: false as const, status: 503, message: 'Service role client is not configured.' };
  return { ok: true as const, admin };
}
