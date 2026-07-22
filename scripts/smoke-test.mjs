// 스모크 테스트: dist/를 vite preview로 띄우고 주요 페이지가 JS 에러 없이 렌더링되는지 확인.
// 사용법: npm run build && node scripts/smoke-test.mjs   (또는 npm run verify)
// 외부 도메인(GA/AdSense/CDN 등) 요청은 차단해서 로컬 코드 문제만 검출한다.
import { spawn } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const PORT = 4173
const BASE = `http://127.0.0.1:${PORT}`
const ROOT = new URL('..', import.meta.url).pathname
const MOBILE = { width: 390, height: 844 }

const PAGES = [
  { path: '/', label: '메인 랜딩' },
  { path: '/give-test.html', label: 'GIVE ID 진단' },
  { path: '/give-prologue.html', label: '프롤로그' },
  { path: '/hogoo-check.html', label: '호구 지수' },
  { path: '/refusal-test.html', label: '거절 능력' },
  { path: '/relationship-risk.html', label: '관계 위험도' },
  { path: '/selfless-otherish-test.html', label: '이타성' },
  { path: '/result-sequence.html', label: '결과 시퀀스' },
  { path: '/hogoo-test.html', label: '7일 챌린지 (React)', mount: '#root' },
  { path: '/challenge-done.html', label: '챌린지 완주·변화 지도', seedComplete: true },
  { path: '/reviews.html', label: '후기' },
  { path: '/about.html', label: '브랜드 스토리' },
  { path: '/white-psychology.html', label: '선의 심리학' },
  { path: '/articles/index.html', label: '칼럼 목록' },
  { path: '/articles/giver-burnout.html', label: '근거 기반 칼럼' },
  { path: '/editorial-policy.html', label: '편집 원칙' },
]

// ── 정적 린트: CLAUDE.md 주요 규칙을 소스 HTML에서 자동 검사 ──
function lintHtmlFiles() {
  const files = [
    ...readdirSync(ROOT).filter((f) => f.endsWith('.html')),
    ...readdirSync(join(ROOT, 'articles')).map((f) => `articles/${f}`).filter((f) => f.endsWith('.html')),
  ]
  const problems = []
  for (const file of files) {
    const html = readFileSync(join(ROOT, file), 'utf8')
    if (!/<html[^>]*lang="ko"/.test(html)) problems.push(`${file}: <html lang="ko"> 누락`)
    if (!/<meta[^>]*name="viewport"/.test(html)) problems.push(`${file}: viewport 메타 누락`)
    for (const m of html.matchAll(/property="og:image"[^>]*content="([^"]*)"|content="([^"]*)"[^>]*property="og:image"/g)) {
      const url = m[1] ?? m[2]
      if (url && !url.startsWith('https://')) problems.push(`${file}: og:image가 절대 URL 아님 (${url})`)
    }
  }
  return { count: files.length, problems }
}

function startPreview() {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
      cwd: new URL('..', import.meta.url).pathname,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let ready = false
    const onData = (buf) => {
      if (!ready && buf.toString().includes(String(PORT))) {
        ready = true
        resolvePromise(proc)
      }
    }
    proc.stdout.on('data', onData)
    proc.stderr.on('data', onData)
    proc.on('exit', (code) => {
      if (!ready) reject(new Error(`vite preview 시작 실패 (exit ${code}) — dist/가 있는지 확인 (npm run build 먼저)`))
    })
    setTimeout(() => { if (!ready) reject(new Error('vite preview 시작 타임아웃(15s)')) }, 15000)
  })
}

async function checkPage(browser, { path, label, mount, seedComplete }) {
  const page = await browser.newPage({ viewport: MOBILE })
  const errors = []

  // 외부 요청 차단 → GA/AdSense/폰트 CDN 노이즈 제거, 로컬 문제만 검출
  await page.route('**/*', (route) => {
    const url = route.request().url()
    url.startsWith(BASE) ? route.continue() : route.abort()
  })

  // 완주 화면은 미완주 상태로 접근 시 7일 챌린지로 리다이렉트되므로,
  // 완주 화면 자체를 검증하려면 완주 상태를 시드해야 함
  if (seedComplete) {
    await page.addInitScript(() => {
      localStorage.setItem('give_challenge_day', '7')
      localStorage.setItem('give_challenge_started', '2026-7-12')
      localStorage.setItem('give_challenge_last', '2026-7-19')
    })
  }

  page.on('pageerror', (err) => errors.push(`JS 예외: ${err.message.split('\n')[0]}`))
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (url.startsWith(BASE)) {
      const reason = req.failure()?.errorText
      errors.push(`로컬 리소스 로드 실패: ${url.replace(BASE, '')}${reason ? ` (${reason})` : ''}`)
    }
  })
  page.on('response', (res) => {
    if (res.url().startsWith(BASE) && res.status() >= 400) {
      errors.push(`HTTP ${res.status()}: ${res.url().replace(BASE, '')}`)
    }
  })

  try {
    const res = await page.goto(BASE + path, { waitUntil: 'load', timeout: 15000 })
    if (!res || res.status() >= 400) errors.push(`페이지 응답 ${res ? res.status() : '없음'}`)
    await page.waitForTimeout(800) // 스크립트 초기화 대기

    if (mount) {
      const mounted = await page.locator(`${mount} > *`).count()
      if (mounted === 0) errors.push(`React가 ${mount}에 마운트되지 않음`)
    }
    const textLen = (await page.locator('body').innerText()).trim().length
    if (textLen < 40) errors.push(`본문이 비어 있음 (텍스트 ${textLen}자)`)

    // 모바일 가로 오버플로: 페이지 자체가 옆으로 스크롤되면 레이아웃 깨짐
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth)
    if (overflow > 2) errors.push(`모바일(390px) 가로 오버플로 ${overflow}px`)
  } catch (e) {
    errors.push(`탐색 실패: ${e.message.split('\n')[0]}`)
  } finally {
    await page.close()
  }
  return { path, label, errors }
}

