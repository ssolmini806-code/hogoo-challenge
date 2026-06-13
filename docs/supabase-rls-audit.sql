-- Supabase RLS audit for the free-site client surface.
-- Run in Supabase SQL Editor after applying migrations.

-- 1) RLS status for tables referenced by the client.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  coalesce(policy_counts.policy_count, 0) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join (
  select
    schemaname,
    tablename,
    count(*) as policy_count
  from pg_policies
  group by schemaname, tablename
) policy_counts
  on policy_counts.schemaname = n.nspname
  and policy_counts.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles',
    'user_progress',
    'user_rewards',
    'challenge_reviews',
    'reviews',
    'hall_of_fame',
    'payment_orders',
    'user_subscriptions'
  )
order by c.relname;

-- 2) Policy details.
select
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'user_progress',
    'user_rewards',
    'challenge_reviews',
    'reviews',
    'hall_of_fame',
    'payment_orders',
    'user_subscriptions'
  )
order by tablename, policyname;

-- 3) Table privileges granted to anon/authenticated.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'profiles',
    'user_progress',
    'user_rewards',
    'challenge_reviews',
    'reviews',
    'hall_of_fame',
    'payment_orders',
    'user_subscriptions'
  )
order by table_name, grantee, privilege_type;

-- 4) Column-level privileges, useful for checking public user_id exposure.
select
  grantee,
  table_name,
  column_name,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'profiles',
    'user_progress',
    'user_rewards',
    'challenge_reviews',
    'reviews',
    'hall_of_fame',
    'payment_orders',
    'user_subscriptions'
  )
order by table_name, column_name, grantee, privilege_type;

-- 5) Fast red flags: public tables with RLS off.
select
  n.nspname as schema_name,
  c.relname as table_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false
order by c.relname;
