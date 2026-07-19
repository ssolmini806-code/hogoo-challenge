// 스모크 테스트: dist/를 vite preview로 띄우고 주요 페이지가 JS 에러 없이 렌더링되는지 확인.
// 사용법: npm run build && node scripts/smoke-test.mjs   (또는 npm run verify)
// 외부 도메인(GA/AdSense/CDN 등) 요청은 차단해서 로컬 코드 문제만 검출한다.
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = 4173
const BASE = `http://localhost:${PORT}`

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
  { path: '/reviews.html', label: '후기' },
  { path: '/about.html', label: '브랜드 스토리' },
  { path: '/white-psychology.html', label: '선의 심리학' },
  { path: '/articles/index.html', label: '칼럼 목록' },
]

function startPreview() {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
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

async function checkPage(browser, { path, label, mount }) {
  const page = await browser.newPage()
  const errors = []

  // 외부 요청 차단 → GA/AdSense/폰트 CDN 노이즈 제거, 로컬 문제만 검출
  await page.route('**/*', (route) => {
    const url = route.request().url()
    url.startsWith(BASE) ? route.continue() : route.abort()
  })

  page.on('pageerror', (err) => errors.push(`JS 예외: ${err.message.split('\n')[0]}`))
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (url.startsWith(BASE)) errors.push(`로컬 리소스 로드 실패: ${url.replace(BASE, '')}`)
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
  } catch (e) {
    errors.push(`탐색 실패: ${e.message.split('\n')[0]}`)
  } finally {
    await page.close()
  }
  return { path, label, errors }
}

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
} finally {
  await browser.close()
  preview.kill()
}

console.log(failed === 0
  ? `\n스모크 테스트 통과 (${PAGES.length}개 페이지)`
  : `\n스모크 테스트 실패: ${failed}/${PAGES.length}개 페이지에 문제`)
process.exit(failed === 0 ? 0 : 1)
