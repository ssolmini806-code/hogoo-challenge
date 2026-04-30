# GIVE ID 캐릭터 디자인 스펙

## 개요

`give-test.html`의 7가지 GIVE ID 결과 유형 각각에 SVG 인라인 치비 캐릭터를 추가한다.
같은 둥근 얼굴+볼터치 베이스에 타입별 코스튬/소품으로 개성을 표현한다.

## 캐릭터 디자인 명세

| 타입 키 | 유형명 | 코스튬 | 배경색 | 포인트색 |
|---|---|---|---|---|
| `angel` | 아낌없이 주는 천사형 | 황금 후광 + 파란 날개 | `#FFF9E6` | `#FFD700` |
| `diplomat` | 눈치 빠른 프로 외교관 | 여우귀 + 안경 + 빨간 넥타이 | `#FFF3E0` | `#FF8C42` |
| `burnout` | 지친 아낌없이 주는 나무 | 시든 잎사귀 머리 + 눈물 | `#FCE4EC` | `#F48FB1` |
| `guardian` | 단단한 경계의 수호자 | 초록 헬멧 + 방패 흉장 | `#E8F5E9` | `#388E3C` |
| `architect` | 효율적인 관계 설계자 | 파란 모자 + 클립보드 | `#E3F2FD` | `#1565C0` |
| `blocker` | 철벽 방어 현실주의자 | 얼음왕관 + 무표정 | `#E1F5FE` | `#4FC3F7` |
| `mixed` | 유연한 현실주의 밸런서 | 저울왕관 + 음양 흉장 | `#F3E5F5` | `#AB47BC` |

## 공통 얼굴 구조

- viewBox: `0 0 90 100`
- 얼굴 원: cx=45, cy=55~57, r=26, 타입별 배경색+테두리
- 눈: 좌 cx=37, 우 cx=53, cy=51~53, r=3.5 (흰 하이라이트 포함)
- 볼터치: 좌 cx=31, 우 cx=59, r=4.5, 타입 포인트색 opacity 0.4
- 미소: `path d="M37 62 Q45 70 53 62"` (burnout은 역방향 슬픈 표정)
- 몸통: 얼굴 아래 소품/의상

## 애니메이션

- 기본: `float` — translateY 0 → -5px → 0, 3s infinite ease-in-out
- 외교관·설계자: `wobble` — rotate -3deg → 0 → 3deg, 2.5s infinite
- burnout은 float 속도를 4s로 느리게 (피곤한 느낌)
- 각 캐릭터마다 `animation-delay`를 0~1s 범위에서 조금씩 다르게 → 여러 캐릭터가 같이 있어도 흐르는 느낌

## 결과 화면 배치

현재 `calculateFinalType()`의 `typeName` 엘리먼트:
```js
document.getElementById('typeName').innerHTML =
  `<span style="font-size:4rem;display:block;margin-bottom:20px;">${data.char}</span>${data.name}`;
```

변경 후:
- `data.char`를 이모지 문자열 대신 SVG 마크업 문자열로 교체
- `<span>` 래퍼의 `font-size:4rem` → `display:block;margin-bottom:16px;`
- SVG 크기: width=110 height=120 (결과 화면에서 좀 더 크게)
- 중앙 정렬 유지

## 구현 범위

- `give-test.html` 단독 수정 (공유 파일 불필요)
- `results` 객체의 `char` 필드를 SVG 마크업 문자열로 교체
- 애니메이션 CSS를 `<style>` 블록에 추가 (`@keyframes float`, `@keyframes wobble`)
- 그 외 페이지 레이아웃 변경 없음

## 범위 밖

- 아티클 페이지, index.html 변경 없음
- 외부 이미지/아이콘 라이브러리 사용 없음
- 모바일/데스크톱 별도 대응 없음 (SVG 자체가 벡터라 대응됨)
