/**
 * Apply selectedDomains from scripts/data/isc-selected-domains.json onto
 * applications.domains, mapped to the five official dashboard domains.
 */
import { createClient } from '@supabase/supabase-js';
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

const DOMAIN_NEEDLES = [
  { domain: 'Graphic Designing & Video Editing', needles: ['graphic designing', 'video editing'] },
  { domain: 'Documentation and Administrative Support', needles: ['documentation', 'administrative support', 'administration'] },
  { domain: 'Outreach and Public Relations', needles: ['outreach', 'public relations'] },
  { domain: 'Content Creation and Social Media', needles: ['content creation', 'social media'] },
  { domain: 'Event Management and Operations', needles: ['event management'] }
];

function canonicalizeDomain(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;
  for (const { domain, needles } of DOMAIN_NEEDLES) {
    if (needles.some((needle) => normalized.includes(needle))) return domain;
  }
  return null;
}

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (!url || !serviceRoleKey) {
  console.error('NOT RUN: Supabase URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(2);
}

const payloadPath = resolve(process.cwd(), 'scripts/data/isc-selected-domains.json');
if (!existsSync(payloadPath)) {
  console.error('NOT RUN: scripts/data/isc-selected-domains.json is required.');
  process.exit(2);
}

const rows = JSON.parse(readFileSync(payloadPath, 'utf8'));
if (!Array.isArray(rows) || rows.length === 0) {
  console.error('NOT RUN: selected-domains payload is empty.');
  process.exit(2);
}

const domainsByReg = new Map();
const unmapped = [];
for (const row of rows) {
  const regNo = String(row.mujRegistrationNumber || '').trim();
  const selected = Array.isArray(row.selectedDomains) ? row.selectedDomains : [];
  if (!regNo) continue;
  const current = domainsByReg.get(regNo) || new Set();
  for (const raw of selected) {
    const mapped = canonicalizeDomain(raw);
    if (mapped) current.add(mapped);
    else unmapped.push({ regNo, raw });
  }
  domainsByReg.set(regNo, current);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data: candidates, error: candidateError } = await supabase
  .from('candidates')
  .select('id, reg_no, display_name');
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

let updated = 0;
let missing = 0;
for (const [regNo, domainSet] of domainsByReg.entries()) {
  const ids = idsByReg.get(regNo) || [];
  if (ids.length === 0) {
    missing += 1;
    console.log(`missing candidate ${regNo}`);
    continue;
  }
  const domains = [...domainSet].join(', ');
  const { error } = await supabase.from('applications').update({ domains }).in('candidate_id', ids);
  if (error) {
    console.error('FAILED: domain update for', regNo, error.message);
    process.exit(1);
  }
  updated += ids.length;
}

console.log(`Updated domains on ${updated} candidate application(s) across ${domainsByReg.size} registration numbers.`);
if (missing) console.log(`No candidate row for ${missing} registration number(s).`);
if (unmapped.length) {
  console.log('Unmapped domain strings:');
  for (const row of unmapped) console.log(`- ${row.regNo}: ${row.raw}`);
}
