import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizePhoneE164 } from '@/lib/auth/phone';
import { isAppRole } from '@/lib/auth/roles';
import { requireServiceRoleClient, requireSuperAdmin } from '@/lib/auth/super-admin-server';

type PanelistCreateBody = {
  phone: string;
  password?: string;
  displayName: string;
  displayTitle?: string;
  role?: string;
  panelIds?: number[];
};

async function findUserByPhone(admin: SupabaseClient, phone: string) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find((user) => user.phone === phone);
    if (match) return match;
    if (users.length < 200) return null;
    page += 1;
  }
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const service = requireServiceRoleClient();
  if (!service.ok) return NextResponse.json({ error: service.message }, { status: service.status });

  const body = (await request.json()) as PanelistCreateBody;
  const displayName = (body.displayName || '').trim();
  const displayTitle = (body.displayTitle || '').trim();
  const normalizedPhone = normalizePhoneE164(body.phone || '');
  const panelIds = Array.isArray(body.panelIds) ? body.panelIds.filter((id) => id === 1 || id === 2) : [];
  const role = isAppRole(body.role) ? body.role : 'panelist';
  const password = (body.password || '').trim();

  if (!displayName || displayName.length < 2) {
    return NextResponse.json({ error: 'Display name is required.' }, { status: 400 });
  }
  if (!normalizedPhone) {
    return NextResponse.json({ error: 'Valid phone number is required.' }, { status: 400 });
  }
  if (role === 'super_admin') {
    return NextResponse.json({ error: 'Use provisioning script for super admin accounts.' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Password is required for new panelist accounts.' }, { status: 400 });
  }

  try {
    const existing = await findUserByPhone(service.admin, normalizedPhone);
    let userId = existing?.id;
    if (!userId) {
      const { data, error } = await service.admin.auth.admin.createUser({
        phone: normalizedPhone,
        password,
        phone_confirm: true,
        user_metadata: { display_name: displayName, display_title: displayTitle }
      });
      if (error || !data.user) {
        return NextResponse.json({ error: 'Could not create auth user.' }, { status: 400 });
      }
      userId = data.user.id;
    } else {
      const { error } = await service.admin.auth.admin.updateUserById(userId, {
        phone: normalizedPhone,
        password,
        phone_confirm: true,
        user_metadata: { ...(existing?.user_metadata || {}), display_name: displayName, display_title: displayTitle }
      });
      if (error) return NextResponse.json({ error: 'Could not update auth user.' }, { status: 400 });
    }

    const { error: profileError } = await service.admin.from('profiles').upsert(
      {
        id: userId,
        display_name: displayName,
        display_title: displayTitle || null,
        role,
        is_active: true
      },
      { onConflict: 'id' }
    );
    if (profileError) return NextResponse.json({ error: 'Could not upsert profile.' }, { status: 400 });

    const { error: deleteMembershipError } = await service.admin
      .from('panel_memberships')
      .delete()
      .eq('profile_id', userId);
    if (deleteMembershipError) {
      return NextResponse.json({ error: 'Could not reset panel memberships.' }, { status: 400 });
    }
    if (panelIds.length > 0) {
      const { error: insertMembershipError } = await service.admin.from('panel_memberships').insert(
        panelIds.map((panelId) => ({ profile_id: userId, panel_id: panelId }))
      );
      if (insertMembershipError) {
        return NextResponse.json({ error: 'Could not assign panel memberships.' }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true, userId });
  } catch {
    return NextResponse.json({ error: 'Failed to create panelist.' }, { status: 500 });
  }
}
