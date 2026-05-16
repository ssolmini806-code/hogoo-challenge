-- Reward tables and review reward metadata.

create table if not exists public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  result_id text,
  reward_context text check (
    reward_context in ('free_test', 'seven_day_challenge', 'giveid', 'paid_30day')
  ),
  reward_type text check (reward_type in ('sns', 'review', 'both')),
  unlocked boolean default false,
  generated_content jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hall_of_fame (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  nickname text,
  badge_level text check (badge_level in ('gold', 'silver')),
  completion_rate integer,
  context text default 'paid_30day',
  created_at timestamptz default now()
);

alter table public.reviews
add column if not exists sns_shared boolean default false;

alter table public.reviews
add column if not exists review_context text;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_rewards_updated_at on public.user_rewards;
create trigger set_user_rewards_updated_at
before update on public.user_rewards
for each row
execute function public.set_updated_at();

alter table public.user_rewards enable row level security;
alter table public.hall_of_fame enable row level security;

drop policy if exists "Users can read own rewards" on public.user_rewards;
create policy "Users can read own rewards"
on public.user_rewards
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own rewards" on public.user_rewards;
create policy "Users can create own rewards"
on public.user_rewards
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own rewards" on public.user_rewards;
create policy "Users can update own rewards"
on public.user_rewards
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Hall of fame is publicly readable" on public.hall_of_fame;
create policy "Hall of fame is publicly readable"
on public.hall_of_fame
for select
to anon, authenticated
using (true);

create index if not exists user_rewards_user_id_idx
on public.user_rewards (user_id);

create index if not exists user_rewards_result_id_idx
on public.user_rewards (result_id);

create index if not exists hall_of_fame_created_at_idx
on public.hall_of_fame (created_at desc);
