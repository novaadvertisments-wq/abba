-- ABBA, Day 5: accounts and profiles
-- Paste this whole file into Supabase > SQL Editor and press Run. It is safe to run twice.

-- 1. A "profiles" table: one row for every person who signs up.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null check (role in ('business', 'nova')),
  full_name   text not null default '',
  phone       text not null default '',
  created_at  timestamptz not null default now()
);

-- 2. Security: switch on row level security, so people can only touch
--    what the rules below allow.
alter table public.profiles enable row level security;

-- A logged-in person can read their OWN profile, and nobody else's.
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- Let the Supabase "authenticated" login role read the table (the rule above
-- then limits it to the person's own row).
grant select on public.profiles to authenticated;

-- There is deliberately no insert, update or delete rule for the app.
-- Profiles are created by the automatic step below, and changing a role
-- is something only Aba's admins can do directly in the database.

-- 3. Automatic step: when someone signs up, create their profile row from
--    the details the app sent (role, name, phone).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    -- Only "business" or "nova" can be chosen at sign-up. Anything else
    -- becomes "business". Admin and checker roles are never set this way.
    case when new.raw_user_meta_data ->> 'role' = 'nova' then 'nova' else 'business' end,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
