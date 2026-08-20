import { canManageCandidateStatus, isAppRole, type AppRole } from '@/lib/auth/roles';
import { canWriteRatingAs, validateRatingPayload } from '@/lib/auth/authorization';
import { normalizePhoneE164 } from '@/lib/auth/phone';
import { mapInterviewDay, type InterviewDay, type Rating, type Student, type User } from '@/lib/data';
import { AppError, failure, isMissingAuthSession, success, toAppError, type OperationResult } from '@/lib/errors';
import type { InterviewRepository, SessionSnapshot } from '@/lib/data-access/types';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

type ProfileRow = {
  id: string;
  display_name: string;
  role: string;
  display_title?: string | null;
  is_active?: boolean | null;
};

type MembershipRow = {
  profile_id: string;
  panel_id: number;
};

type CandidateRow = {
  id: string;
  reg_no: string;
  display_name: string;
  timing: string;
  panel_id: number;
  interview_day: string;
  status: string;
  is_active?: boolean | null;
};

type ApplicationRow = {
  candidate_id: string;
  email?: string | null;
  phone?: string | null;
  program?: string | null;
  why_interested?: string | null;
  domains?: string | null;
  proficiencies?: Record<string, string> | null;
  commitment?: number | null;
  experience?: string | null;
  cv_link?: string | null;
  submitted_at?: string | null;
};

type RatingRow = {
  candidate_id?: string;
  panelist_id?: string;
  studentid?: string;
  panelistid?: string;
  interview_score?: number | null;
  scores?: Record<string, number> | null;
  comment?: string | null;
  best_domain?: string | null;
  domain_priorities?: string[] | null;
  submitted?: boolean | null;
  active?: boolean | null;
};

function mapRole(value: string): AppRole {
  return isAppRole(value) ? value : 'panelist';
}

function mapUser(profile: ProfileRow, panelIds: number[]): User {
  return {
    id: profile.id,
    name: profile.display_name,
    role: mapRole(profile.role),
    displayTitle: profile.display_title || undefined,
    panelId: panelIds[0],
    panelIds,
    isActive: profile.is_active !== false
  };
}

function mapStudent(row: CandidateRow, application?: ApplicationRow | null): Student {
  const status =
    row.status === 'pending' || row.status === 'interviewing' || row.status === 'completed'
      ? row.status
      : 'pending';

  return {
    id: row.id,
    regNo: row.reg_no,
    name: row.display_name,
    timing: row.timing,
    panelId: row.panel_id,
    day: mapInterviewDay(row.interview_day),
    status,
    isActive: row.is_active !== false,
    form: application
      ? {
          fullName: row.display_name,
          regNo: row.reg_no,
          email: application.email || undefined,
          phone: application.phone || undefined,
          program: application.program || undefined,
          whyInterested: application.why_interested || undefined,
          domains: application.domains || undefined,
          proficiencies: application.proficiencies || undefined,
          commitment: application.commitment ?? undefined,
          experience: application.experience || undefined,
          cvLink: application.cv_link || undefined,
          timestamp: application.submitted_at || undefined
        }
      : undefined
  };
}

function mapRating(row: RatingRow): Rating {
  const scores: Record<string, number> = { ...(row.scores || {}) };
  if (typeof row.interview_score === 'number') {
    scores['Interview Score'] = row.interview_score;
  }
  const domainPriorities = Array.isArray(row.domain_priorities) ? row.domain_priorities.filter(Boolean) : [];
  const candidateId = row.candidate_id || row.studentid || '';
  const panelistId = row.panelist_id || row.panelistid || '';

  return {
    studentId: candidateId,
    panelistId,
    scores,
    comment: row.comment || '',
    bestDomain: row.best_domain || domainPriorities[0] || '',
    domainPriorities,
    submitted: Boolean(row.submitted),
    active: Boolean(row.active)
  };
}

function toRatingRow(rating: Rating): RatingRow {
  const interviewScore =
    typeof rating.scores['Interview Score'] === 'number' ? rating.scores['Interview Score'] : null;

  return {
    candidate_id: rating.studentId,
    panelist_id: rating.panelistId,
    interview_score: interviewScore,
    scores: rating.scores,
    comment: rating.comment,
    best_domain: rating.bestDomain || rating.domainPriorities[0] || '',
    domain_priorities: rating.domainPriorities.slice(0, 3),
    submitted: rating.submitted,
    active: rating.active
  };
}

