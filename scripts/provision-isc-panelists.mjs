/**
 * Provision ISC panelists from scripts/data/isc-panelists.json.
 * Generates a 6-digit password per account (except existing Super Admin).
 */
import { createClient } from '@supabase/supabase-js';
import { randomInt } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

function normalizePhoneE164(input, defaultCountryCallingCode = '91') {
  const trimmed = String(input || '').trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  const cc = String(defaultCountryCallingCode || '91').replace(/\D/g, '') || '91';
  if (digits.length < 8) return null;
  if (hasPlus) return digits.length <= 15 ? `+${digits}` : null;
  if (cc === '91' && digits.length === 10) return `+91${digits}`;
  if (cc === '91' && digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (cc === '91' && digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length >= 8 && digits.length + cc.length <= 15) return `+${cc}${digits}`;
  return digits.length <= 15 ? `+${digits}` : null;
}

function mapAppRole(person) {
  const permissions = Array.isArray(person.permissions) ? person.permissions : [];
  const title = `${person.role || ''} ${person.committee || ''}`.toLowerCase();
  if (permissions.includes('super_admin') || title.includes('super admin')) return 'super_admin';
  if (permissions.includes('admin') || title.includes('president')) return 'admin';
  if (title.includes('core')) return 'senior_panelist';
  return 'panelist';
}

function sixDigitPassword() {
  return String(randomInt(100000, 1000000));
}

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (!url || !serviceRoleKey) {
  console.error('NOT RUN: Supabase URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(2);
}

const payload = JSON.parse(readFileSync(resolve(process.cwd(), 'scripts/data/isc-panelists.json'), 'utf8'));
const people = payload.panelists || payload;
if (!Array.isArray(people) || people.length === 0) {
  console.error('NOT RUN: panelist list is empty.');
  process.exit(2);
}

const passwordFile = resolve(process.cwd(), 'scripts/data/login-passwords.json');
const passwordByPhone = existsSync(passwordFile)
  ? JSON.parse(readFileSync(passwordFile, 'utf8'))
  : {};

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function findUserByPhone(targetPhone) {
  const digits = targetPhone.replace(/\D/g, '');
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find((user) => {
      const userDigits = String(user.phone || '').replace(/\D/g, '');
      return user.phone === targetPhone || userDigits === digits || userDigits.endsWith(digits.slice(-10));
    });
    if (match) return match;
    if (users.length < 200) return null;
    page += 1;
  }
}

const usedPasswords = new Set();
function uniquePassword() {
  let value = sixDigitPassword();
  while (usedPasswords.has(value)) value = sixDigitPassword();
  usedPasswords.add(value);
  return value;
}

const results = [];

for (const person of people) {
  const phone = normalizePhoneE164(person.phoneNumber || person.phone);
  const name = String(person.name || '').trim();
  const displayTitle = [person.role, person.committee].filter(Boolean).join(' · ');
  const role = mapAppRole(person);
  if (!phone || !name) {
    results.push({ name, phone: person.phoneNumber, status: 'skipped-invalid' });
    continue;
  }

  const national = phone.replace(/\D/g, '').slice(-10);
  const password =
    String(person.password || passwordByPhone[national] || '').trim() ||
    (role === 'super_admin' ? (process.env.SUPER_ADMIN_PASSWORD || '') : '') ||
    uniquePassword();
  const email = `${national}@interviews.local`;

  try {
    let authUser = await findUserByPhone(phone);
    if (!authUser) {
      if (!password) {
        results.push({ name, phone, status: 'skipped-missing-password' });
        continue;
      }
      const created = await supabase.auth.admin.createUser({
        phone,
        email,
        password,
        phone_confirm: true,
        email_confirm: true,
        user_metadata: { display_name: name, display_title: displayTitle }
      });
      if (created.error || !created.data.user) {
        throw new Error(created.error?.message || 'createUser failed');
      }
      authUser = created.data.user;
    } else {
      const updated = await supabase.auth.admin.updateUserById(authUser.id, {
        phone,
        email,
        ...(password ? { password } : {}),
        phone_confirm: true,
        email_confirm: true,
        user_metadata: {
          ...(authUser.user_metadata || {}),
          display_name: name,
          display_title: displayTitle
        }
      });
      if (updated.error) throw new Error(updated.error.message);
    }

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: authUser.id,
        display_name: name,
        display_title: displayTitle,
        role,
        is_active: true
      },
      { onConflict: 'id' }
    );
    if (profileError) throw new Error(profileError.message);

    if (role !== 'super_admin') {
      await supabase.from('panel_memberships').delete().eq('profile_id', authUser.id);
      const { error: membershipError } = await supabase.from('panel_memberships').insert([
        { profile_id: authUser.id, panel_id: 1 },
        { profile_id: authUser.id, panel_id: 2 }
      ]);
      if (membershipError) throw new Error(membershipError.message);
    }

    results.push({
      name,
      phone,
      loginPhone: national,
      password,
      role,
      title: displayTitle,
      status: 'ok'
    });
  } catch (error) {
    results.push({
      name,
      phone,
      loginPhone: national,
      password,
      role,
      title: displayTitle,
      status: `failed: ${error instanceof Error ? error.message : 'unknown'}`
    });
  }
}

const outDir = resolve(process.cwd(), 'scripts/data');
mkdirSync(outDir, { recursive: true });
const lines = ['Name,Phone,Password,Role,Title,Status'];
for (const row of results) {
  lines.push(
    [row.name, row.loginPhone || row.phone, row.password || '', row.role || '', row.title || '', row.status]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(',')
  );
}
writeFileSync(resolve(outDir, 'panelist-credentials.csv'), `${lines.join('\n')}\n`);

const ok = results.filter((row) => row.status === 'ok').length;
const failed = results.filter((row) => row.status !== 'ok');
console.log(`Provisioned ${ok}/${results.length} accounts.`);
if (failed.length) {
  console.log('Failures:');
  for (const row of failed) console.log(`- ${row.name}: ${row.status}`);
}
console.log('Credentials written to scripts/data/panelist-credentials.csv');
for (const row of results.filter((item) => item.status === 'ok')) {
  console.log(`${row.name}\t${row.loginPhone}\t${row.password}\t${row.role}`);
}
