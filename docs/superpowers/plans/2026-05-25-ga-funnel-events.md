# GA4 퍼널 이벤트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 구매/구독 전환 최적화를 위해 GIVE ID 진단(give-test.html), 7일 챌린지(App.jsx), 인증(Auth.jsx) 3개 파일에 GA4 커스텀 이벤트 17개를 삽입한다.

**Architecture:** 모든 파일에 공통 `trackEvent(name, params)` 헬퍼를 인라인으로 추가한다. gtag가 없을 때 조용히 실패하므로 별도 모듈화는 불필요하다. 이벤트는 사용자 액션 직전/직후에 동기적으로 발화한다.

**Tech Stack:** GA4 gtag.js (G-P6PM6JBJH1), 순수 JS (give-test.html), React 18 (App.jsx, Auth.jsx)

---

## 수정 파일 목록

| 파일 | 역할 |
|------|------|
| `give-test.html` | 진단 퍼널 8개 이벤트 — `trackEvent` 헬퍼 추가, `selectAnswer` / `showResult` / `renderResult` / `openPaid` / `free-test-reward-status` 리스너 수정 |
| `public/share.js` | `give_share_clicked` — `snsKakao` / `snsX` / `snsInsta` / `snsCopy` 각각에 trackEvent 추가 |
| `App.jsx` | 챌린지 퍼널 8개 이벤트 — `trackEvent` 헬퍼 추가, `toggleMission` / `handleShareComplete` / `handleReviewClick` / `saveReward` + `useEffect` 수정, `setLoginModalOpen(true)` 호출부 5곳 래퍼 함수로 교체 |
| `src/components/Auth.jsx` | `sign_up` / `login` — `handleAuth` 내 성공 분기에 trackEvent 추가 |

---

## Task 1: give-test.html — trackEvent 헬퍼 + 진단 시작/진행 이벤트

**Files:**
- Modify: `give-test.html:5-10` (GA script 블록 바로 아래)
- Modify: `give-test.html:817-830` (`selectAnswer` 함수)

- [ ] **Step 1: trackEvent 헬퍼를 GA script 블록 바로 아래에 추가**

`give-test.html`의 9번째 줄 (`gtag('config', 'G-P6PM6JBJH1');`) 바로 다음 `</script>` 닫는 태그 뒤에 새 `<script>` 블록을 추가한다.

```html
    </script>
    <script>
      function trackEvent(name, params) {
        if (typeof gtag === 'function') gtag('event', name, params || {});
      }
    </script>
```

- [ ] **Step 2: selectAnswer에 give_test_start / give_test_progress 삽입**

`give-test.html`의 `selectAnswer` 함수(현재 line 817)를 아래로 교체:

```js
function selectAnswer(score) {
    if (current === 0) trackEvent('give_test_start');
    if (current === 4) trackEvent('give_test_progress', { checkpoint: 5 });
    if (current === 9) trackEvent('give_test_progress', { checkpoint: 10 });

    if (4 > current) scores.G += score;
    else if (8 > current) scores.I += score;
    else if (12 > current) scores.V += score;
    else scores.E += score;

    current += 1;
    if (questions.length > current) {
        renderQuestion();
    } else {
        document.getElementById("progressFill").style.width = "100%";
        showResult();
    }
}
```

- [ ] **Step 3: 브라우저에서 직접 검증**

로컬에서 `give-test.html`을 열고 첫 번째 답 선택 시 콘솔에 다음 확인:
```
// 브라우저 콘솔에서 gtag를 오버라이드해서 확인
window.gtag = function(cmd, name, params) { console.log('[GA]', name, params); };
```
Q1 답 → `give_test_start` 출력 확인  
Q5 답 → `give_test_progress {checkpoint: 5}` 출력 확인  
Q10 답 → `give_test_progress {checkpoint: 10}` 출력 확인

- [ ] **Step 4: 커밋**

