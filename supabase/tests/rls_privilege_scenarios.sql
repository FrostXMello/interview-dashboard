-- Executable counterpart: `npm run verify:rls` (scripts/verify-rls.mjs) maps TESTS 1–18.
-- This SQL file remains a human checklist for the SQL editor. It does not prove live success.
--
-- Replace the UUIDs with real auth.users ids from your project before running.
-- This script documents expected outcomes; it does not invent live success.

-- =============================================================================
-- FIXTURE NOTES (operator must create via Auth dashboard + SQL):
--   panelist_a  panel 1, role panelist
--   panelist_b  panel 1, role panelist
--   panelist_c  panel 2, role panelist
--   senior_s    panels 1+2, role senior_panelist
--   admin_u     role admin
--   candidate_p1 on panel 1
--   candidate_p2 on panel 2
--   rating_b_draft: panelist_b / candidate_p1 / submitted=false
--   rating_b_sub:   panelist_b / candidate_p1 / submitted=true
-- =============================================================================

-- Helper: run each block while SET LOCAL ROLE / request.jwt.claim.sub is impractical
-- in the SQL editor for end-user simulation. Prefer the Supabase client with each
-- user's access token, or use:
--   select auth.uid(); -- while authenticated as that user in the SQL editor session
--
-- Below are assertion queries to run AS each role. Expected row counts are comments.

-- TEST A — Panelist A reads Panelist B rating (draft or submitted): expect 0 rows for peer drafts;
--          for submitted, panelist still expect 0 (only senior/admin).
-- as panelist_a:
-- select * from public.ratings where panelist_id = '<panelist_b>' and candidate_id = '<candidate_p1>';
-- EXPECT: 0 rows

-- TEST B — Panelist A updates Panelist B rating: expect failure
-- update public.ratings set comment = 'hacked' where panelist_id = '<panelist_b>';
-- EXPECT: 0 rows updated / policy violation

-- TEST C — Panelist A inserts rating as Panelist B: expect failure
-- insert into public.ratings (candidate_id, panelist_id, interview_score, submitted)
-- values ('<candidate_p1>', '<panelist_b>', 5, false);
-- EXPECT: FAIL (with check panelist_id = auth.uid())

-- TEST D — Panelist A selects candidate on panel 2: expect 0
-- select * from public.candidates where id = '<candidate_p2>';
-- EXPECT: 0 rows

-- TEST E — Senior reads submitted rating on accessible panel: expect 1
-- select * from public.ratings where panelist_id = '<panelist_b>' and submitted = true;
-- EXPECT: >=1 for accessible candidates

-- TEST E2 — Senior reads UNSUBMITTED draft: expect 0
-- select * from public.ratings where panelist_id = '<panelist_b>' and submitted = false;
-- EXPECT: 0 rows

-- TEST F — Senior updates peer rating: expect failure
-- update public.ratings set comment = 'senior rewrite' where panelist_id = '<panelist_b>';
-- EXPECT: 0 rows updated

-- TEST G — Admin selects all candidates: expect all fixture candidates
-- select count(*) from public.candidates;
-- EXPECT: full count

-- TEST H — anon role
-- set role anon;
-- select * from public.ratings;
-- EXPECT: permission denied / 0 (revoked)

-- Static policy inventory (always safe to run)
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'panel_memberships', 'panels', 'candidates', 'applications', 'ratings')
order by tablename, cmd, policyname;