/**
 * Connected-mode repository using Supabase Auth + PostgREST.
 * Relies on RLS for authorization; does not seed passwords or trust client role claims.
 */
export class RemoteSupabaseRepository implements InterviewRepository {
  private async adminFetch<T>(path: string, init: RequestInit): Promise<OperationResult<T>> {
    try {
      const response = await fetch(path, {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init.headers || {})
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        return failure(
          new AppError('AUTHORIZATION_FAILURE', body?.error || 'Admin operation failed', {
            userMessage: body?.error || 'Admin operation failed.'
          })
        );
      }
      return success(body as T);
    } catch (err) {
      return failure(toAppError(err, 'NETWORK_FAILURE'));
    }
  }

  readonly mode = 'connected' as const;

  private client(): SupabaseClient {
    const sb = createBrowserSupabaseClient();
    if (!sb) {
      throw new AppError('OFFLINE', 'Supabase is not configured');
    }
    return sb;
  }

  async getSession(): Promise<OperationResult<SessionSnapshot>> {
    try {
      const sb = this.client();
      const loggedOut = success<SessionSnapshot>({ mode: this.mode, user: null, isDemoSession: false });
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();
      if (sessionError && isMissingAuthSession(sessionError)) return loggedOut;
      const userId = sessionData.session?.user?.id;
      if (!userId) return loggedOut;

      const profileResult = await this.loadUser(userId);
      if (!profileResult.ok) return failure(profileResult.error);

      return success({ mode: this.mode, user: profileResult.data, isDemoSession: false });
    } catch (err) {
      if (isMissingAuthSession(err)) {
        return success({ mode: this.mode, user: null, isDemoSession: false });
      }
      return failure(toAppError(err));
    }
  }

  async signInWithPassword(identifier: string, password: string): Promise<OperationResult<User>> {
    try {
      const sb = this.client();
      const trimmed = identifier.trim();
      const phone = normalizePhoneE164(trimmed);
      const digits = phone ? phone.replace(/\D/g, '').slice(-10) : '';
      const attempts: Array<{ phone: string; password: string } | { email: string; password: string }> = [];

      if (phone && !trimmed.includes('@') && digits.length === 10) {
        attempts.push({ email: `${digits}@interviews.local`, password });
        attempts.push({ phone, password });
      } else {
        attempts.push(phone && !trimmed.includes('@') ? { phone, password } : { email: trimmed, password });
      }

      let lastError: { message?: string } | null = null;
      for (const credentials of attempts) {
        const { data, error } = await sb.auth.signInWithPassword(credentials);
        if (!error && data.user) {
          return this.loadUser(data.user.id);
        }
        lastError = error;
      }

      return failure(
        new AppError('AUTHENTICATION_FAILURE', lastError?.message || 'Sign-in failed', {
          cause: lastError,
          userMessage: 'Sign-in failed. Check your phone number and password.'
        })
      );
    } catch (err) {
      return failure(toAppError(err, 'AUTHENTICATION_FAILURE'));
    }
  }

  async enterDemoPersona(): Promise<OperationResult<User>> {
    return failure(
      new AppError('AUTHENTICATION_FAILURE', 'Demo personas are disabled in connected mode', {
        userMessage: 'Demo mode is disabled while Supabase is configured. Sign in with your account.'
      })
    );
  }

  async signOut(): Promise<OperationResult<null>> {
    try {
      const { error } = await this.client().auth.signOut();
      if (error) return failure(toAppError(error, 'AUTHENTICATION_FAILURE'));
      return success(null);
    } catch (err) {
      return failure(toAppError(err));
    }
  }

