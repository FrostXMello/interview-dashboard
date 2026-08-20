import { describe, expect, it } from 'vitest';
import { canAccessCandidatePanel, filterReadableRatings } from '@/lib/auth/authorization';
import type { Rating, User } from '@/lib/data';

/**
 * PHASE 8 dataset — expected visibility without a live database.
 * Live RLS must match these results when the verification harness runs.
 */

const panelistA: User = { id: 'user-a', name: 'A', role: 'panelist', panelIds: [1] };
const panelistC: User = { id: 'user-c', name: 'C', role: 'panelist', panelIds: [2] };
const senior: User = { id: 'user-d', name: 'D', role: 'senior_panelist', panelIds: [1] };
const admin: User = { id: 'user-e', name: 'E', role: 'admin', panelIds: [1, 2] };

const panelByCandidate = new Map([
  ['p1-a', 1],
  ['p1-b', 1],
  ['p2-a', 2]
]);

const ratings: Rating[] = [
  {
    studentId: 'p1-a',
    panelistId: 'user-a',
    scores: { 'Interview Score': 6 },
    comment: 'a',
    bestDomain: '',
    domainPriorities: [],
    submitted: true,
    active: false
  },
  {
    studentId: 'p1-a',
    panelistId: 'user-b',
    scores: { 'Interview Score': 8 },
    comment: 'b-secret',
    bestDomain: '',
    domainPriorities: [],
    submitted: true,
    active: false
  },
  {
    studentId: 'p2-a',
    panelistId: 'user-c',
    scores: { 'Interview Score': 7 },
    comment: 'c',
    bestDomain: '',
    domainPriorities: [],
    submitted: true,
    active: false
  },
  {
    studentId: 'p1-a',
    panelistId: 'user-d',
    scores: { 'Interview Score': 9 },
    comment: 'senior',
    bestDomain: '',
    domainPriorities: [],
    submitted: false,
    active: false
  }
];

describe('data isolation expected results (mirrors intended RLS)', () => {
  it('panelist A sees panel 1 candidates only', () => {
    expect(canAccessCandidatePanel(panelistA, 1)).toBe(true);
    expect(canAccessCandidatePanel(panelistA, 2)).toBe(false);
  });

  it('panelist A sees only own ratings, not B/C/senior drafts', () => {
    const visible = filterReadableRatings(panelistA, ratings, panelByCandidate);
    expect(visible.map((r) => r.panelistId).sort()).toEqual(['user-a']);
  });

  it('panelist C cannot see panel 1 ratings', () => {
    const visible = filterReadableRatings(panelistC, ratings, panelByCandidate);
    expect(visible.map((r) => r.panelistId)).toEqual(['user-c']);
  });

  it('senior on panel 1 sees submitted peer ratings on panel 1 plus own draft', () => {
    const visible = filterReadableRatings(senior, ratings, panelByCandidate);
    const ids = visible.map((r) => r.panelistId).sort();
    expect(ids).toEqual(['user-a', 'user-b', 'user-d']);
    expect(visible.some((r) => r.panelistId === 'user-c')).toBe(false);
  });

  it('admin sees every rating', () => {
    const visible = filterReadableRatings(admin, ratings, panelByCandidate);
    expect(visible).toHaveLength(4);
  });
});
