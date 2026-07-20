# 100 Days of Work — Tracker

Multi-user Next.js app: sign up, log in, and track your own 100-day
calisthenics / kettlebell / row / ruck / pull-up-bar program. One account =
one tracker. Data lives in Supabase (Postgres + Auth), Row Level Security
means each account can only ever see its own data (admins excepted — see
below), and it deploys to Vercel.

Verified locally: `npm install` + `npm run build` complete with no errors
(all routes compile: `/`, `/login`, `/signup`, `/today`, `/schedule`,
`/library`, `/settings`, `/progress`, `/admin`), and the schedule generator
is unit-tested for all 100 days across all 3 levels plus the exercise-swap
logic.

## 1. Supabase — create the database

1. In your Supabase project, go to **SQL Editor > New query**.
2. Paste in the contents of `supabase/schema.sql` (in this folder) and run
   it. This creates the `profiles` and `user_progress` tables, turns on Row
   Level Security, and adds a trigger so every new sign-up automatically
   gets a profile (Beginner level, start date = today).
   - **Fresh project:** just run the whole file top to bottom.
   - **Already deployed an earlier version of this app?** Every statement
     is idempotent (`create table if not exists`, `add column if not
     exists`, `create or replace function`), so re-running the top of the
     file is always safe. If your database still has the old `people`
     table (multiple tracked people per login), also run the commented-out
     `MIGRATION` block — it folds each account's first-created person's
     level/start date onto `profiles`, re-keys `user_progress` to the
     account directly, and drops the `people` table.
3. Go to **Project Settings > API** and copy two values: **Project URL** and
   the **anon / public key**. You'll need both in step 2 and step 4.
4. **Turn off email confirmation** — under **Authentication > Providers >
   Email**, toggle **Confirm email** off. This app signs people up with a
   username + password only (see "Accounts" below); it never collects a
   real email address, so there's no inbox for Supabase to send a
   confirmation link to. Skipping this step means every sign-up gets stuck
   waiting on an email that can never arrive.
5. (Optional) Under **Authentication > URL Configuration**, set the **Site
   URL** to your future Vercel URL once you have it (you can also come back
   and update this after deploying).

## 2. Run it locally (optional, to try before deploying)

```bash
cp .env.local.example .env.local
# edit .env.local and paste in your Supabase URL + anon key
npm install
npm run dev
```

Open http://localhost:3000, sign up with a username and password, and you're
straight in — no confirmation email to wait on. **The first account you
create becomes the admin** (see "Accounts and admin" below), so sign up for
yourself first, before sharing the app with anyone else.

## 3. Push to GitHub

If a `.git` folder already exists in this directory, delete it first (it may
be an empty/partial one from scaffolding) — then:

```bash
cd 100-day-tracker-app
git init
git add .
git commit -m "100 days tracker: initial version"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

`.env.local` is already in `.gitignore` — your Supabase keys won't get committed
(the anon key is safe to expose client-side, but no reason to hardcode it into
git history).

## 4. Deploy to Vercel

1. In the Vercel dashboard: **Add New > Project**, then import the GitHub repo
   you just pushed. Vercel auto-detects Next.js — no build config needed.
2. Before the first deploy (or right after, then redeploy), add two
   **Environment Variables** in Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (same two values from Supabase step 1.3)
3. Deploy. Once you have the `https://your-app.vercel.app` URL, go back to
   Supabase **Authentication > URL Configuration** and set the Site URL (and
   add it to Redirect URLs) so confirmation-email links point to production
   instead of localhost.

## Accounts and admin

