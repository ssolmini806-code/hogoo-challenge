# GIVE Ecosystem — Claude Code 가이드

## 프로젝트 개요
애덤 그랜트의 기버/테이커 이론 기반 심리 진단 플랫폼.
- **GIVE ID 진단**: 16문항으로 관계 유형 분석 (7가지 유형)
- **7일 챌린지**: 호구 탈출 훈련 앱 (로그인 필요)
- **지식 허브**: 심리 칼럼 4편

배포 URL: `https://hogoo-challenge.pages.dev`

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 정적 페이지 | 순수 HTML / CSS / JS (프레임워크 없음) |
| 챌린지 앱 | React 18 + Vite 5 |
| 인증 / DB | Supabase (이메일+비밀번호 로그인, `user_progress` 테이블) |
| 아이콘 | lucide-react |
| 폰트 | Pretendard (CDN) |
| SNS 공유 | AddToAny (`https://static.addtoany.com/menu/page.js`) |
| 분석 | Google Analytics (G-P6PM6JBJH1), Microsoft Clarity (wh9qtg72q5) |
| 광고 | Google AdSense (ca-pub-8564310871125079) |
| 피드백 | Userback (A-5n1vSEp2urCeuAdUdVofAoB0M) |
| 빌드 | `npm run build` → `dist/` |
| 배포 | GitHub push → Cloudflare Pages 자동 배포 |

---

## 파일 구조

```
/
├── index.html          # 메인 랜딩 (포털)
├── give-test.html      # GIVE ID 진단 테스트 (순수 JS)
├── hogoo-test.html     # 7일 챌린지 앱 진입점 (React 마운트)
├── about.html          # 브랜드 스토리
├── affiliate.html      # 제휴 문의
├── privacy.html        # 개인정보처리방침
├── terms.html          # 이용약관
├── App.jsx             # 챌린지 앱 메인 컴포넌트
├── main.jsx            # React 엔트리포인트
├── days.js             # 7일치 미션/대사/컨셉 데이터
├── vite.config.js      # 멀티 HTML 빌드 설정
├── src/
│   ├── supabase.js     # Supabase 클라이언트
│   └── components/
│       └── Auth.jsx    # 로그인/회원가입 컴포넌트
└── articles/
    ├── giver-burnout.html
    ├── setting-boundaries.html
    ├── taker-signals.html
    └── smart-giver-guide.html
```

---

## 배포 워크플로우

```
코드 수정 → git add → git commit → git push origin main
                                          ↓
                              Cloudflare Pages 자동 감지
                                          ↓
                              1~2분 후 프로덕션 반영
```

GitHub 원격: `https://github.com/ssolmini806-code/hogoo-challenge`
git remote에 토큰이 포함된 HTTPS URL 방식 사용 중.

---

## 디자인 시스템

### CSS 변수 (공통)
```css
--primary: #00a885        /* 메인 그린 */
--primary-soft: #f0f9f7   /* 연한 그린 배경 */
--text-main: #1d1d1f      /* 기본 텍스트 */
--text-sub: #6e6e73       /* 보조 텍스트 */
```

### 챌린지 앱 다크 테마
```
배경: #1a1614  |  카드: #231f1c  |  보더: #3a3530
텍스트: #f5ede3  |  완료: #7cc88a
```

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

---

## 주요 규칙

- HTML 파일은 모두 한국어(`lang="ko"`), Pretendard 폰트
- 모바일 viewport: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`
- OG/Twitter 이미지는 반드시 절대 URL (`https://hogoo-challenge.pages.dev/og-image.jpg`)
- React 컴포넌트는 인라인 style 객체 방식 사용 (Tailwind 미사용)
- Supabase 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`.env` 파일)
- 수정 후 반드시 커밋 + `git push origin main` 으로 배포까지 완료

---

## Supabase DB 스키마

### `user_progress` 테이블
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

# GIVE 에코시스템 — 무료 사이트

## 프로젝트 정보
- 사이트: hogoo-challenge.pages.dev
- 배포: Cloudflare Pages
- 스택: Vite + React, Supabase, Tailwind CSS
- 언어: 한국어

## 현재 목표
무료 → 유료 전환 유도 + A/B/A+B 3단계 보상 구조

## 무료 사이트 전용 규칙
- 테스트 자체는 로그인 없이 가능
- 보상 버튼 클릭 시 로그인 모달 표시
- 보상 상태는 로그인 후 Supabase DB 저장
- 무료 조언(A 보상)만 CSS blur 허용
- 유료 링크는 환경변수 VITE_PAID_SITE_URL 사용

## 보상 구조
A(SNS 공유) / B(후기 작성) / A+B(둘 다) 3단계
"공유했어요 ✓" 확인 버튼 클릭 = A 해금 (공유창 열기만으론 해금 안 됨)
