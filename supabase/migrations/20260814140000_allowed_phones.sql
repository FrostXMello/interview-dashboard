-- Allowlisted phone registration (no secrets, no OTPs, no passwords).
-- Eligibility is exposed only as a boolean/status RPC — never the full list.

create table if not exists public.allowed_phones (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null,
  can_register boolean not null default true,
  registered_at timestamptz,
  registered_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint allowed_phones_e164_format check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create unique index if not exists allowed_phones_phone_e164_uidx on public.allowed_phones (phone_e164);
create unique index if not exists allowed_phones_one_profile_uidx
  on public.allowed_phones (registered_profile_id)
  where registered_profile_id is not null;

drop trigger if exists allowed_phones_updated_at on public.allowed_phones;
create trigger allowed_phones_updated_at
  before update on public.allowed_phones
  for each row execute function public.handle_updated_at();

alter table public.allowed_phones enable row level security;

revoke all on public.allowed_phones from anon;
revoke all on public.allowed_phones from authenticated;

grant select, insert, update, delete on public.allowed_phones to authenticated;

drop policy if exists allowed_phones_admin_all on public.allowed_phones;
create policy allowed_phones_admin_all on public.allowed_phones
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Phone normalization (E.164). Default region IN (+91) for 10-digit local input.
-- ---------------------------------------------------------------------------

create or replace function public.normalize_phone_e164(p_input text, p_default_cc text default '91')
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_raw text := coalesce(p_input, '');
  v_has_plus boolean := left(trim(v_raw), 1) = '+';
  v_digits text := regexp_replace(v_raw, '[^0-9]', '', 'g');
  v_cc text := regexp_replace(coalesce(p_default_cc, '91'), '[^0-9]', '', 'g');
begin
  if v_digits is null or length(v_digits) < 8 then
    return null;
  end if;

  if v_has_plus then
    if length(v_digits) between 8 and 15 then
      return '+' || v_digits;
    end if;
    return null;
  end if;

  if v_cc = '91' and length(v_digits) = 10 then
    return '+91' || v_digits;
  end if;

  if v_cc = '91' and length(v_digits) = 11 and left(v_digits, 1) = '0' then
    return '+91' || substring(v_digits from 2);
  end if;

  if v_cc = '91' and length(v_digits) = 12 and left(v_digits, 2) = '91' then
    return '+' || v_digits;
  end if;

  if length(v_digits) between 8 and 15 - length(v_cc) then
    return '+' || v_cc || v_digits;
  end if;

  if length(v_digits) between 8 and 15 then
    return '+' || v_digits;
  end if;

  return null;
end;
$$;

revoke all on function public.normalize_phone_e164(text, text) from public;
grant execute on function public.normalize_phone_e164(text, text) to anon, authenticated;

-- Returns a coarse status only. Never returns other phone numbers.
create or replace function public.check_phone_eligibility(p_phone text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_phone text := public.normalize_phone_e164(p_phone, '91');
  v_row public.allowed_phones%rowtype;
begin
  if v_phone is null then
    return 'invalid';
  end if;

  select * into v_row
  from public.allowed_phones
  where phone_e164 = v_phone;

  if not found or v_row.can_register is not true then
    return 'not_authorized';
  end if;

  if v_row.registered_profile_id is not null or v_row.registered_at is not null then
    return 'already_registered';
  end if;

  return 'can_register';
end;
$$;

revoke all on function public.check_phone_eligibility(text) from public;
grant execute on function public.check_phone_eligibility(text) to anon, authenticated;

-- Reset eligibility: allowlisted + already registered. Generic denial otherwise.
create or replace function public.check_phone_reset_eligibility(p_phone text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_phone text := public.normalize_phone_e164(p_phone, '91');
  v_row public.allowed_phones%rowtype;
begin
  if v_phone is null then
    return 'invalid';
  end if;

  select * into v_row
  from public.allowed_phones
  where phone_e164 = v_phone;

  if found
     and v_row.can_register is true
     and (v_row.registered_profile_id is not null or v_row.registered_at is not null) then
    return 'can_reset';
  end if;

  return 'not_eligible';
end;
$$;

revoke all on function public.check_phone_reset_eligibility(text) from public;
grant execute on function public.check_phone_reset_eligibility(text) to anon, authenticated;

-- Completes onboarding after OTP verification. Role is never taken from the client.
create or replace function public.complete_phone_onboarding(p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_phone text;
  v_name text := trim(coalesce(p_display_name, ''));
  v_updated integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if length(v_name) < 2 then
    raise exception 'display name required' using errcode = '22023';
  end if;

  select phone into v_phone from auth.users where id = v_uid;
  v_phone := public.normalize_phone_e164(v_phone, '91');

  if v_phone is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.allowed_phones
  set
    registered_at = coalesce(registered_at, now()),
    registered_profile_id = v_uid
  where phone_e164 = v_phone
    and can_register = true
    and (registered_profile_id is null or registered_profile_id = v_uid);

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.profiles
  set
    display_name = v_name,
    display_title = coalesce(display_title, 'Panelist')
  where id = v_uid;
end;
$$;

revoke all on function public.complete_phone_onboarding(text) from public;
grant execute on function public.complete_phone_onboarding(text) to authenticated;

-- Enforce allowlist when Auth creates a user with a phone (blocks client bypass of RPC).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := public.normalize_phone_e164(new.phone, '91');
begin
  if v_phone is not null then
    if not exists (
      select 1
      from public.allowed_phones ap
      where ap.phone_e164 = v_phone
        and ap.can_register = true
        and (ap.registered_profile_id is null or ap.registered_profile_id = new.id)
    ) then
      raise exception 'phone is not authorized to register' using errcode = '42501';
    end if;
  end if;

  insert into public.profiles (id, display_name, role, display_title)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, new.phone, 'user'), '@', 1), 'Panelist'),
    'panelist',
    new.raw_user_meta_data->>'display_title'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
