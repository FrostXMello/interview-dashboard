-- Super Admin edits must broadcast to every connected dashboard.
alter table if exists public.candidates replica identity full;
alter table if exists public.applications replica identity full;
alter table if exists public.profiles replica identity full;
alter table if exists public.panel_memberships replica identity full;
alter table if exists public.panels replica identity full;
alter table if exists public.ratings replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array['candidates', 'applications', 'profiles', 'panel_memberships', 'panels', 'ratings']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_table then null;
    end;
  end loop;
end $$;

notify pgrst, 'reload schema';
