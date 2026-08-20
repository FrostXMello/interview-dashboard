-- Allow unscheduled interview slots alongside day-1 / day-2.

alter table public.candidates drop constraint if exists candidates_interview_day_check;
alter table public.candidates
  add constraint candidates_interview_day_check
  check (interview_day in ('day-1', 'day-2', 'unscheduled'));
