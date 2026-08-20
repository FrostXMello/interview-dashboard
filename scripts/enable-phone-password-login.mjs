import { execFileSync } from 'node:child_process';

const token = execFileSync(
  'powershell',
  ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/_read-cli-token.ps1'],
  { encoding: 'utf8' }
).trim();
const projectRef = 'zdvslkzmgnxvpunrlbrn';

const getRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  headers: { Authorization: `Bearer ${token}` }
});
const current = await getRes.json();
if (!getRes.ok) {
  console.error('GET auth config failed', getRes.status);
  process.exit(1);
}

const patchRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    external_phone_enabled: true,
    sms_autoconfirm: true,
    sms_otp_length: current.sms_otp_length || 6,
    sms_template: current.sms_template || 'Your code is {{ .Code }}'
  })
});
const patched = await patchRes.text();
console.log('PATCH status', patchRes.status);
console.log(patched.slice(0, 400));
if (!patchRes.ok) process.exit(1);
console.log('Phone provider enable requested.');
