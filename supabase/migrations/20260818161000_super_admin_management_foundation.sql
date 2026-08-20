-- Phase 3 foundation for super-admin management safety.
-- Soft-active flags avoid destructive deletes for users/candidates.

alter table public.profiles
  add column if not exists is_active boolean not null default true;

alter table public.candidates
  add column if not exists is_active boolean not null default true;

create index if not exists profiles_is_active_idx on public.profiles (is_active);
create index if not exists candidates_is_active_idx on public.candidates (is_active);

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

-- Non-admin users should only read active candidates through RLS.
drop policy if exists candidates_select_panel_or_admin on public.candidates;
create policy candidates_select_panel_or_admin on public.candidates
  for select to authenticated
  using (
    (public.is_admin())
    or (is_active = true and public.member_of_panel(panel_id))
  );

-- Applications remain candidate-scoped. Keep existing RLS helper boundary.
drop policy if exists applications_select_panel_or_admin on public.applications;
create policy applications_select_panel_or_admin on public.applications
  for select to authenticated
  using (public.can_access_candidate(candidate_id));
