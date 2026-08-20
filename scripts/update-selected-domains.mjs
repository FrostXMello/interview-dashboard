/**
 * Merge every domain a candidate chose (application domainInterests +
 * selectedDomains) onto applications.domains, using official dashboard names.
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
    if (domain.toLowerCase() === normalized) return domain;
    if (needles.some((needle) => normalized.includes(needle))) return domain;
  }
  return null;
}

function splitDomainParts(raw) {
  const parts = [];
  const pushChunk = (chunk) => {
    let current = '';
    let depth = 0;
    for (const ch of String(chunk || '')) {
      if (ch === '(') depth += 1;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        if (current.trim()) parts.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) parts.push(current.trim());
  };
  for (const coarse of String(raw || '').split(/\s*(?:\||;|\n)\s*/)) {
    if (coarse.trim()) pushChunk(coarse);
  }
  return parts;
}

function addMapped(set, raw) {
  if (Array.isArray(raw)) {
    for (const item of raw) addMapped(set, item);
    return;
  }
  for (const part of splitDomainParts(raw)) {
    const mapped = canonicalizeDomain(part);
    if (mapped) set.add(mapped);
  }
}

function loadJson(name) {
  const filePath = resolve(process.cwd(), 'scripts/data', name);
  if (!existsSync(filePath)) return [];
  const rows = JSON.parse(readFileSync(filePath, 'utf8'));
  return Array.isArray(rows) ? rows : [];
}

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (!url || !serviceRoleKey) {
  console.error('NOT RUN: Supabase URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(2);
}

const domainsByReg = new Map();
function bucket(regNo) {
  const key = String(regNo || '').trim();
  if (!key) return null;
  if (!domainsByReg.has(key)) domainsByReg.set(key, new Set());
  return domainsByReg.get(key);
}

for (const row of loadJson('isc-selected-domains.json')) {
  const set = bucket(row.mujRegistrationNumber);
  if (set) addMapped(set, row.selectedDomains);
}

for (const row of [...loadJson('isc-jw-interviews.json'), ...loadJson('isc-unscheduled.json')]) {
  const set = bucket(row.mujRegistrationNumber);
  if (set) addMapped(set, row.domainInterests);
}

if (domainsByReg.size === 0) {
  console.error('NOT RUN: no domain rows found in scripts/data.');
  process.exit(2);
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
  list.push({ id: row.id, name: row.display_name });
  idsByReg.set(row.reg_no, list);
}

let updated = 0;
let missing = 0;
let multi = 0;
for (const [regNo, domainSet] of domainsByReg.entries()) {
  const rows = idsByReg.get(regNo) || [];
  if (rows.length === 0) {
    missing += 1;
    console.log(`missing candidate ${regNo}`);
    continue;
  }
  const domains = [...domainSet].join(' | ');
  if (domainSet.size > 1) {
    multi += 1;
    console.log(`multi ${regNo} ${rows[0]?.name}: ${domains}`);
  }
  const ids = rows.map((row) => row.id);
  const { error } = await supabase.from('applications').update({ domains }).in('candidate_id', ids);
  if (error) {
    console.error('FAILED: domain update for', regNo, error.message);
    process.exit(1);
  }
  updated += ids.length;
}

console.log(`Updated domains on ${updated} candidate application(s) across ${domainsByReg.size} registration numbers.`);
console.log(`Candidates with multiple preferred domains: ${multi}.`);
if (missing) console.log(`No candidate row for ${missing} registration number(s).`);