```bash
git add give-test.html
git commit -m "feat: add GA4 give_test_start and give_test_progress events"
```

---

## Task 2: give-test.html — 완료/결과 이벤트

**Files:**
- Modify: `give-test.html` — `showResult` 함수 (line ~843), `renderResult` 함수 (line ~878)

- [ ] **Step 1: showResult에 give_test_completed 삽입**

`showResult` 함수를 아래로 교체:

```js
function showResult() {
    const key = getFinalKey();
    localStorage.setItem('give_test_result', key);
    trackEvent('give_test_completed', { give_type: key });
    renderResult(key);
}
```

- [ ] **Step 2: renderResult에 give_result_viewed 삽입**

`renderResult` 함수 내 `window.scrollTo(0, 0);` 바로 다음 줄에 추가:

```js
function renderResult(key) {
    console.log("[give-test] renderResult executed:", key);
    finalKey = key;
    finalResult = results[key];
    const paid = paidDetails[key] || paidDetails.mixed;
    document.getElementById("landing-page").classList.add("hidden");
    document.getElementById("test-page").classList.add("hidden");
    document.getElementById("result-page").classList.remove("hidden");
    document.getElementById("completion").classList.add("show");
    window.scrollTo(0, 0);
    trackEvent('give_result_viewed', { give_type: key });
    // ... 이하 기존 코드 유지
```

- [ ] **Step 3: 브라우저 검증**

16문항 완주 → 콘솔에서 `give_test_completed {give_type: 'burnout'}` (또는 다른 유형)과 `give_result_viewed {give_type: '...'}` 순서대로 출력 확인.

- [ ] **Step 4: 커밋**

```bash
git add give-test.html
git commit -m "feat: add GA4 give_test_completed and give_result_viewed events"
```

---

## Task 3: give-test.html — 유료 CTA 클릭 이벤트

**Files:**
- Modify: `give-test.html` — `openPaid` 함수 (line ~991)

- [ ] **Step 1: openPaid에 paid_cta_clicked 삽입**

`openPaid` 함수를 아래로 교체:

```js
function openPaid(source) {
    trackEvent('paid_cta_clicked', { source: source, give_type: finalKey });
    window.open(paidUrl(source), "_blank", "noopener,noreferrer");
}
```

- [ ] **Step 2: article_clicked 이벤트 추가**

결과 페이지의 아티클 이동 버튼 2개 onclick을 수정한다.

`onclick="location.href='articles/setting-boundaries.html'"` →
```html
onclick="trackEvent('article_clicked', { article_slug: 'setting-boundaries' }); location.href='articles/setting-boundaries.html'"
```

`onclick="location.href='articles/smart-giver-guide.html'"` →
```html
onclick="trackEvent('article_clicked', { article_slug: 'smart-giver-guide' }); location.href='articles/smart-giver-guide.html'"
```

- [ ] **Step 3: 브라우저 검증**

결과 페이지에서 "GIVE ID 심화 분석 받기 →" 버튼 클릭 → 콘솔에 `paid_cta_clicked {source: 'result_bridge', give_type: '...'}` 출력 확인.  
"잠긴 분석 열기 →" 클릭 → `paid_cta_clicked {source: 'locked_panel', ...}` 출력 확인.  
아티클 버튼 클릭 → `article_clicked {article_slug: 'setting-boundaries'}` 출력 확인.

- [ ] **Step 4: 커밋**

```bash
git add give-test.html
git commit -m "feat: add GA4 paid_cta_clicked and article_clicked events"
```

---

## Task 4: give-test.html — 공유 보상 해금 이벤트

**Files:**
- Modify: `give-test.html` — `free-test-reward-status` 이벤트 리스너 (line ~935)

SNS 공유 확인은 `free-test-reward-widget` 컴포넌트가 처리하며, 결과를 `free-test-reward-status` CustomEvent로 알린다. 이 리스너에서 `isShared`가 처음 true가 될 때 이벤트를 발화한다.

