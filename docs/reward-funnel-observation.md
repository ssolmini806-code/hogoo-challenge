# 무료 GIVE ID 보상 퍼널 관찰 계약

## 목적

결과 보상 슬라이드에 도착한 사람이 공유·후기를 시작하고, 실제 해금과 보관함 재방문,
64문항 자기점검 연결까지 어디에서 멈추는지 본다. 가격·구매 이벤트와 섞지 않는다.

## GA4 탐색 경로

자유 형식 퍼널 탐색에서 아래 단계를 순서대로 둔다. 기간은 기능 배포 후 7일과 14일을 각각 본다.

1. `reward_slide_view` — 보상 슬라이드를 실제로 본 세션
2. `share_action_start` 또는 `review_start` — 보상 행동을 시작한 세션
3. `reward_login_open` — 행동 중 로그인이 필요했던 세션(보조 이탈 진단)
4. `reward_a_unlocked` 또는 `reward_b_unlocked` — DB 저장까지 끝난 해금
5. `reward_both_unlocked` — A+B 편지 완성
6. `reward_archive_open` → `reward_archive_view` — 보관함 클릭과 실제 도착
7. `diagnosis_handoff_click` — 무료 64문항 자기점검으로 이어짐

`result_type`, `reward_type`, `channel`, `logged_in`, `placement`, `journey_id`로만 분해한다.
이메일, user_id, 후기 본문, 답변 원문, 세부 점수는 전송하지 않는다.

## 우선 확인할 비율

- 보상 행동 시작률 = 2 / 1
- 공유 해금률 = `reward_a_unlocked` / `share_action_start`
- 후기 해금률 = `reward_b_unlocked` / `review_start`
- 로그인 회복률 = `reward_login_complete` / `reward_login_open`
- A+B 완성률 = 5 / 1
- 보관함 도착률 = `reward_archive_view` / `reward_archive_open`
- 심화 자기점검 연결률 = 7 / 5

표본이 100세션보다 적으면 유형별 문구를 성급하게 바꾸지 않는다. 첫 7일은 기술 오류와 큰 이탈만,
14일째에 채널·로그인 여부·모바일/데스크톱 차이를 함께 판단한다.

## 배포 직후 품질 확인

GA4 DebugView에서 개인 식별 정보 없이 위 이벤트와 공통 문맥이 들어오는지 한 세션으로 확인한다.
실제 전환 수치는 관찰 기간이 쌓인 뒤 기록하며, 테스트 이벤트는 내부 트래픽 필터로 제외한다.

