import type { ApplicantForm } from '@/lib/applicants';
import type { AppRole } from '@/lib/auth/roles';

/**
 * Domain types for the interview dashboard.
 *
 * AUTHENTICATION DATA must never live here (no passwords).
 * DEMO DATA below is synthetic and safe for offline-demo mode.
 */

/** Application user profile (not an auth credential store). */
export interface User {
  id: string;
  name: string;
  email?: string;
  /** Optional contact display only — not used for authentication. */
  phone?: string;
  role: AppRole;
  /** Human-readable title for UI (does not grant privileges). */
  displayTitle?: string;
  panelId?: number;
  /** Panel memberships for authorization scoping. */
  panelIds?: number[];
  isActive?: boolean;
}

export type InterviewDay = 'day-1' | 'day-2' | 'unscheduled';

export interface Student {
  id: string;
  regNo: string;
  name: string;
  timing: string;
  panelId: number;
  day: InterviewDay;
  status: 'pending' | 'interviewing' | 'completed';
  isActive?: boolean;
  form?: ApplicantForm;
}

export interface Rating {
  studentId: string;
  panelistId: string;
  scores: Record<string, number>;
  comment: string;
  bestDomain: string;
  domainPriorities: string[];
  submitted: boolean;
  active: boolean;
}

export const CRITERIA = ['Interview Score'] as const;

export const DOMAIN_OPTIONS = [
  'Event Management and Operations',
  'Content Creation and Social Media',
  'Outreach and Public Relations',
  'Documentation and Administrative Support',
  'Graphic Designing & Video Editing'
] as const;

export type DomainOption = (typeof DOMAIN_OPTIONS)[number];

export const DOMAIN_SHORT_LABELS: Record<DomainOption, string> = {
  'Event Management and Operations': 'Events & Ops',
  'Content Creation and Social Media': 'Content & Social',
  'Outreach and Public Relations': 'Outreach & PR',
  'Documentation and Administrative Support': 'Documentation',
  'Graphic Designing & Video Editing': 'Design & Video'
};

const DOMAIN_NEEDLES: Array<{ domain: DomainOption; needles: string[] }> = [
  { domain: 'Graphic Designing & Video Editing', needles: ['graphic designing', 'video editing'] },
  { domain: 'Documentation and Administrative Support', needles: ['documentation', 'administrative support', 'administration'] },
  { domain: 'Outreach and Public Relations', needles: ['outreach', 'public relations'] },
  { domain: 'Content Creation and Social Media', needles: ['content creation', 'social media'] },
  { domain: 'Event Management and Operations', needles: ['event management'] }
];

export function canonicalizeDomain(value: string): DomainOption | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  const exact = DOMAIN_OPTIONS.find((domain) => domain.toLowerCase() === normalized);
  if (exact) return exact;
  for (const { domain, needles } of DOMAIN_NEEDLES) {
    if (needles.some((needle) => normalized.includes(needle))) return domain;
  }
  return null;
}

export function extractPreferredDomains(raw?: string): DomainOption[] {
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const matched = DOMAIN_NEEDLES
    .filter(({ needles }) => needles.some((needle) => lower.includes(needle)))
    .map(({ domain }) => domain);
  if (matched.length > 0) return matched;
  return raw
    .split(',')
    .map((part) => canonicalizeDomain(part))
    .filter((domain): domain is DomainOption => Boolean(domain));
}

export const SKILL_LABELS = ['Communication', 'Time Management', 'Team Work', 'Graphic Design'] as const;

export function skillRating(
  proficiencies: Record<string, string> | undefined,
  label: (typeof SKILL_LABELS)[number]
): string {
  if (!proficiencies) return '—';
  const aliases: Record<(typeof SKILL_LABELS)[number], string[]> = {
    Communication: ['Communication', 'communication'],
    'Time Management': ['Time Management', 'timeManagement', 'time_management'],
    'Team Work': ['Team Work', 'teamWork', 'teamwork', 'team_work'],
    'Graphic Design': ['Graphic Design', 'graphicDesign', 'graphic_design']
  };
  for (const key of aliases[label]) {
    const value = proficiencies[key];
    if (value) return value;
  }
  return '—';
}

