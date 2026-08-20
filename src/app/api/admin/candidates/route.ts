import { NextResponse } from 'next/server';
import { normalizePhoneE164 } from '@/lib/auth/phone';
import { requireServiceRoleClient, requireSuperAdmin } from '@/lib/auth/super-admin-server';

type CandidateBody = {
  regNo: string;
  name: string;
  day: 'day-1' | 'day-2' | 'unscheduled';
  panelId: number;
  timing: string;
  status: 'pending' | 'interviewing' | 'completed';
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

function buildCandidateId(regNo: string) {
  return `cand-${regNo.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const service = requireServiceRoleClient();
  if (!service.ok) return NextResponse.json({ error: service.message }, { status: service.status });

  const body = (await request.json()) as CandidateBody;
  const regNo = (body.regNo || '').trim();
  const name = (body.name || '').trim();
  const timing = (body.timing || '').trim() || 'TBD';
  const day = body.day === 'day-2' || body.day === 'unscheduled' ? body.day : 'day-1';
  const panelId = body.panelId === 2 ? 2 : 1;
  const status = body.status === 'interviewing' || body.status === 'completed' ? body.status : 'pending';
  const candidateId = buildCandidateId(regNo);

  if (!regNo || !name) {
    return NextResponse.json({ error: 'Registration number and name are required.' }, { status: 400 });
  }

  try {
    const { error: candidateError } = await service.admin.from('candidates').upsert(
      {
        id: candidateId,
        reg_no: regNo,
        display_name: name,
        timing,
        panel_id: panelId,
        interview_day: day,
        status,
        is_active: true
      },
      { onConflict: 'id' }
    );
    if (candidateError) return NextResponse.json({ error: 'Could not upsert candidate.' }, { status: 400 });

    if (body.form) {
      const normalizedPhone = body.form.phone ? normalizePhoneE164(body.form.phone) : null;
      const { error: appError } = await service.admin.from('applications').upsert(
        {
          candidate_id: candidateId,
          email: body.form.email?.trim() || null,
          phone: normalizedPhone || body.form.phone || null,
          program: body.form.program?.trim() || null,
          why_interested: body.form.whyInterested?.trim() || null,
          domains: body.form.domains?.trim() || null,
          proficiencies: body.form.proficiencies || {},
          commitment: typeof body.form.commitment === 'number' ? body.form.commitment : null,
          experience: body.form.experience?.trim() || null,
          cv_link: body.form.cvLink?.trim() || null
        },
        { onConflict: 'candidate_id' }
      );
      if (appError) return NextResponse.json({ error: 'Could not upsert candidate application data.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, candidateId });
  } catch {
    return NextResponse.json({ error: 'Failed to create candidate.' }, { status: 500 });
  }
}
