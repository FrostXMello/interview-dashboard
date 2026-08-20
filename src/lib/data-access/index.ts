import { getAppMode } from '@/lib/mode';
import { OfflineDemoRepository } from '@/lib/data-access/offline-repository';
import { RemoteSupabaseRepository } from '@/lib/data-access/remote-repository';
import type { InterviewRepository } from '@/lib/data-access/types';

let singleton: InterviewRepository | null = null;

export function createInterviewRepository(mode = getAppMode()): InterviewRepository {
  return mode === 'connected' ? new RemoteSupabaseRepository() : new OfflineDemoRepository();
}

/**
 * Factory for the active persistence adapter.
 * UI should depend on InterviewRepository, not on Supabase client details.
 */
export function getInterviewRepository(): InterviewRepository {
  if (singleton) return singleton;
  singleton = createInterviewRepository();
  return singleton;
}

/** Test-only: reset singleton between cases. */
export function resetInterviewRepositoryForTests(): void {
  singleton = null;
}

export type { InterviewRepository, SessionSnapshot, SyncStatus } from '@/lib/data-access/types';
export { clearLegacyAuthStorage } from '@/lib/data-access/offline-repository';
