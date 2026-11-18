-- ABBA, Day 6: Nova profiles
-- Paste this whole file into Supabase > SQL Editor and press Run. It is safe to run twice.
-- (Run the Day 5 file first, if you have not already.)

-- 1. One row per Nova: where they are based.
create table if not exists public.nova_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  city        text not null default '',
  area        text not null default '',
  updated_at  timestamptz not null default now()
);

-- 2. The social media accounts a Nova advertises on (a Nova can have several,
--    but only one per platform).
create table if not exists public.nova_accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  platform    text not null check (platform in
                ('instagram','tiktok','x','facebook','snapchat','youtube','whatsapp')),
  handle      text not null check (char_length(handle) between 2 and 60),
  followers   integer not null check (followers >= 0 and followers <= 1000000000),
  -- The Nova's usual number of views per story or post. This is what Aba cares
  -- about most. It is what the Nova says; screenshots confirm it later.
  avg_views   integer not null default 0 check (avg_views >= 0 and avg_views <= 1000000000),
  -- Aba sets this to true after checking the account. The app can never set it.
  verified    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, platform)
);

-- If you ran an earlier version of this file, add the new column now.
alter table public.nova_accounts
  add column if not exists avg_views integer not null default 0
  check (avg_views >= 0 and avg_views <= 1000000000);

-- 3. Security: switch on row level security.
alter table public.nova_profiles enable row level security;
alter table public.nova_accounts enable row level security;

-- A person can only see and change their OWN rows, and only if they are a Nova.
drop policy if exists "Nova reads own profile" on public.nova_profiles;
create policy "Nova reads own profile" on public.nova_profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Nova adds own profile" on public.nova_profiles;
create policy "Nova adds own profile" on public.nova_profiles
  for insert to authenticated
  with check (
    (select auth.uid()) = id
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'nova')
  );

drop policy if exists "Nova edits own profile" on public.nova_profiles;
create policy "Nova edits own profile" on public.nova_profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Nova reads own accounts" on public.nova_accounts;
create policy "Nova reads own accounts" on public.nova_accounts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Nova adds own accounts" on public.nova_accounts;
create policy "Nova adds own accounts" on public.nova_accounts
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'nova')
  );

drop policy if exists "Nova edits own accounts" on public.nova_accounts;
create policy "Nova edits own accounts" on public.nova_accounts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Nova removes own accounts" on public.nova_accounts;
create policy "Nova removes own accounts" on public.nova_accounts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 4. Which columns the app may touch. "verified" is left out on purpose, so
--    nobody can mark their own account as verified.
grant select on public.nova_profiles to authenticated;
grant insert (id, city, area), update (city, area, updated_at) on public.nova_profiles to authenticated;

grant select on public.nova_accounts to authenticated;
grant insert (user_id, platform, handle, followers, avg_views) on public.nova_accounts to authenticated;
grant update (handle, followers, avg_views) on public.nova_accounts to authenticated;
grant delete on public.nova_accounts to authenticated;
