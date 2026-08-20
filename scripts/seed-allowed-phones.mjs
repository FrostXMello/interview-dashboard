/**
 * Admin/operator seed for allowed_phones.
 * Reads ALLOWED_PHONES as a comma-separated E.164 list from the environment.
 * Never commit real numbers. Never uses NEXT_PUBLIC_*.
 *
 *   ALLOWED_PHONES=+9198XXXXXXXX,+9198YYYYYYYY npm run seed:allowed-phones
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
    let value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[name]) process.env[name] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

function normalize(input) {
  const trimmed = String(input || '').trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (hasPlus && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const list = (process.env.ALLOWED_PHONES || '').split(',').map((s) => s.trim()).filter(Boolean);

if (!url || !serviceKey) {
  console.error('NOT RUN: SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(2);
}
if (!list.length) {
  console.error('NOT RUN: set ALLOWED_PHONES to a comma-separated E.164 list.');
  process.exit(2);
}

const phones = list.map(normalize).filter(Boolean);
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { error } = await admin.from('allowed_phones').upsert(
  phones.map((phone_e164) => ({ phone_e164, can_register: true })),
  { onConflict: 'phone_e164' }
);
if (error) {
  console.error('SEED FAILED:', error.message);
  process.exit(1);
}
console.log(`Seeded ${phones.length} allowlisted phone number(s). Values not printed.`);
