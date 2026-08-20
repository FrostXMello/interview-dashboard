import APPLICANTS from '@/lib/applicants';
import {
  canAccessCandidatePanel,
  canWriteRatingAs,
  filterReadableRatings,
  validateRatingPayload
} from '@/lib/auth/authorization';
import { canManageCandidateStatus, canReadAllPanels, canReadPeerRatings, hasAdminPrivileges } from '@/lib/auth/roles';
import { DEMO_PERSONAS, INITIAL_STUDENTS, type InterviewDay, type Rating, type Student, type User } from '@/lib/data';
import { AppError, failure, success, type OperationResult } from '@/lib/errors';
import type { InterviewRepository, SessionSnapshot } from '@/lib/data-access/types';

export const DEMO_SESSION_KEY = 'interview_demo_session_v1';
export const DEMO_RATINGS_KEY = 'interview_demo_ratings_v1';
export const DEMO_STUDENTS_KEY = 'interview_demo_students_v1';

/** Clear legacy insecure keys that may still contain passwords. */
export function clearLegacyAuthStorage(): void {
  if (typeof window === 'undefined') return;
  const legacyKeys = [
    'interview_curr_user',
    'interview_remember_me',
    'interview_students',
    'interview_ratings'
  ];
  legacyKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

function enrich(student: Student): Student {
  const match = APPLICANTS.find(
    (app) =>
      (app.regNo && app.regNo === student.regNo) ||
      (app.fullName && app.fullName.toLowerCase() === student.name.toLowerCase())
  );
  const normalizedDay = student.day || (student.id.startsWith('d2-') ? 'day-2' : 'day-1');
  if (!match) return { ...student, day: normalizedDay };
  return { ...student, day: normalizedDay, form: { ...match, ...(student.form || {}) } };
}

function readJson<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function scopeCandidates(viewer: User, students: Student[]): Student[] {
  if (canReadAllPanels(viewer.role)) return students;
  return students.filter((s) => canAccessCandidatePanel(viewer, s.panelId));
}

function allStudents(storage: Storage): Student[] {
  return readJson<Student[]>(storage, DEMO_STUDENTS_KEY, INITIAL_STUDENTS.map(enrich)).map(enrich);
}

/**
 * Offline / demo repository.
 * WHY: Preserve intentional local demo capability without pretending to be production auth.
 * TRADEOFF: Authorization is client-enforced only in this mode (acceptable for synthetic data).
 */
export class OfflineDemoRepository implements InterviewRepository {
  readonly mode = 'offline-demo' as const;

  constructor(
    private readonly sessionStore: Storage = typeof sessionStorage !== 'undefined' ? sessionStorage : createMemoryStorage(),
    private readonly dataStore: Storage = typeof localStorage !== 'undefined' ? localStorage : createMemoryStorage()
  ) {}

  async getSession(): Promise<OperationResult<SessionSnapshot>> {
    clearLegacyAuthStorage();
    const personaId = this.sessionStore.getItem(DEMO_SESSION_KEY);
    if (!personaId) {
      return success({ mode: this.mode, user: null, isDemoSession: true });
    }
    const user = DEMO_PERSONAS.find((p) => p.id === personaId) || null;
    return success({ mode: this.mode, user, isDemoSession: true });
  }

  async signInWithPassword(_email: string, _password: string): Promise<OperationResult<User>> {
    void _email;
    void _password;
    return failure(
      new AppError(
        'AUTHENTICATION_FAILURE',
        'Password sign-in is unavailable in offline-demo mode',
        { userMessage: 'This environment is not connected to Supabase Auth. Configure connected mode to sign in.' }
      )
    );
  }

  async enterDemoPersona(personaId: string): Promise<OperationResult<User>> {
    const user = DEMO_PERSONAS.find((p) => p.id === personaId);
    if (!user) {
      return failure(new AppError('VALIDATION_FAILURE', `Unknown demo persona: ${personaId}`));
    }
    this.sessionStore.setItem(DEMO_SESSION_KEY, user.id);
    return success(user);
  }

  async signOut(): Promise<OperationResult<null>> {
    this.sessionStore.removeItem(DEMO_SESSION_KEY);
    return success(null);
  }

  async listVisibleProfiles(viewer: User): Promise<OperationResult<User[]>> {
    if (hasAdminPrivileges(viewer.role) || canReadPeerRatings(viewer.role)) {
      return success(DEMO_PERSONAS);
    }
    return success(DEMO_PERSONAS.filter((p) => p.id === viewer.id));
  }

  async listCandidates(viewer: User): Promise<OperationResult<Student[]>> {
    const enriched = allStudents(this.dataStore);
    this.dataStore.setItem(DEMO_STUDENTS_KEY, JSON.stringify(enriched));
    return success(scopeCandidates(viewer, enriched));
  }

  async listRatings(viewer: User): Promise<OperationResult<Rating[]>> {
    const stored = readJson<Rating[]>(this.dataStore, DEMO_RATINGS_KEY, []);
    const candidates = scopeCandidates(viewer, allStudents(this.dataStore));
    const panelById = new Map(candidates.map((c) => [c.id, c.panelId] as const));
    // Include panel map for all known students so own drafts on accessible candidates resolve.
    allStudents(this.dataStore).forEach((c) => {
      if (canAccessCandidatePanel(viewer, c.panelId) || hasAdminPrivileges(viewer.role)) {
        panelById.set(c.id, c.panelId);
      }
    });
    return success(filterReadableRatings(viewer, stored, panelById));
  }

  async upsertRating(viewer: User, rating: Rating): Promise<OperationResult<Rating>> {
    const authored: Rating = { ...rating, panelistId: viewer.id };
    const validationError = validateRatingPayload(authored);
    if (validationError) return failure(validationError);

    if (!canWriteRatingAs(viewer, authored.panelistId)) {
      return failure(new AppError('AUTHORIZATION_FAILURE', 'Cannot write another panelist rating'));
    }

    const candidate = allStudents(this.dataStore).find((s) => s.id === authored.studentId);
    if (!candidate) {
      return failure(new AppError('VALIDATION_FAILURE', 'Candidate not found'));
    }
    if (!canAccessCandidatePanel(viewer, candidate.panelId)) {
      return failure(new AppError('AUTHORIZATION_FAILURE', 'Candidate is outside your panel scope'));
    }

    const all = readJson<Rating[]>(this.dataStore, DEMO_RATINGS_KEY, []);
    const next = [...all];
    const idx = next.findIndex(
      (r) => r.studentId === authored.studentId && r.panelistId === authored.panelistId
    );
    if (idx >= 0) next[idx] = authored;
    else next.push(authored);
    this.dataStore.setItem(DEMO_RATINGS_KEY, JSON.stringify(next));
    return success(authored);
  }

  async setCandidateStatus(
    viewer: User,
    studentId: string,
    status: Student['status']
  ): Promise<OperationResult<Student>> {
    if (!canManageCandidateStatus(viewer.role)) {
      return failure(new AppError('AUTHORIZATION_FAILURE', 'Only admin-level users can change status'));
    }
    const all = allStudents(this.dataStore);
    const idx = all.findIndex((s) => s.id === studentId);
    if (idx < 0) {
      return failure(new AppError('VALIDATION_FAILURE', 'Candidate not found'));
    }
    all[idx] = { ...all[idx], status };
    this.dataStore.setItem(DEMO_STUDENTS_KEY, JSON.stringify(all));
    return success(all[idx]);
  }

  async listPanels(_viewer: User): Promise<OperationResult<Array<{ id: number; name: string }>>> {
    void _viewer;
    return success([
      { id: 1, name: 'Panel 1' },
      { id: 2, name: 'Panel 2' }
    ]);
  }

  async createPanelist(
    _viewer: User,
    _input: {
      phone: string;
      password?: string;
      displayName: string;
      displayTitle?: string;
      role?: User['role'];
      panelIds: number[];
    }
  ): Promise<OperationResult<User>> {
    void _viewer;
    void _input;
    return failure(new AppError('OFFLINE', 'Super admin panelist management requires connected mode.'));
  }

  async updateUser(
    _viewer: User,
    _userId: string,
    _updates: {
      displayName?: string;
      displayTitle?: string;
      role?: User['role'];
      isActive?: boolean;
      phone?: string;
    }
  ): Promise<OperationResult<User>> {
    void _viewer;
    void _userId;
    void _updates;
    return failure(new AppError('OFFLINE', 'Super admin user updates require connected mode.'));
  }

  async updatePanelMemberships(_viewer: User, _userId: string, _panelIds: number[]): Promise<OperationResult<User>> {
    void _viewer;
    void _userId;
    void _panelIds;
    return failure(new AppError('OFFLINE', 'Super admin panel management requires connected mode.'));
  }

  async createCandidate(
    _viewer: User,
    _input: {
      regNo: string;
      name: string;
      day: InterviewDay;
      panelId: number;
      timing: string;
      status: Student['status'];
      form?: Student['form'];
    }
  ): Promise<OperationResult<Student>> {
    void _viewer;
    void _input;
    return failure(new AppError('OFFLINE', 'Super admin candidate management requires connected mode.'));
  }

  async updateCandidate(
    _viewer: User,
    _candidateId: string,
    _updates: {
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
    void _viewer;
    void _candidateId;
    void _updates;
    return failure(new AppError('OFFLINE', 'Super admin candidate management requires connected mode.'));
  }
}

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    }
  };
}
