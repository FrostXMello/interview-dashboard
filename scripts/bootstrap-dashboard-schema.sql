-- Compatible remote bootstrap for missing dashboard tables.
-- Does not recreate or alter the existing legacy public.ratings table.

create table if not exists public.panels (
  id integer primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.panels (id, name) values
  (1, 'Panel 1'),
  (2, 'Panel 2')
on conflict (id) do nothing;

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
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidates_panel_id_idx on public.candidates (panel_id);
create index if not exists candidates_reg_no_idx on public.candidates (reg_no);
create index if not exists candidates_is_active_idx on public.candidates (is_active);

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

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  );
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
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
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
    where p.id = auth.uid() and p.role in ('senior_panelist', 'admin', 'super_admin')
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
        and c.is_active = true
    );
$$;

alter table public.profiles enable row level security;
alter table public.panel_memberships enable row level security;
alter table public.panels enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;

drop policy if exists panels_select_authenticated on public.panels;
create policy panels_select_authenticated on public.panels
  for select to authenticated
  using (auth.uid() is not null);

drop policy if exists panels_admin_write on public.panels;
create policy panels_admin_write on public.panels
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists profiles_select_scoped on public.profiles;
create policy profiles_select_scoped on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    (id = auth.uid() and role = public.current_profile_role())
    or public.is_admin()
  );

drop policy if exists profiles_insert_self_panelist_or_admin on public.profiles;
create policy profiles_insert_self_panelist_or_admin on public.profiles
  for insert to authenticated
  with check (
    (id = auth.uid() and role = 'panelist')
    or public.is_admin()
  );

drop policy if exists panel_memberships_select_scoped on public.panel_memberships;
create policy panel_memberships_select_scoped on public.panel_memberships
  for select to authenticated
  using (profile_id = auth.uid() or public.is_admin() or public.member_of_panel(panel_id));

drop policy if exists panel_memberships_admin_write on public.panel_memberships;
create policy panel_memberships_admin_write on public.panel_memberships
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists candidates_select_panel_or_admin on public.candidates;
create policy candidates_select_panel_or_admin on public.candidates
  for select to authenticated
  using (public.is_admin() or (is_active = true and public.member_of_panel(panel_id)));

drop policy if exists candidates_admin_write on public.candidates;
create policy candidates_admin_write on public.candidates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists applications_select_panel_or_admin on public.applications;
create policy applications_select_panel_or_admin on public.applications
  for select to authenticated
  using (public.can_access_candidate(candidate_id));

drop policy if exists applications_admin_write on public.applications;
create policy applications_admin_write on public.applications
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.panels to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.panel_memberships to authenticated;
grant select, insert, update, delete on public.candidates to authenticated;
grant select, insert, update, delete on public.applications to authenticated;
grant insert, update, delete on public.panels to authenticated;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_senior_or_admin() to authenticated;
grant execute on function public.member_of_panel(integer) to authenticated;
grant execute on function public.can_access_candidate(text) to authenticated;

notify pgrst, 'reload schema';
