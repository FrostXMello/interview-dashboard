/**
 * Live RLS + Auth verification harness.
 *
 * Requires a real/local Supabase project. Does nothing if configuration is missing.
 * Never logs passwords, JWTs, or service-role keys.
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY  (JWT)
 *   SUPABASE_SERVICE_ROLE_KEY  (server-only; never NEXT_PUBLIC)
 *   VERIFY_TEST_PASSWORD       (optional; generated if omitted)
 *
 * Usage:
 *   npm run verify:rls
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[name]) process.env[name] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

function env(name) {
  return (process.env[name] || '').trim();
}

function looksLikeJwt(value) {
  return value.startsWith('eyJ') && value.split('.').length === 3;
}

function looksLikePublishableKey(value) {
  return value.startsWith('sb_publishable_') && value.length > 20;
}

function looksLikeSecretKey(value) {
  return value.startsWith('sb_secret_') && value.length > 16;
}

function looksLikeValidAnonKey(value) {
  return looksLikePublishableKey(value) || looksLikeJwt(value);
}

function looksLikeValidServiceKey(value) {
  return looksLikeSecretKey(value) || looksLikeJwt(value);
}

function failConfig(message) {
  console.error(`NOT RUN: ${message}`);
  process.exit(2);
}

const url = env('SUPABASE_URL') || env('NEXT_PUBLIC_SUPABASE_URL');
const anonKey = env('SUPABASE_ANON_KEY') || env('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');

if (!url) failConfig('Supabase URL is missing.');
if (!anonKey) failConfig('Anon/publishable key is missing.');
if (!looksLikeValidAnonKey(anonKey)) {
  failConfig('Anon key must be a JWT or sb_publishable_ key. Refusing to treat this as connected mode.');
}
if (!serviceKey) failConfig('SUPABASE_SERVICE_ROLE_KEY is missing (server-only; required to create test users).');
if (!looksLikeValidServiceKey(serviceKey)) failConfig('Service role key must be a JWT or sb_secret_ key.');
if (anonKey === serviceKey) failConfig('Anon key and service role key must not be identical.');

const password = env('VERIFY_TEST_PASSWORD') || `Tmp!${randomBytes(12).toString('hex')}`;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const anon = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const USERS = [
  { key: 'A', email: 'panelist-a@test.example', name: 'Panelist A', role: 'panelist', panels: [1] },
  { key: 'B', email: 'panelist-b@test.example', name: 'Panelist B', role: 'panelist', panels: [1] },
  { key: 'C', email: 'panelist-c@test.example', name: 'Panelist C', role: 'panelist', panels: [2] },
  { key: 'D', email: 'senior-d@test.example', name: 'Senior D', role: 'senior_panelist', panels: [1] },
  { key: 'E', email: 'admin-e@test.example', name: 'Admin E', role: 'admin', panels: [1, 2] }
];

function clientFor(accessToken) {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
}

async function ensureUser(spec) {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = (list?.users || []).find((u) => u.email === spec.email);
  let id = existing?.id;
  if (!id) {
    const created = await admin.auth.admin.createUser({
      email: spec.email,
      password,
      email_confirm: true,
      user_metadata: { display_name: spec.name }
    });
    if (created.error || !created.data.user) {
      throw new Error(`createUser ${spec.email}: ${created.error?.message || 'unknown'}`);
    }
    id = created.data.user.id;
  }

  const profile = await admin.from('profiles').upsert(
    { id, display_name: spec.name, role: spec.role, display_title: spec.name },
    { onConflict: 'id' }
  );
  if (profile.error) throw new Error(`profile ${spec.email}: ${profile.error.message}`);

  await admin.from('panel_memberships').delete().eq('profile_id', id);
  const membership = await admin
    .from('panel_memberships')
    .insert(spec.panels.map((panel_id) => ({ profile_id: id, panel_id })));
  if (membership.error) throw new Error(`membership ${spec.email}: ${membership.error.message}`);

  const session = await admin.auth.signInWithPassword({ email: spec.email, password });
  if (session.error || !session.data.session) {
    throw new Error(`signIn ${spec.email}: ${session.error?.message || 'no session'}`);
  }

  return { ...spec, id, accessToken: session.data.session.access_token };
}

async function seedDataset() {
  const candidates = await admin.from('candidates').upsert(
    [
      { id: 'p1-a', reg_no: 'TEST-P1A', display_name: 'Candidate P1-A', timing: '10:00 AM-10:10 AM', panel_id: 1, interview_day: 'day-1', status: 'pending' },
      { id: 'p1-b', reg_no: 'TEST-P1B', display_name: 'Candidate P1-B', timing: '10:10 AM-10:20 AM', panel_id: 1, interview_day: 'day-1', status: 'pending' },
      { id: 'p2-a', reg_no: 'TEST-P2A', display_name: 'Candidate P2-A', timing: '10:00 AM-10:10 AM', panel_id: 2, interview_day: 'day-1', status: 'pending' }
    ],
    { onConflict: 'id' }
  );
  if (candidates.error) throw new Error(candidates.error.message);

  const applications = await admin.from('applications').upsert(
    [
      { candidate_id: 'p1-a', email: 'p1a@test.example', program: 'Test', why_interested: 'Synthetic', commitment: 4 },
      { candidate_id: 'p1-b', email: 'p1b@test.example', program: 'Test', why_interested: 'Synthetic', commitment: 3 },
      { candidate_id: 'p2-a', email: 'p2a@test.example', program: 'Test', why_interested: 'Synthetic', commitment: 5 }
    ],
    { onConflict: 'candidate_id' }
  );
  if (applications.error) throw new Error(applications.error.message);
}

function outcome(ok) {
  return ok ? 'ALLOWED' : 'DENIED';
}

function record(id, expected, actual, extra = '') {
  const pass = expected === actual;
  console.log(`TEST ${id}`);
  console.log(`EXPECTED: ${expected}`);
  console.log(`ACTUAL: ${actual}${extra ? ` (${extra})` : ''}`);
  console.log(`RESULT: ${pass ? 'PASS' : 'FAIL'}`);
  console.log('');
  return pass;
}

async function main() {
  console.log('verify-rls: starting (credentials omitted)');

  const created = {};
  for (const spec of USERS) {
    created[spec.key] = await ensureUser(spec);
    console.log(`USER ${spec.key}: ${spec.email} role=${spec.role} panels=${spec.panels.join(',')}`);
  }

  await seedDataset();
  await admin.from('ratings').delete().in('candidate_id', ['p1-a', 'p1-b', 'p2-a']);

  const a = clientFor(created.A.accessToken);
  const b = clientFor(created.B.accessToken);
  const d = clientFor(created.D.accessToken);
  const e = clientFor(created.E.accessToken);

  const results = [];

  const t1 = await anon.from('candidates').select('id');
  results.push(record(1, 'DENIED', outcome(!t1.error && (t1.data || []).length > 0), t1.error?.code || `rows=${(t1.data || []).length}`));

  const t2 = await a.from('candidates').select('id').eq('id', 'p1-a');
  results.push(record(2, 'ALLOWED', outcome(!t2.error && (t2.data || []).length === 1)));

  const t3 = await a.from('candidates').select('id').eq('id', 'p2-a');
  results.push(record(3, 'DENIED', outcome(!t3.error && (t3.data || []).length > 0), `rows=${(t3.data || []).length}`));

  const seedOwn = await a.from('ratings').upsert({
    candidate_id: 'p1-a',
    panelist_id: created.A.id,
    interview_score: 6,
    scores: { 'Interview Score': 6 },
    comment: 'own-draft',
    submitted: false
  }, { onConflict: 'candidate_id,panelist_id' });
  if (seedOwn.error) throw new Error(`seed own rating: ${seedOwn.error.message}`);

  const t4 = await a.from('ratings').select('candidate_id').eq('panelist_id', created.A.id);
  results.push(record(4, 'ALLOWED', outcome(!t4.error && (t4.data || []).length >= 1)));

  const seedBDraft = await b.from('ratings').upsert({
    candidate_id: 'p1-a',
    panelist_id: created.B.id,
    interview_score: 5,
    scores: { 'Interview Score': 5 },
    comment: 'b-draft',
    submitted: false
  }, { onConflict: 'candidate_id,panelist_id' });
  if (seedBDraft.error) throw new Error(`seed B draft: ${seedBDraft.error.message}`);

  const t5 = await a.from('ratings').select('comment').eq('panelist_id', created.B.id).eq('submitted', false);
  results.push(record(5, 'DENIED', outcome(!t5.error && (t5.data || []).length > 0), `rows=${(t5.data || []).length}`));

  await b.from('ratings').update({ submitted: true, comment: 'b-submitted' })
    .eq('candidate_id', 'p1-a')
    .eq('panelist_id', created.B.id);

  const t6 = await a.from('ratings').select('comment').eq('panelist_id', created.B.id).eq('submitted', true);
  results.push(record(6, 'DENIED', outcome(!t6.error && (t6.data || []).length > 0), `rows=${(t6.data || []).length}`));

  const t7 = await d.from('ratings').select('comment').eq('panelist_id', created.B.id).eq('submitted', true);
  results.push(record(7, 'ALLOWED', outcome(!t7.error && (t7.data || []).length >= 1)));

  const t8 = await d.from('ratings').select('comment').eq('panelist_id', created.A.id).eq('submitted', false);
  results.push(record(8, 'DENIED', outcome(!t8.error && (t8.data || []).length > 0), `rows=${(t8.data || []).length}`));

  const t9 = await a.from('ratings').insert({
    candidate_id: 'p1-b',
    panelist_id: created.B.id,
    interview_score: 4,
    submitted: false
  });
  results.push(record(9, 'DENIED', outcome(!t9.error)));

  const t10 = await a.from('ratings').upsert({
    candidate_id: 'p1-b',
    panelist_id: created.A.id,
    interview_score: 7,
    scores: { 'Interview Score': 7 },
    submitted: false
  }, { onConflict: 'candidate_id,panelist_id' });
  results.push(record(10, 'ALLOWED', outcome(!t10.error)));

  const t11 = await a.from('ratings').update({ comment: 'hacked' }).eq('panelist_id', created.B.id).select('comment');
  results.push(record(11, 'DENIED', outcome(!t11.error && (t11.data || []).length > 0), t11.error?.code || `updated=${(t11.data || []).length}`));

  const t12 = await a.from('ratings').update({ comment: 'updated-own' }).eq('panelist_id', created.A.id).eq('candidate_id', 'p1-a').select('comment');
  results.push(record(12, 'ALLOWED', outcome(!t12.error && (t12.data || []).length >= 1)));

  const t13 = await a.from('ratings').insert({
    candidate_id: 'p2-a',
    panelist_id: created.A.id,
    interview_score: 3,
    submitted: false
  });
  results.push(record(13, 'DENIED', outcome(!t13.error)));

  const t14c = await a.from('candidates').update({ status: 'completed' }).eq('id', 'p1-a').select('status');
  const t14a = await a.from('applications').update({ program: 'Hacked' }).eq('candidate_id', 'p1-a').select('program');
  const t14Allowed = (!t14c.error && (t14c.data || []).length > 0) || (!t14a.error && (t14a.data || []).length > 0);
  results.push(record(14, 'DENIED', outcome(t14Allowed)));

  const t15 = await e.from('candidates').select('id');
  results.push(record(15, 'ALLOWED', outcome(!t15.error && (t15.data || []).length >= 3), `rows=${(t15.data || []).length}`));

  const t16 = await e.from('applications').select('candidate_id');
  results.push(record(16, 'ALLOWED', outcome(!t16.error && (t16.data || []).length >= 3)));

  const t17 = await e.from('ratings').select('panelist_id');
  results.push(record(17, 'ALLOWED', outcome(!t17.error && (t17.data || []).length >= 1)));

  const t18 = await e.from('candidates').update({ status: 'interviewing' }).eq('id', 'p1-b').select('status');
  results.push(record(18, 'ALLOWED', outcome(!t18.error && t18.data?.[0]?.status === 'interviewing')));

  const invalid = await anon.auth.signInWithPassword({
    email: 'panelist-a@test.example',
    password: 'definitely-wrong-password'
  });
  console.log('AUTH invalid credentials: EXPECTED DENIED');
  console.log(`AUTH invalid credentials: ACTUAL ${invalid.error ? 'DENIED' : 'ALLOWED'}`);
  console.log(`AUTH invalid credentials: RESULT ${invalid.error ? 'PASS' : 'FAIL'}`);
  results.push(Boolean(invalid.error));

  const passed = results.filter(Boolean).length;
  const failed = results.length - passed;
  console.log(`SUMMARY: ${passed} passed, ${failed} failed of ${results.length}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('VERIFY FAILED:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});
