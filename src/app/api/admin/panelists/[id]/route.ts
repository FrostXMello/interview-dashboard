import { NextResponse } from 'next/server';
import { normalizePhoneE164 } from '@/lib/auth/phone';
import { isAppRole } from '@/lib/auth/roles';
import { requireServiceRoleClient, requireSuperAdmin } from '@/lib/auth/super-admin-server';

type UpdateBody = {
  displayName?: string;
  displayTitle?: string;
  role?: string;
  isActive?: boolean;
  phone?: string;
  panelIds?: number[];
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const service = requireServiceRoleClient();
  if (!service.ok) return NextResponse.json({ error: service.message }, { status: service.status });

  const { id } = await params;
  const body = (await request.json()) as UpdateBody;

  const profilePatch: Record<string, unknown> = {};
  if (typeof body.displayName === 'string') {
    const trimmed = body.displayName.trim();
    if (trimmed.length < 2) return NextResponse.json({ error: 'Display name is required.' }, { status: 400 });
    profilePatch.display_name = trimmed;
  }
  if (typeof body.displayTitle === 'string') profilePatch.display_title = body.displayTitle.trim();
  if (typeof body.isActive === 'boolean') profilePatch.is_active = body.isActive;
  if (typeof body.role === 'string') {
    if (!isAppRole(body.role)) return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    profilePatch.role = body.role;
  }

  try {
    if (Object.keys(profilePatch).length > 0) {
      const { error } = await service.admin.from('profiles').update(profilePatch).eq('id', id);
      if (error) return NextResponse.json({ error: 'Could not update profile.' }, { status: 400 });
    }

    if (typeof body.phone === 'string' && body.phone.trim()) {
      const normalizedPhone = normalizePhoneE164(body.phone);
      if (!normalizedPhone) return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });
      const { error } = await service.admin.auth.admin.updateUserById(id, {
        phone: normalizedPhone,
        phone_confirm: true
      });
      if (error) return NextResponse.json({ error: 'Could not update auth phone.' }, { status: 400 });
    }

    if (Array.isArray(body.panelIds)) {
      const panelIds = body.panelIds.filter((panelId) => panelId === 1 || panelId === 2);
      const { error: deleteError } = await service.admin.from('panel_memberships').delete().eq('profile_id', id);
      if (deleteError) return NextResponse.json({ error: 'Could not reset panel memberships.' }, { status: 400 });
      if (panelIds.length > 0) {
        const { error: insertError } = await service.admin
          .from('panel_memberships')
          .insert(panelIds.map((panelId) => ({ profile_id: id, panel_id: panelId })));
        if (insertError) return NextResponse.json({ error: 'Could not update panel memberships.' }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update panelist.' }, { status: 500 });
  }
}
