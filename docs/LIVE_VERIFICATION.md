# Live verification (operator checklist)

This project **cannot claim live Auth/RLS verification** until the steps below succeed against a real or local Supabase instance.

## Current workstation (as of last inspection)

| Item | Status |
|------|--------|
| Supabase CLI | Present (`supabase --version` 2.98.2) |
| Docker Desktop daemon | **Not running** — `supabase start` cannot run |
| `psql` | Absent |
| `supabase/config.toml` | Present (after `supabase init`) |
| Linked remote project | Absent |
| `.env.local` URL | Present but **does not resolve (NXDOMAIN)** |
| `.env.local` anon key | Present but **not a JWT** → app stays in offline-demo |

**Verification path: D** — no usable database. Do not treat unit tests as live RLS.

## PATH B — Local Supabase (preferred when Docker works)

1. Start Docker Desktop and confirm `docker ps` works.
2. From `interview-dashboard/`:

```bash
supabase start
```

3. Copy the printed `API URL` and `anon key` (JWT) into `.env.local`.
4. Copy the printed `service_role key` into a **shell session only** (never `NEXT_PUBLIC_*`, never commit):

```bash
# PowerShell example — do not commit these values
$env:NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon jwt>"
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role jwt>"
```

5. Apply migrations (local start usually auto-applies `supabase/migrations/`):

```bash
supabase db reset
```

6. Run the harness:

```bash
npm run verify:rls
```

Expected: process exit `0` and every `TEST n` line `RESULT: PASS`.

7. Optional Auth UI check: `npm run dev`, sign in as `panelist-a@test.example` using the password you set in `VERIFY_TEST_PASSWORD`.

## PATH A — Hosted Supabase (only after DNS + JWT are valid)

1. Create/select a **development** project (do not target unknown production).
2. Confirm the project URL resolves (`nslookup <project>.supabase.co`).
3. Put the **anon/publishable JWT** in `.env.local` (`NEXT_PUBLIC_SUPABASE_*` only).
4. Apply migrations in order via SQL editor or `supabase db push` (linked **dev** project):
   - `20260813120000_security_foundation.sql`
   - `20260813133000_fix_rls_privilege_gaps.sql`
   - `20260814120000_authenticated_write_grants.sql`
5. Export `SUPABASE_SERVICE_ROLE_KEY` in the shell (Dashboard → Settings → API). Never prefix with `NEXT_PUBLIC_`.
6. `npm run verify:rls`

## PATH C — Docker/Postgres without Supabase

Not recommended. Auth (`auth.users`, `auth.uid()`) is required for these RLS policies. Use PATH B instead.

## What the harness proves

Creates synthetic users:

| ID | Email | Role | Panels |
|----|-------|------|--------|
| A | panelist-a@test.example | panelist | 1 |
| B | panelist-b@test.example | panelist | 1 |
| C | panelist-c@test.example | panelist | 2 |
| D | senior-d@test.example | senior_panelist | 1 |
| E | admin-e@test.example | admin | 1, 2 |

Then executes TESTS 1–18 from the live-verification brief against PostgREST with each user's access token.

## What unit tests prove (not live)

`npm test` covers authorization invariants, isolation expected results, mode detection, and middleware **decisions**. They do **not** execute Postgres RLS.

## Git history

Do not rewrite history in this phase. See `docs/GIT_HISTORY_REMEDIATION.md`.
