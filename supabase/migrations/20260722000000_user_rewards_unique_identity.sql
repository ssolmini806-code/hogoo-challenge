-- user_rewards의 논리적 식별자를 DB가 직접 보장한다.
-- NULLS NOT DISTINCT 덕분에 result_id가 없는 레거시/7일 보상도 같은 유형이 중복되지 않는다.

-- 기존 중복을 임의로 지우지 않는다. 운영 감사 없이 데이터가 사라지는 일을 막기 위해
-- 중복 그룹이 하나라도 있으면 마이그레이션 전체를 중단한다.
do $$
declare
  duplicate_groups integer;
begin
  select count(*)
  into duplicate_groups
  from (
    select 1
    from public.user_rewards
    group by user_id, reward_context, result_id, reward_type
    having count(*) > 1
  ) duplicates;

  if duplicate_groups > 0 then
    raise exception 'user_rewards has % duplicate identity group(s); audit before creating the unique index', duplicate_groups;
  end if;
end $$;

create unique index if not exists user_rewards_identity_unique
on public.user_rewards (user_id, reward_context, result_id, reward_type) nulls not distinct;
