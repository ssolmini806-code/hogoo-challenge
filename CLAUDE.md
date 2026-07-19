# GIVE Ecosystem — Claude Code 가이드

## 프로젝트 개요
애덤 그랜트의 기버/테이커 이론 기반 심리 진단 플랫폼.
배포 URL: `https://hogoo-challenge.pages.dev` (한국어 사이트)

- **진단 테스트 5종** (순수 JS): GIVE ID(`give-test`), 호구 지수(`hogoo-check`), 거절 능력(`refusal-test`), 관계 위험도(`relationship-risk`), 이타성(`selfless-otherish-test`)
- **7일 챌린지**: 호구 탈출 훈련 앱 (`hogoo-test.html`에 React 마운트, 로그인 필요)
- **지식 허브**: 심리 칼럼 (`articles/`)

## 현재 목표: 무료 → 유료 전환 유도
- 테스트 자체는 로그인 없이 가능. 보상 버튼 클릭 시 로그인 모달 표시
- 보상 3단계: A(SNS 공유) / B(후기 작성) / A+B(둘 다)
  - "공유했어요 ✓" 확인 버튼 클릭 = A 해금 (공유창 열기만으론 해금 안 됨)
- 보상 상태는 로그인 후 Supabase DB 저장
- 무료 조언(A 보상)만 CSS blur 허용
- 유료 링크는 환경변수 `VITE_PAID_SITE_URL` 사용

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 정적 페이지 | 순수 HTML / CSS / JS (프레임워크 없음) |
| 챌린지 앱 | React 18 + Vite 5 (**Tailwind·Next.js 미사용** — 인라인 style 객체) |
| 인증 / DB | Supabase (이메일+비밀번호 로그인, `user_progress` 테이블) |
| 아이콘 | lucide-react |
| 폰트 | Pretendard (CDN) |
| SNS 공유 | AddToAny (`https://static.addtoany.com/menu/page.js`) |
| 분석 | Google Analytics (G-P6PM6JBJH1), Microsoft Clarity (wh9qtg72q5) |
| 광고 | Google AdSense (ca-pub-8564310871125079) |
| 피드백 | Userback (A-5n1vSEp2urCeuAdUdVofAoB0M) |
| 빌드 | `npm run build` → `dist/` |
| 배포 | GitHub push → Cloudflare Pages 자동 배포 (1~2분) |

---

## 파일 구조

**핵심 패턴**: 테스트 페이지 하나 = 루트 HTML + `public/<이름>-world.css` + `public/<이름>-world.js` 3종 세트.
페이지 하나를 고치는 작업은 보통 이 3개 파일을 함께 수정한다 (→ 이것만으로는 Fable 모드 아님).

```
/
├── index.html                  # 메인 랜딩 (포털)
├── give-test.html              # GIVE ID 진단 (+ public/give-test-logic.js, give-question-world.css)
├── give-prologue.html          # 테스트 프롤로그 (슬라이드 전환)
├── hogoo-check.html            # 호구 지수 테스트 (+ public/hogoo-world.*)
├── refusal-test.html           # 거절 능력 테스트 (+ public/refusal-world.*)
├── relationship-risk.html      # 관계 위험도 테스트 (+ public/risk-world.*)
├── selfless-otherish-test.html # 이타성 테스트 (+ public/selfless-world.*)
├── result-sequence.html        # 결과 슬라이드 시퀀스 (+ public/result-world.*)
├── hogoo-test.html             # 7일 챌린지 앱 진입점 (React 마운트)
├── design-lab.html             # 디자인 실험실 (+ public/design-lab.*)
├── reviews.html / white-psychology.html / about.html / affiliate.html / privacy.html / terms.html
├── App.jsx / main.jsx / days.js  # 챌린지 앱 (React)
├── vite.config.js              # 멀티 HTML 빌드 설정
├── components/                 # advice / result / reward (ChallengeRewardSection.tsx 등)
├── src/
│   ├── supabase.js
│   └── components/             # Auth.jsx, LoginModal.tsx, LoginButton.tsx, MyPage.jsx
├── public/
│   ├── give-theme.css          # ⚠ 공유 테마 — 여러 페이지 영향
│   ├── site-bootstrap.js       # ⚠ 전 페이지 공통 부트스트랩
│   ├── share.css / share.js    # ⚠ 공유 버튼 공통
│   ├── third-party-loader.js   # ⚠ GA/Clarity/AdSense 로더
│   ├── give-progress.js / challenge-done.html
│   └── (각 테스트별 *-world.css / *-world.js)
└── articles/                   # 칼럼 4편
```

⚠ 표시 파일 수정 = 전 페이지 영향 → 아래 L1 검증 대상.

---

## 작업 모드 (가성비 원칙)

**원칙: 필요할 때만 더 생각한다.** 기본은 빠르게, 아래 신호가 있을 때만 단계를 추가한다.

