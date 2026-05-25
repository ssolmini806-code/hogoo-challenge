# GA4 퍼널 이벤트 설계 스펙

## 배경

GA4 태그(`G-P6PM6JBJH1`)가 설치되어 있으나 커스텀 이벤트가 전혀 없음.
자동 수집 이벤트(page_view, scroll 등)만 동작 중.

목표: 구매/구독 전환 최적화를 위한 완전한 퍼널 가시성 확보.

---

## 전환 구조

```
[랜딩] → [GIVE ID 진단] → [결과 열람] → [유료 CTA 클릭]  ← 핵심 전환 #1
                                       ↘
                                       [SNS 공유] → [잠긴 콘텐츠 해금]

[챌린지 랜딩] → [로그인 모달] → [회원가입] → [Day 진행] → [완료] → [보상 해금]  ← 핵심 전환 #2
```

---

## 공통 헬퍼

모든 파일에 동일한 래퍼 사용. `gtag`가 로드되지 않은 경우 조용히 실패.

```js
function trackEvent(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}
```

- **give-test.html**: `<script>` 블록 내 상단에 추가
- **App.jsx**: 컴포넌트 함수 외부 상단에 추가
- **Auth.jsx**: 컴포넌트 함수 외부 상단에 추가

---

## 퍼널 A: GIVE ID 진단 (give-test.html)

### 이벤트 목록

| 이벤트명 | 삽입 위치 | 파라미터 |
|---------|---------|---------|
| `give_test_start` | `answerQuestion()` — `current === 0` 조건부 | — |
| `give_test_progress` | `answerQuestion()` — `current`가 4 또는 9일 때 | `{ checkpoint: 5 }` / `{ checkpoint: 10 }` |
| `give_test_completed` | `showResult()` 내 `renderResult(key)` 호출 직전 | `{ give_type: key }` |
| `give_result_viewed` | `renderResult()` 내 DOM 렌더링 완료 직후 | `{ give_type: key }` |
| `give_share_clicked` | `snsKakao()`, `snsX()`, `snsInsta()`, `snsCopy()` 각 함수 상단 | `{ channel: 'kakao'/'x'/'insta'/'copy', give_type: finalKey }` |
| `give_share_confirmed` | SNS 공유 확인 버튼(`.locked-interpretation-overlay`) 클릭 핸들러 내 잠금 해제 시 | `{ give_type: finalKey }` |
| `give_reward_unlocked` | `renderLockedInterpretation(key, true)` 호출 직후 | `{ reward_type: 'sns_share', give_type: key }` |
| `paid_cta_clicked` | `openPaid(source)` 함수 내 `window.open` 직전 | `{ source, give_type: finalKey }` |
| `article_clicked` | 아티클 이동 버튼 onclick — setting-boundaries, smart-giver-guide | `{ article_slug }` |

### 구현 상세

**`give_test_start`** — 첫 답 선택 시 1회만 발생:
```js
function answerQuestion(score) {
  if (current === 0) trackEvent('give_test_start');
  // 기존 로직...
}
```

**`give_test_progress`** — Q5, Q10 체크포인트:
```js
// current는 0-based, 답변 후 증가 전 시점
if (current === 4) trackEvent('give_test_progress', { checkpoint: 5 });
if (current === 9) trackEvent('give_test_progress', { checkpoint: 10 });
```

**`paid_cta_clicked`** — source 3가지: `result_bridge`, `new_cta`, `locked_panel`:
```js
function openPaid(source) {
  trackEvent('paid_cta_clicked', { source, give_type: finalKey });
  window.open(paidUrl(source), '_blank', 'noopener,noreferrer');
}
```

**`give_share_clicked`** — 각 SNS 함수 상단:
```js
function snsKakao() {
  trackEvent('give_share_clicked', { channel: 'kakao', give_type: finalKey });
  // 기존 카카오 공유 로직...
}
```

**`give_share_confirmed` / `give_reward_unlocked`** — 잠금 해제 오버레이 버튼 핸들러:
```js
// lockedInterpretationOverlay 클릭 시 공유 확인 후 해금
overlayBtn.addEventListener('click', () => {
  trackEvent('give_share_confirmed', { give_type: finalKey });
  renderLockedInterpretation(finalKey, true);
  trackEvent('give_reward_unlocked', { reward_type: 'sns_share', give_type: finalKey });
});
```

