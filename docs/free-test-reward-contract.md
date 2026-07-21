# 무료 결과 보상 데이터 계약 (free_test)

`feat/result-reward-envelope`에서 정리한 `public.user_rewards` 사용 규약.

## 현재 스키마 (변경 없음)

`supabase/migrations/20260516034323_reward_tables.sql` 기준. **이번 작업에서 스키마도 RLS도 바꾸지 않았다.**

| 컬럼 | 용도 |
|---|---|
| `user_id` | 소유자 (RLS `auth.uid() = user_id`) |
| `reward_context` | 무료 결과 보상은 항상 `'free_test'` |
| `result_id` | `give-test:<typeKey>` — **결과별 분리 키** |
| `reward_type` | `'sns'` (A) / `'review'` (B) / `'both'` (A+B) |
| `unlocked` | 해금 여부 |
| `generated_content` | 클라이언트에서 결정적으로 생성한 보상 본문(JSON) |
| `created_at` / `updated_at` | 시간 (트리거로 updated_at 자동 갱신) |

RLS 정책은 select/insert/update/delete 모두 `auth.uid() = user_id`로 이미 걸려 있어,
다른 사용자의 보상은 서버에서 차단된다. 클라이언트 쿼리도 항상 `user_id`를 함께 건다.

## 조회·저장 키

조회와 저장 모두 아래 네 값을 **함께** 사용한다. `result_id`가 빠지면 다른 유형에서 받은
보상이 섞이거나 덮어써진다 (이번 작업 전의 실제 버그).

```
user_id + reward_context='free_test' + result_id + reward_type
```

유일한 접근 지점은 `src/rewards/free-test-reward-service.js`의 `createRewardService(client)`다.
`reviews.html`도 같은 키 규칙을 따른다.

## result_id

| typeKey | result_id | 유형 |
|---|---|---|
| angel | `give-test:angel` | 다 퍼주는 강아지 |
| diplomat | `give-test:diplomat` | 눈치 보는 고양이 |
| architect | `give-test:architect` | 야무진 여우 |
| guardian | `give-test:guardian` | 현명한 올빼미 |
| burnout | `give-test:burnout` | 방전된 햄스터 |
| blocker | `give-test:blocker` | 철벽 고슴도치 |
| mixed | `give-test:mixed` | 영리한 너구리 |

알 수 없는 type은 `mixed`로 정규화한다 (`normalizeTypeKey`).

## 보존 규칙

- **보상은 삭제하지 않는다.** 서비스에 delete 경로가 없다 (단위 테스트로 고정).
- 재검사는 로컬 검사 상태(`give_test_result`, `give_test_scores`, draft)만 초기화한다.
- 다른 유형이 나오면 새 `result_id`로 **별도 저장**되고 기존 보상은 그대로 남는다.
- 후기를 삭제해도 `free_test` 보상은 회수하지 않는다. 후기 row에는 `result_id`가 없어
  컨텍스트만으로 지우면 다른 유형의 보상까지 함께 사라지기 때문이다.

## 레거시 보상 (`result_id IS NULL`)

이전 위젯이 `result_id` 없이 저장한 row가 있을 수 있다.

- 삭제하거나 값을 채워 넣지 않는다.
- 현재 결과의 해금 상태로 **적용하지 않는다** (조회가 `result_id`로 걸러내므로 자동으로 제외된다).
- 마이페이지 "나의 보상 봉투"에서 **"이전 무료 보상"** 그룹으로 보존 표시한다.

## 적용하지 않은 제안 — 중복 방지 unique 인덱스

현재 스키마에는 중복 row를 막는 제약이 없다. 서비스가 조회 후 update/insert 하므로
동시 클릭 시 이론상 중복 row가 생길 수 있다 (UI에서 저장 중 버튼 비활성화로 완화).

정말 필요해지면 아래를 **기존 데이터 정리 후** 적용해야 한다. 파괴적이라 이번에 적용하지 않았고,
마이그레이션 파일로도 추가하지 않았다.

```sql
-- 1) 먼저 중복 확인 (읽기 전용)
select user_id, reward_context, result_id, reward_type, count(*)
from public.user_rewards
group by 1,2,3,4 having count(*) > 1;

-- 2) 중복이 없을 때만 부분 유니크 인덱스 추가.
--    result_id가 NULL인 레거시 row는 대상에서 제외한다.
create unique index concurrently if not exists user_rewards_free_test_unique
on public.user_rewards (user_id, reward_context, result_id, reward_type)
where result_id is not null;
```

중복이 있으면 삭제하지 말고 가장 오래된 row를 남기는 병합 계획을 따로 세울 것.
