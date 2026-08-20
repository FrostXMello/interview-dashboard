-- Security foundation schema + RLS
-- Apply via Supabase SQL editor or `supabase db push` when the CLI is available.
--
-- ASSUMPTIONS:
-- 1) Auth identity lives in auth.users (Supabase Auth). Application profile is public.profiles.
-- 2) Roles: panelist | senior_panelist | admin
-- 3) Panelists may read/write ONLY their own ratings.
-- 4) Senior panelists may read ratings for candidates on panels they belong to (review),
--    but still write only their own ratings.
-- 5) Admins may read/write broadly for operations.
-- 6) Candidate + application PII is readable only by members of the candidate's panel (or admin).

create extension if not exists "pgcrypto";

do $$ begin
  create type public.app_role as enum ('panelist', 'senior_panelist', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.panels (
  id integer primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.panels (id, name) values
  (1, 'Panel 1'),
  (2, 'Panel 2')
on conflict (id) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role public.app_role not null default 'panelist',
  display_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.panel_memberships (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  panel_id integer not null references public.panels (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, panel_id)
);

create index if not exists panel_memberships_panel_id_idx on public.panel_memberships (panel_id);

create table if not exists public.candidates (
  id text primary key,
  reg_no text not null,
  display_name text not null,
  timing text not null default 'TBD',
  panel_id integer not null references public.panels (id),
  interview_day text not null default 'day-1' check (interview_day in ('day-1', 'day-2')),
  status text not null default 'pending' check (status in ('pending', 'interviewing', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidates_panel_id_idx on public.candidates (panel_id);
create index if not exists candidates_reg_no_idx on public.candidates (reg_no);

create table if not exists public.applications (
  candidate_id text primary key references public.candidates (id) on delete cascade,
  email text,
  phone text,
  program text,
  why_interested text,
  domains text,
  proficiencies jsonb not null default '{}'::jsonb,
  commitment integer check (commitment is null or (commitment between 1 and 5)),
  experience text,
  cv_link text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  candidate_id text not null references public.candidates (id) on delete cascade,
  panelist_id uuid not null references public.profiles (id) on delete cascade,
  interview_score integer check (interview_score is null or (interview_score between 1 and 10)),
  scores jsonb not null default '{}'::jsonb,
  comment text not null default '',
  best_domain text not null default '',
  domain_priorities text[] not null default '{}',
  submitted boolean not null default false,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ratings_candidate_panelist_unique unique (candidate_id, panelist_id),
  constraint ratings_domain_priorities_len check (cardinality(domain_priorities) <= 3)
);

create index if not exists ratings_candidate_id_idx on public.ratings (candidate_id);
create index if not exists ratings_panelist_id_idx on public.ratings (panelist_id);
create index if not exists ratings_submitted_idx on public.ratings (submitted);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer, locked search_path)
-- ---------------------------------------------------------------------------

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.is_senior_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('senior_panelist', 'admin')
  );
$$;

create or replace function public.member_of_panel(target_panel integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1 from public.panel_memberships pm
      where pm.profile_id = auth.uid() and pm.panel_id = target_panel
    );
$$;

create or replace function public.can_access_candidate(target_candidate_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.candidates c
      join public.panel_memberships pm
        on pm.panel_id = c.panel_id and pm.profile_id = auth.uid()
      where c.id = target_candidate_id
    );
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists candidates_updated_at on public.candidates;
create trigger candidates_updated_at
  before update on public.candidates
  for each row execute function public.handle_updated_at();

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.handle_updated_at();

drop trigger if exists ratings_updated_at on public.ratings;
create trigger ratings_updated_at
  before update on public.ratings
  for each row execute function public.handle_updated_at();

-- Auto-create a minimal profile row when a user signs up (role defaults to panelist).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role, display_title)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Panelist'),
    'panelist',
    new.raw_user_meta_data->>'display_title'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.panel_memberships enable row level security;
alter table public.panels enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;
alter table public.ratings enable row level security;

-- Panels: authenticated members can read panel labels
drop policy if exists panels_select_authenticated on public.panels;
create policy panels_select_authenticated on public.panels
  for select to authenticated
  using (auth.uid() is not null);

drop policy if exists panels_admin_write on public.panels;
create policy panels_admin_write on public.panels
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Profiles
drop policy if exists profiles_select_scoped on public.profiles;
create policy profiles_select_scoped on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (
      public.is_senior_or_admin()
      and exists (
        select 1
        from public.panel_memberships mine
        join public.panel_memberships theirs
          on theirs.panel_id = mine.panel_id
        where mine.profile_id = auth.uid()
          and theirs.profile_id = profiles.id
      )
    )
  );

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    (id = auth.uid() and role = public.current_profile_role())
    or public.is_admin()
  );

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_insert_self_panelist_or_admin on public.profiles
  for insert to authenticated
  with check (
    (id = auth.uid() and role = 'panelist')
    or public.is_admin()
  );

