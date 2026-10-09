-- RepQuest cloud sync: one JSON document of training data per account.
-- Run this once in Supabase → SQL Editor.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Server-side timestamp on every write, so devices compare against one clock.
create or replace function public.touch_user_data()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch
  before insert or update on public.user_data
  for each row execute function public.touch_user_data();

-- Each signed-in user can only see and change their own row.
alter table public.user_data enable row level security;

drop policy if exists "Users read own data" on public.user_data;
create policy "Users read own data" on public.user_data
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own data" on public.user_data;
create policy "Users insert own data" on public.user_data
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own data" on public.user_data;
create policy "Users update own data" on public.user_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own data" on public.user_data;
create policy "Users delete own data" on public.user_data
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Signed-in users may use the table (RLS above still limits them to their own row).
grant select, insert, update, delete on public.user_data to authenticated;
revoke all on public.user_data from anon;
