insert into public.profiles (id, display_name, role, display_title, is_active)
values (
  'd6995090-74a4-4f9e-b2be-560cf57cbdcc',
  'Super Admin',
  'super_admin',
  'Super Admin',
  true
)
on conflict (id) do update
set
  display_name = excluded.display_name,
  display_title = excluded.display_title,
  role = excluded.role,
  is_active = true,
  updated_at = now();

notify pgrst, 'reload schema';
