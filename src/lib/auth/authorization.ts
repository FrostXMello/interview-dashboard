/**
 * Pure authorization helpers shared by offline-demo repository and unit tests.
 * Connected-mode security is enforced by Postgres RLS; these mirror the intended rules
 * for demo mode and for documenting invariants.
 *
 * ROLE MODEL DECISION:
 * - Role is GLOBAL on profiles (panelist | senior_panelist | admin).
 * - Panel access is SEPARATE via panel_memberships (resource scoping).
 * - displayTitle is cosmetic only and never grants privileges.
 */

import type { AppRole } from '@/lib/auth/roles';
import { canReadAllPanels, hasAdminPrivileges } from '@/lib/auth/roles';
import type { Rating, User } from '@/lib/data';
import { AppError } from '@/lib/errors';
import { panelIdsFor } from '@/lib/data-access/types';

export function canAccessCandidatePanel(viewer: User, panelId: number): boolean {
  if (canReadAllPanels(viewer.role)) return true;
  return panelIdsFor(viewer).includes(panelId);
}

export function canReadRating(args: {
  viewer: User;
  ratingPanelistId: string;
  submitted: boolean;
  candidatePanelId: number;
}): boolean {
  const { viewer, ratingPanelistId, submitted, candidatePanelId } = args;

  if (hasAdminPrivileges(viewer.role)) return true;
  if (ratingPanelistId === viewer.id) return true;

  // Seniors may review SUBMITTED ratings only, and only for candidates on their panels.
  if (viewer.role === 'senior_panelist') {
    return submitted && canAccessCandidatePanel(viewer, candidatePanelId);
  }

  return false;
}

/** Writers may only author ratings as themselves (including admins). */
export function canWriteRatingAs(viewer: User, panelistId: string): boolean {
  return viewer.id === panelistId;
}

export function filterReadableRatings(
  viewer: User,
  ratings: Rating[],
  candidatePanelById: Map<string, number>
): Rating[] {
  return ratings.filter((rating) => {
    const panelId = candidatePanelById.get(rating.studentId);
    if (panelId === undefined) {
      // Unknown candidate: only allow if it is the viewer's own row (draft edge case).
      return rating.panelistId === viewer.id || hasAdminPrivileges(viewer.role);
    }
    return canReadRating({
      viewer,
      ratingPanelistId: rating.panelistId,
      submitted: rating.submitted,
      candidatePanelId: panelId
    });
  });
}

export function validateRatingPayload(rating: Rating): AppError | null {
  if (!rating.studentId?.trim()) {
    return new AppError('VALIDATION_FAILURE', 'studentId is required');
  }
  if (!rating.panelistId?.trim()) {
    return new AppError('VALIDATION_FAILURE', 'panelistId is required');
  }
  if (!Array.isArray(rating.domainPriorities) || rating.domainPriorities.length > 3) {
    return new AppError('VALIDATION_FAILURE', 'domainPriorities must have 0–3 entries');
  }

  for (const [key, value] of Object.entries(rating.scores || {})) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 10) {
      return new AppError('VALIDATION_FAILURE', `Score "${key}" must be an integer 1–10`);
    }
  }

  return null;
}

export function assertRoleIsAuthoritative(role: AppRole, displayTitle?: string): AppRole {
  void displayTitle;
  return role;
}
