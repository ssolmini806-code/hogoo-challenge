# 심리 효과 기반 전환 최적화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** give-test.html 결과 화면에 5개 심리 전환 구간을 추가하고, 미니테스트 2개 및 지식 허브 칼럼 2개를 신규 생성한다.

**Architecture:** give-test.html의 `calculateFinalType()` 함수에서 `#conversion-zones` div를 동적으로 채우는 방식. 미니테스트 2개는 give-test.html 스타일을 재사용한 독립 HTML 파일. 모두 givecosystem.com으로 CTA 연결.

**Tech Stack:** 순수 HTML/CSS/JS (프레임워크 없음), Pretendard 폰트, 기존 CSS 변수 재사용

---

## 파일 구조

| 파일 | 작업 |
|---|---|
| `give-test.html` | `results` 객체에 `locked` 필드 추가 + `#conversion-zones` div 삽입 + JS populate 함수 추가 |
| `hogoo-check.html` | 신규 생성 (12문항, 5결과유형) |
| `relationship-risk.html` | 신규 생성 (12문항, 4결과유형) |
| `articles/loss-aversion-relationships.html` | 신규 생성 |
| `articles/curiosity-gap-patterns.html` | 신규 생성 |
| `index.html` | 미니테스트 카드 2개 + 칼럼 링크 2개 추가 |

---

## Task 1: give-test.html — results 객체에 locked 필드 추가

**Files:** Modify `give-test.html`

각 유형의 `results` 객체에 `locked` 배열(3개 항목)을 추가한다.

- [ ] give-test.html의 `results` 객체 각 유형에 아래 `locked` 필드를 추가한다.

```js
// angel
locked: [
  "천사형이 가장 자주 <b>당하는 관계 함정</b>",
  "도움을 줬는데도 <b>죄책감이 드는 이유</b>",
  "천사형에게 딱 맞는 <b>경계 설정 스크립트 3가지</b>"
],

// diplomat
locked: [
  "외교관형이 놓치는 <b>자기 감정 신호</b>",
  "눈치 보다가 무너지는 <b>임계점 패턴</b>",
  "외교관형을 위한 <b>솔직한 소통 훈련법</b>"
],

// burnout
locked: [
  "번아웃이 오기 전 나타나는 <b>3가지 경고 신호</b>",
  "주는 것을 멈추지 못하는 <b>심리 구조</b>",
  "번아웃형 전용 <b>회복 로드맵</b>"
],

// guardian
locked: [
  "수호자형이 관계에서 <b>놓치는 것</b>",
  "강한 경계 뒤에 숨겨진 <b>감정 패턴</b>",
  "경계를 지키면서도 <b>친밀해지는 전략</b>"
],

// architect
locked: [
  "설계자형이 빠지는 <b>감정 함정</b>",
  "효율을 추구하다 잃는 <b>관계의 온기</b>",
  "설계자형을 위한 <b>공감 능력 훈련법</b>"
],

// blocker
locked: [
  "철벽이 오히려 <b>상처가 되는 순간</b>",
  "철벽형이 내심 <b>그리워하는 관계</b>",
  "철벽을 유지하면서도 <b>연결되는 방법</b>"
],

// mixed
locked: [
  "밸런서형이 혼란스러운 <b>진짜 이유</b>",
  "상황에 따라 달라지는 패턴의 <b>장단점</b>",
  "밸런서형을 위한 <b>일관성 훈련</b>"
],
```

- [ ] 저장 후 JS 오류 없는지 확인 (`node -e "const fs=require('fs'); const html=fs.readFileSync('give-test.html','utf8'); const m=html.match(/const results = \{[\s\S]*?\};/); console.log(m?'OK':'FAIL')"` — 오류 없으면 OK)

---

## Task 2: give-test.html — #conversion-zones div + CSS 추가

**Files:** Modify `give-test.html`

- [ ] `<style>` 블록에 전환 구간 CSS를 추가한다. 기존 `.cta-box` 스타일 다음에 삽입:

```css
/* ── Conversion Zones ── */
#conversion-zones { margin-top: 0; }
.conv-progress-wrap { background: white; border-radius: 20px; padding: 24px 20px; margin-bottom: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); }
.conv-prog-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 0.85rem; font-weight: 700; }
.conv-prog-row span:last-child { color: var(--primary); }
.conv-prog-bar { background: #f2f2f7; border-radius: 100px; height: 8px; margin-bottom: 20px; overflow: hidden; }
.conv-prog-fill { background: linear-gradient(90deg, #00a885, #00c4a0); height: 100%; width: 35%; border-radius: 100px; }
.conv-locked-list { display: flex; flex-direction: column; gap: 10px; }
.conv-locked-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #fafafa; border-radius: 12px; border: 1px solid #f0f0f0; font-size: 0.85rem; color: #3e3e3e; }
.conv-blur { filter: blur(4px); user-select: none; }
.conv-ikea { text-align: center; font-size: 0.75rem; color: #aeaeb2; margin-top: 14px; }
.conv-ikea strong { color: var(--primary); }

.conv-pricing-wrap { background: white; border-radius: 20px; padding: 24px 20px; margin-bottom: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); }
.conv-framing { text-align: center; font-size: 0.9rem; color: #6e6e73; margin-bottom: 20px; line-height: 1.6; }
.conv-framing strong { color: #1d1d1f; }
.conv-price-cards { display: flex; gap: 8px; }
.conv-price-card { flex: 1; border-radius: 16px; padding: 16px 10px; text-align: center; border: 2px solid #e5e5ea; position: relative; cursor: pointer; transition: all 0.2s; }
.conv-price-card:hover { transform: translateY(-2px); }
.conv-price-card.best { border-color: var(--primary); background: #f0f9f7; }
.conv-best-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; font-size: 0.62rem; font-weight: 800; padding: 3px 8px; border-radius: 100px; white-space: nowrap; }
.conv-price-name { font-size: 0.7rem; font-weight: 700; color: #6e6e73; margin-bottom: 6px; }
.conv-price-val { font-size: 1.15rem; font-weight: 800; color: #1d1d1f; }
.conv-price-card.best .conv-price-val { color: var(--primary); }
.conv-price-orig { font-size: 0.65rem; color: #aeaeb2; text-decoration: line-through; margin-top: 2px; }
.conv-price-save { font-size: 0.62rem; color: #e53e3e; font-weight: 700; margin-top: 2px; }
.conv-price-items { font-size: 0.68rem; color: #6e6e73; margin-top: 8px; line-height: 1.4; }
.conv-math { text-align: center; font-size: 0.75rem; color: #aeaeb2; margin-top: 14px; }
.conv-math strong { color: var(--primary); }

.conv-loss-wrap { background: #fff8f8; border: 1.5px solid #ffe5e5; border-radius: 20px; padding: 24px 20px; margin-bottom: 12px; }
.conv-loss-head { font-size: 0.95rem; font-weight: 800; color: #c0392b; text-align: center; margin-bottom: 8px; line-height: 1.5; }
.conv-loss-body { font-size: 0.82rem; color: #6e6e73; text-align: center; line-height: 1.7; margin-bottom: 20px; }
.conv-cta-primary { display: block; width: 100%; background: linear-gradient(135deg, #00a885, #00866a); color: white; font-size: 1rem; font-weight: 800; padding: 17px; border-radius: 14px; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,168,133,0.3); transition: all 0.2s; }
.conv-cta-primary:hover { transform: translateY(-2px); }
.conv-cta-sub { display: block; text-align: center; font-size: 0.72rem; color: #aeaeb2; margin-top: 8px; }

.conv-tests-wrap { margin-bottom: 12px; }
.conv-tests-title { font-size: 0.78rem; font-weight: 700; color: #6e6e73; text-align: center; margin-bottom: 12px; }
.conv-test-cards { display: flex; gap: 8px; }
.conv-test-card { flex: 1; background: white; border-radius: 16px; padding: 18px 12px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06); cursor: pointer; border: 2px solid transparent; transition: all 0.2s; text-decoration: none; display: block; }
.conv-test-card:hover { border-color: var(--primary); transform: translateY(-2px); }
.conv-test-emoji { font-size: 1.6rem; margin-bottom: 8px; }
.conv-test-name { font-size: 0.82rem; font-weight: 800; color: #1d1d1f; margin-bottom: 4px; line-height: 1.3; }
.conv-test-meta { font-size: 0.68rem; color: #aeaeb2; }

.conv-hub-wrap { background: #f0f9f7; border-radius: 20px; padding: 20px; margin-bottom: 12px; }
.conv-hub-title { font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 14px; }
.conv-hub-links { display: flex; flex-direction: column; gap: 8px; }
.conv-hub-link { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: white; border-radius: 10px; font-size: 0.82rem; color: #1d1d1f; font-weight: 600; text-decoration: none; transition: color 0.2s; }
.conv-hub-link:hover { color: var(--primary); }
.conv-hub-badge { font-size: 0.6rem; font-weight: 700; color: white; padding: 2px 7px; border-radius: 100px; flex-shrink: 0; }
.badge-new { background: #e53e3e; }
.badge-free { background: #aeaeb2; }
```

