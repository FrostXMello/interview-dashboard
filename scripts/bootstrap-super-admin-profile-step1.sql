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
