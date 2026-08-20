import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_PERSONAS } from '@/lib/data';
import { OfflineDemoRepository } from '@/lib/data-access/offline-repository';

function memoryStorage(): Storage {
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

describe('OfflineDemoRepository security behavior', () => {
  let repo: OfflineDemoRepository;
  let session: Storage;
  let data: Storage;

  beforeEach(() => {
    session = memoryStorage();
    data = memoryStorage();
    repo = new OfflineDemoRepository(session, data);
  });

  it('rejects password sign-in in demo mode', async () => {
    const result = await repo.signInWithPassword('a@b.c', 'x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('AUTHENTICATION_FAILURE');
  });

  it('clears demo session on logout', async () => {
    const panelist = DEMO_PERSONAS.find((p) => p.role === 'panelist')!;
    await repo.enterDemoPersona(panelist.id);
    await repo.signOut();
    const snapshot = await repo.getSession();
    expect(snapshot.ok && snapshot.data.user).toBeNull();
  });

  it('denies rating another panelist identity', async () => {
    const panelist = DEMO_PERSONAS.find((p) => p.role === 'panelist' && p.panelIds?.[0] === 1)!;
    await repo.enterDemoPersona(panelist.id);
    const other = DEMO_PERSONAS.find((p) => p.id !== panelist.id)!;
    const result = await repo.upsertRating(panelist, {
      studentId: 's1',
      panelistId: other.id,
      scores: { 'Interview Score': 7 },
      comment: '',
      bestDomain: '',
      domainPriorities: ['Content Creation & Social Media'],
      submitted: false,
      active: false
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Forced to viewer id — cannot impersonate.
      expect(result.data.panelistId).toBe(panelist.id);
    }
  });

  it('denies writing a rating for a candidate outside panel scope', async () => {
    const panelist = DEMO_PERSONAS.find((p) => p.role === 'panelist' && p.panelIds?.[0] === 1)!;
    await repo.enterDemoPersona(panelist.id);
    const result = await repo.upsertRating(panelist, {
      studentId: 's2', // panel 2 in demo seed
      panelistId: panelist.id,
      scores: { 'Interview Score': 7 },
      comment: '',
      bestDomain: '',
      domainPriorities: ['Event Management & Operations'],
      submitted: false,
      active: false
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('AUTHORIZATION_FAILURE');
  });

  it('hides peer ratings from panelists even if present in storage', async () => {
    const panelist = DEMO_PERSONAS.find((p) => p.id === 'demo-panelist-1a')!;
    const peer = DEMO_PERSONAS.find((p) => p.id === 'demo-panelist-1b')!;
    data.setItem(
      'interview_demo_ratings_v1',
      JSON.stringify([
        {
          studentId: 's1',
          panelistId: peer.id,
          scores: { 'Interview Score': 9 },
          comment: 'confidential',
          bestDomain: '',
          domainPriorities: [],
          submitted: true,
          active: false
        }
      ])
    );
    await repo.enterDemoPersona(panelist.id);
    const listed = await repo.listRatings(panelist);
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.data.some((r) => r.panelistId === peer.id)).toBe(false);
    }
  });
});