  private async loadUser(userId: string): Promise<OperationResult<User>> {
    const sb = this.client();
    const [profileResult, membershipResult] = await Promise.all([
      sb.from('profiles').select('id, display_name, role, display_title, is_active').eq('id', userId).maybeSingle(),
      sb.from('panel_memberships').select('profile_id, panel_id').eq('profile_id', userId)
    ]);

    if (profileResult.error) return failure(toAppError(profileResult.error, 'DATABASE_FAILURE'));
    const profile = profileResult.data;
    if (!profile) {
      return failure(
        new AppError('AUTHORIZATION_FAILURE', 'No application profile for authenticated user', {
          userMessage: 'Your account is signed in but has no profile. Contact an administrator.'
        })
      );
    }
    if (profile.is_active === false) {
      return failure(
        new AppError('AUTHORIZATION_FAILURE', 'Profile is inactive', {
          userMessage: 'Your account is deactivated. Contact a super admin.'
        })
      );
    }

    const mappedProfile = profile as ProfileRow;
    if (mappedProfile.role === 'admin' || mappedProfile.role === 'super_admin') {
      return success(mapUser(mappedProfile, []));
    }

    if (membershipResult.error) return failure(toAppError(membershipResult.error, 'DATABASE_FAILURE'));
    const panelIds = ((membershipResult.data || []) as MembershipRow[]).map((m) => m.panel_id);
    return success(mapUser(mappedProfile, panelIds));
  }

  async listVisibleProfiles(_viewer: User): Promise<OperationResult<User[]>> {
    void _viewer;
    try {
      const sb = this.client();
      const { data: profiles, error } = await sb
        .from('profiles')
        .select('id, display_name, role, display_title, is_active');
      if (error) return failure(toAppError(error, 'DATABASE_FAILURE'));

      const { data: memberships, error: membershipError } = await sb
        .from('panel_memberships')
        .select('profile_id, panel_id');
      if (membershipError) return failure(toAppError(membershipError, 'DATABASE_FAILURE'));

      const byProfile = new Map<string, number[]>();
      ((memberships || []) as MembershipRow[]).forEach((m) => {
        const list = byProfile.get(m.profile_id) || [];
        list.push(m.panel_id);
        byProfile.set(m.profile_id, list);
      });

      const users = ((profiles || []) as ProfileRow[]).map((p) =>
        mapUser(p, byProfile.get(p.id) || [])
      );
      return success(users);
    } catch (err) {
      return failure(toAppError(err));
    }
  }

  async listCandidates(_viewer: User): Promise<OperationResult<Student[]>> {
    void _viewer;
    try {
      const sb = this.client();
      const { data: candidates, error } = await sb.from('candidates').select('*');
      if (error) return failure(toAppError(error, 'DATABASE_FAILURE'));

      const { data: applications, error: appError } = await sb.from('applications').select('*');
      if (appError) return failure(toAppError(appError, 'DATABASE_FAILURE'));

      const appById = new Map(
        ((applications || []) as ApplicationRow[]).map((a) => [a.candidate_id, a] as const)
      );

      const students = ((candidates || []) as CandidateRow[]).map((c) =>
        mapStudent(c, appById.get(c.id))
      );
      return success(students);
    } catch (err) {
      return failure(toAppError(err));
    }
  }

  async listRatings(_viewer: User): Promise<OperationResult<Rating[]>> {
    void _viewer;
    try {
      const sb = this.client();
      const { data, error } = await sb.from('ratings').select('*');
      if (error) return failure(toAppError(error, 'DATABASE_FAILURE'));
      return success(((data || []) as RatingRow[]).map(mapRating));
    } catch (err) {
      return failure(toAppError(err));
    }
  }

  async upsertRating(viewer: User, rating: Rating): Promise<OperationResult<Rating>> {
    try {
      // Always author as the authenticated viewer — never trust client-supplied panelistId.
      const authored: Rating = { ...rating, panelistId: viewer.id };
      const validationError = validateRatingPayload(authored);
      if (validationError) return failure(validationError);

      if (!canWriteRatingAs(viewer, authored.panelistId)) {
        return failure(new AppError('AUTHORIZATION_FAILURE', 'Cannot write another panelist rating'));
      }

      const sb = this.client();
      const payload = toRatingRow(authored);
      const { data, error } = await sb
        .from('ratings')
        .upsert(payload, { onConflict: 'candidate_id,panelist_id' })
        .select('*')
        .maybeSingle();

      if (error) return failure(toAppError(error, 'DATABASE_FAILURE'));
      return success(data ? mapRating(data as RatingRow) : authored);
    } catch (err) {
      return failure(toAppError(err));
    }
  }