export function mapInterviewDay(value?: string): InterviewDay {
  if (value === 'day-2' || value === 'unscheduled') return value;
  return 'day-1';
}

export const RANKING_TABS = ['all', ...DOMAIN_OPTIONS] as const;

export const DOMAIN_PRIORITY_POINTS = [3, 2, 1] as const;

/**
 * Demo personas for offline-demo mode only.
 * Entering a persona does not use passwords and is not a production session.
 */
export const DEMO_PERSONAS: User[] = [
  {
    id: 'demo-panelist-1a',
    name: 'Demo Panelist A1',
    email: 'panelist.a1@demo.local',
    role: 'panelist',
    displayTitle: 'Panelist',
    panelId: 1,
    panelIds: [1]
  },
  {
    id: 'demo-panelist-1b',
    name: 'Demo Panelist A2',
    email: 'panelist.a2@demo.local',
    role: 'panelist',
    displayTitle: 'Panelist',
    panelId: 1,
    panelIds: [1]
  },
  {
    id: 'demo-panelist-2a',
    name: 'Demo Panelist B1',
    email: 'panelist.b1@demo.local',
    role: 'panelist',
    displayTitle: 'Panelist',
    panelId: 2,
    panelIds: [2]
  },
  {
    id: 'demo-senior-1',
    name: 'Demo Senior Reviewer',
    email: 'senior@demo.local',
    role: 'senior_panelist',
    displayTitle: 'Senior Panelist',
    panelId: 1,
    panelIds: [1, 2]
  },
  {
    id: 'demo-admin',
    name: 'Demo Administrator',
    email: 'admin@demo.local',
    role: 'admin',
    displayTitle: 'Administrator',
    panelIds: [1, 2]
  }
];

/** @deprecated Use DEMO_PERSONAS — kept as alias for gradual migration. */
export const INITIAL_USERS: User[] = DEMO_PERSONAS;

/** Synthetic interview schedule for offline-demo. */
export const INITIAL_STUDENTS: Student[] = [
  // Day 1 — panel 1
  { id: 's1', regNo: 'DEMO-1001', name: 'Alex Rivera', timing: '5:30 PM-5:40 PM', panelId: 1, day: 'day-1', status: 'pending' },
  { id: 's3', regNo: 'DEMO-1003', name: 'Sam Patel', timing: '5:50 PM-6:00 PM', panelId: 1, day: 'day-1', status: 'pending' },
  { id: 's5', regNo: 'DEMO-1005', name: 'Riley Brooks', timing: '6:10 PM-6:20 PM', panelId: 1, day: 'day-1', status: 'pending' },
  // Day 1 — panel 2
  { id: 's2', regNo: 'DEMO-1002', name: 'Jordan Lee', timing: '5:30 PM-5:40 PM', panelId: 2, day: 'day-1', status: 'pending' },
  { id: 's4', regNo: 'DEMO-1004', name: 'Casey Nguyen', timing: '5:50 PM-6:00 PM', panelId: 2, day: 'day-1', status: 'pending' },
  { id: 's6', regNo: 'DEMO-1006', name: 'Taylor Kim', timing: '6:10 PM-6:20 PM', panelId: 2, day: 'day-1', status: 'pending' },
  // Day 2 — panel 1
  { id: 'd2-s1', regNo: 'DEMO-2001', name: 'Morgan Shah', timing: '3:00 PM-3:10 PM', panelId: 1, day: 'day-2', status: 'pending' },
  { id: 'd2-s3', regNo: 'DEMO-2003', name: 'Quinn Alvarez', timing: '3:20 PM-3:30 PM', panelId: 1, day: 'day-2', status: 'pending' },
  // Day 2 — panel 2
  { id: 'd2-s2', regNo: 'DEMO-2002', name: 'Avery Chen', timing: '3:00 PM-3:10 PM', panelId: 2, day: 'day-2', status: 'pending' },
  { id: 'd2-s4', regNo: 'DEMO-2004', name: 'Jamie Okonkwo', timing: '3:20 PM-3:30 PM', panelId: 2, day: 'day-2', status: 'pending' }
];