- [ ] `result-page` div 안에서 `<div class="share-wrap">` 바로 위에 `<div id="conversion-zones"></div>` 를 삽입한다.

기존:
```html
                <div class="share-wrap">
```
변경 후:
```html
                <div id="conversion-zones"></div>

                <div class="share-wrap">
```

- [ ] 저장 확인

---

## Task 3: give-test.html — calculateFinalType()에 populateConversionZones() 추가

**Files:** Modify `give-test.html`

- [ ] `calculateFinalType()` 함수 끝 (`}` 닫기 직전)에 아래 호출을 추가한다:

```js
        populateConversionZones(data);
```

- [ ] `calculateFinalType()` 함수 다음에 아래 함수를 추가한다:

```js
    function populateConversionZones(data) {
        const el = document.getElementById('conversion-zones');
        if (!el) return;

        const locked = data.locked || [];
        const lockedHtml = locked.map((item, i) => `
            <div class="conv-locked-item">
                <span style="font-size:1rem;flex-shrink:0;">🔒</span>
                <span>${i === 0 ? item : item.replace(/<b>(.*?)<\/b>/, '<b><span class="conv-blur">$1</span></b>')}</span>
            </div>
        `).join('');

        el.innerHTML = `
        <div class="conv-progress-wrap">
            <div class="conv-prog-row"><span>분석 진행률</span><span>35% 완료</span></div>
            <div class="conv-prog-bar"><div class="conv-prog-fill"></div></div>
            <div class="conv-locked-list">${lockedHtml}</div>
            <p class="conv-ikea">16개 질문에 성실히 답하셨어요 — <strong>심화 분석까지 한 걸음만 더</strong></p>
        </div>

        <div class="conv-pricing-wrap">
            <p class="conv-framing"><strong>커피 한 잔 값</strong>으로<br>평생 반복되는 관계 패턴을 끊을 수 있다면?</p>
            <div class="conv-price-cards">
                <div class="conv-price-card" onclick="window.open('https://givecosystem.com','_blank')">
                    <div class="conv-price-name">30일 챌린지</div>
                    <div class="conv-price-val">₩14,900</div>
                    <div class="conv-price-items">호구 탈출 훈련<br>30일 미션 + 코칭</div>
                </div>
                <div class="conv-price-card best" onclick="window.open('https://givecosystem.com','_blank')">
                    <div class="conv-best-badge">🏆 가장 인기</div>
                    <div class="conv-price-name">심화 + 30일 세트</div>
                    <div class="conv-price-val">₩17,000</div>
                    <div class="conv-price-orig">별도 구매 ₩19,800</div>
                    <div class="conv-price-save">▲ ₩2,800 절약</div>
                    <div class="conv-price-items">심화 리포트 포함<br>완전 분석 + 훈련</div>
                </div>
                <div class="conv-price-card" onclick="window.open('https://givecosystem.com','_blank')">
                    <div class="conv-price-name">심화 분석만</div>
                    <div class="conv-price-val">₩4,900</div>
                    <div class="conv-price-items">관계 패턴 분석<br>PDF 리포트</div>
                </div>
            </div>
            <p class="conv-math">₩4,900 + ₩14,900 = ₩19,800 → <strong>세트로 하면 ₩17,000</strong></p>
        </div>

        <div class="conv-loss-wrap">
            <p class="conv-loss-head">"지금 이 패턴을 모르면<br>같은 관계에서 같은 상처를 반복합니다"</p>
            <p class="conv-loss-body">기본 진단은 당신의 유형을 알려드렸어요.<br>하지만 <strong>왜 반복되는지</strong>, <strong>어떻게 바꿀 수 있는지</strong>는<br>심화 분석에서만 알 수 있습니다.</p>
            <button class="conv-cta-primary" onclick="window.open('https://givecosystem.com','_blank')">내 관계 약점 지금 분석하기 →</button>
            <span class="conv-cta-sub">givecosystem.com · 100% 사실 기반 분석</span>
        </div>

        <div class="conv-tests-wrap">
            <p class="conv-tests-title">📝 나에 대해 더 알고 싶다면</p>
            <div class="conv-test-cards">
                <a class="conv-test-card" href="hogoo-check.html">
                    <div class="conv-test-emoji">🤔</div>
                    <div class="conv-test-name">나는<br>호구일까?</div>
                    <div class="conv-test-meta">12문항 · 3분</div>
                </a>
                <a class="conv-test-card" href="relationship-risk.html">
                    <div class="conv-test-emoji">⚠️</div>
                    <div class="conv-test-name">내 인간관계<br>위험도 테스트</div>
                    <div class="conv-test-meta">12문항 · 3분</div>
                </a>
            </div>
        </div>

        <div class="conv-hub-wrap">
            <p class="conv-hub-title">📚 무료로 더 읽어보기</p>
            <div class="conv-hub-links">
                <a class="conv-hub-link" href="articles/giver-burnout.html"><span class="conv-hub-badge badge-free">무료</span>기버 번아웃 — 나는 왜 항상 지치는가</a>
                <a class="conv-hub-link" href="articles/setting-boundaries.html"><span class="conv-hub-badge badge-free">무료</span>경계 설정이 어려운 진짜 이유</a>
                <a class="conv-hub-link" href="articles/loss-aversion-relationships.html"><span class="conv-hub-badge badge-new">NEW</span>거절이 이렇게 힘든 이유: 손실 회피 심리학</a>
                <a class="conv-hub-link" href="articles/curiosity-gap-patterns.html"><span class="conv-hub-badge badge-new">NEW</span>나도 모르는 나의 관계 패턴: 호기심의 틈</a>
            </div>
        </div>
        `;
    }
```

