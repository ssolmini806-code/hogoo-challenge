# GIVE 에코시스템 — 무료 사이트 (Codex용)

상세 프로젝트 정보(파일 구조·디자인 시스템·DB 스키마)는 CLAUDE.md 참고. 이 파일은 요약 + 행동 규칙.

## 프로젝트 정보
- 사이트: hogoo-challenge.pages.dev (Cloudflare Pages, GitHub push 시 자동 배포)
- 스택: 순수 HTML/CSS/JS(테스트 페이지) + React 18/Vite 5(챌린지 앱) + Supabase
- **Tailwind·Next.js 미사용** — React는 인라인 style 객체 방식
- 언어: 한국어
- 테스트 페이지 패턴: 루트 HTML + `public/<이름>-world.css` + `public/<이름>-world.js` 3종 세트

## 현재 목표
무료 → 유료 전환 유도 + A/B/A+B 3단계 보상 구조
- 테스트는 로그인 없이 가능, 보상 버튼 클릭 시 로그인 모달
- 보상 상태: 로그인 후 Supabase DB / "공유했어요 ✓" 클릭 = A 해금
- 무료 조언(A 보상)만 CSS blur 허용 / 유료 링크: `VITE_PAID_SITE_URL`

## 작업 모드 (필요할 때만 더 생각한다)

### L0 기본 (대부분의 작업)
- 빠르게 실행, 최소 단계. 구체적 스펙이 주어지면 그대로 구현, 중간 확인 질문으로 멈추지 않기
- 작고 되돌리기 쉬운 모호함은 기본값 선택 후 보고에 가정 명시

### L1 검증 플러스 (해당 시 자동)
커밋 전 `npm run build` 통과 + 영향 페이지 확인. 트리거:
- 공유 자산(give-theme.css, site-bootstrap.js, share.*, third-party-loader.js, vite.config.js) 수정
- 서로 다른 페이지 2개 이상 변경 (한 페이지의 html+css+js 세트는 해당 없음)
- 로그인/보상/Supabase 로직 변경

### L2 Fable 모드 (조사→계획→실행→검증)
- 원인 불명 버그 ("왜 안 되지") — 수정 전 원인부터 확정
- DB 스키마 / RLS / 인증 구조 변경, 구조적 리팩토링
- 명시적으로 "꼼꼼하게" / "fable 모드로" 요청 시

에스컬레이션: 첫 시도 실패 또는 가정과 어긋나는 증거 발견 시 한 단계 올려 조사부터. 반대로 원인이 바로 확정되면 형식적 단계 생략.

## 행동 규칙
- 멈춰서 확인: 되돌리기 어려운 작업 / DB 구조 변경 / 아키텍처·범위 변경일 때만
- 파일 하나에 다 넣지 않기, 기존 기능 보존, 가짜 값 UI 표시 금지
- 완료 = 커밋 + `git push origin main`까지. 보고에 커밋 여부와 가정 명시
