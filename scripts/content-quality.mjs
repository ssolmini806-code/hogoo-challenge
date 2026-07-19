import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const articleNames = readdirSync(join(ROOT, 'articles'))
  .filter((name) => name.endsWith('.html') && name !== 'index.html')
  .sort()
const problems = []

if (articleNames.length !== 10) {
  problems.push(`칼럼 상세 페이지가 10편이 아님 (${articleNames.length}편)`)
}

for (const name of articleNames) {
  const file = `articles/${name}`
  const html = readFileSync(join(ROOT, file), 'utf8')
  const externalReferences = [...html.matchAll(/<section class="reference-list"[\s\S]*?<\/section>/g)]
    .flatMap((match) => [...match[0].matchAll(/href="https:\/\/([^"/]+)[^"]*"/g)])
    .filter((match) => match[1] !== 'hogoo-challenge.pages.dev')

  if (!html.includes('class="reference-list"')) problems.push(`${file}: 참고문헌 섹션 누락`)
  if (externalReferences.length < 2) problems.push(`${file}: 외부 원문 링크가 2개 미만`)
  if (!/class="author-name"[\s\S]*?href="\.\.\/editorial-policy\.html"/.test(html)) problems.push(`${file}: 작성자·편집 원칙 링크 누락`)
  if (!/property="article:modified_time" content="2026-07-19/.test(html)) problems.push(`${file}: 검토일 메타 누락`)
  if (!/"@type"\s*:\s*"Article"/.test(html)) problems.push(`${file}: Article 구조화 데이터 누락`)
  if (!html.includes('class="evidence-note"')) problems.push(`${file}: 근거 범위 안내 누락`)
  if (!html.includes('class="content-boundary"')) problems.push(`${file}: 콘텐츠 한계 안내 누락`)
  if (!html.includes('id="main"')) problems.push(`${file}: 본문 바로가기 대상(id="main") 누락`)

  for (const [index, match] of [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].entries()) {
    try {
      JSON.parse(match[1])
    } catch (error) {
      problems.push(`${file}: JSON-LD ${index + 1} 파싱 실패 (${error.message})`)
    }
  }
}

const rootHtmlFiles = readdirSync(ROOT).filter((name) => name.endsWith('.html'))
const allHtmlFiles = [...rootHtmlFiles, ...articleNames.map((name) => `articles/${name}`)]
for (const file of allHtmlFiles) {
  const html = readFileSync(join(ROOT, file), 'utf8')
  if (/pagead2\.googlesyndication\.com|adsbygoogle/.test(html)) {
    problems.push(`${file}: 승인 전 AdSense 실행 코드 발견`)
  }
  const hasVerification = /name="google-adsense-account"/.test(html)
  if (hasVerification && file !== 'index.html') problems.push(`${file}: 홈 외 AdSense 확인 메타 발견`)
}

const homepage = readFileSync(join(ROOT, 'index.html'), 'utf8')
if (!/name="google-adsense-account"/.test(homepage)) problems.push('index.html: AdSense 사이트 확인 메타 누락')
if (/data-third-party="[^"]*\bads\b/.test(homepage)) problems.push('index.html: 승인 전 광고 로더 활성화')
if (!homepage.includes('home-reading')) problems.push('index.html: 콘텐츠 허브 섹션 누락')

const sitemap = readFileSync(join(ROOT, 'public/sitemap.xml'), 'utf8')
for (const path of ['editorial-policy.html', 'articles/']) {
  if (!sitemap.includes(`https://hogoo-challenge.pages.dev/${path}`)) problems.push(`sitemap.xml: ${path} 누락`)
}

if (problems.length) {
  console.error(`콘텐츠 품질 검사 실패 (${problems.length}건)`)
  problems.forEach((problem) => console.error(`  ✗ ${problem}`))
  process.exit(1)
}

console.log(`콘텐츠 품질 검사 통과 (칼럼 ${articleNames.length}편: 작성자·수정일·근거·출처·한계, 승인 전 광고 비활성화)`)
