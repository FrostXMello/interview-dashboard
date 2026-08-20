-- Minimal bootstrap: Super Admin profile for provisioned auth user.
-- Safe to run on projects where full migrations have not yet been applied.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.app_role as enum ('panelist', 'senior_panelist', 'admin');
exception
  when duplicate_object then null;
end $$;

alter type public.app_role add value if not exists 'super_admin';

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role public.app_role not null default 'panelist',
  display_title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists is_active boolean not null default true;

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