**`article_clicked`** — 두 CTA 버튼:
```js
onclick="trackEvent('article_clicked', { article_slug: 'setting-boundaries' }); location.href='...'"
onclick="trackEvent('article_clicked', { article_slug: 'smart-giver-guide' }); location.href='...'"
```

---

## 퍼널 B: 7일 챌린지 (App.jsx + Auth.jsx)

### 이벤트 목록

| 이벤트명 | 삽입 위치 | 파라미터 |
|---------|---------|---------|
| `challenge_landing_viewed` | App.jsx — 마운트 `useEffect`, 세션 없을 때 | — |
| `login_modal_opened` | App.jsx — `setLoginModalOpen(true)` 3곳 | `{ trigger: 'challenge_start'/'share'/'review' }` |
| `sign_up` | Auth.jsx — 회원가입 성공 콜백 | `{ method: 'email' }` |
| `login` | Auth.jsx — 로그인 성공 콜백 | `{ method: 'email' }` |
| `challenge_day_started` | App.jsx — `currentDay` state 변경 감지 `useEffect` | `{ day_index: currentDay + 1 }` |
| `challenge_mission_completed` | App.jsx — 미션 토글 완료 후 | `{ day_index: currentDay + 1, missions_done, missions_total }` |
| `challenge_day_completed` | App.jsx — 하루 전체 미션 완료 감지 | `{ day_index: currentDay + 1, completion_rate }` |
| `challenge_all_completed` | App.jsx — Day 6 완료 시 | `{ completion_rate, total_days: 7 }` |
| `challenge_share_completed` | App.jsx — `handleShareComplete()` 성공 후 | — |
| `challenge_reward_unlocked` | App.jsx — `saveReward()` 성공 후 | `{ reward_type }` |

### 구현 상세

**`challenge_landing_viewed`** — 비로그인 첫 방문:
```js
useEffect(() => {
  if (!session) trackEvent('challenge_landing_viewed');
}, []);
```

**`login_modal_opened`** — trigger별로 3곳 식별:
- `handleShareComplete` 내 `setLoginModalOpen(true)` → `trigger: 'share'`
- `handleReviewClick` 내 `setLoginModalOpen(true)` → `trigger: 'review'`
- 챌린지 시작 버튼 클릭 → `trigger: 'challenge_start'`

**`challenge_mission_completed` / `challenge_day_completed` / `challenge_all_completed`**:
미션 토글 핸들러 내에서 완료 카운트를 계산하여 발생:
```js
const dayMissions = DAYS[currentDay].missions;
const doneMissions = updatedMissions.length;
const totalMissions = dayMissions.length;
trackEvent('challenge_mission_completed', { day_index: currentDay + 1, missions_done: doneMissions, missions_total: totalMissions });

if (doneMissions === totalMissions) {
  const rate = Math.round((completionRate) * 100);
  trackEvent('challenge_day_completed', { day_index: currentDay + 1, completion_rate: rate });
  if (currentDay === 6) {
    trackEvent('challenge_all_completed', { completion_rate: rate, total_days: 7 });
  }
}
```

**`challenge_reward_unlocked`**:
```js
const saveReward = async (rewardType, generatedContent) => {
  // 기존 저장 로직...
  trackEvent('challenge_reward_unlocked', { reward_type: rewardType });
};
```

---

## GA4 전환 표시 대상 (GA4 관리자 설정, 코드 아님)

| 이벤트 | 이유 |
|--------|------|
| `paid_cta_clicked` | 핵심 수익 전환 — 유료 사이트 이동 |
| `sign_up` | 구독 퍼널 진입 기준 |
| `challenge_all_completed` | 챌린지 완주 = 가장 높은 참여 전환 |
| `challenge_reward_unlocked` (reward_type=both) | A+B 보상 달성 = 최고 참여도 |

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `give-test.html` | `trackEvent` 헬퍼 추가, 9개 이벤트 삽입 |
| `App.jsx` | `trackEvent` 헬퍼 추가, 8개 이벤트 삽입 |
| `src/components/Auth.jsx` | `trackEvent` 헬퍼 추가, `sign_up`/`login` 이벤트 삽입 |

---

## 검증 방법

1. GA4 DebugView (`?debug_mode=true` URL 파라미터 또는 GA4 확장 프로그램) 로 실시간 확인
2. 각 이벤트 발화 시 DebugView에 이벤트명 + 파라미터 표시 확인
3. 배포 후 24시간 이내 GA4 실시간 보고서에서 이벤트 수 확인
