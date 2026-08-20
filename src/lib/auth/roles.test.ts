import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  APP_ROLES,
  canManageCandidateStatus,
  canReadAllPanels,
  canReadPeerRatings,
  hasAdminPrivileges,
  isAppRole
} from '@/lib/auth/roles';

const pageSource = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8');
const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260818143000_super_admin_foundation.sql'),
  'utf8'
);

describe('super_admin role foundation', () => {
  it('recognizes super_admin as an app role', () => {
    expect(APP_ROLES).toContain('super_admin');
    expect(isAppRole('super_admin')).toBe(true);
  });

  it('inherits admin-level capabilities for read/manage helpers', () => {
    expect(hasAdminPrivileges('super_admin')).toBe(true);
    expect(canReadPeerRatings('super_admin')).toBe(true);
    expect(canReadAllPanels('super_admin')).toBe(true);
    expect(canManageCandidateStatus('super_admin')).toBe(true);
  });

  it('does not elevate panelist or senior_panelist to admin-level access', () => {
    expect(hasAdminPrivileges('panelist')).toBe(false);
    expect(hasAdminPrivileges('senior_panelist')).toBe(false);
    expect(canManageCandidateStatus('panelist')).toBe(false);
  });
});

describe('public login page', () => {
  it('no longer renders the synthetic demo persona chooser', () => {
    expect(pageSource).not.toMatch(/Choose a demo persona/i);
    expect(pageSource).not.toMatch(/handleDemoEnter/);
    expect(pageSource).not.toMatch(/demoPersonas\.map/);
  });
});

describe('database super_admin migration', () => {
  it('adds the super_admin enum value and helper', () => {
    expect(migration).toMatch(/alter type public\.app_role add value if not exists 'super_admin'/i);
    expect(migration).toMatch(/create or replace function public\.is_super_admin\(\)/i);
  });

  it('makes is_admin and is_senior_or_admin include super_admin', () => {
    expect(migration).toMatch(/role in \('admin', 'super_admin'\)/);
    expect(migration).toMatch(/role in \('senior_panelist', 'admin', 'super_admin'\)/);
  });
});
