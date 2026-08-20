-- Synthetic isolation dataset (candidates/applications/ratings).
-- Profiles and memberships MUST be created from Auth user UUIDs (see scripts/verify-rls.mjs).
-- Safe to re-run: uses ON CONFLICT.

insert into public.candidates (id, reg_no, display_name, timing, panel_id, interview_day, status)
values
  ('p1-a', 'TEST-P1A', 'Candidate P1-A', '10:00 AM-10:10 AM', 1, 'day-1', 'pending'),
  ('p1-b', 'TEST-P1B', 'Candidate P1-B', '10:10 AM-10:20 AM', 1, 'day-1', 'pending'),
  ('p2-a', 'TEST-P2A', 'Candidate P2-A', '10:00 AM-10:10 AM', 2, 'day-1', 'pending')
on conflict (id) do update set
  reg_no = excluded.reg_no,
  display_name = excluded.display_name,
  panel_id = excluded.panel_id,
  status = excluded.status;

insert into public.applications (
  candidate_id, email, phone, program, why_interested, domains, commitment, experience
) values
  ('p1-a', 'p1a@test.example', '5550100001', 'Test Program', 'Synthetic interest statement.', 'Event Management & Operations', 4, 'None'),
  ('p1-b', 'p1b@test.example', '5550100002', 'Test Program', 'Synthetic interest statement.', 'Documentation & Administration', 3, 'None'),
  ('p2-a', 'p2a@test.example', '5550100003', 'Test Program', 'Synthetic interest statement.', 'Outreach & Public Relations', 5, 'None')
on conflict (candidate_id) do update set
  email = excluded.email,
  program = excluded.program;