Signing up only ever asks for a **username** and **password** — no email
address is collected anywhere in the UI, and usernames can be anything (any
characters, spaces, unicode — no format restrictions, just non-empty and
under 60 characters). Under the hood it still runs on Supabase Auth (so
password hashing, sessions, and Row Level Security via `auth.uid()` all keep
working exactly as before); each account gets a random, non-deliverable
email (`lib/auth.js`'s `randomSyntheticEmail()`) that has no relationship to
the username at all. At login, a Postgres function
(`username_login_email()` in `supabase/schema.sql`) looks up the right email
for whatever username was typed. Usernames are stored in
`profiles.display_name` via the signup trigger and are unique,
case-insensitively — trying to sign up (or get renamed by an admin to) one
that's already taken surfaces a plain "That username is already taken"
message.

**The very first account created on a fresh database automatically becomes
an admin** — there's no separate setup step. Make sure you're the first
person to sign up right after deploying, before you send the link to anyone
else. From then on, admins can promote or demote any other account from the
**Admin** page (which only appears in the nav for admins).

Admins can, for any account:
- Rename their username, edit their level and start date
- Promote or demote their admin status (you can't demote the last remaining
  admin — the app blocks it so the account can't get locked out)
- Delete their account entirely (you can't delete your own account from the
  admin page, and the last remaining admin can't be deleted either)

**Admins never see anyone's workout progress.** The Admin page only manages
account-level fields (username, level, start date, admin status); the
`user_progress` table (checks, notes, benchmark results, swaps) is owner-only
at the database level — the RLS policies in `supabase/schema.sql` give
admins no bypass on it at all. Each account's Progress page and
accountability grid stay private to them.

Deleting an account removes their Supabase Auth user, which cascades to
their profile and every logged day — this can't be undone.

One tradeoff worth knowing about: **no self-service "forgot password."**
Supabase's password-reset flow emails a link, and these accounts don't have
a real inbox. If someone forgets their password, reset it for them from the
Supabase dashboard: **Authentication > Users**, find their (synthetic)
email, and set a new password for them directly from that screen.

## Start date and daily default

Each account has its own **start date**, set on the **Settings** page (Day 1
of their program). Every page that shows "today's" workout — including what
opens by default when you log in — is computed from that start date via
`dayNumberFromStartDate()` in `lib/db.js`, so everyone's exercises line up
with the calendar day they actually started on. Changing the start date on
Settings immediately shifts which day is "today" going forward; past logged
days are untouched.

## 100-day accountability grid

The **Progress** page shows a 10×10 grid, one cell per day: **blue** means
that day was marked complete, **brown** means the day has already passed and
was never completed, and a plain cell means the day isn't due yet. Tap any
brown (missed) cell to jump straight to that day on **Today** and fill it
in retroactively. This grid — like the rest of your workout data — is only
ever visible to you, not to admins.

## Benchmark tracking

Days 1, 50, and 100 are baseline / midpoint / final benchmark tests. Instead
of just checking boxes, each test line (max push-ups, plank hold, pull-ups
or dead-hang, 1000m row or 1-mile ruck, plus an optional capstone ruck on
Day 100) has a real input — a number for reps, a minutes:seconds field for
holds and times. Results are stored per-day in `user_progress.benchmarks`
(see `BENCHMARK_ITEMS` in `lib/schedule.js` for the shared list of test
keys/labels/types).

The **Progress** page pulls all three benchmark days and lines them up in a
Day 1 / Day 50 / Day 100 comparison table, with the best result in each row
highlighted — so the "did I actually get stronger" question has a real
answer by Day 100.

## Branding / logo

The app header, login page, and signup page all display the original MTN
GOAT / 100 Day Climb logo (`public/logo.png`) with a transparent background,
sized large for visibility. Next.js also auto-serves `app/icon.png` and
`app/apple-icon.png` (cropped from the same artwork) as the site favicon /
home-screen icon — no extra config needed. Swap any of those three files to
rebrand.

## Difficulty levels

Each account has its own level, set on the **Settings** page, switchable
anytime — switching only changes exercises/split going forward, past logged
days are untouched.

| Level | Split | What changes |
|---|---|---|
| Beginner | 4 on / 3 off | Original program, unchanged. |
| Intermediate | 5 on / 2 off | Harder A-D prescriptions (pulled from a later phase) + a new **E** "Power & Grip Conditioning" day. |
| Advanced | 6 on / 1 off | Hardest A-D prescriptions + **E** + a new **F** "Full-Body HIIT Finisher" day. |

All three levels share the same 100-day calendar: the same 4-phase arc
(Foundation/Build/Intensify/Peak), the same benchmark tests on Days 1, 50, and
100, and the same deload window (Days 92-99) before the finish. Only the daily
training content and weekly frequency change. See `lib/schedule.js` for the
implementation (`WEEK_PATTERNS`, `LEVELS`, `getDayPlan(day, level, swaps)`).

## Exercise swaps

On the Today page, any exercise on a training day can be swapped. Tap "⇄ Swap
exercise" and pick a same-family alternative, labeled **Easier**, **Similar**,
or **Harder** relative to what's currently scheduled — useful for working
around an injury (swap out something that hurts) or just picking what you'd
rather do. A "swapped" badge shows on any substituted exercise, with a button
to revert back to the originally-scheduled movement.

Every one of the 67 exercises is tagged with a movement `fam` (family) and a
1-4 `tier` (easiest → hardest) in `lib/schedule.js`; alternates only ever come
from the same family, so a swap always stays equipment-appropriate (no
kettlebell exercise will ever get offered as a replacement on a pull-up bar
day) and targets a comparable movement pattern. Swaps are stored per
account/day in `user_progress.swaps` and persist across visits.

## What's inside

- `lib/schedule.js` — the exercise database (67 exercises, each tagged with
  a movement family + difficulty tier), the 100-day phase arc, the per-level
  schedule generator, `getAlternates()` for the swap feature, and
  `BENCHMARK_ITEMS`/`formatBenchmarkValue()` for the Day 1/50/100 tests.
- `lib/auth.js` — username validation (permissive — any non-empty string
  under 60 characters) and `randomSyntheticEmail()`, the random
  non-deliverable email Supabase Auth needs behind the scenes.
- `lib/db.js` — data-access helpers, including the admin-only helpers
  (`adminListProfiles`, `adminUpdateProfile`, `adminSetAdmin`,
  `adminDeleteUser`) — note there's deliberately no admin helper that reads
  `user_progress`.
- `supabase/schema.sql` — `profiles` (account, username, level, start date,
  admin flag) and `user_progress` (per-account, per-day log including swaps
  + benchmark results), a unique case-insensitive index on usernames,
  `is_admin()` and `username_login_email()` helpers, admin-aware RLS on
  `profiles` only (never `user_progress`), the first-signup-becomes-admin
  trigger, and the `admin_delete_user()` function.
- `app/(app)/AccountProvider.js` — React context that loads the signed-in
  account's own profile; every page under `app/(app)/` reads from it via
  `useAccount()`.
- `app/(app)/AccountabilityGrid.js` — the reusable 10×10 grid component,
  used on the Progress page for your own data.
- `app/(app)/settings/` — edit your own level + start date.
- `app/(app)/admin/` — admin-only: manage every account's username, level,
  start date, admin status, and deletion. No workout-progress access.
- `app/(app)/` — Today (daily view, swaps, benchmark entry), Schedule
  (100-day list), Library (exercise reference), Progress (stats, the
  accountability grid, and Day 1/50/100 benchmark comparison).
- `app/login`, `app/signup` — username + password (Supabase Auth underneath).
- `public/logo.png`, `app/icon.png`, `app/apple-icon.png` — the MTN GOAT
  brand mark (transparent background).
- `middleware.js` + `lib/supabase/middleware.js` — refreshes the auth session
  on every request and redirects signed-out users away from the app pages.

## Notes

- Row Level Security means no account can ever read or write another
  account's data. Admins are the one exception, and only for account-level
  fields on `profiles` (username, level, start date, admin status) — the
  RLS policies in `supabase/schema.sql` give admins no access to
  `user_progress` at all, so workout history and benchmark results stay
  private even from admins.
- "Confirm email" must stay **off** in Supabase (Authentication > Providers >
  Email) — see step 4 under Supabase setup above. Accounts here don't have a
  real inbox, so a confirmation requirement would lock every new sign-up out
  permanently.
