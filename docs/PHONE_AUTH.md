# Phone registration, OTP, and password login

Connected-mode authentication is **allowlisted phone + OTP verification + user-chosen password**, using Supabase Auth.

Offline-demo mode is unchanged: pick a synthetic persona. Demo never sends OTP and never creates Auth users.

## Flows

**Register:** phone → allowlist RPC → name → SMS OTP → verify → set password → sign out → login.

**Login:** phone + password (`signInWithPassword`).

**Forgot password:** phone → reset-eligibility RPC → OTP → verify → new password.

The client never receives the allowlist. It only learns whether *this* number may continue.

## Database

Table `allowed_phones` (admin RLS only).

RPCs (SECURITY DEFINER, return status strings only):

- `check_phone_eligibility(p_phone)` → `can_register` | `already_registered` | `not_authorized` | `invalid`
- `check_phone_reset_eligibility(p_phone)` → `can_reset` | `not_eligible` | `invalid`
- `complete_phone_onboarding(p_display_name)` — claims the allowlist row for `auth.uid()`, sets profile name, **never accepts a role**

`handle_new_user` still forces `role = panelist` and **rejects** Auth user creation when the phone is not allowlisted.

## Seed allowlist (no frontend list)

```bash
ALLOWED_PHONES=+9198XXXXXXXX,+9198YYYYYYYY npm run seed:allowed-phones
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in the shell (never `NEXT_PUBLIC_*`).

Or run `supabase/seeds/allowed_phones.example.sql` in the SQL editor after replacing placeholders.

## Development test OTP (no real SMS spend)

In the [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Phone**:

1. Enable Phone provider.
2. Add **test phone numbers** with a **test OTP** (Dashboard feature — not this repo).
3. Insert the same E.164 number into `allowed_phones`.
4. In this app, register/login using that number and the Dashboard OTP.

Example (synthetic, not a real person):

- Test phone configured in Dashboard, e.g. `+919999999001`
- Test OTP configured in Dashboard, e.g. `123456`
- Allowlist row for `+919999999001`

**Production** must use a real SMS provider (Twilio, MessageBird, etc.) configured in Supabase. This application does not send SMS itself and does not hardcode OTPs.

## Required Supabase Auth settings (connected mode)

- Phone provider enabled
- Users can sign in with phone + password after `updateUser({ password })`
- SMS provider for production

Until those are configured, OTP send/verify will fail at runtime even if the Next.js app is running.
