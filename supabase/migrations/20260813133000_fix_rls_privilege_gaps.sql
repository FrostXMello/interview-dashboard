-- Fix privilege gaps discovered in security review (safe to apply after 20260813120000).
-- 1) Signup must not honor client-supplied role metadata (privilege escalation).
-- 2) Senior panelists may read SUBMITTED peer ratings only (not drafts).
-- 3) Lock profile self-insert role to panelist.
-- 4) Revoke PUBLIC execute on SECURITY DEFINER helpers; grant to authenticated only.
-- 5) Explicit search_path on updated_at trigger function.

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

drop policy if exists profiles_admin_insert on public.profiles;
drop policy if exists profiles_insert_self_panelist_or_admin on public.profiles;
create policy profiles_insert_self_panelist_or_admin on public.profiles
  for insert to authenticated
  with check (
    (id = auth.uid() and role = 'panelist')
    or public.is_admin()
  );

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

drop policy if exists ratings_update_own_or_admin on public.ratings;
create policy ratings_update_own_or_admin on public.ratings
  for update to authenticated
  using (panelist_id = auth.uid() or public.is_admin())
  with check (panelist_id = auth.uid() or public.is_admin());

comment on policy ratings_select_own_or_reviewer on public.ratings is
  'Own ratings always; admin all; senior_panelist submitted ratings for accessible candidates only';