async function checkFunnelContract(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  await page.route('**/*', (route) => {
    const url = route.request().url()
    url.startsWith(BASE) ? route.continue() : route.abort()
  })
  await page.addInitScript(() => {
    localStorage.setItem('give_test_result', 'diplomat')
    localStorage.setItem('give_challenge_day', '3')
    localStorage.setItem('give_funnel_journey_v1', JSON.stringify({
      id: 'verify-journey-id',
      resultType: 'diplomat',
      firstSeenAt: '2026-07-19T00:00:00.000Z',
    }))
  })

  try {
    await page.goto(`${BASE}/result-sequence.html?test=give&type=diplomat#next-path`, {
      waitUntil: 'load', timeout: 15000,
    })
    await page.waitForFunction(() => window.GiveJourney && window.trackEvent?.__giveContextual, null, { timeout: 15000 })

    const result = await page.evaluate(() => {
      window.trackEvent('funnel_contract_probe', { product: 'give_id_only' })
      const links = Array.from(document.querySelectorAll('[data-product]')).map((link) => ({
        product: link.dataset.product,
        href: link.href,
      }))
      const dynamicUrl = window.GiveJourney.paidUrl('give_id_only', {
        medium: 'contract_test', content: 'dynamic_reward',
      })
      const events = window.dataLayer.map((entry) => Array.from(entry))
      const probe = events.find((entry) => entry[0] === 'event' && entry[1] === 'funnel_contract_probe')
      return { links, dynamicUrl, probe: probe ? probe[2] : null }
    })

    for (const link of result.links) {
      const url = new URL(link.href)
      if (url.hostname !== 'givecosystem.com') errors.push(`${link.product}: 유료 호스트 불일치`)
      if (url.pathname !== '/start') errors.push(`${link.product}: /start 경로 누락`)
      if (url.searchParams.get('product') !== link.product) errors.push(`${link.product}: product 불일치`)
      if (url.searchParams.get('journey_id') !== 'verify-journey-id') errors.push(`${link.product}: journey_id 누락`)
      if (url.searchParams.get('result_type') !== 'diplomat') errors.push(`${link.product}: result_type 누락`)
      if (!url.searchParams.get('utm_medium')) errors.push(`${link.product}: UTM 누락`)
    }

    const dynamicUrl = new URL(result.dynamicUrl)
    if (dynamicUrl.searchParams.get('journey_id') !== 'verify-journey-id') errors.push('동적 유료 URL: journey_id 누락')
    if (dynamicUrl.searchParams.get('result_type') !== 'diplomat') errors.push('동적 유료 URL: result_type 누락')
    if (dynamicUrl.searchParams.get('utm_content') !== 'dynamic_reward') errors.push('동적 유료 URL: utm_content 누락')
    if (!result.probe) errors.push('공통 이벤트 컨텍스트가 dataLayer에 기록되지 않음')
    else {
      if (result.probe.journey_id !== 'verify-journey-id') errors.push('이벤트 journey_id 불일치')
      if (result.probe.result_type !== 'diplomat') errors.push('이벤트 result_type 불일치')
      if (result.probe.journey_stage !== 'give_result') errors.push('이벤트 journey_stage 불일치')
      if (result.probe.challenge_day !== 3) errors.push('이벤트 challenge_day 불일치')
    }
  } catch (error) {
    errors.push(`퍼널 계약 검사 실패: ${error.message.split('\n')[0]}`)
  } finally {
    await page.close()
  }
  return errors
}