- [ ] 기존 `.cta-box` JS 업데이트 코드(calculateFinalType 내 ctaBox.innerHTML)를 아래로 교체해 7일 챌린지 버튼만 남긴다:

기존:
```js
        const ctaBox = document.querySelector('.cta-box');
        ctaBox.innerHTML = `
            <button class="start-btn" style="background: linear-gradient(90deg, #00a885 0%, #00cba1 100%); margin-bottom: 12px; box-shadow: 0 10px 20px rgba(0, 168, 133, 0.2);" onclick="location.href='hogoo-test.html'">🔥 7일 호구 탈출 챌린지로 지금 바꾸기</button>
            <div style="display: block; background: #1d1d1f; color: white; padding: 20px; border-radius: 16px; font-size: 1.1rem; font-weight: 700; cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.1); transition: all 0.2s ease;" onclick="alert('심화 분석 리포트는 현재 론칭 준비 중입니다. 정식 서비스가 시작되면 결제 후 리포트를 받아보실 수 있습니다! 조금만 기다려 주세요.')">
                📊 나만을 위한 20P 심화 분석 리포트 받기
                <div style="font-size: 0.8rem; font-weight: 400; opacity: 0.8; margin-top: 4px;">(유료 서비스 론칭 준비 중 - 정밀 진단)</div>
            </div>
            <span class="sub-cta" onclick="location.reload()" style="margin-top: 20px; display: inline-block;">다시 테스트하기</span>
        `;
```
변경 후:
```js
        const ctaBox = document.querySelector('.cta-box');
        ctaBox.innerHTML = `
            <button class="start-btn" onclick="location.href='hogoo-test.html'">🔥 7일 호구 탈출 챌린지 시작하기</button>
            <span class="sub-cta" onclick="location.reload()" style="margin-top:16px;display:inline-block;">다시 테스트하기</span>
        `;
```

- [ ] 저장 후 로컬에서 파일 열어 결과 화면 확인

- [ ] commit:
```bash
git add give-test.html
git commit -m "feat: add psychological conversion zones to GIVE ID result screen"
```

---

## Task 4: hogoo-check.html 생성

**Files:** Create `hogoo-check.html`

