import type { InterviewDay, Rating, Student, User } from '@/lib/data';
import type { OperationResult } from '@/lib/errors';
import type { AppMode } from '@/lib/mode';
import type { AppRole } from '@/lib/auth/roles';

export type SyncStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'offline'
  | 'error'
  | 'unauthorized';

export interface SessionSnapshot {
  mode: AppMode;
  user: User | null;
  /** True when session is a local demo persona, not Supabase Auth. */
  isDemoSession: boolean;
}

export interface InterviewRepository {
  readonly mode: AppMode;

  getSession(): Promise<OperationResult<SessionSnapshot>>;
  signInWithPassword(email: string, password: string): Promise<OperationResult<User>>;
  enterDemoPersona(personaId: string): Promise<OperationResult<User>>;
  signOut(): Promise<OperationResult<null>>;

  listVisibleProfiles(viewer: User): Promise<OperationResult<User[]>>;
  listCandidates(viewer: User): Promise<OperationResult<Student[]>>;
  listRatings(viewer: User): Promise<OperationResult<Rating[]>>;

  upsertRating(viewer: User, rating: Rating): Promise<OperationResult<Rating>>;
  setCandidateStatus(
    viewer: User,
    studentId: string,
    status: Student['status']
  ): Promise<OperationResult<Student>>;

  listPanels(viewer: User): Promise<OperationResult<Array<{ id: number; name: string }>>>;
  createPanelist(
    viewer: User,
    input: {
      phone: string;
      password?: string;
      displayName: string;
      displayTitle?: string;
      role?: AppRole;
      panelIds: number[];
    }
  ): Promise<OperationResult<User>>;
  updateUser(
    viewer: User,
    userId: string,
    updates: {
      displayName?: string;
      displayTitle?: string;
      role?: AppRole;
      isActive?: boolean;
      phone?: string;
    }
  ): Promise<OperationResult<User>>;
  updatePanelMemberships(
    viewer: User,
    userId: string,
    panelIds: number[]
  ): Promise<OperationResult<User>>;
  createCandidate(
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
  ): Promise<OperationResult<Student>>;
  updateCandidate(
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
  ): Promise<OperationResult<Student>>;
}

export function panelIdsFor(user: User): number[] {
  if (user.panelIds && user.panelIds.length > 0) return user.panelIds;
  if (typeof user.panelId === 'number') return [user.panelId];
  return [];
}
