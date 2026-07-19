# 무료 → 유료 여정 측정 및 give-flow 수신 계약

작성 기준: 2026-07-19  
무료 사이트: `https://hogoo-challenge.pages.dev`  
유료 사이트: `https://givecosystem.com`

이 문서는 화면 디자인과 독립된 데이터 계약이다. Fable 검수 중에는 UI를 변경하지 않고 아래 이벤트명과 파라미터 계약을 유지한다.

## 1. 현재 구현 범위

무료 사이트에서 완료된 항목:

- 브라우저별 무작위 `journey_id` 생성 및 로컬 저장
- GIVE ID 결과 유형과 챌린지 진행 일수 연결
- 모든 `trackEvent()` 호출에 공통 여정 컨텍스트 자동 추가
- 유료 링크에 `product`, UTM, `journey_id`, `result_type` 전달
- GA linker 대상에 `hogoo-challenge.pages.dev`, `givecosystem.com` 등록
- 중단한 결과·챌린지·완주 경로를 다시 여는 북마크

유료 사이트에서 아직 필요한 항목:

- `/start` 진입 파라미터 검증 및 세션 보관
- 유형별 첫 문장과 추천 이유 렌더링
- `paid_landing_view`, `checkout_open`, `purchase` 이벤트 연결
- 결제 완료 데이터와 최초 `journey_id` 연결

무료 사이트가 값을 보낸다는 사실만으로 유료 랜딩 개인화나 결제 귀속이 완성되지는 않는다.

## 2. URL 계약

예시:

```text
https://givecosystem.com/start
  ?product=give_id_challenge
  &utm_source=hogoo_free
  &utm_medium=give_result
  &utm_campaign=first_path
  &utm_content=result_final_path
  &journey_id=550e8400-e29b-41d4-a716-446655440000
  &result_type=diplomat
```

### 허용 파라미터

| 이름 | 필수 | 허용값·형식 | 용도 |
|---|---:|---|---|
| `product` | 예 | 아래 상품 allowlist | 표시 상품과 결제 경로 선택 |
| `journey_id` | 아니요 | UUID 또는 `gj_`로 시작하는 80자 이하 문자열 | 익명 여정 단계 연결 |
| `result_type` | 아니요 | 아래 7개 유형 allowlist | 랜딩 첫 문장·추천 설명 개인화 |
| `utm_source` | 아니요 | 100자 이하 | 기본값 `hogoo_free` |
| `utm_medium` | 아니요 | 100자 이하 | 무료 사이트 내 출발 단계 |
| `utm_campaign` | 아니요 | 100자 이하 | 기본값 `first_path` |
| `utm_content` | 아니요 | 100자 이하 | CTA 위치·실험안 구분 |
| `_gl` | 아니요 | Google linker 생성값 | GA4 교차 도메인 세션 연결 |

### 상품 allowlist

| 키 | 의미 | 현재 가격 표시 |
|---|---|---:|
| `give_id_only` | 심화 결과 보기 | 5,900원 |
| `give_id_challenge` | GIVE ID — 첫 번째 길 | 29,900원 |
| `give_id_challenge_upgrade` | 첫 번째 길로 이어가기 | 25,900원 |
| `give_maintenance_monthly` | 이어지는 길 | 유료 사이트 기준 |
| `give_maintenance_plus_monthly` | 이어지는 길 플러스 | 유료 사이트 기준 |
| `give_maintenance_6month` | 이어지는 길 6개월 | 유료 사이트 기준 |

URL의 상품명이나 가격은 결제 근거로 신뢰하지 않는다. 유료 사이트의 서버 측 상품 매핑을 최종 권위로 사용한다.

### 유형 allowlist

| 키 | 사용자 표시명 |
|---|---|
| `angel` | 다 퍼주는 강아지 |
| `diplomat` | 눈치 보는 고양이 |
| `architect` | 야무진 여우 |
| `guardian` | 현명한 올빼미 |
| `burnout` | 방전된 햄스터 |
| `blocker` | 철벽 고슴도치 |
| `mixed` | 영리한 너구리 |

알 수 없는 값은 오류 화면을 만들지 않고 비개인화 기본 랜딩으로 보낸다.

## 3. 유료 사이트 수신 순서

1. `/start` 최초 렌더 전에 파라미터를 allowlist로 검증한다.
2. GA가 `_gl`과 UTM을 읽을 수 있도록 분석 초기화를 먼저 수행한다.
3. 정제된 `journey_id`, `result_type`, UTM, 최초 진입 시각을 `sessionStorage`에 보관한다.
4. URL에서 `journey_id`와 `result_type`을 `history.replaceState()`로 제거한다. 공유·복사 시 다른 사람에게 개인화 상태가 전달되지 않게 한다.
5. 허용된 `result_type`만 개인화 카피에 사용한다.
6. 결제창을 열 때 서버가 결정한 상품 ID와 세션의 여정 컨텍스트를 함께 기록한다.
7. 결제 완료 이벤트에는 결제 시스템의 주문 ID를 사용하고 URL 가격을 사용하지 않는다.

권장 세션 구조:

```js
{
  version: 1,
  journeyId: "…",
  resultType: "diplomat",
  product: "give_id_challenge",
  source: "hogoo_free",
  medium: "give_result",
  campaign: "first_path",
  content: "result_final_path",
  receivedAt: "2026-07-19T00:00:00.000Z"
}
```

`journey_id`는 이름·이메일이 아니며 무료 사이트에서도 개인정보를 넣지 않는다. 결제 계정과 연결된 이후에는 유료 사이트의 개인정보 보유·삭제 정책을 적용한다.

