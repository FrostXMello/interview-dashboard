/**
 * One-off import of ISC interview schedule into candidates + applications.
 * Panel A -> 1, Panel B -> 2, 2026-08-20 -> day-1, 2026-08-21 -> day-2.
 */
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

void randomBytes;

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[name]) process.env[name] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

function slug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeSkills(skills) {
  if (!skills || typeof skills !== 'object') return {};
  const out = {};
  const pairs = [
    ['communication', 'Communication'],
    ['timeManagement', 'Time Management'],
    ['teamWork', 'Team Work'],
    ['graphicDesign', 'Graphic Design']
  ];
  for (const [from, to] of pairs) {
    const value = skills[from] ?? skills[to];
    if (typeof value === 'string' && value.trim()) out[to] = value.trim();
  }
  return out;
}

function normalizePhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return digits ? `+${digits}` : null;
}

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (!url || !serviceRoleKey) {
  console.error('NOT RUN: Supabase URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(2);
}

const rows = JSON.parse(readFileSync(resolve(process.cwd(), 'scripts/data/isc-jw-interviews.json'), 'utf8'));
if (!Array.isArray(rows) || rows.length === 0) {
  console.error('NOT RUN: interview JSON is empty.');
  process.exit(2);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { error: panelError } = await supabase.from('panels').upsert(
  [
    { id: 1, name: 'Panel A' },
    { id: 2, name: 'Panel B' }
  ],
  { onConflict: 'id' }
);
if (panelError) {
  console.error('FAILED: could not upsert panels.', panelError.message);
  process.exit(1);
}

const candidates = [];
const applications = [];
const seen = new Set();

for (const row of rows) {
  const regNo = String(row.mujRegistrationNumber || '').trim();
  const name = String(row.fullName || '').trim();
  const panelLabel = String(row.panel || '').trim().toUpperCase();
  const panelId = panelLabel.includes('B') ? 2 : 1;
  const isUnscheduled = !row.interviewDate || String(row.timeSlot || '').toLowerCase().includes('unscheduled');
  const day = isUnscheduled ? 'unscheduled' : String(row.interviewDate || '') === '2026-08-21' ? 'day-2' : 'day-1';
  const timing = String(row.timeSlot || 'TBD').replace(/\s+/g, ' ').trim();
  const id = isUnscheduled
    ? `cand-${slug(regNo)}-unscheduled`
    : `cand-${slug(regNo)}-${slug(row.interviewDate)}-${panelId === 2 ? 'b' : 'a'}-${slug(timing)}`;
  if (!regNo || !name) continue;
  if (seen.has(id)) continue;
  seen.add(id);

  const experienceParts = [
    row.priorExperience ? String(row.priorExperience).trim() : '',
    row.accommodation ? `Accommodation: ${String(row.accommodation).trim()}` : '',
    row.collegeTimings ? `College timings: ${String(row.collegeTimings).trim()}` : ''
  ].filter(Boolean);

  candidates.push({
    id,
    reg_no: regNo,
    display_name: name,
    timing,
    panel_id: panelId,
    interview_day: day,
    status: 'pending',
    is_active: true
  });

  applications.push({
    candidate_id: id,
    email: row.collegeEmail ? String(row.collegeEmail).trim() : null,
    phone: normalizePhone(row.contactPhone),
    program: row.program ? String(row.program).trim() : null,
    why_interested: row.whyJoinISC ? String(row.whyJoinISC).trim() : null,
    domains: row.domainInterests ? String(row.domainInterests).trim() : null,
    proficiencies: normalizeSkills(row.skillsProficiency),
    commitment: typeof row.commitmentRating === 'number' ? row.commitmentRating : null,
    experience: experienceParts.join('\n') || null,
    cv_link: row.cvResumeLink ? String(row.cvResumeLink).trim() : null,
    submitted_at: row.interviewDate ? `${row.interviewDate}T00:00:00Z` : null
  });
}

const { error: candidateError } = await supabase.from('candidates').upsert(candidates, { onConflict: 'id' });
if (candidateError) {
  console.error('FAILED: candidates upsert', candidateError.message);
  process.exit(1);
}

const { error: applicationError } = await supabase.from('applications').upsert(applications, { onConflict: 'candidate_id' });
if (applicationError) {
  console.error('FAILED: applications upsert', applicationError.message);
  process.exit(1);
}

const day1 = candidates.filter((c) => c.interview_day === 'day-1');
const day2 = candidates.filter((c) => c.interview_day === 'day-2');
const unscheduled = candidates.filter((c) => c.interview_day === 'unscheduled');
console.log(`Imported ${candidates.length} interview slots.`);
console.log(`Day 1: ${day1.length} (Panel A ${day1.filter((c) => c.panel_id === 1).length}, Panel B ${day1.filter((c) => c.panel_id === 2).length})`);
console.log(`Day 2: ${day2.length} (Panel A ${day2.filter((c) => c.panel_id === 1).length}, Panel B ${day2.filter((c) => c.panel_id === 2).length})`);
console.log(`Unscheduled: ${unscheduled.length}`);
console.log('Panelists were not created. Send names, phones, positions, and panel assignments next.');
