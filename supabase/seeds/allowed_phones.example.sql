-- Example seed only. Replace with authorized numbers via SQL editor or scripts/seed-allowed-phones.mjs.
-- Do not commit real personal numbers unless the repository policy explicitly allows it.

insert into public.allowed_phones (phone_e164, can_register)
values
  ('+919999999001', true),
  ('+919999999002', true)
on conflict (phone_e164) do nothing;
