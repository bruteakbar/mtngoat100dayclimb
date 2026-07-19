-- 100 Days Tracker — Supabase schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query) once per project.
-- If you already ran an earlier version of this file, skip to the MIGRATION
-- block below instead of running the CREATE TABLE statements again.

-- 1. Account-level profile. Per-person scheduling fields (level, start_date)
--    now live on the `people` table below, since one account can track
--    multiple people.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- 2. People — one logged-in account can add multiple people (family,
--    clients, teammates, etc). Each person has their own level and start
--    date and follows their own 100-day schedule independently, with no
--    separate login required for them.
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  start_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- 3. Per-person, per-day progress log. `swaps` records any exercise
--    substitutions the user made for that specific day (see app for logic).
create table if not exists public.user_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  day int not null check (day between 1 and 100),
  done boolean not null default false,
  checks jsonb not null default '{}'::jsonb,
  swaps jsonb not null default '{}'::jsonb,
  notes text default '',
  updated_at timestamptz not null default now(),
  unique (person_id, day)
);

-- ---------------------------------------------------------------------
-- MIGRATION: already have a deployed database with the old single-person
-- `profiles.level` / `profiles.start_date` columns? Run this block
-- instead of the CREATE TABLE statements above. Safe to re-run.
--
--   create table if not exists public.people (
--     id uuid primary key default gen_random_uuid(),
--     owner_id uuid not null references auth.users(id) on delete cascade,
--     name text not null,
--     level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
--     start_date date not null default current_date,
--     created_at timestamptz not null default now()
--   );
--
--   alter table public.people enable row level security;
--   drop policy if exists "people_select_own" on public.people;
--   create policy "people_select_own" on public.people for select using (auth.uid() = owner_id);
--   drop policy if exists "people_insert_own" on public.people;
--   create policy "people_insert_own" on public.people for insert with check (auth.uid() = owner_id);
--   drop policy if exists "people_update_own" on public.people;
--   create policy "people_update_own" on public.people for update using (auth.uid() = owner_id);
--   drop policy if exists "people_delete_own" on public.people;
--   create policy "people_delete_own" on public.people for delete using (auth.uid() = owner_id);
--
--   -- one "Me" person per existing account, carrying over their old level/start_date
--   insert into public.people (owner_id, name, level, start_date)
--   select p.id, 'Me', coalesce(p.level, 'beginner'), coalesce(p.start_date, current_date)
--   from public.profiles p
--   where not exists (select 1 from public.people pe where pe.owner_id = p.id);
--
--   alter table public.user_progress add column if not exists person_id uuid references public.people(id) on delete cascade;
--   alter table public.user_progress add column if not exists swaps jsonb not null default '{}'::jsonb;
--
--   -- point every existing progress row at that account's "Me" person
--   update public.user_progress up
--   set person_id = pe.id
--   from public.people pe
--   where pe.owner_id = up.user_id and up.person_id is null;
--
--   alter table public.user_progress alter column person_id set not null;
--   alter table public.user_progress drop constraint if exists user_progress_user_id_day_key;
--   alter table public.user_progress add constraint user_progress_person_id_day_key unique (person_id, day);
-- ---------------------------------------------------------------------

-- 4. Row Level Security — every user can only ever see/write their own
--    account, their own people, and progress rows tied to their own account.
alter table public.profiles enable row level security;
alter table public.people enable row level security;
alter table public.user_progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "people_select_own" on public.people;
create policy "people_select_own" on public.people for select using (auth.uid() = owner_id);
drop policy if exists "people_insert_own" on public.people;
create policy "people_insert_own" on public.people for insert with check (auth.uid() = owner_id);
drop policy if exists "people_update_own" on public.people;
create policy "people_update_own" on public.people for update using (auth.uid() = owner_id);
drop policy if exists "people_delete_own" on public.people;
create policy "people_delete_own" on public.people for delete using (auth.uid() = owner_id);

drop policy if exists "progress_select_own" on public.user_progress;
create policy "progress_select_own" on public.user_progress for select using (auth.uid() = user_id);
drop policy if exists "progress_insert_own" on public.user_progress;
create policy "progress_insert_own" on public.user_progress for insert with check (auth.uid() = user_id);
drop policy if exists "progress_update_own" on public.user_progress;
create policy "progress_update_own" on public.user_progress for update using (auth.uid() = user_id);
drop policy if exists "progress_delete_own" on public.user_progress;
create policy "progress_delete_own" on public.user_progress for delete using (auth.uid() = user_id);

-- 5. Auto-create a profile row + a default "Me" person the moment someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.people (owner_id, name)
  values (new.id, 'Me')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Keep updated_at fresh on writes
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists touch_user_progress on public.user_progress;
create trigger touch_user_progress
  before update on public.user_progress
  for each row execute procedure public.touch_updated_at();
