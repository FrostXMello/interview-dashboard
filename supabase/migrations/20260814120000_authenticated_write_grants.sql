-- Allow authenticated role to perform writes that RLS already restricts.
-- Without these GRANTs, admin policies exist but UPDATE/INSERT fail at the privilege layer
-- (TEST 18 / setCandidateStatus would be denied even for admins).

grant insert, update, delete on public.candidates to authenticated;
grant insert, update, delete on public.applications to authenticated;
grant insert, update, delete on public.panel_memberships to authenticated;
grant insert, update, delete on public.panels to authenticated;
grant insert on public.profiles to authenticated;