## 4. 퍼널 이벤트 계약

### 공통 이벤트 파라미터

무료 사이트의 `trackEvent()`에는 자동으로 다음 값이 붙는다.

| 파라미터 | 예시 |
|---|---|
| `journey_id` | UUID 또는 `gj_…` |
| `result_type` | `diplomat`, 결과 전이면 `unknown` |
| `journey_stage` | `home`, `prologue`, `give_test`, `give_result`, `free_challenge`, `challenge_complete`, `content` |
| `challenge_day` | 0~7 |

### 핵심 퍼널

| 순서 | 이벤트 | 성공 판단 | GA4 핵심 이벤트 권장 |
|---:|---|---|---:|
| 1 | `give_prologue_view` | 프롤로그 진입 | 아니요 |
| 2 | `give_prologue_complete` | 실 또는 대체 버튼으로 검사 진입 | 예 |
| 3 | `give_test_start` | 첫 답변 완료 | 아니요 |
| 4 | `give_test_completed` | 16문항 완료 및 유형 산출 | 예 |
| 5 | `give_result_slide_view` | 결과 슬라이드별 도달 | 아니요 |
| 6A | `paid_cta_click` | 심화 결과·첫 번째 길 CTA 클릭 | 예 |
| 6B | `free_challenge_start` | 무료 7일 챌린지 선택 | 예 |
| 7 | `challenge_day_completed` | 날짜별 3개 미션 완료 | 아니요 |
| 8 | `challenge_complete_view` | 완주 화면 실제 도달 | 예 |
| 9 | `challenge_map_export` | 변화 지도 저장 또는 공유 | 아니요 |
| 10 | `funnel_paid_exit` | 무료 도메인에서 유료 도메인으로 이탈 | 예 |
| 11 | `paid_landing_view` | 유료 `/start`가 컨텍스트 수신 | 예, 유료 구현 필요 |
| 12 | `checkout_open` | 결제 UI 실제 열림 | 예, 유료 구현 필요 |
| 13 | `purchase` | 결제 승인 | 예, 유료 구현 필요 |

`challenge_started`, `challenge_day_complete`, `challenge_completed`는 기존 호환 이벤트다. 새 퍼널 보고서에서는 각각의 화면·React 이벤트와 중복 합산하지 않는다.

## 5. GA4 설정

이벤트 범위 사용자 정의 측정기준 권장:

- `result_type`
- `journey_stage`
- `challenge_day`
- `product`
- `placement`
- `utm_content`
- `resume_kind`

`journey_id`는 값의 종류가 지나치게 많은 고유 식별자이므로 GA4 사용자 정의 측정기준으로 등록하지 않는다. 개별 여정 연결이 필요하면 원시 이벤트 내보내기 또는 별도 익명 퍼널 저장소에서 사용한다. GA4 기본 보고서에서는 단계·유형·상품 같은 저카디널리티 차원을 사용한다.

무료·유료 양쪽 GA 설정에서 교차 도메인 linker를 허용하고 같은 측정 체계를 사용해야 세션이 추천 트래픽으로 끊기지 않는다.

## 6. 기준선과 계산식

Fable 개선 적용 전 최소 14일 또는 핵심 이벤트 300건 중 늦게 충족되는 시점까지 기준선을 수집한다.

```text
검사 시작률       = give_test_start / give_prologue_view
검사 완료율       = give_test_completed / give_test_start
결과→무료 시작률  = free_challenge_start / give_test_completed
결과→유료 클릭률  = paid_cta_click(result_final_path) / give_test_completed
챌린지 완주율     = challenge_complete_view / free_challenge_start
무료→유료 도달률  = paid_landing_view / funnel_paid_exit
결제창 진입률     = checkout_open / paid_landing_view
구매 전환율       = purchase / paid_landing_view
전체 구매율       = purchase / give_test_start
```

분모와 분자는 같은 기간의 고유 `journey_id` 기준으로 중복 제거한다. 쿠키 삭제·기기 변경·동의 거부로 인해 완전한 개인 연결이 불가능할 수 있으므로 집계 수치는 방향성 지표로 해석한다.

## 7. 개인화 안전 원칙

- 유형을 진단명처럼 단정하지 않는다.
- 불안·죄책감을 키워 결제를 압박하지 않는다.
- 개인화 데이터가 없더라도 상품 이해와 결제가 가능해야 한다.
- 유형별 차이는 첫 문장과 추천 이유에 집중하고 가격·환불·핵심 제공 내용은 동일하게 명확히 표시한다.
- “무료에서 발견한 패턴이 다음 길로 이어진다”는 서사를 사용하되, 7일 챌린지가 유료 진입의 필수 조건처럼 보이게 하지 않는다.

## 8. 유료 사이트 완료 조건

- 7개 정상 유형과 알 수 없는 유형을 모두 처리한다.
- 6개 상품 키 외 값으로 임의 결제 상품을 열 수 없다.
- 파라미터가 전혀 없어도 기본 랜딩이 정상 표시된다.
- 새 탭·새로고침·결제창 이동 후에도 세션 내 컨텍스트가 유지된다.
- 분석 초기화 뒤 민감하지 않은 개인화 파라미터를 주소창에서 제거한다.
- `paid_landing_view → checkout_open → purchase`가 같은 익명 여정으로 연결된다.
- 모바일 390px와 데스크톱 1280px, 모션 축소 환경에서 동작한다.
