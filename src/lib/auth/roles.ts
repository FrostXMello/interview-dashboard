/**
 * Application authorization roles (profile-level, not auth secrets).
 *
 * ASSUMPTION (documented): The product historically used free-text titles
 * ("Head of Events", "junior", "senior", "superadmin"). For enforceable
 * authorization we normalize to explicit roles. Title/label may still be shown
 * in the UI via `displayTitle` without granting privileges.
 */

export const APP_ROLES = ['panelist', 'senior_panelist', 'admin', 'super_admin'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (APP_ROLES as readonly string[]).includes(value);
}

export function hasAdminPrivileges(role: AppRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function canReadPeerRatings(role: AppRole): boolean {
  return role === 'senior_panelist' || hasAdminPrivileges(role);
}

export function canManageCandidateStatus(role: AppRole): boolean {
  return hasAdminPrivileges(role);
}

export function canReadAllPanels(role: AppRole): boolean {
  return hasAdminPrivileges(role);
}
