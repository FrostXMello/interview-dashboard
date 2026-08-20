/**
 * Apply supabase/migrations to the linked remote project via Management API.
 * Uses Supabase CLI access token from Windows Credential Manager.
 * Does not print secrets.
 */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);

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

const projectRef =
  (process.env.SUPABASE_PROJECT_REF || '').trim() ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ||
  '';

if (!projectRef) {
  console.error('NOT RUN: Could not determine Supabase project ref.');
  process.exit(2);
}

function readCliAccessToken() {
  const scriptPath = resolve(process.cwd(), 'scripts/_read-cli-token.ps1');
  try {
    const token = execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
      { encoding: 'utf8' }
    ).trim();
    return token || null;
  } catch {
    return null;
  }
}

const token = readCliAccessToken();
if (!token) {
  console.error('NOT RUN: Supabase CLI access token not found. Run `supabase login` first.');
  process.exit(2);
}

const migrationsDir = resolve(process.cwd(), 'supabase/migrations');
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();
const sql = files.map((f) => readFileSync(resolve(migrationsDir, f), 'utf8')).join('\n');

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: sql })
});

const body = await response.text();
if (!response.ok) {
  console.error(`MIGRATION FAILED: HTTP ${response.status}`);
  console.error(body.slice(0, 1200));
  process.exit(1);
}

console.log('Migrations applied successfully.');
if (body.trim()) console.log(body.slice(0, 400));
