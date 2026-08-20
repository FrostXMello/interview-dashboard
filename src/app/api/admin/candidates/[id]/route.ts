import { NextResponse } from 'next/server';
import { normalizePhoneE164 } from '@/lib/auth/phone';
import { requireServiceRoleClient, requireSuperAdmin } from '@/lib/auth/super-admin-server';

type CandidateUpdateBody = {
  regNo?: string;
  name?: string;
  day?: 'day-1' | 'day-2' | 'unscheduled';
  panelId?: number;
  timing?: string;
  status?: 'pending' | 'interviewing' | 'completed';
  isActive?: boolean;
  form?: {
    email?: string;
    phone?: string;
    program?: string;
    whyInterested?: string;
    domains?: string;
    proficiencies?: Record<string, string>;
    commitment?: number;
    experience?: string;
    cvLink?: string;
  };
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const service = requireServiceRoleClient();
  if (!service.ok) return NextResponse.json({ error: service.message }, { status: service.status });
  const { id } = await params;
  const body = (await request.json()) as CandidateUpdateBody;

  const candidatePatch: Record<string, unknown> = {};
  if (typeof body.regNo === 'string') candidatePatch.reg_no = body.regNo.trim();
  if (typeof body.name === 'string') candidatePatch.display_name = body.name.trim();
  if (typeof body.timing === 'string') candidatePatch.timing = body.timing.trim() || 'TBD';
  if (body.day === 'day-1' || body.day === 'day-2' || body.day === 'unscheduled') candidatePatch.interview_day = body.day;
  if (body.panelId === 1 || body.panelId === 2) candidatePatch.panel_id = body.panelId;
  if (body.status === 'pending' || body.status === 'interviewing' || body.status === 'completed') candidatePatch.status = body.status;
  if (typeof body.isActive === 'boolean') candidatePatch.is_active = body.isActive;

  try {
    if (Object.keys(candidatePatch).length > 0) {
      const { error } = await service.admin.from('candidates').update(candidatePatch).eq('id', id);
      if (error) return NextResponse.json({ error: 'Could not update candidate.' }, { status: 400 });
    }

    if (body.form) {
      const { data: existing } = await service.admin
        .from('applications')
        .select('*')
        .eq('candidate_id', id)
        .maybeSingle();

      const normalizedPhone =
        body.form.phone !== undefined
          ? body.form.phone
            ? normalizePhoneE164(body.form.phone) || body.form.phone
            : null
          : existing?.phone ?? null;

      const { error } = await service.admin.from('applications').upsert(
        {
          candidate_id: id,
          email: body.form.email !== undefined ? body.form.email?.trim() || null : existing?.email ?? null,
          phone: normalizedPhone,
          program: body.form.program !== undefined ? body.form.program?.trim() || null : existing?.program ?? null,
          why_interested:
            body.form.whyInterested !== undefined
              ? body.form.whyInterested?.trim() || null
              : existing?.why_interested ?? null,
          domains: body.form.domains !== undefined ? body.form.domains?.trim() || null : existing?.domains ?? null,
          proficiencies:
            body.form.proficiencies !== undefined ? body.form.proficiencies : existing?.proficiencies || {},
          commitment:
            body.form.commitment !== undefined ? body.form.commitment : existing?.commitment ?? null,
          experience:
            body.form.experience !== undefined ? body.form.experience?.trim() || null : existing?.experience ?? null,
          cv_link: body.form.cvLink !== undefined ? body.form.cvLink?.trim() || null : existing?.cv_link ?? null
        },
        { onConflict: 'candidate_id' }
      );
      if (error) return NextResponse.json({ error: 'Could not update candidate application data.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update candidate.' }, { status: 500 });
  }
}
