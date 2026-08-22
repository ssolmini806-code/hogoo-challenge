# assets-src — 이미지 원본 마스터

배포되지 않는 원본 PNG 보관소.

`public/` 안에 두면 Vite가 `dist/`로 그대로 복사해 Cloudflare Pages에 올라가므로
(웹페이지에서 참조하지 않는데도 55MB가 배포되던 문제) `public/` 밖에 둔다.

실제로 서빙되는 이미지는 `public/images/` 의 webp 파일들이다.

## 새 이미지 추가 절차
1. 원본 png/jpg를 `public/images/<카테고리>/` 에 넣는다
2. `node scripts/compress-images.js` 실행 → 같은 위치에 webp 생성
3. 원본 png/jpg는 이 디렉터리로 옮기고, 페이지에서는 webp만 참조한다