- [ ] **Step 1: 공유 상태 추적 플래그 추가 후 리스너 수정**

현재 코드(line ~935):
```js
window.addEventListener("free-test-reward-status", (event) => {
    const detail = event.detail || {};
    if (detail.rootId && detail.rootId !== "give-test-reward-root") return;
    if (!finalKey) return;
    renderLockedInterpretation(finalKey, Boolean(detail.isShared));
});
```

이를 아래로 교체:
```js
let _shareTracked = false;
window.addEventListener("free-test-reward-status", (event) => {
    const detail = event.detail || {};
    if (detail.rootId && detail.rootId !== "give-test-reward-root") return;
    if (!finalKey) return;
    const isShared = Boolean(detail.isShared);
    if (isShared && !_shareTracked) {
        _shareTracked = true;
        trackEvent('give_share_confirmed', { give_type: finalKey });
        trackEvent('give_reward_unlocked', { reward_type: 'sns_share', give_type: finalKey });
    }
    renderLockedInterpretation(finalKey, isShared);
});
```

- [ ] **Step 2: 브라우저 검증**

결과 페이지 → 공유 보상 위젯에서 공유 완료 → 콘솔에 `give_share_confirmed` 후 `give_reward_unlocked {reward_type: 'sns_share', ...}` 출력 확인.  
새로고침 후 이미 공유된 상태에서는 이벤트가 재발화되지 않아야 한다 (`_shareTracked = false`로 리셋되므로 새 세션에서 1회 발화 — 이는 허용 범위).

- [ ] **Step 3: 커밋**

```bash
git add give-test.html
git commit -m "feat: add GA4 give_share_confirmed and give_reward_unlocked events"
```

---

## Task 5: public/share.js — give_share_clicked 이벤트

**Files:**
- Modify: `public/share.js`

share.js의 각 SNS 함수 첫 줄에 gtag 호출을 추가한다. `window.finalKey`는 give-test.html에서 전역으로 설정되며 다른 페이지에서는 undefined (문제 없음).

- [ ] **Step 1: 각 SNS 함수에 trackEvent 추가**

`public/share.js` 전체를 아래로 교체:

```js
(function(){
  function trackEvent(name, params) {
    if (typeof gtag === 'function') gtag('event', name, params || {});
  }
  function toast(m){
    var e=document.getElementById('snst');
    if(!e)return;
    e.textContent=m;
    e.classList.add('on');
    clearTimeout(e._t);
    e._t=setTimeout(function(){e.classList.remove('on')},3500);
  }
  function copy(u,m){
    if(navigator.clipboard){
      navigator.clipboard.writeText(u).then(function(){toast(m)}).catch(function(){fb(u,m)});
    }else{fb(u,m);}
  }
  function fb(u,m){
    var el=document.createElement('textarea');
    el.value=u;el.style.cssText='position:fixed;top:-999px;opacity:0';
    document.body.appendChild(el);el.select();
    try{document.execCommand('copy');}catch(e){}
    document.body.removeChild(el);toast(m);
  }
  window.snsX=function(){
    trackEvent('give_share_clicked', { channel: 'x', give_type: window.finalKey || null });
    window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(document.title)+'&url='+encodeURIComponent(location.href),'_blank','width=600,height=400,noopener');
  };
  window.snsThreads=function(){
    trackEvent('give_share_clicked', { channel: 'threads', give_type: window.finalKey || null });
    window.open('https://www.threads.net/intent/post?text='+encodeURIComponent(document.title+'\n\n'+location.href),'_blank','width=600,height=600,noopener');
  };
  window.snsKakao=function(){
    trackEvent('give_share_clicked', { channel: 'kakao', give_type: window.finalKey || null });
    if(navigator.share){navigator.share({title:document.title,url:location.href});}
    else{copy(location.href,'링크 복사 완료! 카카오톡에 붙여넣기 해주세요 💛');}
  };
  window.snsInsta=function(){
    trackEvent('give_share_clicked', { channel: 'insta', give_type: window.finalKey || null });
    if(navigator.share){
      navigator.share({title:document.title,url:location.href}).catch(function(){});
    }else{
      copy(location.href,'링크 복사 완료! 인스타 스토리에 붙여넣기 해주세요 📸');
    }
  };
  window.snsTiktok=function(){
    trackEvent('give_share_clicked', { channel: 'tiktok', give_type: window.finalKey || null });
    copy(location.href,'링크 복사 완료! 틱톡 앱에 붙여넣기 해주세요 🎵');
  };
  window.snsCopy=function(btn){
    trackEvent('give_share_clicked', { channel: 'copy', give_type: window.finalKey || null });
    var span=btn&&btn.querySelector('span');
    var orig=span?span.textContent:'링크 복사';
    copy(location.href,'링크가 복사되었어요 🔗');
    if(span){span.textContent='복사 완료!';setTimeout(function(){span.textContent=orig;},1500);}
  };
})();
```

