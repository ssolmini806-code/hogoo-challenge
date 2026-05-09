-- Supabase setup for public challenge reviews.
-- Run this once in the Supabase SQL editor.

create table if not exists public.challenge_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null default '익명 참가자',
  rating integer not null default 5 check (rating between 1 and 5),
  content text not null check (char_length(content) between 10 and 500),
  challenge_day integer default 1 check (challenge_day between 1 and 7),
  completed_missions integer default 0 check (completed_missions >= 0),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.challenge_reviews enable row level security;

drop policy if exists "Public reviews are readable" on public.challenge_reviews;
create policy "Public reviews are readable"
on public.challenge_reviews
for select
using (is_public = true);

drop policy if exists "Authenticated users can write reviews" on public.challenge_reviews;
create policy "Authenticated users can write reviews"
on public.challenge_reviews
for insert
to authenticated
with check (auth.uid() = user_id);

create index if not exists challenge_reviews_public_created_at_idx
on public.challenge_reviews (is_public, created_at desc);
