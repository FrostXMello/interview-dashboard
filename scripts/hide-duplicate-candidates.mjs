/**
 * Soft-hide extra interview slots for the same registration number.
 * Keeps the earliest active slot (day-1 before day-2, then earlier time).
 * If a later slot already has ratings, that slot is kept instead.
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

function parseTimingStartMinutes(timing) {
  const normalized = String(timing || '').replace(/[–—]/g, '-').trim();
  if (!normalized || normalized.toUpperCase() === 'TBD') return Number.POSITIVE_INFINITY;
  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})/);
  const meridiemMatch = normalized.match(/\b(AM|PM)\b/i);
  if (!timeMatch || !meridiemMatch) return Number.POSITIVE_INFINITY;
  const hourRaw = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const meridiem = meridiemMatch[1].toUpperCase();
  let hour = hourRaw % 12;
  if (meridiem === 'PM') hour += 12;
  return hour * 60 + minute;
}

function dayRank(day) {
  if (day === 'day-1') return 0;
  if (day === 'day-2') return 1;
  return 2;
}

function slotRank(row) {
  return [dayRank(row.interview_day), parseTimingStartMinutes(row.timing), row.panel_id || 99];
}

function isEarlier(a, b) {
  const ra = slotRank(a);
  const rb = slotRank(b);
  for (let i = 0; i < ra.length; i += 1) {
    if (ra[i] !== rb[i]) return ra[i] < rb[i];
  }
  return String(a.id).localeCompare(String(b.id)) < 0;
}

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (!url || !key) {
  console.error('NOT RUN: Supabase URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: candidates, error: candidateError } = await supabase
  .from('candidates')
  .select('id, reg_no, display_name, interview_day, timing, panel_id, is_active');
if (candidateError) {
  console.error('FAILED: could not list candidates.', candidateError.message);
  process.exit(1);
}

const { data: ratings, error: ratingError } = await supabase.from('ratings').select('candidate_id, submitted');
if (ratingError) {
  console.error('FAILED: could not list ratings.', ratingError.message);
  process.exit(1);
}

const ratedIds = new Set((ratings || []).map((row) => row.candidate_id).filter(Boolean));

const byReg = new Map();
for (const row of candidates || []) {
  const list = byReg.get(row.reg_no) || [];
  list.push(row);
  byReg.set(row.reg_no, list);
}

let changed = 0;
for (const [, rows] of byReg.entries()) {
  if (rows.length < 2) continue;
  const withRatings = rows.filter((row) => ratedIds.has(row.id));
  const keep = (withRatings.length > 0 ? withRatings : rows).reduce((best, row) =>
    isEarlier(row, best) ? row : best
  );
  for (const row of rows) {
    const shouldBeActive = row.id === keep.id;
    if (Boolean(row.is_active !== false) === shouldBeActive) continue;
    const { error } = await supabase.from('candidates').update({ is_active: shouldBeActive }).eq('id', row.id);
    if (error) {
      console.error('FAILED: could not update', row.id, error.message);
      process.exit(1);
    }
    changed += 1;
    console.log(
      `${shouldBeActive ? 'keep' : 'hide'} ${row.display_name} ${row.reg_no} ${row.interview_day} ${row.timing} panel ${row.panel_id} (${row.id})`
    );
  }
}

console.log(changed ? `Updated ${changed} duplicate interview slot(s).` : 'No duplicate slot changes needed.');
