import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const token = execFileSync(
  'powershell',
  ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/_read-cli-token.ps1'],
  { encoding: 'utf8' }
).trim();

async function run(label, sql) {
  const res = await fetch('https://api.supabase.com/v1/projects/zdvslkzmgnxvpunrlbrn/database/query', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  console.log(label, res.status, text.slice(0, 400));
  if (!res.ok) process.exit(1);
}

await run(
  'step1',
  readFileSync('scripts/bootstrap-super-admin-profile-step1.sql', 'utf8')
);
await run(
  'step2',
  readFileSync('scripts/bootstrap-super-admin-profile-step2.sql', 'utf8')
);

console.log('Super Admin profile bootstrap complete.');
