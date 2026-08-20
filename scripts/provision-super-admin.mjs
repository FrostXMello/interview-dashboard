/**
 * Idempotent Super Admin provisioning.
 *
 * Required env:
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPER_ADMIN_PHONE
 * - SUPER_ADMIN_PASSWORD
 *
 * Optional env:
 * - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 * - SUPER_ADMIN_DISPLAY_NAME
 * - SUPER_ADMIN_DISPLAY_TITLE
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

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const rawPhone = (process.env.SUPER_ADMIN_PHONE || '').trim();
const password = (process.env.SUPER_ADMIN_PASSWORD || '').trim();
const displayName = (process.env.SUPER_ADMIN_DISPLAY_NAME || 'Super Admin').trim();
const displayTitle = (process.env.SUPER_ADMIN_DISPLAY_TITLE || 'Super Admin').trim();
const phone = normalizePhoneE164(rawPhone);

if (!url || !serviceRoleKey) {
  console.error('NOT RUN: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(2);
}
if (!phone) {
  console.error('NOT RUN: SUPER_ADMIN_PHONE must be a valid phone number.');
  process.exit(2);
}
if (!password) {
  console.error('NOT RUN: SUPER_ADMIN_PASSWORD is required.');
  process.exit(2);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function findUserByPhone(targetPhone) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find((user) => user.phone === targetPhone);
    if (match) return match;
    if (users.length < 200) return null;
    page += 1;
  }
}

async function findExistingSuperAdminProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'super_admin');
  if (error) throw error;
  if ((data || []).length > 1) {
    throw new Error('Multiple super_admin profiles already exist. Resolve manually before reprovisioning.');
  }
  return data?.[0] || null;
}

let authUser = null;
const existingSuperAdmin = await findExistingSuperAdminProfile();
if (existingSuperAdmin?.id) {
  const { data, error } = await supabase.auth.admin.getUserById(existingSuperAdmin.id);
  if (error) {
    console.error('PROVISION FAILED: could not load existing super admin auth user.');
    process.exit(1);
  }
  authUser = data.user;
}

if (!authUser) {
  authUser = await findUserByPhone(phone);
}

if (!authUser) {
  const { data, error } = await supabase.auth.admin.createUser({
    phone,
    password,
    phone_confirm: true,
    user_metadata: {
      display_name: displayName,
      display_title: displayTitle
    }
  });
  if (error || !data.user) {
    console.error('PROVISION FAILED: could not create auth user.');
    process.exit(1);
  }
  authUser = data.user;
} else {
  const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
    phone,
    password,
    phone_confirm: true,
    user_metadata: {
      ...(authUser.user_metadata || {}),
      display_name: displayName,
      display_title: displayTitle
    }
  });
  if (error) {
    console.error('PROVISION FAILED: could not update auth user.');
    process.exit(1);
  }
}

const { error: profileError } = await supabase.from('profiles').upsert(
  {
    id: authUser.id,
    display_name: displayName,
    display_title: displayTitle,
    role: 'super_admin'
  },
  { onConflict: 'id' }
);

if (profileError) {
  console.error('PROVISION FAILED: could not upsert profile.');
  process.exit(1);
}

console.log('Super admin provisioned successfully. Secrets were not printed.');