- [ ] **Step 2: 브라우저 검증**

give-test.html 결과 페이지 → 카카오 버튼 클릭 → 콘솔에 `give_share_clicked {channel: 'kakao', give_type: '...'}` 출력 확인.  
링크 복사 버튼 → `give_share_clicked {channel: 'copy', ...}` 출력 확인.

- [ ] **Step 3: 커밋**

```bash
git add public/share.js
git commit -m "feat: add GA4 give_share_clicked event to all SNS share functions"
```

---

## Task 6: Auth.jsx — sign_up / login 이벤트

**Files:**
- Modify: `src/components/Auth.jsx:10-28` (`handleAuth` 함수)

- [ ] **Step 1: trackEvent 헬퍼 추가 및 handleAuth 수정**

`Auth.jsx` 파일 상단 import 바로 다음에 헬퍼를 추가하고, `handleAuth` 성공 분기에 이벤트를 삽입한다.

`import { supabase } from '../supabase';` 다음 줄에 추가:
```js
function trackEvent(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}
```

`handleAuth` 함수를 아래로 교체:
```js
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        trackEvent('sign_up', { method: 'email' });
        alert('회원가입 확인 메일을 확인해주세요!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        trackEvent('login', { method: 'email' });
      }
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 2: 브라우저 검증**

챌린지 앱에서 회원가입 폼 제출 → 콘솔에 `sign_up {method: 'email'}` 출력 확인.  
로그인 폼 제출 → `login {method: 'email'}` 출력 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/components/Auth.jsx
git commit -m "feat: add GA4 sign_up and login events to Auth component"
```

---

## Task 7: App.jsx — trackEvent 헬퍼 + login_modal_opened 이벤트

**Files:**
- Modify: `App.jsx:1-22` (헬퍼 추가), App.jsx 전체 `setLoginModalOpen(true)` 5곳

- [ ] **Step 1: trackEvent 헬퍼 및 openLoginModal 래퍼 추가**

`App.jsx`에서 `const CHALLENGE_COMPLETED_AT_KEY = 'challenge_completed_at';` 줄(line 21) 바로 다음에 추가:

```js
function trackEvent(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}

function openLoginModal(setFn, trigger) {
  trackEvent('login_modal_opened', { trigger: trigger });
  setFn(true);
}
```

- [ ] **Step 2: setLoginModalOpen(true) 5곳을 openLoginModal 호출로 교체**

**2a. `handleShareComplete` (line ~240):**
```js
// Before:
if (!session) { setLoginModalOpen(true); return; }
// After:
if (!session) { openLoginModal(setLoginModalOpen, 'share'); return; }
```

**2b. `handleReviewClick` (line ~255):**
```js
// Before:
if (!session) { setLoginModalOpen(true); return; }
// After:
if (!session) { openLoginModal(setLoginModalOpen, 'review'); return; }
```

