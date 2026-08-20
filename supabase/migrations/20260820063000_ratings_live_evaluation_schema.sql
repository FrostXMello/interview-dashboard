-- Replace the legacy ratings table (studentid/panelistid demo rows) with the
-- evaluation schema the app writes. Keep a backup copy as ratings_legacy.

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

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ratings'
      and column_name = 'studentid'
  ) then
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'ratings_legacy'
    ) then
      drop table public.ratings_legacy;
    end if;

    begin
      alter publication supabase_realtime drop table public.ratings;
    exception
      when undefined_object then null;
      when others then null;
    end;

    alter table public.ratings rename to ratings_legacy;
  end if;
end $$;

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

drop trigger if exists ratings_updated_at on public.ratings;
create trigger ratings_updated_at
  before update on public.ratings
  for each row execute function public.handle_updated_at();

alter table public.ratings replica identity full;
alter table public.ratings enable row level security;

revoke all on public.ratings from anon;
grant select, insert, update, delete on public.ratings to authenticated;
grant all on public.ratings to service_role;

drop policy if exists ratings_all_anon on public.ratings;
drop policy if exists ratings_select_own_or_reviewer on public.ratings;
drop policy if exists ratings_insert_own on public.ratings;
drop policy if exists ratings_update_own_or_admin on public.ratings;
drop policy if exists ratings_delete_own_unsubmitted_or_admin on public.ratings;

-- Same-panel readers can see live scores so averages update in real time.
-- Writes remain own-row only (admins may update any row).
create policy ratings_select_own_or_reviewer on public.ratings
  for select to authenticated
  using (
    panelist_id = auth.uid()
    or public.is_admin()
    or public.can_access_candidate(candidate_id)
  );

create policy ratings_insert_own on public.ratings
  for insert to authenticated
  with check (
    panelist_id = auth.uid()
    and public.can_access_candidate(candidate_id)
  );

create policy ratings_update_own_or_admin on public.ratings
  for update to authenticated
  using (panelist_id = auth.uid() or public.is_admin())
  with check (panelist_id = auth.uid() or public.is_admin());

create policy ratings_delete_own_unsubmitted_or_admin on public.ratings
  for delete to authenticated
  using (
    public.is_admin()
    or (panelist_id = auth.uid() and submitted = false)
  );

-- Panelists need colleague names in live panel feedback.
drop policy if exists profiles_select_scoped on public.profiles;
create policy profiles_select_scoped on public.profiles
  for select to authenticated
  using (auth.uid() is not null);

do $$
begin
  begin
    alter publication supabase_realtime drop table public.ratings_legacy;
  exception
    when undefined_object then null;
    when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.ratings;
  exception
    when duplicate_object then null;
    when others then null;
  end;
end $$;

notify pgrst, 'reload schema';
