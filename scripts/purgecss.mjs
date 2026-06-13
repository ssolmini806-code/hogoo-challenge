/**
 * Post-build: PurgeCSS로 dist/give-theme.css 미사용 규칙 제거
 * 소스 public/give-theme.css는 건드리지 않음
 */
import { PurgeCSS } from 'purgecss';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const TARGET = resolve(ROOT, 'dist/give-theme.css');

async function run() {
  if (!existsSync(TARGET)) {
    console.log('PurgeCSS: dist/give-theme.css 없음 (빌드 먼저 실행)');
    return;
  }

  const result = await new PurgeCSS().purge({
    content: [
      resolve(ROOT, '**/*.html'),
      resolve(ROOT, '**/*.jsx'),
      resolve(ROOT, '**/*.tsx'),
      resolve(ROOT, 'public/**/*.js'),
    ],
    css: [TARGET],
    safelist: {
      standard: [
        /^is-/, /^active$/, /^on$/, /^open$/, /^hidden$/, /^visible$/,
        /^animate/, /^sequence-green-active$/,
        /^type-/, /^result-/,
      ],
      deep: [/\[open\]/, /\[aria-selected/, /\[aria-expanded/],
    },
    keyframes: true,
    variables: false,
  });

  if (!result.length) {
    console.error('PurgeCSS: 결과 없음');
    process.exit(1);
  }

  const before = readFileSync(TARGET, 'utf-8').length;
  writeFileSync(TARGET, result[0].css, 'utf-8');
  const after = result[0].css.length;

  console.log(`PurgeCSS: give-theme.css ${(before / 1024).toFixed(1)} KB → ${(after / 1024).toFixed(1)} KB (${Math.round((1 - after / before) * 100)}% 절감)`);
}

run().catch(err => { console.error(err); process.exit(1); });