**2c. `toggleMission` (line ~298):**
```js
// Before:
if (!adminMode && !session) { setLoginModalOpen(true); return; }
// After:
if (!adminMode && !session) { openLoginModal(setLoginModalOpen, 'mission_click'); return; }
```

**2d. `updateField` (line ~309):**
```js
// Before:
if (!adminMode && !session) { setLoginModalOpen(true); return; }
// After:
if (!adminMode && !session) { openLoginModal(setLoginModalOpen, 'field_update'); return; }
```

**2e. `submitReview` (line ~378):**
```js
// Before:
if (!session) { setLoginModalOpen(true); return; }
// After:
if (!session) { openLoginModal(setLoginModalOpen, 'review'); return; }
```

- [ ] **Step 3: 브라우저 검증**

비로그인 상태에서 미션 체크박스 클릭 → 콘솔에 `login_modal_opened {trigger: 'mission_click'}` + 로그인 모달 오픈 확인.  
공유 버튼 클릭 → `login_modal_opened {trigger: 'share'}` 확인.

- [ ] **Step 4: 커밋**

```bash
git add App.jsx
git commit -m "feat: add GA4 trackEvent helper and login_modal_opened event to App"
```

---

## Task 8: App.jsx — challenge_landing_viewed 이벤트

**Files:**
- Modify: `App.jsx` — Admin token listener `useEffect` (line ~50)

- [ ] **Step 1: 마운트 시 비로그인 방문 추적 useEffect 추가**

`App.jsx`에서 Admin token listener `useEffect` (line 50) 바로 앞에 새 useEffect 추가:

```js
  // GA4: challenge landing view (non-logged-in visitors only)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!initialSession) {
        trackEvent('challenge_landing_viewed');
      }
    });
  }, []);
```

- [ ] **Step 2: 브라우저 검증**

비로그인 상태로 챌린지 앱 접속 → 콘솔에 `challenge_landing_viewed` 출력 확인.  
로그인 상태로 접속 → 이벤트 발화 없음 확인.

- [ ] **Step 3: 커밋**

```bash
git add App.jsx
git commit -m "feat: add GA4 challenge_landing_viewed event"
```

---

## Task 9: App.jsx — challenge_day_started 이벤트

**Files:**
- Modify: `App.jsx` — `currentDay` state 변경 추적 useEffect 추가

- [ ] **Step 1: useEffect로 day 이동 추적**

`App.jsx`의 `isDayUnlocked` 함수(line ~340) 바로 앞에 추가:

```js
  const prevDayRef = React.useRef(null);
  useEffect(() => {
    if (prevDayRef.current !== null && prevDayRef.current !== currentDay) {
      trackEvent('challenge_day_started', { day_index: currentDay + 1 });
    }
    prevDayRef.current = currentDay;
  }, [currentDay]);
```

`React.useRef`를 사용하려면 import에 `useRef`가 없으므로, `App.jsx` 1번째 줄의 import를 확인하고 추가한다:

현재: `import { useState, useEffect } from "react";`  
변경: `import { useState, useEffect, useRef } from "react";`

그리고 `prevDayRef`를 `useRef`로 변경:
```js
  const prevDayRef = useRef(null);
```

- [ ] **Step 2: 브라우저 검증**

Day 탭 클릭으로 Day 1 → Day 2 이동 → 콘솔에 `challenge_day_started {day_index: 2}` 출력 확인.  
초기 로드 시에는 이벤트가 발화되지 않아야 함.

- [ ] **Step 3: 커밋**

```bash
git add App.jsx
git commit -m "feat: add GA4 challenge_day_started event"
```

---

## Task 10: App.jsx — 미션 완료 / 챌린지 완료 이벤트

**Files:**
- Modify: `App.jsx` — `toggleMission` 함수 (line ~297)

- [ ] **Step 1: toggleMission에 mission/day/all 완료 이벤트 삽입**