  async setCandidateStatus(
    viewer: User,
    studentId: string,
    status: Student['status']
  ): Promise<OperationResult<Student>> {
    if (!canManageCandidateStatus(viewer.role)) {
      return failure(new AppError('AUTHORIZATION_FAILURE', 'Only admin-level users can change status'));
    }
    try {
      const sb = this.client();
      const { data, error } = await sb
        .from('candidates')
        .update({ status })
        .eq('id', studentId)
        .select('*')
        .maybeSingle();
      if (error) return failure(toAppError(error, 'DATABASE_FAILURE'));
      if (!data) return failure(new AppError('VALIDATION_FAILURE', 'Candidate not found'));
      return success(mapStudent(data as CandidateRow));
    } catch (err) {
      return failure(toAppError(err));
    }
  }

  async listPanels(_viewer: User): Promise<OperationResult<Array<{ id: number; name: string }>>> {
    void _viewer;
    try {
      const { data, error } = await this.client().from('panels').select('id, name').order('id');
      if (error) return failure(toAppError(error, 'DATABASE_FAILURE'));
      return success((data || []) as Array<{ id: number; name: string }>);
    } catch (err) {
      return failure(toAppError(err));
    }
  }

  async createPanelist(
    viewer: User,
    input: {
      phone: string;
      password?: string;
      displayName: string;
      displayTitle?: string;
      role?: AppRole;
      panelIds: number[];
    }
  ): Promise<OperationResult<User>> {
    if (viewer.role !== 'super_admin') {
      return failure(new AppError('AUTHORIZATION_FAILURE', 'Super admin role required'));
    }
    const result = await this.adminFetch<{ ok: boolean; userId: string }>('/api/admin/panelists', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    if (!result.ok) return result;
    return this.loadUser(result.data.userId);
  }

  async updateUser(
    viewer: User,
    userId: string,
    updates: {
      displayName?: string;
      displayTitle?: string;
      role?: AppRole;
      isActive?: boolean;
      phone?: string;
    }
  ): Promise<OperationResult<User>> {
    if (viewer.role !== 'super_admin') {
      return failure(new AppError('AUTHORIZATION_FAILURE', 'Super admin role required'));
    }
    const result = await this.adminFetch<{ ok: boolean }>(`/api/admin/panelists/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    if (!result.ok) return result;
    return this.loadUser(userId);
  }

  async updatePanelMemberships(viewer: User, userId: string, panelIds: number[]): Promise<OperationResult<User>> {
    if (viewer.role !== 'super_admin') {
      return failure(new AppError('AUTHORIZATION_FAILURE', 'Super admin role required'));
    }
    const result = await this.adminFetch<{ ok: boolean }>(`/api/admin/panelists/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ panelIds })
    });
    if (!result.ok) return result;
    return this.loadUser(userId);
  }

  async createCandidate(
    viewer: User,
    input: {
      regNo: string;
      name: string;
      day: InterviewDay;
      panelId: number;
      timing: string;
      status: Student['status'];
      form?: Student['form'];
    }
  ): Promise<OperationResult<Student>> {
    if (viewer.role !== 'super_admin') {
      return failure(new AppError('AUTHORIZATION_FAILURE', 'Super admin role required'));
    }
    const result = await this.adminFetch<{ ok: boolean; candidateId: string }>('/api/admin/candidates', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    if (!result.ok) return result;
    const candidates = await this.listCandidates(viewer);
    if (!candidates.ok) return candidates;
    const candidate = candidates.data.find((item) => item.id === result.data.candidateId);
    if (!candidate) return failure(new AppError('DATABASE_FAILURE', 'Created candidate could not be loaded'));
    return success(candidate);
  }

  async updateCandidate(
    viewer: User,
    candidateId: string,
    updates: {
      regNo?: string;
      name?: string;
      day?: InterviewDay;
      panelId?: number;
      timing?: string;
      status?: Student['status'];
      isActive?: boolean;
      form?: Student['form'];
    }
  ): Promise<OperationResult<Student>> {
    if (viewer.role !== 'super_admin') {
      return failure(new AppError('AUTHORIZATION_FAILURE', 'Super admin role required'));
    }
    const result = await this.adminFetch<{ ok: boolean }>(`/api/admin/candidates/${encodeURIComponent(candidateId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    if (!result.ok) return result;
    const candidates = await this.listCandidates(viewer);
    if (!candidates.ok) return candidates;
    const candidate = candidates.data.find((item) => item.id === candidateId);
    if (!candidate) return failure(new AppError('DATABASE_FAILURE', 'Updated candidate could not be loaded'));
    return success(candidate);
  }
}
