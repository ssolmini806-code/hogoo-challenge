-- Idempotent RLS setup for public challenge reviews.

create table if not exists public.challenge_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null default '익명 참가자',
  rating integer not null default 5,
  content text not null,
  challenge_day integer default 1,
  completed_missions integer default 0,
  review_context text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.challenge_reviews
add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.challenge_reviews
add column if not exists display_name text not null default '익명 참가자';

alter table public.challenge_reviews
add column if not exists rating integer not null default 5;

alter table public.challenge_reviews
add column if not exists content text not null default '';

alter table public.challenge_reviews
add column if not exists challenge_day integer default 1;

alter table public.challenge_reviews
add column if not exists completed_missions integer default 0;

alter table public.challenge_reviews
add column if not exists review_context text;

alter table public.challenge_reviews
add column if not exists is_public boolean not null default true;

alter table public.challenge_reviews
add column if not exists created_at timestamptz not null default now();

alter table public.challenge_reviews enable row level security;

drop policy if exists "Public reviews are readable" on public.challenge_reviews;
create policy "Public reviews are readable"
on public.challenge_reviews
for select
to anon, authenticated
using (is_public = true or auth.uid() = user_id);

drop policy if exists "Authenticated users can write reviews" on public.challenge_reviews;
create policy "Authenticated users can write reviews"
on public.challenge_reviews
for insert
to authenticated
with check (
  auth.uid() = user_id
  and char_length(content) between 10 and 500
  and rating between 1 and 5
  and coalesce(completed_missions, 0) >= 0
  and coalesce(challenge_day, 1) between 1 and 7
);

drop policy if exists "Users can update own reviews" on public.challenge_reviews;
create policy "Users can update own reviews"
on public.challenge_reviews
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and char_length(content) between 10 and 500
  and rating between 1 and 5
  and coalesce(completed_missions, 0) >= 0
  and coalesce(challenge_day, 1) between 1 and 7
);

drop policy if exists "Users can delete own reviews" on public.challenge_reviews;
create policy "Users can delete own reviews"
on public.challenge_reviews
for delete
to authenticated
using (auth.uid() = user_id);

revoke select on public.challenge_reviews from anon, authenticated;
grant select (
  id,
  display_name,
  rating,
  content,
  challenge_day,
  completed_missions,
  review_context,
  is_public,
  created_at
) on public.challenge_reviews to anon, authenticated;

grant select (user_id) on public.challenge_reviews to authenticated;

grant insert (
  user_id,
  display_name,
  rating,
  content,
  challenge_day,
  completed_missions,
  review_context,
  is_public
) on public.challenge_reviews to authenticated;

grant update (
  display_name,
  rating,
  content,
  challenge_day,
  completed_missions,
  review_context,
  is_public
) on public.challenge_reviews to authenticated;

grant delete on public.challenge_reviews to authenticated;

create index if not exists challenge_reviews_public_created_at_idx
on public.challenge_reviews (is_public, created_at desc);

create index if not exists challenge_reviews_user_created_at_idx
on public.challenge_reviews (user_id, created_at desc);
