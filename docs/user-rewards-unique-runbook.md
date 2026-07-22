# user_rewards 중복 방지 운영 적용

프런트의 원자적 `upsert`보다 DB 유니크 인덱스를 먼저 적용해야 한다. 순서를 바꾸면 운영 저장이 실패한다.

## 1. 읽기 전용 감사

Supabase SQL Editor에서 아래 쿼리만 먼저 실행한다.

```sql
select
  user_id,
  reward_context,
  result_id,
  reward_type,
  count(*) as row_count,
  array_agg(id order by created_at) as row_ids
from public.user_rewards
group by user_id, reward_context, result_id, reward_type
having count(*) > 1
order by row_count desc;
```

- 결과 0행: 마이그레이션 적용 가능
- 결과 존재: 삭제하지 말고 행별 `unlocked`, `generated_content`, `created_at`을 검토한 뒤 별도 정리 승인 필요

## 2. 마이그레이션 적용

`supabase/migrations/20260722000000_user_rewards_unique_identity.sql`을 적용한다. 이 파일 자체도 중복을 다시 검사하며, 발견 시 아무 데이터도 지우지 않고 실패한다.

## 3. 적용 확인

```sql
select indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'user_rewards'
  and indexname = 'user_rewards_identity_unique';
```

그다음에만 이 브랜치의 프런트 코드를 배포한다.
