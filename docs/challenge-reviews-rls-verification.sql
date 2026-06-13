-- Verification script for challenge_reviews RLS.
-- Run after applying supabase/migrations/20260613000000_challenge_reviews_rls.sql.
--
-- Replace the two UUID values below with real auth.users IDs from your project.
-- The transaction rolls back at the end, so test rows are not kept.

begin;

-- 1) Confirm RLS is enabled.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'challenge_reviews';

-- 2) Confirm expected policies exist.
select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'challenge_reviews'
order by policyname;

-- 3) Confirm anon cannot select user_id, while public review columns are selectable.
set local role anon;

select
  id,
  display_name,
  rating,
  content,
  completed_missions,
  created_at
from public.challenge_reviews
where is_public = true
limit 3;

-- This should fail for anon after the migration:
-- select user_id from public.challenge_reviews limit 1;

reset role;

-- 4) Simulate authenticated user A.
-- Replace this value.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
set local role authenticated;

insert into public.challenge_reviews (
  user_id,
  display_name,
  rating,
  content,
  challenge_day,
  completed_missions,
  review_context,
  is_public
) values (
  '00000000-0000-0000-0000-000000000001',
  'RLS 테스트',
  5,
  'RLS 정책 검증을 위한 임시 후기입니다.',
  1,
  1,
  'free_test',
  true
)
returning id, display_name, rating, content, completed_missions, created_at;

-- This should fail because user A cannot insert as user B.
-- Replace user B value before uncommenting.
-- insert into public.challenge_reviews (
--   user_id,
--   display_name,
--   rating,
--   content
-- ) values (
--   '00000000-0000-0000-0000-000000000002',
--   '차단 테스트',
--   5,
--   '다른 사용자 ID로 쓰는 시도는 실패해야 합니다.'
-- );

-- 5) Invalid content should fail.
-- insert into public.challenge_reviews (
--   user_id,
--   display_name,
--   rating,
--   content
-- ) values (
--   '00000000-0000-0000-0000-000000000001',
--   '짧은 후기',
--   5,
--   '짧음'
-- );

reset role;

rollback;
