# 성능 최적화 설계 — GIVE Ecosystem

**날짜**: 2026-05-25  
**목표**: Lighthouse FCP 23.6s → 2~4s, 성능 점수 55 → 80+

---

## 문제 진단

Lighthouse 보고서 (slow 4G 에뮬레이션):
- FCP: 23.6초, LCP: 27.2초, SI: 23.6초
- 총 네트워크 페이로드: 4,681 KiB
- 렌더링 차단 요청 존재
- 사용하지 않는 JS: 363 KiB, CSS: 25 KiB

### 근본 원인

| 우선순위 | 문제 | 영향 |
|---|---|---|
| 1 | Pretendard `static` CDN — FOIT + 수 MB 폰트 | FCP 수십 초 |
| 2 | `/share.css` 동기 `<link>` — 렌더링 차단 | ~200ms |
| 3 | Kakao SDK `async` 없음 (`give-test.html`) | ~1초 |
| 4 | Userback 위젯 초기 로드 (`index.html`) | 초기 리소스 경합 |
| 5 | 캐시 헤더 없음 | 재방문 성능 저하 |
| 6 | preconnect 힌트 없음 | DNS/TCP 지연 |
| 7 | give-test.html 40KB+ 인라인 JS | 메인 스레드 파싱 |

---

## 설계

### 방법 A: 렌더링 차단 제거

#### A1. Pretendard 폰트 교체 — 전체 HTML 파일
모든 HTML의 Pretendard CDN URL을 교체. **preload 트릭은 유지** (비차단 로딩), URL만 변경.

```html
<!-- Before -->
<link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" crossorigin>
<noscript><link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" crossorigin></noscript>

<!-- After -->
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css">
<noscript><link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"></noscript>
```

- `static` → `variable/pretendardvariable-dynamic-subset.css`
- 현재 `static` 버전은 `font-display: block` (기본값) → FOIT → FCP에서 텍스트가 보이지 않음
- dynamic-subset은 `font-display: swap` 기본 적용 → 시스템 폰트로 즉시 렌더 후 교체
- 페이지 실제 글자만 서브셋 → 폰트 파일 70~80% 감소
- preload 트릭은 기존과 동일하게 유지 (CSS 비차단 로딩)

#### A2. share.css 비차단 로딩 — 전체 HTML 파일
```html
<!-- Before -->
<link rel="stylesheet" href="/share.css">

<!-- After -->
<link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'" href="/share.css">
<noscript><link rel="stylesheet" href="/share.css"></noscript>
```

#### A3. Kakao SDK async 추가 — give-test.html
```html
<!-- Before -->
<script src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js"></script>

<!-- After -->
<script src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js" async></script>
```
Kakao SDK는 `kakao.init()` 호출 전에만 로드되면 되므로, async로 로드해도 기능 문제 없음.
(give-test.html의 JS는 사용자 인터랙션 후 실행되므로 이미 SDK가 로드된 상태)

#### A4. Userback 지연 로딩 — index.html
```html
<!-- Before: 페이지 로드 시 즉시 실행 -->
<script>
  (function(d){ var s = d.createElement('script'); s.async = true;
    s.src = 'https://static.userback.io/widget/v1.js';
    (d.head || d.body).appendChild(s);
  })(document);
</script>

<!-- After: 페이지 인터랙티브 후 3초 지연 -->
<script>
  window.addEventListener('load', function() {
    setTimeout(function() {
      (function(d){ var s = d.createElement('script'); s.async = true;
        s.src = 'https://static.userback.io/widget/v1.js';
        (d.head || d.body).appendChild(s);
      })(document);
    }, 3000);
  });
</script>
```

#### A5. preconnect 힌트 — 각 페이지별
사용하는 외부 도메인에 맞게 추가:
```html
<!-- 공통 -->
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://www.googletagmanager.com">
<!-- give-test.html 추가 -->
<link rel="preconnect" href="https://t1.kakaocdn.net">
```

#### A6. Cache-Control 헤더 — public/_headers
```
/favicon.svg
  Cache-Control: public, max-age=31536000, immutable
/og-image.jpg
  Cache-Control: public, max-age=31536000, immutable
/share.css
  Cache-Control: public, max-age=86400
/share.js
  Cache-Control: public, max-age=86400
/images/*
  Cache-Control: public, max-age=31536000, immutable
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

---

### 방법 B: give-test.html JS 분리

`give-test.html`은 69KB 파일 중 약 40KB+가 인라인 `<script>` 블록. 이를 별도 파일로 분리.

- `give-test.html`의 인라인 `<script>` (퀴즈 로직, 결과 렌더링) → `public/give-test.js`로 추출
- `<script src="/give-test.js" defer></script>`로 참조
- `defer`로 HTML 파싱과 병렬 다운로드, DOMContentLoaded 후 실행 보장

**주의**: 인라인 JS가 직접 DOM을 조작하는 경우 `defer` 후 `DOMContentLoaded` 이벤트 리스너로 감싸야 함.

---

## 적용 대상 파일 목록

### Pretendard + share.css 교체 대상 (전체)
- index.html
- give-test.html
- hogoo-test.html
- hogoo-check.html
- about.html
- affiliate.html
- refusal-test.html
- relationship-risk.html
- reviews.html
- privacy.html
- terms.html
- articles/index.html
- articles/giver-burnout.html
- articles/setting-boundaries.html
- articles/taker-signals.html
- articles/smart-giver-guide.html
- articles/curiosity-gap-patterns.html
- articles/loss-aversion-relationships.html

### 추가 수정 대상
- give-test.html: Kakao async, JS 분리
- index.html: Userback 지연
- public/_headers: 캐시 헤더

---

## 예상 결과

| 지표 | 현재 | 목표 |
|---|---|---|
| FCP (slow 4G) | 23.6s | 2~4s |
| LCP | 27.2s | 3~6s |
| Performance Score | 55 | 80+ |
| 재방문 로드 | 전체 재다운로드 | 캐시 활용 |

---

## 위험 요소

- Kakao SDK async: `kakao.init()` 호출이 SDK 로드 전에 실행될 경우 오류. give-test.html의 Kakao 초기화 코드가 `window.Kakao`가 없을 때 방어 코드가 있는지 확인 필요.
- give-test.html JS 분리: 인라인 JS가 `<script>` 태그 밖의 인라인 변수를 참조하거나, DOM이 준비되지 않은 상태에서 실행되는 코드가 있으면 오류 가능. 분리 전 꼼꼼히 검토 필요.
