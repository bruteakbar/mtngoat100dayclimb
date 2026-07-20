-- 100 Days Tracker — Supabase schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query) once per project.
-- Every statement here is safe to re-run (create table if not exists, add
-- column if not exists, create or replace function/policy) EXCEPT the
-- MIGRATION block below, which only applies if you're upgrading from the
-- older multi-person ("people" table) version of this schema — see its
-- comment for details.

-- 1. One row per account. This *is* the tracked person now (earlier
--    versions of this app let one login track multiple people via a
--    separate `people` table; that's been folded in here — one account,
--    one 100-day tracker). `is_admin` marks accounts that can see and
--    manage every other account from the in-app Admin page. The very
--    first account ever created on a fresh database automatically becomes
--    an admin (see the trigger in section 5) — make sure you're the first
--    person to sign up right after deploying.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  start_date date not null default current_date,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Safe to re-run any time (including on a table that was just created above):
-- makes sure these columns exist even if you ran an earlier version of this
-- script before the single-tracker/admin feature was added.
alter table public.profiles add column if not exists level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced'));
alter table public.profiles add column if not exists start_date date not null default current_date;
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Usernames are free-form (any characters) but must be unique, ignoring
-- case, so login lookups and admin renames are unambiguous. If this fails
-- because your database already has two accounts whose usernames only
-- differ by case, rename one of them first, then re-run.
create unique index if not exists profiles_display_name_lower_idx on public.profiles (lower(display_name));

-- 2. Per-account, per-day progress log. `swaps` records any exercise
--    substitutions made for that specific day (see app for logic).
create table if not exists public.user_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day int not null check (day between 1 and 100),
  done boolean not null default false,
  checks jsonb not null default '{}'::jsonb,
  swaps jsonb not null default '{}'::jsonb,
  benchmarks jsonb not null default '{}'::jsonb,
  notes text default '',
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

alter table public.user_progress add column if not exists benchmarks jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------
-- MIGRATION: upgrading from the earlier version of this app that had a
-- separate `people` table (one login tracking multiple people)? Run this
-- block once, after the statements above have run (they already add the
-- new columns to an existing `profiles`/`user_progress` table via
-- IF NOT EXISTS / ADD COLUMN IF NOT EXISTS). Safe to re-run.
--
--   -- pull each account's level/start_date from their first-created person
--   update public.profiles p
--   set level = pe.level, start_date = pe.start_date
--   from (
--     select distinct on (owner_id) owner_id, level, start_date
--     from public.people
--     order by owner_id, created_at asc
--   ) pe
--   where pe.owner_id = p.id;
--
--   -- this app now tracks one person per account: if an account had more
--   -- than one person, keep only the progress that belonged to their
--   -- first-created person and drop the rest
--   delete from public.user_progress up
--   using public.people pe
--   where up.person_id = pe.id
--     and pe.id not in (
--       select distinct on (owner_id) id from public.people order by owner_id, created_at asc
--     );
--
--   alter table public.user_progress drop constraint if exists user_progress_person_id_day_key;
--   alter table public.user_progress add constraint user_progress_user_id_day_key unique (user_id, day);
--   alter table public.user_progress drop column if exists person_id;
--
--   drop table if exists public.people;
-- ---------------------------------------------------------------------

-- 3. Helper: is this account an admin? `security definer` so it can read
--    `profiles` for the RLS checks below without recursing into RLS itself.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;
grant execute on function public.is_admin(uuid) to authenticated, anon;

-- 3b. Username-based login. Usernames are free-form and are never turned
--     into an email themselves (see lib/auth.js) — each account instead
--     gets a random, non-deliverable email at signup. This function looks
--     up the right email for whatever username was typed, so the login
--     page can call it (as the anonymous role, before any session exists)
--     and then sign in with the email it gets back. Matching is
--     case-insensitive. Because it only ever returns an email — never
--     whether a username exists on its own — it doesn't leak account
--     existence beyond what a failed login already would.
create or replace function public.username_login_email(uname text)
returns text
language sql
security definer
set search_path = public, auth
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.display_name) = lower(trim(uname))
  limit 1;
$$;
grant execute on function public.username_login_email(text) to anon, authenticated;

-- 4. Row Level Security. Everyone can read/write their own account; admins
--    can additionally read/write every account's profile (needed for the
--    Admin page). Workout progress (below) stays owner-only, with no admin
--    bypass at all.
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin(auth.uid()));

-- Deliberately owner-only, with NO admin bypass: workout progress and
-- benchmark results are private to the account that logged them, even from
-- admins. Admins manage accounts (level, start date, username, admin
-- status, deletion) on the Admin page, but never see anyone's actual
-- logged days.
drop policy if exists "progress_select_own" on public.user_progress;
drop policy if exists "progress_select_own_or_admin" on public.user_progress;
create policy "progress_select_own" on public.user_progress
  for select using (auth.uid() = user_id);

drop policy if exists "progress_insert_own" on public.user_progress;
drop policy if exists "progress_insert_own_or_admin" on public.user_progress;
create policy "progress_insert_own" on public.user_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "progress_update_own" on public.user_progress;
drop policy if exists "progress_update_own_or_admin" on public.user_progress;
create policy "progress_update_own" on public.user_progress
  for update using (auth.uid() = user_id);

drop policy if exists "progress_delete_own" on public.user_progress;
drop policy if exists "progress_delete_own_or_admin" on public.user_progress;
create policy "progress_delete_own" on public.user_progress
  for delete using (auth.uid() = user_id);

-- 5. Auto-create a profile the moment someone signs up. The app signs
--    people up with a username + password (no real email is collected) —
--    signUp() is called with a synthetic, non-deliverable email plus
--    `options: { data: { username } }`, and that username is pulled out of
--    the new user's metadata here and stored as profiles.display_name.
--
--    The very first account ever created on a fresh database (i.e. no
--    other account is already an admin) automatically becomes an admin.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  make_admin boolean;
begin
  select not exists(select 1 from public.profiles where is_admin) into make_admin;
  insert into public.profiles (id, display_name, is_admin)
  values (new.id, new.raw_user_meta_data ->> 'username', coalesce(make_admin, true))
  on conflict (id) do update set display_name = excluded.display_name;
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

-- 7. Lets an admin fully remove another account (deletes the auth.users
--    row; profiles + user_progress cascade-delete automatically since both
--    reference auth.users with ON DELETE CASCADE). Callable from the app
--    via supabase.rpc('admin_delete_user', { target_id }). An admin can't
--    delete their own account through this function (avoids locking
--    themselves out) — the app also blocks removing the last admin.
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can delete accounts.';
  end if;
  if target_id = auth.uid() then
    raise exception 'You cannot delete your own account from the admin page.';
  end if;
  delete from auth.users where id = target_id;
end;
$$;
grant execute on function public.admin_delete_user(uuid) to authenticated;