-- Panel memberships
drop policy if exists panel_memberships_select_scoped on public.panel_memberships;
create policy panel_memberships_select_scoped on public.panel_memberships
  for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_admin()
    or public.member_of_panel(panel_id)
  );

drop policy if exists panel_memberships_admin_write on public.panel_memberships;
create policy panel_memberships_admin_write on public.panel_memberships
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Candidates
drop policy if exists candidates_select_panel_or_admin on public.candidates;
create policy candidates_select_panel_or_admin on public.candidates
  for select to authenticated
  using (public.member_of_panel(panel_id));

drop policy if exists candidates_admin_write on public.candidates;
create policy candidates_admin_write on public.candidates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Applications (PII)
drop policy if exists applications_select_panel_or_admin on public.applications;
create policy applications_select_panel_or_admin on public.applications
  for select to authenticated
  using (public.can_access_candidate(candidate_id));

drop policy if exists applications_admin_write on public.applications;
create policy applications_admin_write on public.applications
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Ratings: confidential evaluations
drop policy if exists ratings_select_own_or_reviewer on public.ratings;
create policy ratings_select_own_or_reviewer on public.ratings
  for select to authenticated
  using (
    panelist_id = auth.uid()
    or public.is_admin()
    or (
      public.current_profile_role() = 'senior_panelist'
      and submitted = true
      and public.can_access_candidate(candidate_id)
    )
  );

drop policy if exists ratings_insert_own on public.ratings;
create policy ratings_insert_own on public.ratings
  for insert to authenticated
  with check (
    panelist_id = auth.uid()
    and public.can_access_candidate(candidate_id)
  );

drop policy if exists ratings_update_own_or_admin on public.ratings;
create policy ratings_update_own_or_admin on public.ratings
  for update to authenticated
  using (panelist_id = auth.uid() or public.is_admin())
  with check (panelist_id = auth.uid() or public.is_admin());

drop policy if exists ratings_delete_own_unsubmitted_or_admin on public.ratings;
create policy ratings_delete_own_unsubmitted_or_admin on public.ratings
  for delete to authenticated
  using (
    public.is_admin()
    or (panelist_id = auth.uid() and submitted = false)
  );

revoke all on public.profiles from anon;
revoke all on public.panel_memberships from anon;
revoke all on public.candidates from anon;
revoke all on public.applications from anon;
revoke all on public.ratings from anon;

revoke all on function public.current_profile_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_senior_or_admin() from public;
revoke all on function public.member_of_panel(integer) from public;
revoke all on function public.can_access_candidate(text) from public;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_senior_or_admin() to authenticated;
grant execute on function public.member_of_panel(integer) to authenticated;
grant execute on function public.can_access_candidate(text) to authenticated;

grant select on public.panels to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.panel_memberships to authenticated;
grant select on public.candidates to authenticated;
grant select on public.applications to authenticated;
grant select, insert, update, delete on public.ratings to authenticated;
