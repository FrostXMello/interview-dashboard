# Security Foundation

This document describes the authentication, authorization, and data boundaries introduced in the security-foundation phase.

## Modes

| Mode | When | Auth | Data |
|------|------|------|------|
| `offline-demo` | Supabase env missing/invalid, or `NEXT_PUBLIC_APP_MODE=demo` | Demo persona picker (no passwords) | Synthetic candidates/applicants in the client; demo ratings in `localStorage` keys prefixed `interview_demo_*` |
| `connected` | Valid `NEXT_PUBLIC_SUPABASE_URL` + JWT anon key | Supabase Auth email/password; session cookies via `@supabase/ssr` | Postgres tables with RLS |

Connected mode is detected only when the anon key **looks like a JWT** (`eyJ...` with 3 segments). A placeholder key forces offline-demo.

## Identity model

```
auth.users (Supabase Auth identity)
    ↓
public.profiles (display name, role, title)
    ↓
public.panel_memberships (panel access)
    ↓
candidates / applications / ratings (authorized resources)
```

Passwords are never stored in application tables, React state, or browser storage.

## Roles

| Role | Candidate/application read | Rating read | Rating write | Admin ops |
|------|----------------------------|-------------|--------------|-----------|
| `panelist` | Panels they belong to | Own only | Own only | No |
| `senior_panelist` | Panels they belong to | Own + submitted ratings on accessible candidates | Own only | No |
| `admin` | All | All | Own (and admin updates) | Yes (status, memberships, schema ops) |

Enforcement: **Postgres RLS** in connected mode. Offline-demo mirrors the same rules in the repository for UX only (synthetic data).

## Applying migrations

1. Create/select a Supabase project.
2. Run migrations in order from `supabase/migrations/` in the SQL editor (or via Supabase CLI).
3. Create Auth users in the dashboard (or invite flow).
4. Set `profiles.role` and `panel_memberships` for each user using the **service role / SQL editor** (never from the browser client). New signups always receive `panelist` — role elevation is admin-only.
5. Seed `candidates` / `applications` with **non-production** data for demos.
6. Set Vercel/local env to the real URL + anon JWT (never a service_role key).
7. Execute `supabase/tests/rls_privilege_scenarios.sql` checks with real user tokens before calling RLS "verified".

## Role model

- **Global role** on `profiles.role`: `panelist` | `senior_panelist` | `admin`.
- **Panel scope** via `panel_memberships` (not embedded in the role string).
- `display_title` is cosmetic only.

## Git history remediation

Historical commits may still contain plaintext passwords and real applicant PII. See [GIT_HISTORY_REMEDIATION.md](./GIT_HISTORY_REMEDIATION.md). This phase does **not** rewrite Git history automatically.
