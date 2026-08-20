import { describe, expect, it } from 'vitest';
import {
  canAccessCandidatePanel,
  canReadRating,
  canWriteRatingAs,
  filterReadableRatings,
  validateRatingPayload
} from '@/lib/auth/authorization';
import type { Rating, User } from '@/lib/data';

const panelistA: User = {
  id: 'a',
  name: 'A',
  role: 'panelist',
  panelIds: [1]
};

const panelistB: User = {
  id: 'b',
  name: 'B',
  role: 'panelist',
  panelIds: [1]
};

const senior: User = {
  id: 's',
  name: 'Senior',
  role: 'senior_panelist',
  panelIds: [1]
};

const admin: User = {
  id: 'admin',
  name: 'Admin',
  role: 'admin',
  panelIds: [1, 2]
};

const superAdmin: User = {
  id: 'super-admin',
  name: 'Super Admin',
  role: 'super_admin',
  panelIds: [1, 2]
};

describe('authorization invariants', () => {
  it('TEST A: panelist cannot read another panelist rating', () => {
    expect(
      canReadRating({
        viewer: panelistA,
        ratingPanelistId: panelistB.id,
        submitted: true,
        candidatePanelId: 1
      })
    ).toBe(false);
  });

  it('TEST C: panelist cannot write as another panelist', () => {
    expect(canWriteRatingAs(panelistA, panelistB.id)).toBe(false);
  });

  it('TEST D: panelist cannot access other panel candidates', () => {
    expect(canAccessCandidatePanel(panelistA, 2)).toBe(false);
  });

  it('TEST E: senior can read submitted peer ratings on their panel', () => {
    expect(
      canReadRating({
        viewer: senior,
        ratingPanelistId: panelistB.id,
        submitted: true,
        candidatePanelId: 1
      })
    ).toBe(true);
  });

  it('TEST E2: senior cannot read unsubmitted peer drafts', () => {
    expect(
      canReadRating({
        viewer: senior,
        ratingPanelistId: panelistB.id,
        submitted: false,
        candidatePanelId: 1
      })
    ).toBe(false);
  });

  it('TEST F: senior cannot write as another panelist', () => {
    expect(canWriteRatingAs(senior, panelistB.id)).toBe(false);
  });

  it('TEST G: admin can read all ratings', () => {
    expect(
      canReadRating({
        viewer: admin,
        ratingPanelistId: panelistB.id,
        submitted: false,
        candidatePanelId: 2
      })
    ).toBe(true);
  });

  it('TEST G2: super_admin can read all ratings', () => {
    expect(
      canReadRating({
        viewer: superAdmin,
        ratingPanelistId: panelistB.id,
        submitted: false,
        candidatePanelId: 2
      })
    ).toBe(true);
  });

  it('filters ratings for panelist to own rows only', () => {
    const ratings: Rating[] = [
      {
        studentId: 'c1',
        panelistId: 'a',
        scores: { 'Interview Score': 5 },
        comment: '',
        bestDomain: '',
        domainPriorities: [],
        submitted: false,
        active: false
      },
      {
        studentId: 'c1',
        panelistId: 'b',
        scores: { 'Interview Score': 8 },
        comment: 'secret',
        bestDomain: '',
        domainPriorities: ['Event Management & Operations'],
        submitted: true,
        active: false
      }
    ];
    const filtered = filterReadableRatings(panelistA, ratings, new Map([['c1', 1]]));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].panelistId).toBe('a');
  });
});

describe('rating validation', () => {
  it('rejects scores outside 1–10', () => {
    const error = validateRatingPayload({
      studentId: 'c1',
      panelistId: 'a',
      scores: { 'Interview Score': 11 },
      comment: '',
      bestDomain: '',
      domainPriorities: [],
      submitted: false,
      active: false
    });
    expect(error?.code).toBe('VALIDATION_FAILURE');
  });

  it('rejects more than 3 domain priorities', () => {
    const error = validateRatingPayload({
      studentId: 'c1',
      panelistId: 'a',
      scores: { 'Interview Score': 5 },
      comment: '',
      bestDomain: '',
      domainPriorities: ['a', 'b', 'c', 'd'],
      submitted: false,
      active: false
    });
    expect(error?.code).toBe('VALIDATION_FAILURE');
  });
});