- [ ] 아래 내용으로 `hogoo-check.html` 생성:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-P6PM6JBJH1"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-P6PM6JBJH1');</script>
    <meta charset="UTF-8">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>나는 호구일까? | GIVE Ecosystem</title>
    <meta name="description" content="12가지 질문으로 알아보는 나의 호구 지수. 지금 바로 무료 진단해보세요.">
    <link rel="canonical" href="https://hogoo-challenge.pages.dev/hogoo-check.html">
    <meta property="og:title" content="나는 호구일까? 테스트">
    <meta property="og:description" content="12가지 질문으로 알아보는 나의 호구 지수">
    <meta property="og:image" content="https://hogoo-challenge.pages.dev/og-image.jpg">
    <meta property="og:url" content="https://hogoo-challenge.pages.dev/hogoo-check.html">
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
    <link rel="stylesheet" href="/share.css">
    <style>
        :root { --primary: #00a885; --primary-soft: #f0f9f7; --text-main: #1d1d1f; --text-sub: #6e6e73; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Pretendard', -apple-system, sans-serif; background: #f9f9fb; color: var(--text-main); }
        .inner { max-width: 480px; margin: 0 auto; padding: 0 20px; }
        .hidden { display: none !important; }

        /* Intro */
        #intro-page { padding: 60px 0 80px; text-align: center; }
        .test-badge { display: inline-block; background: var(--primary-soft); color: var(--primary); font-size: 0.75rem; font-weight: 700; padding: 6px 14px; border-radius: 100px; margin-bottom: 20px; letter-spacing: 0.05em; }
        .test-title { font-size: 2rem; font-weight: 900; color: var(--text-main); margin-bottom: 12px; letter-spacing: -0.04em; line-height: 1.2; }
        .test-subtitle { font-size: 1rem; color: var(--text-sub); line-height: 1.6; margin-bottom: 32px; }
        .test-meta { font-size: 0.82rem; color: var(--text-sub); margin-bottom: 32px; }
        .start-btn { display: block; width: 100%; background: linear-gradient(135deg, #00a885, #00866a); color: white; font-size: 1.05rem; font-weight: 800; padding: 18px; border-radius: 16px; border: none; cursor: pointer; box-shadow: 0 6px 24px rgba(0,168,133,0.3); }
        .start-btn:hover { transform: translateY(-2px); }

        /* Test */
        #test-page { padding: 32px 0 80px; }
        .progress-wrap { margin-bottom: 28px; }
        .progress-info { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-sub); margin-bottom: 8px; font-weight: 600; }
        .progress-bar { background: #ebebf0; border-radius: 100px; height: 6px; overflow: hidden; }
        .progress-fill { background: linear-gradient(90deg, var(--primary), #00c4a0); height: 100%; border-radius: 100px; transition: width 0.4s ease; }
        .q-num { font-size: 0.78rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em; margin-bottom: 12px; }
        .q-text { font-size: 1.15rem; font-weight: 800; color: var(--text-main); line-height: 1.6; margin-bottom: 28px; white-space: pre-line; }
        .answer-list { display: flex; flex-direction: column; gap: 10px; }
        .ans-btn { background: white; border: 2px solid #e5e5ea; border-radius: 14px; padding: 16px 18px; font-size: 0.95rem; font-weight: 600; color: var(--text-main); text-align: left; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .ans-btn:hover { border-color: var(--primary); background: var(--primary-soft); }

        /* Result */
        #result-page { padding: 40px 0 80px; }
        .result-header { text-align: center; margin-bottom: 24px; }
        .result-header span { font-size: 0.85rem; font-weight: 700; color: var(--text-sub); }
        .type-name { font-size: 1.8rem; font-weight: 900; color: var(--text-main); margin-top: 8px; letter-spacing: -0.04em; }
        .type-desc { background: white; border-radius: 20px; padding: 24px; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .type-tagline { font-size: 1.2rem; font-weight: 800; color: var(--primary); text-align: center; margin-bottom: 16px; letter-spacing: -0.02em; }
        .type-body { font-size: 0.95rem; line-height: 1.8; color: var(--text-main); }
        .result-card { background: white; border: 2px solid #eee; border-radius: 20px; padding: 20px; margin-bottom: 12px; }
        .card-title { font-size: 0.82rem; font-weight: 800; color: var(--text-sub); letter-spacing: 0.04em; margin-bottom: 10px; }
        .card-body { font-size: 0.95rem; line-height: 1.7; color: var(--text-main); }
        .result-cta { margin-top: 24px; background: #fff8f8; border: 1.5px solid #ffe5e5; border-radius: 20px; padding: 24px 20px; text-align: center; }
        .result-cta h3 { font-size: 1rem; font-weight: 800; color: #c0392b; margin-bottom: 8px; line-height: 1.5; }
        .result-cta p { font-size: 0.82rem; color: var(--text-sub); line-height: 1.6; margin-bottom: 20px; }
        .cta-btn { display: block; width: 100%; background: linear-gradient(135deg, #00a885, #00866a); color: white; font-size: 1rem; font-weight: 800; padding: 16px; border-radius: 14px; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,168,133,0.3); margin-bottom: 10px; }
        .cta-sub { font-size: 0.72rem; color: #aeaeb2; }
        .retry-link { display: inline-block; margin-top: 16px; font-size: 0.82rem; color: var(--text-sub); cursor: pointer; text-decoration: underline; }
        .related-tests { display: flex; gap: 8px; margin-top: 16px; }
        .rel-card { flex: 1; background: white; border-radius: 14px; padding: 14px 10px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.06); cursor: pointer; border: 2px solid transparent; transition: all 0.2s; text-decoration: none; display: block; }
        .rel-card:hover { border-color: var(--primary); }
        .rel-emoji { font-size: 1.4rem; margin-bottom: 6px; }
        .rel-name { font-size: 0.75rem; font-weight: 800; color: var(--text-main); line-height: 1.3; }
        footer { margin-top: 60px; padding: 40px 0; border-top: 1px solid #f2f2f2; text-align: center; font-size: 0.82rem; color: #999; }
        footer a { color: #666; text-decoration: none; margin: 0 10px; }
    </style>
</head>
<body>

<!-- Intro -->
<div id="intro-page">
    <div class="inner">
        <span class="test-badge">무료 심리 테스트</span>
        <h1 class="test-title">나는<br>호구일까?</h1>
        <p class="test-subtitle">착한 것과 호구는 다릅니다.<br>12가지 질문으로 지금 확인해보세요.</p>
        <p class="test-meta">12문항 · 약 3분 · 무료</p>
        <button class="start-btn" onclick="startTest()">지금 바로 진단하기</button>
    </div>
</div>

<!-- Test -->
<div id="test-page" class="hidden">
    <div class="inner">
        <div class="progress-wrap">
            <div class="progress-info">
                <span id="qNum">1 / 12</span>
                <span id="qPct">0%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" id="progFill" style="width:0%"></div></div>
        </div>
        <p class="q-num" id="qNumLabel">Q1</p>
        <h2 class="q-text" id="qText"></h2>
        <div class="answer-list" id="answerList"></div>
    </div>
</div>

<!-- Result -->
<div id="result-page" class="hidden">
    <div class="inner">
        <div class="result-header">
            <span>나의 호구 유형은</span>
            <h1 class="type-name" id="typeName"></h1>
        </div>
        <div class="type-desc">
            <p class="type-tagline" id="typeTagline"></p>
            <p class="type-body" id="typeBody"></p>
        </div>
        <div class="result-card" id="cardStrength"></div>
        <div class="result-card" style="background:#fffafa;border-color:#ffe5e5" id="cardRisk"></div>
        <div class="result-card" style="background:#f0faff;border-color:#e0f2ff" id="cardAdvice"></div>

        <div class="result-cta">
            <h3>"이 패턴이 왜 생겼는지, 어떻게 바꾸는지<br>더 정확하게 알고 싶다면"</h3>
            <p>GIVE ID 심화 분석에서 당신의 관계 패턴을<br>완전히 해석해드립니다.</p>
            <button class="cta-btn" onclick="window.open('https://givecosystem.com','_blank')">GIVE ID 심화 분석 받아보기 →</button>
            <span class="cta-sub">givecosystem.com · ₩4,900부터 시작</span>
        </div>

        <div class="related-tests">
            <a class="rel-card" href="give-test.html">
                <div class="rel-emoji">🎯</div>
                <div class="rel-name">GIVE ID<br>유형 진단</div>
            </a>
            <a class="rel-card" href="relationship-risk.html">
                <div class="rel-emoji">⚠️</div>
                <div class="rel-name">인간관계<br>위험도 테스트</div>
            </a>
        </div>

        <div style="text-align:center">
            <span class="retry-link" onclick="retryTest()">다시 테스트하기</span>
        </div>

        <footer>
            <div style="margin-bottom:16px">
                <a href="index.html">홈으로</a>
                <a href="give-test.html">GIVE ID 진단</a>
                <a href="articles/giver-burnout.html">심리 칼럼</a>
            </div>
            <p>&copy; 2026 GIVE Ecosystem</p>
        </footer>
    </div>
</div>

<script src="/share.js" defer></script>
<script>
const questions = [
    { q: "부탁을 받으면 어떻게 반응하나요?", a: ["고민도 없이 \"응, 할게!\"", "고민하다가 결국 한다", "한번 생각해보겠다고 한다", "상황에 따라 다르게 답한다"] },
    { q: "부탁을 거절했을 때 어떤 기분이 드나요?", a: ["내가 나쁜 사람 같아서 매우 죄책감이 든다", "약간 미안한 마음이 든다", "거절은 했지만 찜찜하다", "별로 죄책감이 없다"] },
    { q: "상대방이 불편해할까봐 원하는 걸 참은 적이 있나요?", a: ["자주 있다", "가끔 있다", "드물게 있다", "거의 없다"] },
    { q: "\"착하다\", \"배려심이 깊다\"는 말을 얼마나 자주 듣나요?", a: ["매우 자주 듣는다", "자주 듣는다", "가끔 듣는다", "거의 못 듣는다"] },
    { q: "내가 도움을 요청하기는 어려운 편인가요?", a: ["매우 어렵다. 부담 줄까봐 못 한다", "조금 어렵다", "그저 그렇다", "전혀 어렵지 않다"] },
    { q: "같은 사람이 반복해서 부탁할 때 어떻게 하나요?", a: ["계속 들어준다", "부담되지만 들어준다", "한번쯤 말해본다", "기준을 정하고 말한다"] },
    { q: "관계가 끊길까봐 싫은 것도 참은 적이 있나요?", a: ["자주 있다", "가끔 있다", "드물게 있다", "거의 없다"] },
    { q: "나보다 상대방 감정/기분을 먼저 생각하는 편인가요?", a: ["항상 그렇다", "자주 그렇다", "가끔 그렇다", "그렇지 않다"] },
    { q: "도움을 주고 나서 감사 인사가 없으면 어떤가요?", a: ["많이 서운하고 상처가 된다", "살짝 서운하다", "별로 신경 쓰지 않는다", "전혀 신경 안 쓴다"] },
    { q: "거절 후 상대방이 실망할 것 같아서 번복한 적이 있나요?", a: ["자주 있다", "가끔 있다", "드물게 있다", "없다"] },
    { q: "지금 내 에너지 상태가 어떤가요?", a: ["항상 지쳐있다. 충전이 안 된다", "가끔 번아웃이 온다", "보통이다", "에너지가 넘친다"] },
    { q: "내 인간관계에서 나는...", a: ["항상 더 많이 주는 쪽이다", "대체로 더 많이 주는 것 같다", "주고받는 것이 비슷하다", "받는 편이다"] }
];

const results = {
    hogoo: {
        name: "완전 호구형",
        emoji: "🥺",
        tagline: "착하다는 말이 칭찬인지 상처인지 모르겠어요",
        body: "당신은 상대방을 위해 자신을 희생하는 경우가 매우 잦습니다. 거절이 어렵고, 거절 후에는 죄책감이 뒤따릅니다. 착한 것은 훌륭한 자질이지만, 경계 없는 친절은 당신을 지치게 만듭니다.",
        strength: "강한 공감 능력과 따뜻한 마음으로 주변 사람들에게 신뢰를 받습니다. 이 에너지를 자신을 위해서도 쓸 수 있다면 훨씬 더 건강해집니다.",
        risk: "반복적인 희생과 억눌린 감정이 쌓여 번아웃으로 이어질 수 있습니다. 상대방이 당신의 친절을 당연하게 여길 가능성이 높습니다.",
        advice: "오늘 딱 하나, 작은 '아니오'를 연습해보세요. 죄책감 없이 거절하는 근육은 훈련으로 키울 수 있습니다."
    },
    nice: {
        name: "착한 사람형",
        emoji: "😊",
        tagline: "선 하나만 더 그으면 관계가 달라집니다",
        body: "당신은 기본적으로 다정하고 배려심이 깊지만, 때로는 경계를 지키지 못해 손해를 보는 경우가 있습니다. 호구와 착한 사람의 경계선에서 흔들리는 중입니다.",
        strength: "배려와 현실감각을 동시에 갖추고 있습니다. 조금만 경계를 더 명확히 하면 관계가 훨씬 건강해집니다.",
        risk: "무의식적으로 상대방의 기분을 먼저 배려하다 자신의 감정을 나중에 처리하는 패턴이 있습니다.",
        advice: "부탁을 받았을 때 즉각 답하지 말고, '잠깐 생각해볼게'라는 시간을 만들어 보세요."
    },
    middle: {
        name: "중간 경계형",
        emoji: "🤔",
        tagline: "상황에 따라 달라지는 당신의 패턴",
        body: "당신은 상황에 따라 경계를 잘 지키기도 하고 무너지기도 합니다. 특정 관계나 상황에서 약점이 드러나는 패턴이 있습니다.",
        strength: "유연하게 상황을 판단할 줄 압니다. 어떤 상황에서 경계가 무너지는지 파악하면 훨씬 안정적인 관계를 만들 수 있습니다.",
        risk: "일관성 없는 반응이 상대방에게 혼란을 줄 수 있고, 특정 조건에서는 여전히 손해를 볼 수 있습니다.",
        advice: "어떤 상황에서 경계가 무너지는지 패턴을 기록해보세요. 인식이 변화의 첫걸음입니다."
    },
    realist: {
        name: "현실주의형",
        emoji: "💪",
        tagline: "이미 잘 하고 있어요, 더 정교하게 만들면 완벽",
        body: "당신은 자신의 감정과 경계를 꽤 잘 인식하고 있습니다. 관계에서 일방적으로 손해 보는 일이 적은 편입니다.",
        strength: "자기 인식이 높고 불필요한 희생을 잘 피합니다. 건강한 관계를 만들어 나가는 기초가 탄탄합니다.",
        risk: "너무 현실적으로 계산하다 관계에서 감정적 연결이 약해질 수 있습니다.",
        advice: "경계는 잘 지키고 있으니, 이제는 관계의 '따뜻함'을 조금 더 표현해보는 것도 좋습니다."
    },
    wall: {
        name: "철벽형",
        emoji: "🧱",
        tagline: "경계는 탁월해요, 관계의 온기도 함께",
        body: "당신은 경계를 매우 잘 지킵니다. 하지만 경계가 너무 강해 때로는 진정한 연결이 어려울 수 있습니다.",
        strength: "자기 보호 능력이 탁월합니다. 불필요한 에너지 낭비가 거의 없습니다.",
        risk: "경계가 너무 높아 친밀한 관계를 형성하기 어려울 수 있습니다. 좋은 사람을 밀어낼 위험도 있습니다.",
        advice: "신뢰할 수 있는 사람에게 작은 것 하나씩 솔직하게 나눠보세요. 경계와 온기는 공존할 수 있습니다."
    }
};

let score = 0;
let current = 0;

function startTest() {
    document.getElementById('intro-page').classList.add('hidden');
    document.getElementById('test-page').classList.remove('hidden');
    window.scrollTo(0, 0);
    renderQ();
}

function renderQ() {
    const q = questions[current];
    document.getElementById('qNumLabel').textContent = 'Q' + (current + 1);
    document.getElementById('qNum').textContent = (current + 1) + ' / ' + questions.length;
    const pct = Math.round((current / questions.length) * 100);
    document.getElementById('qPct').textContent = pct + '%';
    document.getElementById('progFill').style.width = pct + '%';
    document.getElementById('qText').textContent = q.q;
    const list = document.getElementById('answerList');
    list.innerHTML = '';
    q.a.forEach((ans, i) => {
        const btn = document.createElement('button');
        btn.className = 'ans-btn';
        btn.textContent = ans;
        btn.onclick = () => {
            score += (3 - i);
            current++;
            if (current >= questions.length) showResult();
            else { window.scrollTo(0, 0); renderQ(); }
        };
        list.appendChild(btn);
    });
}

function showResult() {
    document.getElementById('test-page').classList.add('hidden');
    document.getElementById('result-page').classList.remove('hidden');
    window.scrollTo(0, 0);

    let key;
    if (score >= 30) key = 'hogoo';
    else if (score >= 22) key = 'nice';
    else if (score >= 14) key = 'middle';
    else if (score >= 7) key = 'realist';
    else key = 'wall';

    const d = results[key];
    document.getElementById('typeName').textContent = d.emoji + ' ' + d.name;
    document.getElementById('typeTagline').textContent = '"' + d.tagline + '"';
    document.getElementById('typeBody').textContent = d.body;
    document.getElementById('cardStrength').innerHTML = '<div class="card-title">✨ 당신의 강점</div><p class="card-body">' + d.strength + '</p>';
    document.getElementById('cardRisk').innerHTML = '<div class="card-title" style="color:#e53e3e">⚠️ 주의할 점</div><p class="card-body">' + d.risk + '</p>';
    document.getElementById('cardAdvice').innerHTML = '<div class="card-title" style="color:#007aff">🚀 지금 할 수 있는 것</div><p class="card-body">' + d.advice + '</p>';
}

function retryTest() {
    score = 0; current = 0;
    document.getElementById('result-page').classList.add('hidden');
    document.getElementById('intro-page').classList.remove('hidden');
    window.scrollTo(0, 0);
}
</script>
</body>
</html>
```

- [ ] 저장 확인

---

## Task 5: relationship-risk.html 생성

**Files:** Create `relationship-risk.html`

- [ ] 아래 내용으로 `relationship-risk.html` 생성 (hogoo-check.html과 동일한 구조, 질문/결과만 다름):

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-P6PM6JBJH1"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-P6PM6JBJH1');</script>
    <meta charset="UTF-8">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>내 인간관계 위험도 테스트 | GIVE Ecosystem</title>
    <meta name="description" content="12가지 질문으로 알아보는 내 인간관계 위험도. 지금 바로 무료 진단해보세요.">
    <link rel="canonical" href="https://hogoo-challenge.pages.dev/relationship-risk.html">
    <meta property="og:title" content="내 인간관계 위험도 테스트">
    <meta property="og:description" content="12가지 질문으로 알아보는 내 인간관계 위험도">
    <meta property="og:image" content="https://hogoo-challenge.pages.dev/og-image.jpg">
    <meta property="og:url" content="https://hogoo-challenge.pages.dev/relationship-risk.html">
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
    <link rel="stylesheet" href="/share.css">
    <style>
        :root { --primary: #00a885; --primary-soft: #f0f9f7; --text-main: #1d1d1f; --text-sub: #6e6e73; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Pretendard', -apple-system, sans-serif; background: #f9f9fb; color: var(--text-main); }
        .inner { max-width: 480px; margin: 0 auto; padding: 0 20px; }
        .hidden { display: none !important; }
        #intro-page { padding: 60px 0 80px; text-align: center; }
        .test-badge { display: inline-block; background: var(--primary-soft); color: var(--primary); font-size: 0.75rem; font-weight: 700; padding: 6px 14px; border-radius: 100px; margin-bottom: 20px; letter-spacing: 0.05em; }
        .test-title { font-size: 2rem; font-weight: 900; color: var(--text-main); margin-bottom: 12px; letter-spacing: -0.04em; line-height: 1.2; }
        .test-subtitle { font-size: 1rem; color: var(--text-sub); line-height: 1.6; margin-bottom: 32px; }
        .test-meta { font-size: 0.82rem; color: var(--text-sub); margin-bottom: 32px; }
        .start-btn { display: block; width: 100%; background: linear-gradient(135deg, #00a885, #00866a); color: white; font-size: 1.05rem; font-weight: 800; padding: 18px; border-radius: 16px; border: none; cursor: pointer; box-shadow: 0 6px 24px rgba(0,168,133,0.3); }
        .start-btn:hover { transform: translateY(-2px); }
        #test-page { padding: 32px 0 80px; }
        .progress-wrap { margin-bottom: 28px; }
        .progress-info { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-sub); margin-bottom: 8px; font-weight: 600; }
        .progress-bar { background: #ebebf0; border-radius: 100px; height: 6px; overflow: hidden; }
        .progress-fill { background: linear-gradient(90deg, var(--primary), #00c4a0); height: 100%; border-radius: 100px; transition: width 0.4s ease; }
        .q-num { font-size: 0.78rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em; margin-bottom: 12px; }
        .q-text { font-size: 1.15rem; font-weight: 800; color: var(--text-main); line-height: 1.6; margin-bottom: 28px; white-space: pre-line; }
        .answer-list { display: flex; flex-direction: column; gap: 10px; }
        .ans-btn { background: white; border: 2px solid #e5e5ea; border-radius: 14px; padding: 16px 18px; font-size: 0.95rem; font-weight: 600; color: var(--text-main); text-align: left; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .ans-btn:hover { border-color: var(--primary); background: var(--primary-soft); }
        #result-page { padding: 40px 0 80px; }
        .result-header { text-align: center; margin-bottom: 24px; }
        .result-header span { font-size: 0.85rem; font-weight: 700; color: var(--text-sub); }
        .type-name { font-size: 1.8rem; font-weight: 900; color: var(--text-main); margin-top: 8px; letter-spacing: -0.04em; }
        .type-desc { background: white; border-radius: 20px; padding: 24px; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .type-tagline { font-size: 1.2rem; font-weight: 800; color: var(--primary); text-align: center; margin-bottom: 16px; letter-spacing: -0.02em; }
        .type-body { font-size: 0.95rem; line-height: 1.8; color: var(--text-main); }
        .result-card { background: white; border: 2px solid #eee; border-radius: 20px; padding: 20px; margin-bottom: 12px; }
        .card-title { font-size: 0.82rem; font-weight: 800; color: var(--text-sub); letter-spacing: 0.04em; margin-bottom: 10px; }
        .card-body { font-size: 0.95rem; line-height: 1.7; color: var(--text-main); }
        .result-cta { margin-top: 24px; background: #fff8f8; border: 1.5px solid #ffe5e5; border-radius: 20px; padding: 24px 20px; text-align: center; }
        .result-cta h3 { font-size: 1rem; font-weight: 800; color: #c0392b; margin-bottom: 8px; line-height: 1.5; }
        .result-cta p { font-size: 0.82rem; color: var(--text-sub); line-height: 1.6; margin-bottom: 20px; }
        .cta-btn { display: block; width: 100%; background: linear-gradient(135deg, #00a885, #00866a); color: white; font-size: 1rem; font-weight: 800; padding: 16px; border-radius: 14px; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,168,133,0.3); margin-bottom: 10px; }
        .cta-sub { font-size: 0.72rem; color: #aeaeb2; }
        .retry-link { display: inline-block; margin-top: 16px; font-size: 0.82rem; color: var(--text-sub); cursor: pointer; text-decoration: underline; }
        .related-tests { display: flex; gap: 8px; margin-top: 16px; }
        .rel-card { flex: 1; background: white; border-radius: 14px; padding: 14px 10px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.06); cursor: pointer; border: 2px solid transparent; transition: all 0.2s; text-decoration: none; display: block; }
        .rel-card:hover { border-color: var(--primary); }
        .rel-emoji { font-size: 1.4rem; margin-bottom: 6px; }
        .rel-name { font-size: 0.75rem; font-weight: 800; color: var(--text-main); line-height: 1.3; }
        footer { margin-top: 60px; padding: 40px 0; border-top: 1px solid #f2f2f2; text-align: center; font-size: 0.82rem; color: #999; }
        footer a { color: #666; text-decoration: none; margin: 0 10px; }
    </style>
</head>
<body>

<div id="intro-page">
    <div class="inner">
        <span class="test-badge">무료 심리 테스트</span>
        <h1 class="test-title">내 인간관계<br>위험도 테스트</h1>
        <p class="test-subtitle">지금 내 관계가 나를 지치게 하고 있나요?<br>12가지 질문으로 확인해보세요.</p>
        <p class="test-meta">12문항 · 약 3분 · 무료</p>
        <button class="start-btn" onclick="startTest()">지금 바로 진단하기</button>
    </div>
</div>

<div id="test-page" class="hidden">
    <div class="inner">
        <div class="progress-wrap">
            <div class="progress-info">
                <span id="qNum">1 / 12</span>
                <span id="qPct">0%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" id="progFill" style="width:0%"></div></div>
        </div>
        <p class="q-num" id="qNumLabel">Q1</p>
        <h2 class="q-text" id="qText"></h2>
        <div class="answer-list" id="answerList"></div>
    </div>
</div>

<div id="result-page" class="hidden">
    <div class="inner">
        <div class="result-header">
            <span>나의 인간관계 위험도는</span>
            <h1 class="type-name" id="typeName"></h1>
        </div>
        <div class="type-desc">
            <p class="type-tagline" id="typeTagline"></p>
            <p class="type-body" id="typeBody"></p>
        </div>
        <div class="result-card" id="cardStrength"></div>
        <div class="result-card" style="background:#fffafa;border-color:#ffe5e5" id="cardRisk"></div>
        <div class="result-card" style="background:#f0faff;border-color:#e0f2ff" id="cardAdvice"></div>

        <div class="result-cta">
            <h3>"이 관계 패턴이 왜 반복되는지,<br>어떻게 바꿀 수 있는지 알고 싶다면"</h3>
            <p>GIVE ID 심화 분석에서 당신의 관계 패턴을<br>근본부터 해석해드립니다.</p>
            <button class="cta-btn" onclick="window.open('https://givecosystem.com','_blank')">GIVE ID 심화 분석 받아보기 →</button>
            <span class="cta-sub">givecosystem.com · ₩4,900부터 시작</span>
        </div>

        <div class="related-tests">
            <a class="rel-card" href="give-test.html">
                <div class="rel-emoji">🎯</div>
                <div class="rel-name">GIVE ID<br>유형 진단</div>
            </a>
            <a class="rel-card" href="hogoo-check.html">
                <div class="rel-emoji">🤔</div>
                <div class="rel-name">나는<br>호구일까?</div>
            </a>
        </div>

        <div style="text-align:center">
            <span class="retry-link" onclick="retryTest()">다시 테스트하기</span>
        </div>

        <footer>
            <div style="margin-bottom:16px">
                <a href="index.html">홈으로</a>
                <a href="give-test.html">GIVE ID 진단</a>
                <a href="articles/giver-burnout.html">심리 칼럼</a>
            </div>
            <p>&copy; 2026 GIVE Ecosystem</p>
        </footer>
    </div>
</div>

<script src="/share.js" defer></script>
<script>
const questions = [
    { q: "최근 특정 관계에서 대화 후 피곤하거나 지친 느낌이 드나요?", a: ["항상 그렇다", "자주 그렇다", "가끔 그렇다", "그렇지 않다"] },
    { q: "주변에 내 말을 끊거나 무시하는 사람이 있나요?", a: ["자주 있다", "가끔 있다", "드물게 있다", "없다"] },
    { q: "경계를 분명히 했는데도 무시당한 경험이 있나요?", a: ["최근에도 있다", "과거에 있다", "기억이 잘 안 난다", "없다"] },
    { q: "특정 관계에서 내 감정을 솔직하게 표현하기 어렵나요?", a: ["매우 어렵다", "어려운 편이다", "조금 어렵다", "전혀 어렵지 않다"] },
    { q: "나를 진심으로 걱정해주는 사람이 있다고 느끼나요?", a: ["없다고 느낀다", "잘 모르겠다", "한두 명은 있다", "충분히 있다"] },
    { q: "관계에서 내가 더 많이 희생하고 있다고 느끼나요?", a: ["항상 그렇게 느낀다", "자주 그렇게 느낀다", "가끔 그렇게 느낀다", "그렇지 않다"] },
    { q: "최근 6개월 안에 관계 문제로 잠을 못 잔 적이 있나요?", a: ["자주 있다", "있다", "한 번 있다", "없다"] },
    { q: "특정 사람과의 관계가 일방적이라고 느끼나요?", a: ["강하게 느낀다", "어느 정도 느낀다", "약간 느낀다", "그렇지 않다"] },
    { q: "상대방이 화낼까봐 내 의견을 참는 경우가 있나요?", a: ["자주 있다", "가끔 있다", "드물게 있다", "없다"] },
    { q: "내가 거절했더니 관계가 나빠진 경험이 있나요?", a: ["최근에도 있다", "과거에 있다", "잘 모르겠다", "없다"] },
    { q: "지금 나의 주요 관계들이 내게 에너지를 주나요, 빼앗아 가나요?", a: ["대부분 빼앗아 간다", "빼앗아 가는 관계가 더 많다", "비슷하다", "대부분 에너지를 준다"] },
    { q: "현재 나의 관계 상태를 한마디로 표현하면?", a: ["지쳐있고 탈출하고 싶다", "불편하지만 어쩔 수 없다", "나쁘지 않지만 개선하고 싶다", "건강하고 만족스럽다"] }
];

const results = {
    high: {
        name: "🚨 고위험 단계",
        tagline: "지금 당신의 관계에는 즉각적인 변화가 필요합니다",
        body: "현재 당신의 인간관계에는 당신을 지치게 만드는 요소가 매우 많습니다. 일방적인 관계, 경계 침범, 감정 소진이 반복되고 있을 가능성이 높습니다. 지금 이 신호를 무시하면 번아웃으로 이어질 수 있습니다.",
        strength: "이미 문제를 인식하고 있다는 것 자체가 변화의 시작입니다. 인식 없이는 변화도 없습니다.",
        risk: "현재 패턴이 지속되면 심각한 번아웃, 자존감 저하, 만성 피로로 이어질 수 있습니다.",
        advice: "지금 당장 가장 에너지를 빼앗는 관계 하나를 파악하고, 그 관계에서 할 수 있는 가장 작은 경계 하나를 설정해보세요."
    },
    caution: {
        name: "⚠️ 주의 단계",
        tagline: "아직 괜찮지만, 패턴을 점검할 때가 왔습니다",
        body: "당신의 관계에는 개선이 필요한 부분이 있습니다. 지금은 버틸 수 있지만, 이 패턴이 계속되면 점점 더 지칩니다. 지금이 바로 바꿀 타이밍입니다.",
        strength: "아직 관계를 건강하게 만들 에너지가 남아 있습니다. 지금 시작하면 충분히 바꿀 수 있습니다.",
        risk: "현재 패턴을 방치하면 서서히 지쳐가고, 나중에는 더 큰 에너지가 필요하게 됩니다.",
        advice: "에너지를 빼앗는 관계와 주는 관계를 구분해보세요. 그리고 빼앗는 관계에 어떤 경계를 설정할 수 있는지 생각해보세요."
    },
    ok: {
        name: "✅ 양호 단계",
        tagline: "대체로 건강하지만 개선할 여지가 있습니다",
        body: "당신의 인간관계는 전반적으로 건강한 편입니다. 하지만 몇 가지 영역에서 더 나아질 수 있는 여지가 있습니다.",
        strength: "관계에서 기본적인 건강함을 유지하고 있습니다. 이를 더 정교하게 다듬으면 훨씬 풍요로운 관계를 만들 수 있습니다.",
        risk: "무의식적으로 형성된 일부 패턴이 있을 수 있습니다. 이를 점검해보는 것이 좋습니다.",
        advice: "관계에서 불편했던 순간을 하나 떠올리고, 그때 다르게 할 수 있었던 것이 무엇인지 생각해보세요."
    },
    healthy: {
        name: "💚 건강형",
        tagline: "관계 근육이 단단한 당신, 더 정교하게 키워보세요",
        body: "당신의 인간관계는 전반적으로 매우 건강합니다. 경계를 잘 지키고, 에너지를 나눌 줄 알며, 관계에서 자신을 잃지 않습니다.",
        strength: "건강한 관계 패턴을 가지고 있습니다. 이 능력은 주변 사람들에게도 긍정적인 영향을 미칩니다.",
        risk: "건강한 관계 패턴이 있더라도 특정 상황이나 새로운 관계에서는 흔들릴 수 있습니다.",
        advice: "현재의 건강한 패턴을 더 의식적으로 발전시켜보세요. 더 깊은 연결과 성장이 가능합니다."
    }
};

let score = 0;
let current = 0;

function startTest() {
    document.getElementById('intro-page').classList.add('hidden');
    document.getElementById('test-page').classList.remove('hidden');
    window.scrollTo(0, 0);
    renderQ();
}

function renderQ() {
    const q = questions[current];
    document.getElementById('qNumLabel').textContent = 'Q' + (current + 1);
    document.getElementById('qNum').textContent = (current + 1) + ' / ' + questions.length;
    const pct = Math.round((current / questions.length) * 100);
    document.getElementById('qPct').textContent = pct + '%';
    document.getElementById('progFill').style.width = pct + '%';
    document.getElementById('qText').textContent = q.q;
    const list = document.getElementById('answerList');
    list.innerHTML = '';
    q.a.forEach((ans, i) => {
        const btn = document.createElement('button');
        btn.className = 'ans-btn';
        btn.textContent = ans;
        btn.onclick = () => {
            score += (3 - i);
            current++;
            if (current >= questions.length) showResult();
            else { window.scrollTo(0, 0); renderQ(); }
        };
        list.appendChild(btn);
    });
}

function showResult() {
    document.getElementById('test-page').classList.add('hidden');
    document.getElementById('result-page').classList.remove('hidden');
    window.scrollTo(0, 0);

    let key;
    if (score >= 27) key = 'high';
    else if (score >= 18) key = 'caution';
    else if (score >= 9) key = 'ok';
    else key = 'healthy';

    const d = results[key];
    document.getElementById('typeName').textContent = d.name;
    document.getElementById('typeTagline').textContent = '"' + d.tagline + '"';
    document.getElementById('typeBody').textContent = d.body;
    document.getElementById('cardStrength').innerHTML = '<div class="card-title">✨ 현재 상태</div><p class="card-body">' + d.strength + '</p>';
    document.getElementById('cardRisk').innerHTML = '<div class="card-title" style="color:#e53e3e">⚠️ 주의할 점</div><p class="card-body">' + d.risk + '</p>';
    document.getElementById('cardAdvice').innerHTML = '<div class="card-title" style="color:#007aff">🚀 지금 할 수 있는 것</div><p class="card-body">' + d.advice + '</p>';
}

function retryTest() {
    score = 0; current = 0;
    document.getElementById('result-page').classList.add('hidden');
    document.getElementById('intro-page').classList.remove('hidden');
    window.scrollTo(0, 0);
}
</script>
</body>
</html>
```

- [ ] commit:
```bash
git add hogoo-check.html relationship-risk.html
git commit -m "feat: add hogoo-check and relationship-risk mini tests"
```

---

## Task 6: 지식 허브 칼럼 2개 생성

**Files:** Create `articles/loss-aversion-relationships.html`, `articles/curiosity-gap-patterns.html`

- [ ] 기존 칼럼(giver-burnout.html) 상단 구조를 참고해 두 파일을 생성한다. 핵심 내용:

**loss-aversion-relationships.html** — "거절이 이렇게 힘든 이유: 손실 회피 심리학"
- 손실 회피란 무엇인가 (카너먼의 연구 - 잃는 고통이 얻는 기쁨의 2배)
- 왜 거절이 손실처럼 느껴지는가
- 관계에서의 손실 회피 패턴
- 건강하게 극복하는 법
- 하단 CTA → give-test.html + givecosystem.com

**curiosity-gap-patterns.html** — "나도 모르는 나의 관계 패턴: 호기심의 틈"
- 호기심의 틈 개념 (조지 로웬스타인 연구)
- 우리가 자신의 패턴을 모르는 이유
- 관계에서 반복되는 패턴의 구조
- 패턴을 인식하는 방법
- 하단 CTA → give-test.html + givecosystem.com

두 칼럼 모두 기존 칼럼 스타일(CSS 변수, Pretendard, 모바일 퍼스트)을 따른다.

- [ ] commit:
```bash
git add articles/loss-aversion-relationships.html articles/curiosity-gap-patterns.html
git commit -m "feat: add two new knowledge hub articles on psychology"
```

---

## Task 7: index.html 업데이트

**Files:** Modify `index.html`

- [ ] index.html의 지식 허브 섹션(기존 칼럼 카드들)에 새 칼럼 2개 카드를 추가한다.
- [ ] index.html의 테스트 섹션(또는 적절한 위치)에 미니테스트 2개 카드를 추가한다.

- [ ] commit:
```bash
git add index.html
git commit -m "feat: add mini-tests and new articles to index"
```

---

## Task 8: 최종 배포

- [ ] 전체 변경사항 확인:
```bash
git status
git log --oneline -6
```

- [ ] push:
```bash
git push origin main
```

- [ ] 1~2분 후 https://hogoo-challenge.pages.dev/give-test.html 결과 화면 확인
