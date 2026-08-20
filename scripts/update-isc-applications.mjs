import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

function normalizePhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return digits ? `+${digits}` : null;
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

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const projectRef =
  (process.env.SUPABASE_PROJECT_REF || '').trim() ||
  url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ||
  '';

if (!url || !serviceRoleKey || !projectRef) {
  console.error('NOT RUN: Supabase URL, service role key, and project ref are required.');
  process.exit(2);
}

const ratingsPath = resolve(process.cwd(), 'scripts/data/isc-self-ratings.json');
const unscheduledPath = resolve(process.cwd(), 'scripts/data/isc-unscheduled.json');
if (!existsSync(ratingsPath) || !existsSync(unscheduledPath)) {
  console.error('NOT RUN: scripts/data/isc-self-ratings.json and isc-unscheduled.json are required.');
  process.exit(2);
}

const ratingsRows = JSON.parse(readFileSync(ratingsPath, 'utf8'));
const unscheduledRows = JSON.parse(readFileSync(unscheduledPath, 'utf8'));

function readCliAccessToken() {
  try {
    return execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', resolve(process.cwd(), 'scripts/_read-cli-token.ps1')],
      { encoding: 'utf8' }
    ).trim();
  } catch {
    return '';
  }
}

const token = readCliAccessToken();
if (!token) {
  console.error('NOT RUN: Supabase CLI token missing.');
  process.exit(2);
}

const sql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260820070000_unscheduled_interview_day.sql'),
  'utf8'
);
const sqlRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: sql })
});
if (!sqlRes.ok) {
  console.error('FAILED: could not update interview_day constraint.', (await sqlRes.text()).slice(0, 500));
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data: candidates, error: candidateError } = await supabase
  .from('candidates')
  .select('id, reg_no');
if (candidateError) {
  console.error('FAILED: could not list candidates.', candidateError.message);
  process.exit(1);
}

const idsByReg = new Map();
for (const row of candidates || []) {
  const list = idsByReg.get(row.reg_no) || [];
  list.push(row.id);
  idsByReg.set(row.reg_no, list);
}

const latestByReg = new Map();
for (const row of ratingsRows) {
  const regNo = String(row.mujRegistrationNumber || '').trim();
  if (regNo) latestByReg.set(regNo, row);
}

let updated = 0;
for (const [regNo, row] of latestByReg.entries()) {
  const ids = idsByReg.get(regNo) || [];
  if (ids.length === 0) continue;
  const proficiencies = normalizeSkills(row.skillsProficiency);
  const { error } = await supabase
    .from('applications')
    .update({ proficiencies })
    .in('candidate_id', ids);
  if (error) {
    console.error('FAILED: proficiency update for', regNo, error.message);
    process.exit(1);
  }
  updated += ids.length;
}

const unscheduledCandidates = [];
const unscheduledApplications = [];
for (const row of unscheduledRows) {
  const regNo = String(row.mujRegistrationNumber || '').trim();
  const name = String(row.fullName || '').trim();
  if (!regNo || !name) continue;
  const id = `cand-${slug(regNo)}-unscheduled`;
  const experienceParts = [
    row.priorExperience ? String(row.priorExperience).trim() : '',
    row.accommodation ? `Accommodation: ${String(row.accommodation).trim()}` : '',
    row.collegeTimings ? `College timings: ${String(row.collegeTimings).trim()}` : ''
  ].filter(Boolean);

  unscheduledCandidates.push({
    id,
    reg_no: regNo,
    display_name: name,
    timing: 'Unscheduled',
    panel_id: 1,
    interview_day: 'unscheduled',
    status: 'pending',
    is_active: true
  });

  unscheduledApplications.push({
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
    submitted_at: null
  });
}

if (unscheduledCandidates.length > 0) {
  const { error: unschedCandError } = await supabase
    .from('candidates')
    .upsert(unscheduledCandidates, { onConflict: 'id' });
  if (unschedCandError) {
    console.error('FAILED: unscheduled candidates', unschedCandError.message);
    process.exit(1);
  }
  const { error: unschedAppError } = await supabase
    .from('applications')
    .upsert(unscheduledApplications, { onConflict: 'candidate_id' });
  if (unschedAppError) {
    console.error('FAILED: unscheduled applications', unschedAppError.message);
    process.exit(1);
  }
}

console.log(`Updated self-ratings on ${updated} candidate applications.`);
console.log(`Upserted ${unscheduledCandidates.length} unscheduled candidates.`);