async function checkChallengeGate(browser) {
  const page = await browser.newPage({ viewport: MOBILE })
  const errors = []
  await page.route('**/*', (route) => {
    const url = route.request().url()
    url.startsWith(BASE) ? route.continue() : route.abort()
  })
  try {
    await page.goto(`${BASE}/challenge-done.html`, { waitUntil: 'load', timeout: 15000 })
    const url = new URL(page.url())
    if (url.pathname !== '/hogoo-test.html') errors.push(`미완주 상태에서 완주 화면이 그대로 노출됨 (${url.pathname})`)
  } catch (error) {
    errors.push(`완주 게이트 검사 실패: ${error.message.split('\n')[0]}`)
  } finally {
    await page.close()
  }
  return errors
}

async function checkMyPageRoute(browser) {
  const page = await browser.newPage({ viewport: MOBILE })
  const errors = []
  const redirects = readFileSync(join(ROOT, 'public/_redirects'), 'utf8')
  if (!/^\/mypage\s+\/hogoo-test\s+200$/m.test(redirects)) {
    errors.push('/mypage Cloudflare rewrite 누락')
  }

  await page.route('**/*', (route) => {
    const url = route.request().url()
    url.startsWith(BASE) ? route.continue() : route.abort()
  })
  // Vite preview는 Cloudflare의 _redirects를 해석하지 않는다. 같은 엔트리를 연 뒤
  // 앱 스크립트보다 먼저 공개 경로를 주입해 실제 rewrite 이후의 렌더를 재현한다.
  await page.addInitScript(() => window.history.replaceState(null, '', '/mypage'))
  page.on('pageerror', (err) => errors.push(`JS 예외: ${err.message.split('\n')[0]}`))

  try {
    const response = await page.goto(`${BASE}/hogoo-test.html`, { waitUntil: 'load', timeout: 15000 })
    if (!response || response.status() >= 400) errors.push(`앱 엔트리 응답 ${response ? response.status() : '없음'}`)
    await page.getByRole('heading', { name: '내 보상 봉투를 다시 열어볼까요?' }).waitFor({ timeout: 5000 })
    if (new URL(page.url()).pathname !== '/mypage') errors.push('공개 경로 /mypage가 유지되지 않음')
    if (!await page.getByRole('button', { name: '로그인하고 보상 보기' }).isVisible()) {
      errors.push('비로그인 로그인 게이트가 보이지 않음')
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    if (overflow > 2) errors.push(`마이페이지 게이트 모바일 가로 오버플로 ${overflow}px`)
    await page.getByRole('button', { name: '로그인하고 보상 보기' }).click()
    if (!await page.getByRole('dialog').isVisible()) errors.push('로그인 CTA가 로그인 모달을 열지 않음')
  } catch (error) {
    errors.push(`마이페이지 경로 검사 실패: ${error.message.split('\n')[0]}`)
  } finally {
    await page.close()
  }
  return errors
}

// 1) 정적 린트
const lint = lintHtmlFiles()
if (lint.problems.length) {
  console.log(`정적 린트: ${lint.problems.length}건 위반`)
  for (const p of lint.problems) console.log(`  ✗ ${p}`)
} else {
  console.log(`정적 린트 통과 (HTML ${lint.count}개)`)
}

// 2) 브라우저 스모크 (모바일 390px 뷰포트)
const preview = await startPreview()
const browser = await chromium.launch()
let failed = 0

try {
  for (const target of PAGES) {
    const { path, label, errors } = await checkPage(browser, target)
    if (errors.length === 0) {
      console.log(`  ✓ ${label} (${path})`)
    } else {
      failed++
      console.log(`  ✗ ${label} (${path})`)
      for (const err of errors) console.log(`      - ${err}`)
    }
  }
  const funnelErrors = await checkFunnelContract(browser)
  if (funnelErrors.length === 0) {
    console.log('  ✓ 무료→유료 퍼널 데이터 계약')
  } else {
    failed++
    console.log('  ✗ 무료→유료 퍼널 데이터 계약')
    for (const error of funnelErrors) console.log(`      - ${error}`)
  }
  const gateErrors = await checkChallengeGate(browser)
  if (gateErrors.length === 0) {
    console.log('  ✓ 챌린지 완주 게이트 (미완주 접근 차단)')
  } else {
    failed++
    console.log('  ✗ 챌린지 완주 게이트 (미완주 접근 차단)')
    for (const error of gateErrors) console.log(`      - ${error}`)
  }
  const myPageErrors = await checkMyPageRoute(browser)
  if (myPageErrors.length === 0) {
    console.log('  ✓ 마이페이지 공개 경로·비로그인 인증 게이트')
  } else {
    failed++
    console.log('  ✗ 마이페이지 공개 경로·비로그인 인증 게이트')
    for (const error of myPageErrors) console.log(`      - ${error}`)
  }
} finally {
  await browser.close()
  preview.kill()
}

const ok = failed === 0 && lint.problems.length === 0
console.log(ok
  ? `\n전체 통과 (린트 ${lint.count}개 파일 + 스모크 ${PAGES.length}개 페이지)`
  : `\n실패: 린트 위반 ${lint.problems.length}건, 페이지 문제 ${failed}건`)
process.exit(ok ? 0 : 1)