### L0 — 기본 모드 (대부분의 작업)
- 요청 범위만 수정, 최소 단계로 바로 실행
- 사용자가 번호/섹션(`── 1 ──` 식)으로 구체적 스펙을 준 경우: 스펙 그대로 구현하고 중간 확인 질문으로 멈추지 않는다
- 모호한 부분이 작고 되돌리기 쉬우면: 합리적 기본값을 선택하고 **완료 보고에 가정을 명시** (질문으로 블로킹 금지)
- 자체 검토는 "빌드가 깨지지 않는가" 수준이면 충분

### L1 — 검증 플러스 (해당하면 자동 적용)
L0 + 커밋 전 `npm run verify` 실행. 검사 내용: 빌드 → 정적 린트(전체 HTML의 lang="ko"/viewport/og:image 절대 URL) → 13개 페이지 브라우저 스모크(모바일 390px 뷰포트에서 JS 에러·리소스 404·빈 화면·가로 오버플로·React 마운트 검출). 트리거:
- ⚠ 공유 자산(give-theme.css, site-bootstrap.js, share.*, third-party-loader.js) 또는 vite.config.js 수정
- **서로 다른 페이지 2개 이상**에 걸친 변경 (한 페이지의 html+css+js 3종 세트는 해당 없음)
- 로그인 / 보상 해금 / Supabase 연동 로직 변경

### L2 — Fable 모드 (조사→계획→실행→검증 4단계)
트리거 (하나라도 해당 시):
- "원인 모름", "왜 안 되지" 류의 버그 — 코드 수정 전에 원인부터 확정
- DB 스키마 / RLS / 인증 구조 변경
- 구조적 리팩토링, 여러 시스템에 영향을 주는 변경
- 명시적으로 "꼼꼼하게" / "fable 모드로" 요청 시

### 에스컬레이션 / 디에스컬레이션
- **올리기**: 첫 수정 시도가 실패하거나, 조사 결과가 처음 가정과 어긋나면 즉시 한 단계 올려 원인 조사부터 다시 시작 (같은 수정을 반복 시도하지 않는다)
- **내리기**: L2 조건이라도 조사 단계에서 원인이 바로 확정되면 남은 형식적 단계는 생략하고 수정으로 직행

---

## 완료 기준 (모든 모드 공통)
- 수정 → 커밋 → `git push origin main`까지가 한 작업의 끝 (Cloudflare Pages 자동 배포)
- 완료 보고에 포함: 무엇이 바뀌었는지 / 커밋 완료 여부 / (L0에서 가정했다면) 가정 내용
- 검증 실패·미확인 상태면 그대로 보고한다. 완료로 포장 금지

## 주요 규칙
- HTML은 모두 한국어(`lang="ko"`), Pretendard 폰트
- 모바일 viewport: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`
- OG/Twitter 이미지는 절대 URL (`https://hogoo-challenge.pages.dev/og-image.jpg`)
- 디자인/UI 작업은 모바일·데스크탑 양쪽 확인 (사용자가 매번 별도로 요구하지 않아도)
- Supabase 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`.env`)
- GitHub 원격: `https://github.com/ssolmini806-code/hogoo-challenge` (인증은 Codespaces 자격 증명 — URL에 토큰 없음)

## 디자인 시스템
```css
--primary: #00a885        /* 메인 그린 */
--primary-soft: #f0f9f7   /* 연한 그린 배경 */
--text-main: #1d1d1f      /* 기본 텍스트 */
--text-sub: #6e6e73       /* 보조 텍스트 */
```
챌린지 앱 다크 테마: 배경 `#1a1614` | 카드 `#231f1c` | 보더 `#3a3530` | 텍스트 `#f5ede3` | 완료 `#7cc88a`

### 공유 버튼 표준 (모든 페이지 통일)
```html
<div class="a2a_kit a2a_kit_size_36 a2a_default_style"
     data-a2a-url="페이지URL" data-a2a-title="페이지제목">
    <a class="a2a_button_kakao"></a>
    <a class="a2a_button_instagram"></a>
    <a class="a2a_button_threads"></a>
    <a class="a2a_button_facebook"></a>
    <a class="a2a_button_line"></a>
    <a class="a2a_button_copy_link"></a>
</div>
<script async src="https://static.addtoany.com/menu/page.js"></script>
```

## Supabase DB 스키마 — `user_progress`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| user_id | uuid | 사용자 ID |
| day_index | int | 챌린지 일차 (0~6) |
| missions | int[] | 완료한 미션 인덱스 배열 |
| selected_phrase | int | 선택한 대사 인덱스 |
| note | text | 오늘의 행동 메모 |
| anxiety | int | 불안 점수 (0~10) |
| guilt | int | 죄책감 점수 (0~10) |
| updated_at | timestamptz | 마지막 수정 시각 |

@AI_RULES.md
