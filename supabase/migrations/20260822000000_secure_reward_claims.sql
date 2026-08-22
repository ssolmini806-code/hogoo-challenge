-- 보상 발급 권한을 브라우저에서 서버 함수로 옮긴다.
-- 기존 보상 행은 그대로 보존하며, 새 후기부터 결과별 보상 근거를 연결한다.

alter table public.challenge_reviews
add column if not exists reward_result_id text;

alter table public.challenge_reviews
add column if not exists reward_badge text;

alter table public.challenge_reviews
drop constraint if exists challenge_reviews_reward_context_check;

alter table public.challenge_reviews
add constraint challenge_reviews_reward_context_check
check (review_context is null or review_context in ('free_test', 'seven_day_challenge'));

alter table public.challenge_reviews
drop constraint if exists challenge_reviews_reward_result_id_check;

alter table public.challenge_reviews
add constraint challenge_reviews_reward_result_id_check
check (
  (review_context = 'free_test' and reward_result_id is not null and reward_result_id ~ '^give-test:(angel|diplomat|architect|guardian|burnout|blocker|mixed)$')
  or (review_context = 'seven_day_challenge' and reward_result_id is null)
  or (review_context is null and reward_result_id is null)
) not valid;

alter table public.challenge_reviews
drop constraint if exists challenge_reviews_reward_badge_check;

alter table public.challenge_reviews
add constraint challenge_reviews_reward_badge_check
check (reward_badge is null or reward_badge = 'seven_day_finisher');

-- 운영에 누적된 중복/과권한 정책을 이름에 의존하지 않고 정리한다.
do $$
declare
  policy record;
begin
  for policy in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('user_rewards', 'user_progress', 'challenge_reviews')
  loop
    execute format('drop policy if exists %I on public.%I', policy.policyname, policy.tablename);
  end loop;
end $$;

revoke all on public.user_rewards from anon, authenticated;
revoke all on public.user_progress from anon, authenticated;
revoke all on public.challenge_reviews from anon, authenticated;

create policy "Users can read own rewards"
on public.user_rewards for select to authenticated
using (auth.uid() = user_id);

-- 연결된 유료 서비스의 기존 직접 쓰기는 보존하되 무료 보상은 서버 함수만 발급한다.
create policy "Connected services can create own non-free rewards"
on public.user_rewards for insert to authenticated
with check (
  auth.uid() = user_id
  and reward_context in ('giveid', 'paid_30day')
);

create policy "Connected services can update own non-free rewards"
on public.user_rewards for update to authenticated
using (
  auth.uid() = user_id
  and reward_context in ('giveid', 'paid_30day')
)
with check (
  auth.uid() = user_id
  and reward_context in ('giveid', 'paid_30day')
);

create policy "Users can read own progress"
on public.user_progress for select to authenticated
using (auth.uid() = user_id);

create policy "Public reviews are readable"
on public.challenge_reviews for select to anon, authenticated
using (is_public = true or auth.uid() = user_id);

create policy "Authenticated users can write reviews"
on public.challenge_reviews for insert to authenticated
with check (
  auth.uid() = user_id
  and review_context in ('free_test', 'seven_day_challenge')
  and char_length(content) between 10 and 500
  and rating between 1 and 5
  and coalesce(completed_missions, 0) between 0 and 21
  and coalesce(challenge_day, 1) between 1 and 7
);

create policy "Users can delete own reviews"
on public.challenge_reviews for delete to authenticated
using (auth.uid() = user_id);

-- 기존 자기 보상/진행 조회는 유지한다. 쓰기는 Edge Function의 service role만 수행한다.
grant select on public.user_rewards to authenticated;
grant insert, update on public.user_rewards to authenticated;
grant select on public.user_progress to authenticated;

grant insert (
  user_id,
  display_name,
  rating,
  content,
  challenge_day,
  completed_missions,
  review_context,
  reward_result_id,
  is_public
) on public.challenge_reviews to authenticated;
grant delete on public.challenge_reviews to authenticated;

revoke select on public.challenge_reviews from anon, authenticated;
grant select (
  id,
  display_name,
  rating,
  content,
  challenge_day,
  completed_missions,
  review_context,
  reward_result_id,
  reward_badge,
  is_public,
  created_at
) on public.challenge_reviews to anon, authenticated;
grant select (user_id) on public.challenge_reviews to authenticated;

create index if not exists challenge_reviews_reward_claim_idx
on public.challenge_reviews (user_id, review_context, reward_result_id, created_at desc);

update public.challenge_reviews review
set reward_badge = 'seven_day_finisher'
where review.review_context = 'seven_day_challenge'
  and exists (
    select 1
    from public.user_rewards reward
    where reward.user_id = review.user_id
      and reward.reward_context = 'seven_day_challenge'
      and reward.reward_type = 'sns'
      and reward.unlocked = true
  );

create table if not exists public.challenge_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  verification_code uuid not null default gen_random_uuid(),
  completed_missions integer not null default 21 check (completed_missions = 21),
  issued_at timestamptz not null default now(),
  unique (user_id),
  unique (verification_code)
);

alter table public.challenge_certificates enable row level security;
revoke all on public.challenge_certificates from anon, authenticated;