`toggleMission` 함수를 아래로 교체 (전체 함수):

```js
  const toggleMission = (dayIdx, mIdx) => {
    if (!adminMode && !session) { openLoginModal(setLoginModalOpen, 'mission_click'); return; }
    const key = `${dayIdx}`;
    const arr = missions[key] || [];
    const isAdding = !arr.includes(mIdx);
    const newArr = isAdding ? [...arr, mIdx] : arr.filter(i => i !== mIdx);
    saveProgress(dayIdx, { missions: newArr });
    setMissions(prev => ({ ...prev, [key]: newArr }));

    if (isAdding) {
      const totalForDay = DAYS[dayIdx].missions.length;
      trackEvent('challenge_mission_completed', {
        day_index: dayIdx + 1,
        missions_done: newArr.length,
        missions_total: totalForDay,
      });
      if (newArr.length === totalForDay) {
        const newTotalMissions = completedMissions + 1;
        const newCompletionRate = Math.round((newTotalMissions / (DAYS.length * 3)) * 100);
        trackEvent('challenge_day_completed', {
          day_index: dayIdx + 1,
          completion_rate: newCompletionRate,
        });
        if (completedDays + 1 === DAYS.length) {
          trackEvent('challenge_all_completed', {
            completion_rate: newCompletionRate,
            total_days: DAYS.length,
          });
        }
      }
    }
  };
```

- [ ] **Step 2: 브라우저 검증 (로그인 상태에서)**

미션 체크박스 하나 클릭 → 콘솔에 `challenge_mission_completed {day_index: 1, missions_done: 1, missions_total: 3}` 출력 확인.  
같은 Day의 미션 3개 모두 체크 → `challenge_day_completed {day_index: 1, completion_rate: ...}` 출력 확인.  
언체크 시에는 이벤트 발화 없음 확인.

- [ ] **Step 3: 커밋**

```bash
git add App.jsx
git commit -m "feat: add GA4 challenge_mission_completed, challenge_day_completed, challenge_all_completed events"
```

---

## Task 11: App.jsx — 공유/보상 해금 이벤트

**Files:**
- Modify: `App.jsx` — `handleShareComplete` (line ~235), `saveReward` (line ~201)

- [ ] **Step 1: handleShareComplete에 challenge_share_completed 삽입**

`handleShareComplete` 내 `setIsShared(true);` 다음 줄에 추가:

```js
  const handleShareComplete = async () => {
    if (adminMode) {
      setIsShared(true);
      return;
    }
    if (!session) { openLoginModal(setLoginModalOpen, 'share'); return; }
    try {
      await saveReward('sns');
      setIsShared(true);
      trackEvent('challenge_share_completed');
    } catch (err) {
      console.error('Failed to save share reward:', err);
      alert('공유 보상 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };
```

- [ ] **Step 2: saveReward에 challenge_reward_unlocked 삽입**

`saveReward` 함수 끝부분 (마지막 `insert` 호출 후)에 추가. 현재 함수 구조:

```js
  const saveReward = async (rewardType, generatedContent) => {
    if (adminMode) return;
    // ... Supabase upsert/insert 로직 ...
    const { error } = await supabase.from('user_rewards').insert(payload);
    if (error) throw error;
    // ↓ 여기에 추가
    trackEvent('challenge_reward_unlocked', { reward_type: rewardType });
  };
```

정확한 위치: `src/components/Auth.jsx`와 동일하게, `saveReward`의 두 분기(update, insert) 모두에서 에러가 없을 때 이벤트가 발화되어야 하므로, 함수 맨 끝 (throw 없이 return되는 지점)에 추가한다.

실제로 함수는 update 분기에서 return하고, insert 분기는 끝에서 자연 종료된다. 두 분기 모두 커버하려면:

```js
  const saveReward = async (rewardType, generatedContent) => {
    if (adminMode) return;

    const payload = {
      user_id: session.user.id,
      reward_context: 'seven_day_challenge',
      reward_type: rewardType,
      unlocked: true,
      ...(generatedContent ? { generated_content: generatedContent } : {}),
    };

    const { data: existingRewards, error: findError } = await supabase
      .from('user_rewards')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('reward_context', 'seven_day_challenge')
      .eq('reward_type', rewardType)
      .limit(1);

    if (findError) throw findError;

    if (existingRewards?.[0]?.id) {
      const { error } = await supabase
        .from('user_rewards')
        .update(payload)
        .eq('id', existingRewards[0].id);
      if (error) throw error;
      trackEvent('challenge_reward_unlocked', { reward_type: rewardType });
      return;
    }

    const { error } = await supabase.from('user_rewards').insert(payload);
    if (error) throw error;
    trackEvent('challenge_reward_unlocked', { reward_type: rewardType });
  };
```

- [ ] **Step 3: 브라우저 검증**

챌린지 앱에서 공유 완료 버튼 클릭 → 콘솔에 `challenge_share_completed` 출력 확인.  
`challenge_reward_unlocked {reward_type: 'sns'}` 출력 확인.

- [ ] **Step 4: 커밋**

```bash
git add App.jsx
git commit -m "feat: add GA4 challenge_share_completed and challenge_reward_unlocked events"
```

---

## Task 12: 빌드 및 배포

**Files:**
- 빌드 아티팩트: `dist/`

- [ ] **Step 1: 빌드 실행**

```bash
npm run build
```

Expected: 에러 없이 `dist/` 생성.

- [ ] **Step 2: 빌드 산출물에서 이벤트 코드 존재 확인**

```bash
grep -l "give_test_start\|challenge_all_completed\|paid_cta_clicked" dist/*.js dist/*.html 2>/dev/null | head -10
```

Expected: 관련 파일 목록 출력.

- [ ] **Step 3: 배포**

```bash
git add -A
git push origin main
```

Expected: Cloudflare Pages 자동 배포 트리거 (1~2분 후 반영).

- [ ] **Step 4: 프로덕션 검증**

`https://hogoo-challenge.pages.dev/give-test.html`을 열고 GA4 DebugView (`chrome://extensions`에서 "Google Analytics Debugger" 확장 또는 URL에 `?_ga_debug=1` 추가)로 이벤트 수신 확인.

---

## GA4 전환 표시 설정 (수동 작업)

구현 완료 후 GA4 관리자에서 수동으로 설정:

1. GA4 속성 → 관리 → 이벤트
2. 아래 이벤트를 "전환으로 표시" 활성화:
   - `paid_cta_clicked`
   - `sign_up`
   - `challenge_all_completed`
   - `challenge_reward_unlocked`

---

## 이벤트 전체 목록 체크리스트

| 이벤트 | 파일 | Task |
|--------|------|------|
| `give_test_start` | give-test.html | 1 |
| `give_test_progress` | give-test.html | 1 |
| `give_test_completed` | give-test.html | 2 |
| `give_result_viewed` | give-test.html | 2 |
| `paid_cta_clicked` | give-test.html | 3 |
| `article_clicked` | give-test.html | 3 |
| `give_share_confirmed` | give-test.html | 4 |
| `give_reward_unlocked` | give-test.html | 4 |
| `give_share_clicked` | public/share.js | 5 |
| `sign_up` | Auth.jsx | 6 |
| `login` | Auth.jsx | 6 |
| `login_modal_opened` | App.jsx | 7 |
| `challenge_landing_viewed` | App.jsx | 8 |
| `challenge_day_started` | App.jsx | 9 |
| `challenge_mission_completed` | App.jsx | 10 |
| `challenge_day_completed` | App.jsx | 10 |
| `challenge_all_completed` | App.jsx | 10 |
| `challenge_share_completed` | App.jsx | 11 |
| `challenge_reward_unlocked` | App.jsx | 11 |
