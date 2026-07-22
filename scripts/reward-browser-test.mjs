// 보상 봉투 슬라이드 브라우저 테스트.
// 실제 Supabase 자격 증명 없이 돌리기 위해 supabase 모듈 요청을 인메모리 가짜 구현으로 가로챈다.
// 로그인/DB 계약과 UI 흐름을 함께 검증한다. 비밀키는 사용하지도, 출력하지도 않는다.
//
// 사용법: npm run build && node scripts/reward-browser-test.mjs

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}`;
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${ok || !detail ? '' : ` — ${detail}`}`);
}

function startPreview() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
      cwd: new URL('..', import.meta.url).pathname,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let ready = false;
    proc.stdout.on('data', (buf) => {
      if (!ready && buf.toString().includes(String(PORT))) { ready = true; resolve(proc); }
    });
    proc.stderr.on('data', () => {});
    // 테스트가 중단돼도 preview 서버가 포트를 붙잡고 남지 않게 한다
    const kill = () => { try { proc.kill('SIGKILL'); } catch {} };
    process.on('exit', kill);
    process.on('SIGINT', () => { kill(); process.exit(130); });
    process.on('SIGTERM', () => { kill(); process.exit(143); });
    setTimeout(() => {
      if (!ready) reject(new Error(`preview 서버 기동 실패 (포트 ${PORT}이 이미 사용 중일 수 있습니다)`));
    }, 25000);
  });
}

// 브라우저에 주입할 가짜 supabase 모듈. user_rewards를 window에 두고 검사한다.
const FAKE_SUPABASE_MODULE = `
// 새로고침·페이지 이동에도 상태가 유지되도록 localStorage에 백업한다
const KEY = '__fake_supabase_store__';
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}
const store = load() || { rows: [], reviews: [], session: null, deletes: 0, failRewardWrites: false };
if (!store.reviews) store.reviews = [];
function persist() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} }
globalThis.__rewardStore = store;
globalThis.__persistStore = persist;

function makeQuery(table) {
  const filters = {}; const nulls = [];
  let mode = 'select', payload = null, cap = Infinity;
  const q = {
    select() { mode = 'select'; return q; },
    insert(v) { mode = 'insert'; payload = v; return q; },
    update(v) { mode = 'update'; payload = v; return q; },
    delete() { mode = 'delete'; return q; },
    eq(c, v) { filters[c] = v; return q; },
    is(c, v) { if (v === null) nulls.push(c); return q; },
    order() { return q; },
    single() { return Promise.resolve({ data: null, error: null }); },
    limit(n) { cap = n; return q; },
    then(res) { return Promise.resolve(run()).then(res); },
  };
  function run() {
    if (table === 'challenge_reviews') {
      if (mode === 'insert') { store.reviews.push(payload); persist(); }
      return { data: [], error: null };
    }
    if (table !== 'user_rewards') return { data: [], error: null };
    // 보상 쓰기 실패를 재현한다 (읽기는 정상 동작)
    if (store.failRewardWrites && mode !== 'select') {
      return { data: null, error: { message: 'reward write failed (test)' } };
    }
    const match = (r) => Object.entries(filters).every(([k, v]) => r[k] === v)
      && nulls.every((k) => r[k] == null);
    if (mode === 'insert') {
      store.rows.push({ id: 'r' + (store.rows.length + 1), created_at: new Date().toISOString(), ...payload });
      persist();
      return { data: null, error: null };
    }
    if (mode === 'update') { store.rows.filter(match).forEach((r) => Object.assign(r, payload)); persist(); return { data: null, error: null }; }
    if (mode === 'delete') { store.deletes++; store.rows = store.rows.filter((r) => !match(r)); persist(); return { data: null, error: null }; }
    return { data: store.rows.filter(match).slice(0, cap), error: null };
  }
  return q;
}

const listeners = [];
const supabase = {
  auth: {
    getSession: () => new Promise((resolve) => {
      const delay = Number(store.authDelayMs) || 0;
      const done = () => resolve({ data: { session: store.session }, error: null });
      if (delay > 0) setTimeout(done, delay); else done();
    }),
    getUser: () => Promise.resolve({ data: { user: store.session?.user ?? null }, error: null }),
    onAuthStateChange: (cb) => { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
    signOut: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
  },
  from: (t) => makeQuery(t),
};

globalThis.__login = (userId) => {
  store.session = { user: { id: userId, email: 'tester@example.test' } };
  persist();
  listeners.forEach((cb) => cb('SIGNED_IN', store.session));
};
globalThis.__logout = () => { store.session = null; persist(); listeners.forEach((cb) => cb('SIGNED_OUT', null)); };
`;

async function makeContext(browser, viewport, opts = {}) {
  const context = await browser.newContext({ viewport, ...opts });
  // supabase 모듈 요청을 가짜 구현으로 바꾼다
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (/\/assets\/supabase-[^/]*\.js$/.test(url)) {
      // 번들이 export 이름을 축약하므로(export{t as s}) 원본에서 내보내는 이름을 읽어
      // 같은 이름으로 가짜 클라이언트를 내보낸다.
      const original = await (await route.fetch()).text();
      const exported = [...original.matchAll(/export\s*\{([^}]*)\}/g)]
        .flatMap((m) => m[1].split(','))
        .map((part) => part.trim().split(/\s+as\s+/).pop().trim())
        .filter(Boolean);
      const names = exported.length ? exported : ['supabase'];
      const body = `${FAKE_SUPABASE_MODULE}\nexport {${names.map((n) => `supabase as ${n}`).join(',')}};\n`;
      await route.fulfill({ status: 200, contentType: 'text/javascript', body });
      return;
    }
    if (!url.startsWith(BASE)) { await route.abort(); return; }
    await route.continue();
  });
  return context;
}

// site-bootstrap.js가 나중에 window.trackEvent를 덮어쓰므로,
// 단순 스텁 대신 접근자를 심어 이후 할당까지 가로채 기록한다.
async function installEventRecorder(page) {
  await page.addInitScript(() => {
    window.__events = [];
    let inner = null;
    const recorder = (name, params) => {
      window.__events.push({ name, params });
      if (typeof inner === 'function') { try { inner(name, params); } catch {} }
    };
    Object.defineProperty(window, 'trackEvent', {
      configurable: true,
      get: () => recorder,
      set: (fn) => { inner = fn; },
    });
  });
}

async function gotoReward(page, type = 'diplomat', extra = '') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // 외부 도메인(폰트 등)은 테스트에서 일부러 차단하므로 그 실패는 제외한다
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    if (/net::ERR_FAILED|Failed to load resource/.test(text)) return;
    errors.push(text);
  });
  await page.goto(`${BASE}/result-sequence.html?test=give&type=${type}${extra}#reward`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#slideReward.active .reward-headline', { timeout: 10000 });
  return errors;
}

async function run() {
  const preview = await startPreview();
  const browser = await chromium.launch();
  let failed = false;

  try {
    // ── 1~3. 비로그인 진입 / 미리보기 / 공유 CTA → 로그인 ──
    console.log('\n[모바일 390×844] 비로그인 진입');
    let context = await makeContext(browser, MOBILE);
    let page = await context.newPage();
    await page.addInitScript(() => window.localStorage.setItem('give_test_scores', JSON.stringify({ burnout: 6, refusal: 15, reciprocity: 8, recovery: 7 })));
    let errors = await gotoReward(page);

    check('비로그인으로 보상 슬라이드에 진입한다', await page.isVisible('#slideReward.active'));
    check('진행 상태 0/2가 첫 화면에 보인다', (await page.textContent('.reward-progress strong')) === '0/2');
    check('보상 A 미리보기(티저)가 로그인 없이 보인다',
      (await page.textContent('.reward-card-copy')).includes('삼키는 한 문장'));
    check('보상 A의 경계 문장 전문은 공유 전에 노출되지 않는다',
      !(await page.content()).includes('지금 바로 답하기는 어려워요. 확인하고 다시 말할게요'));

    // 세로 스크롤이 생기지 않아야 한다
    const scroll = await page.evaluate(() => ({
      v: document.documentElement.scrollHeight > window.innerHeight + 1,
      h: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    check('보상 슬라이드에 페이지 세로 스크롤이 없다', !scroll.v);
    check('가로 오버플로가 없다 (390px)', !scroll.h);

    // 터치 타깃 44px
    const smallTargets = await page.$$eval('#slideReward button, #slideReward a', (els) =>
      els.filter((el) => el.offsetParent !== null && el.getBoundingClientRect().height < 43.5).length);
    check('보상 슬라이드의 모든 터치 영역이 44px 이상이다', smallTargets === 0, `${smallTargets}개 미달`);

    await page.click('.reward-share-grid button:has-text("링크 복사")');
    check('비로그인 공유 CTA는 로그인 모달을 연다', await page.isVisible('[role="dialog"]'), '');

    // ── 4~7. 로그인 → 공유 의도 복구 → 확인 → A 해금 → 새로고침 유지 ──
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.__login('user-A'));
    await page.waitForTimeout(300);
    check('로그인 후 공유 의도가 복구된다 ("공유 계속하기")', await page.isVisible('.reward-resume:has-text("공유 계속하기")'));

    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
    await page.click('.reward-share-grid button:has-text("링크 복사")');
    await page.waitForSelector('.reward-confirm', { timeout: 5000 });
    check('링크 복사 성공 후 자기 확인 단계가 열린다', await page.isVisible('button:has-text("공유했어요")'));
    check('실제 게시 검증이라고 표현하지 않는다',
      (await page.textContent('.reward-confirm-note')).includes('확인할 수 없어요'));

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    check('공유 URL이 결과 URL이다', copied.includes('/result-sequence.html') && copied.includes('type=diplomat'), copied);
    check('공유 URL에 점수·사용자 정보가 없다',
      !/score|answers|email|user_id|journey_id|product/i.test(copied), copied);

    await page.click('button:has-text("공유했어요")');
    await page.waitForSelector('button:has-text("경계 문장 카드 열어보기")', { timeout: 5000 });
    check('공유 확인 후 A 보상이 즉시 해금된다', (await page.textContent('.reward-progress strong')) === '1/2');

    const rowsAfterA = await page.evaluate(() => globalThis.__rewardStore.rows.map((r) => ({ ...r, generated_content: !!r.generated_content })));
    check('A 보상이 result_id와 함께 저장된다',
      rowsAfterA.length === 1 && rowsAfterA[0].result_id === 'give-test:diplomat'
      && rowsAfterA[0].reward_context === 'free_test' && rowsAfterA[0].reward_type === 'sns'
      && rowsAfterA[0].unlocked === true && rowsAfterA[0].generated_content === true,
      JSON.stringify(rowsAfterA));

    // 보상 A 상세 열람 + 키보드 접근성
    await page.click('button:has-text("경계 문장 카드 열어보기")');
    await page.waitForSelector('.reward-panel');
    check('상세 패널을 열면 포커스가 패널 제목으로 이동한다',
      (await page.evaluate(() => document.activeElement?.id)) === 'rewardPanelTitle');
    const quote = await page.textContent('.reward-quote');
    check('해금된 경계 문장 전문이 보인다', quote.includes('확인하고 다시 말할게요'), quote);
    check('보상 문장이 결과 슬라이드의 "오늘의 조언"과 동일하지 않다',
      !quote.includes('일정 확인하고 가능한 범위만'), quote);
    await page.keyboard.press('Escape');
    await page.waitForSelector('.reward-panel', { state: 'detached' });
    check('Escape로 패널이 닫히고 보상 슬라이드로 돌아온다', await page.isVisible('#slideReward.active'));
    check('패널을 닫으면 포커스가 원래 버튼으로 돌아온다',
      (await page.evaluate(() => document.activeElement?.textContent || '')).includes('경계 문장 카드'));

    // 패널이 슬라이드 탐색을 가로채지 않는지 (스페이스로 슬라이드가 넘어가면 안 됨)
    await page.click('button:has-text("경계 문장 카드 열어보기")');
    await page.waitForSelector('.reward-panel');
    await page.keyboard.press('Space');
    check('패널이 열려 있을 때 스페이스로 슬라이드가 넘어가지 않는다', await page.isVisible('#slideReward.active'));
    await page.keyboard.press('Escape');
    // 패널이 열려 있는 동안 배경 슬라이드는 inert다. 닫힘을 기다리지 않고 다음 버튼을
    // 누르면 inert 상태의 버튼을 눌러 아무 일도 일어나지 않는다.
    await page.waitForSelector('.reward-panel', { state: 'detached' });

    check('콘솔 오류·리소스 404 없음 (비로그인~A 해금)', errors.length === 0, errors.join(' | '));

    // 새로고침 후 A 유지
    let page2 = await context.newPage();
    await page2.addInitScript(() => window.localStorage.setItem('give_test_scores', JSON.stringify({ burnout: 6, refusal: 15, reciprocity: 8, recovery: 7 })));
    await page2.evaluate(() => {}).catch(() => {});
    await gotoReward(page2);
    await page2.waitForTimeout(400);
    check('새로고침해도 A 보상이 유지된다', (await page2.textContent('.reward-progress strong')) === '1/2');
    await page2.close();

    // ── 8~11. 후기 → 복귀 → B 해금 → A+B 자동 해금 ──
    await page.click('button:has-text("후기 쓰고 열기")');
    await page.waitForURL(/reviews\.html/, { timeout: 8000 });
    const reviewUrl = new URL(page.url());
    check('후기 시작 URL이 context/rid/result_type/return을 담는다',
      reviewUrl.searchParams.get('context') === 'free_test'
      && reviewUrl.searchParams.get('rid') === 'give-test:diplomat'
      && reviewUrl.searchParams.get('result_type') === 'diplomat'
      && reviewUrl.searchParams.get('return').startsWith('/result-sequence.html'));

    // 후기 저장 → 복귀 (reviews.html의 실제 제출 흐름)
    await page.waitForSelector('#formContent', { timeout: 8000 });
    await page.fill('#formContent', '결과를 보고 거절 문장을 하나 정해뒀습니다. 도움이 됐어요.');
    await page.click('#formSubmit');
    await page.waitForURL(/result-sequence\.html.*reward=reviewed/, { timeout: 10000 });
    await page.waitForSelector('#slideReward.active', { timeout: 8000 });
    await page.waitForTimeout(700);

    check('후기 완료 후 원래 결과의 보상 슬라이드로 복귀한다', await page.isVisible('#slideReward.active'));
    check('B 보상이 해금되고 A+B가 자동으로 열린다', (await page.textContent('.reward-progress strong')) === '2/2');
    check('A+B 설명서 버튼이 활성화된다', await page.isEnabled('button:has-text("설명서 열어보기")'));

    const rowsAfterBoth = await page.evaluate(() => globalThis.__rewardStore.rows.map((r) => `${r.result_id}|${r.reward_type}|${r.unlocked}`));
    check('A/B/A+B가 모두 같은 result_id로 저장된다',
      rowsAfterBoth.length === 3 && rowsAfterBoth.every((r) => r.startsWith('give-test:diplomat|')),
      JSON.stringify(rowsAfterBoth));
    check('보상이 한 번도 삭제되지 않았다', (await page.evaluate(() => globalThis.__rewardStore.deletes)) === 0);

    // A+B 콘텐츠가 실제로 열리는지 + 페이지 넘김
    await page.click('button:has-text("설명서 열어보기")');
    await page.waitForSelector('.reward-panel');
    const manualText = await page.textContent('.reward-panel-body');
    check('A+B 콘텐츠가 실제로 열린다', manualText.includes('내 GIVE ID 유형') && manualText.includes('거절 곤란'));
    check('"곧 제공 예정" 같은 문구가 없다', !manualText.includes('곧 제공') && !manualText.includes('준비 중'));
    await page.click('button:has-text("다음 장")');
    await page.click('button:has-text("다음 장")');
    const cta = await page.getAttribute('a:has-text("결제 없이 64문항")', 'href');
    check('진단 CTA에 product/result_type/가격이 없다',
      cta.includes('/start') && !/product|result_type|price/i.test(cta), cta);
    await page.keyboard.press('Escape');
    await page.waitForSelector('.reward-panel', { state: 'detached' });

    // ── 13. 다른 유형에서는 보상이 섞이지 않는다 ──
    let page3 = await context.newPage();
    await gotoReward(page3, 'angel');
    await page3.waitForTimeout(500);
    check('다른 결과 유형에서는 기존 보상이 섞이지 않는다', (await page3.textContent('.reward-progress strong')) === '0/2');
    await page3.close();

    // ── 15. 재검사해도 보상 유지 ──
    const beforeRetry = await page.evaluate(() => globalThis.__rewardStore.rows.length);
    let page4 = await context.newPage();
    await page4.goto(`${BASE}/give-test.html?start=1&retry=1`, { waitUntil: 'networkidle' });
    await page4.waitForTimeout(800);
    const afterRetry = await page.evaluate(() => globalThis.__rewardStore.rows.length);
    check('재검사를 시작해도 DB 보상이 유지된다',
      afterRetry === beforeRetry && (await page.evaluate(() => globalThis.__rewardStore.deletes)) === 0,
      `${beforeRetry} → ${afterRetry}`);
    await page4.close();
    await context.close();

    // ── 14. 다른 사용자에게 보상이 섞이지 않는다 (별도 컨텍스트 = 별도 store) ──
    const context2 = await makeContext(browser, MOBILE);
    const otherPage = await context2.newPage();
    await gotoReward(otherPage, 'diplomat');
    await otherPage.evaluate(() => window.__login('user-B'));
    await otherPage.waitForTimeout(500);
    check('다른 사용자에게 보상이 섞이지 않는다', (await otherPage.textContent('.reward-progress strong')) === '0/2');
    await context2.close();

    // ── 회귀 R1. reward=reviewed 수동 입력 + DB row 없음 → B 잠김 ──
    console.log('\n[회귀 검사]');
    {
      const ctx = await makeContext(browser, MOBILE);
      const p = await ctx.newPage();
      const errs = await gotoReward(p, 'diplomat', '&reward=reviewed');
      await p.evaluate(() => window.__login('user-forge'));
      await p.waitForTimeout(700);

      check('reward=reviewed를 수동 입력해도 B가 열리지 않는다',
        (await p.textContent('.reward-progress strong')) === '0/2');
      check('보상 row가 생성되지 않는다',
        (await p.evaluate(() => globalThis.__rewardStore.rows.length)) === 0);
      check('A+B 버튼이 잠긴 상태로 남는다', await p.isDisabled('button:has-text("아직 잠겨 있어요")'));
      check('후기 확인 실패 안내가 표시된다',
        (await p.textContent('.reward-slide-inner')).includes('후기 완료 상태를 확인하지 못했어요'));
      check('수동 입력 경로에서 콘솔 오류 없음', errs.length === 0, errs.join(' | '));
      await ctx.close();
    }

    // ── 회귀 R2. 실제 review row가 DB에 있으면 B 해금 ──
    {
      const ctx = await makeContext(browser, MOBILE);
      const p = await ctx.newPage();
      await p.addInitScript(() => window.localStorage.setItem('__fake_supabase_store__', JSON.stringify({
        rows: [{
          id: 'r1', user_id: 'user-real', result_id: 'give-test:diplomat',
          reward_context: 'free_test', reward_type: 'review', unlocked: true,
          generated_content: { kind: 'risk_scenes' }, created_at: '2026-07-21T00:00:00Z',
        }],
        session: { user: { id: 'user-real', email: 'tester@example.test' } },
        deletes: 0,
      })));
      await gotoReward(p, 'diplomat', '&reward=reviewed');
      await p.waitForTimeout(700);
      check('실제 review row가 있으면 B가 해금된다',
        (await p.textContent('.reward-progress strong')) === '1/2');
      check('후기 등록 완료 안내가 표시된다',
        (await p.textContent('.reward-slide-inner')).includes('후기가 등록됐어요'));
      await ctx.close();
    }

    // ── 회귀 R3. 보상 DB insert 오류 → 성공 문구·리다이렉트 금지 ──
    {
      const ctx = await makeContext(browser, MOBILE);
      const p = await ctx.newPage();
      await p.addInitScript(() => window.localStorage.setItem('__fake_supabase_store__', JSON.stringify({
        rows: [], session: { user: { id: 'user-err', email: 'tester@example.test' } }, deletes: 0,
        failRewardWrites: true,
      })));
      await p.goto(`${BASE}/reviews.html?context=free_test&rid=give-test%3Adiplomat&result_type=diplomat&return=%2Fresult-sequence.html%3Ftest%3Dgive%26type%3Ddiplomat%26reward%3Dreviewed%23reward`, { waitUntil: 'networkidle' });
      await p.waitForSelector('#formContent', { timeout: 8000 });
      await p.fill('#formContent', '보상 저장 실패를 확인하기 위한 후기 내용입니다.');
      await p.click('#formSubmit');
      await p.waitForTimeout(1500);

      check('보상 저장 실패 시 성공 문구를 표시하지 않는다',
        !(await p.textContent('#formMsg')).includes('등록됐습니다'),
        await p.textContent('#formMsg'));
      check('보상 저장 실패 시 결과 화면으로 이동하지 않는다', p.url().includes('reviews.html'));
      check('보상 저장 실패가 사용자에게 안내된다',
        (await p.textContent('#formMsg')).includes('보상 저장에 실패'));
      const reviewRows = await p.evaluate(() => globalThis.__rewardStore.reviews?.length ?? 0);
      check('후기 자체는 저장돼 있다', reviewRows === 1, String(reviewRows));

      // ── 회귀 R4. 후기 재등록 없이 보상 저장만 재시도 ──
      await p.evaluate(() => { globalThis.__rewardStore.failRewardWrites = false; globalThis.__persistStore(); });
      await p.click('#formSubmit');
      await p.waitForURL(/result-sequence\.html/, { timeout: 10000 });
      const after = await p.evaluate(() => ({
        reviews: globalThis.__rewardStore.reviews?.length ?? 0,
        rewards: globalThis.__rewardStore.rows.length,
      }));
      check('재시도 시 후기는 다시 등록되지 않는다', after.reviews === 1, JSON.stringify(after));
      check('재시도로 보상만 저장된다', after.rewards === 1, JSON.stringify(after));
      const saved = await p.evaluate(() => globalThis.__rewardStore.rows[0]);
      check('후기 보상에 위험 장면 콘텐츠가 함께 저장된다',
        saved.generated_content?.kind === 'risk_scenes' && saved.result_id === 'give-test:diplomat',
        JSON.stringify(saved.generated_content?.kind));
      await ctx.close();
    }

    // ── 회귀 R5. 비-GIVE 결과에서는 위젯·DB·이벤트 0건 ──
    {
      const ctx = await makeContext(browser, MOBILE);
      const p = await ctx.newPage();
      await installEventRecorder(p);
      await p.goto(`${BASE}/result-sequence.html?test=hogoo&type=mid#reward`, { waitUntil: 'networkidle' });
      await p.waitForTimeout(900);
      const nonGive = await p.evaluate(() => ({
        rendered: (document.getElementById('result-reward-root')?.innerHTML || '').length,
        slideHidden: document.getElementById('slideReward')?.hidden,
        supabaseTouched: typeof globalThis.__rewardStore !== 'undefined'
          ? globalThis.__rewardStore.rows.length : -1,
        rewardEvents: (window.__events || []).filter((e) => /^reward_|^share_|^review_/.test(e.name)).length,
      }));
      check('비-GIVE 결과에서 보상 슬라이드가 숨겨진다', nonGive.slideHidden === true);
      check('비-GIVE 결과에서 위젯이 마운트되지 않는다', nonGive.rendered === 0, String(nonGive.rendered));
      check('비-GIVE 결과에서 보상 DB 호출 0건', nonGive.supabaseTouched <= 0, String(nonGive.supabaseTouched));
      check('비-GIVE 결과에서 보상 분석 이벤트 0건', nonGive.rewardEvents === 0, String(nonGive.rewardEvents));
      await ctx.close();
    }

    // ── 회귀 R6~R8. reward_slide_view는 실제 노출 시점에만, 세션당 1회 ──
    {
      const ctx = await makeContext(browser, MOBILE);
      const p = await ctx.newPage();
      await installEventRecorder(p);
      const countViews = () => p.evaluate(() =>
        (window.__events || []).filter((e) => e.name === 'reward_slide_view').length);

      // 첫 슬라이드만 보고 이탈 (#reward 없이 진입)
      await p.goto(`${BASE}/result-sequence.html?test=give&type=diplomat`, { waitUntil: 'networkidle' });
      await p.waitForTimeout(800);
      check('첫 결과 슬라이드만 보면 reward_slide_view 0', (await countViews()) === 0, String(await countViews()));

      // 보상 슬라이드까지 실제로 넘어간다
      for (let i = 0; i < 12; i += 1) {
        if (await p.evaluate(() => document.getElementById('slideReward')?.classList.contains('active'))) break;
        await p.click('#sequenceNext');
        await p.waitForTimeout(150);
      }
      await p.waitForTimeout(400);
      check('보상 슬라이드에 실제 진입하면 reward_slide_view 1', (await countViews()) === 1, String(await countViews()));

      // 앞뒤로 오가도 1회
      await p.click('#sequenceBack');
      await p.waitForTimeout(200);
      await p.click('#sequenceNext');
      await p.waitForTimeout(300);
      check('슬라이드를 오가도 reward_slide_view는 1회', (await countViews()) === 1, String(await countViews()));

      // 새로고침해도 세션 dedupe 유지
      await p.reload({ waitUntil: 'networkidle' });
      await p.waitForTimeout(700);
      check('새로고침해도 reward_slide_view가 다시 발화하지 않는다 (세션 dedupe)',
        (await countViews()) === 0, '재적재 후 새 이벤트 수: ' + (await countViews()));
      await ctx.close();
    }

    // ── 회귀 R9. pending intent는 유형별로 격리된다 ──
    {
      const ctx = await makeContext(browser, MOBILE);
      const p = await ctx.newPage();
      await gotoReward(p, 'diplomat');
      await p.click('.reward-share-grid button:has-text("링크 복사")');
      await p.waitForSelector('[role="dialog"]');
      const stored = await p.evaluate(() => window.sessionStorage.getItem('give_reward_pending_intent_v1'));
      check('pending intent가 유형과 함께 저장된다',
        JSON.parse(stored).typeKey === 'diplomat' && JSON.parse(stored).intent === 'share', String(stored));

      await p.goto(`${BASE}/result-sequence.html?test=give&type=angel#reward`, { waitUntil: 'networkidle' });
      await p.waitForSelector('#slideReward.active .reward-headline');
      await p.evaluate(() => window.__login('user-intent'));
      await p.waitForTimeout(500);
      check('diplomat의 pending intent가 angel 결과에서 복원되지 않는다',
        !(await p.isVisible('.reward-resume:has-text("공유 계속하기")')));
      check('불일치한 pending intent는 즉시 삭제된다',
        (await p.evaluate(() => window.sessionStorage.getItem('give_reward_pending_intent_v1'))) === null);
      await ctx.close();
    }

    // ── 회귀 R10. reward_slide_view의 logged_in 값이 실제 로그인 상태와 일치한다 ──
    console.log('\n[reward_slide_view 로그인 상태]');
    {
      // (1) 비로그인 진입 → logged_in=false
      const ctx = await makeContext(browser, MOBILE);
      const p = await ctx.newPage();
      await installEventRecorder(p);
      await gotoReward(p, 'diplomat');
      await p.waitForTimeout(600);
      const anon = await p.evaluate(() =>
        (window.__events || []).filter((e) => e.name === 'reward_slide_view'));
      check('비로그인 진입은 logged_in=false로 기록된다',
        anon.length === 1 && anon[0].params.logged_in === false, JSON.stringify(anon));
      check('reward_slide_view에 result_type과 placement가 담긴다',
        anon[0]?.params.result_type === 'diplomat'
        && anon[0]?.params.placement === 'result_reward_slide', JSON.stringify(anon[0]?.params));
      await ctx.close();
    }

    {
      // (2) 이미 로그인한 사용자 → logged_in=true
      const ctx = await makeContext(browser, MOBILE);
      const p = await ctx.newPage();
      await installEventRecorder(p);
      await p.addInitScript(() => window.localStorage.setItem('__fake_supabase_store__', JSON.stringify({
        rows: [], reviews: [], deletes: 0,
        session: { user: { id: 'user-loggedin', email: 'tester@example.test' } },
      })));
      await gotoReward(p, 'diplomat');
      await p.waitForTimeout(700);
      const authed = await p.evaluate(() =>
        (window.__events || []).filter((e) => e.name === 'reward_slide_view'));
      check('로그인 사용자의 진입은 logged_in=true로 기록된다',
        authed.length === 1 && authed[0].params.logged_in === true, JSON.stringify(authed));
      await ctx.close();
    }

    {
      // (3) getSession이 늦게 응답해도 잘못된 false가 먼저 확정되지 않는다
      const ctx = await makeContext(browser, MOBILE);
      const p = await ctx.newPage();
      await installEventRecorder(p);
      await p.addInitScript(() => window.localStorage.setItem('__fake_supabase_store__', JSON.stringify({
        rows: [], reviews: [], deletes: 0, authDelayMs: 1500,
        session: { user: { id: 'user-slow', email: 'tester@example.test' } },
      })));
      await p.goto(`${BASE}/result-sequence.html?test=give&type=diplomat#reward`, { waitUntil: 'domcontentloaded' });
      await p.waitForSelector('#slideReward.active .reward-headline', { timeout: 10000 });

      // 슬라이드는 이미 활성인데 getSession은 아직 응답 전
      const early = await p.evaluate(() =>
        (window.__events || []).filter((e) => e.name === 'reward_slide_view'));
      check('getSession 응답 전에는 reward_slide_view를 확정하지 않는다',
        early.length === 0, JSON.stringify(early));

      await p.waitForTimeout(2200);
      const late = await p.evaluate(() =>
        (window.__events || []).filter((e) => e.name === 'reward_slide_view'));
      check('getSession 응답 후 logged_in=true로 한 번만 기록된다',
        late.length === 1 && late[0].params.logged_in === true, JSON.stringify(late));

      // (4) 앞뒤 이동해도 세션당 1회
      await p.click('#sequenceBack');
      await p.waitForTimeout(250);
      await p.click('#sequenceNext');
      await p.waitForTimeout(400);
      const afterNav = await p.evaluate(() =>
        (window.__events || []).filter((e) => e.name === 'reward_slide_view').length);
      check('지연 로그인 경로에서도 앞뒤 이동 시 1회 유지', afterNav === 1, String(afterNav));

      // (5) 새로고침해도 dedupe 계약 유지
      await p.reload({ waitUntil: 'networkidle' });
      await p.waitForTimeout(2200);
      const afterReload = await p.evaluate(() =>
        (window.__events || []).filter((e) => e.name === 'reward_slide_view').length);
      check('새로고침 후에도 reward_slide_view가 다시 발화하지 않는다', afterReload === 0, String(afterReload));
      await ctx.close();
    }

    // ── 18~20. 뷰포트별 오버플로 ──
    console.log('\n[뷰포트 검사]');
    for (const width of [360, 390, 768, 1024, 1280, 1440]) {
      const ctx = await makeContext(browser, { width, height: width < 500 ? 844 : 800 });
      const p = await ctx.newPage();
      await gotoReward(p, 'burnout');
      await p.waitForTimeout(250);
      const over = await p.evaluate(() => ({
        h: document.documentElement.scrollWidth > window.innerWidth + 1,
        v: document.documentElement.scrollHeight > window.innerHeight + 1,
        cut: [...document.querySelectorAll('#slideReward *')].some((el) => el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow === 'hidden'),
      }));
      check(`${width}px: 가로 오버플로 없음`, !over.h);
      check(`${width}px: 페이지 세로 스크롤 없음`, !over.v);
      check(`${width}px: 한국어 문장 잘림 없음`, !over.cut);
      await ctx.close();
    }

    // ── 21. 키보드만으로 조작 ──
    console.log('\n[키보드 · reduced-motion]');
    const kctx = await makeContext(browser, DESKTOP);
    const kpage = await kctx.newPage();
    await gotoReward(kpage, 'guardian');
    let reached = false;
    for (let i = 0; i < 25 && !reached; i += 1) {
      await kpage.keyboard.press('Tab');
      reached = await kpage.evaluate(() => !!document.activeElement?.closest('#slideReward'));
    }
    check('키보드 Tab만으로 보상 CTA에 도달한다', reached);
    await kctx.close();

    // ── 22. reduced-motion ──
    const rctx = await makeContext(browser, MOBILE, { reducedMotion: 'reduce' });
    const rpage = await rctx.newPage();
    await gotoReward(rpage, 'angel');
    const envelopeAnimated = await rpage.evaluate(() => {
      const el = document.querySelector('.reward-envelope-flap');
      if (!el) return 'missing';
      const s = getComputedStyle(el);
      return s.transitionDuration;
    });
    check('reduced-motion에서 봉투 애니메이션이 생략된다', envelopeAnimated === '0s', String(envelopeAnimated));
    check('reduced-motion에서도 핵심 정보가 즉시 보인다',
      await rpage.isVisible('.reward-progress') && await rpage.isVisible('.reward-cards'));
    await rctx.close();

    // ── 데스크톱 + 모바일 스크린샷 ──
    for (const [label, viewport] of [['mobile-390x844', MOBILE], ['desktop-1280x800', DESKTOP]]) {
      const ctx = await makeContext(browser, viewport);
      const p = await ctx.newPage();
      await gotoReward(p, 'diplomat');
      await p.waitForTimeout(600);
      await p.screenshot({ path: `/tmp/reward-${label}.png` });
      // 해금 상태 스크린샷
      await p.evaluate(() => {
        globalThis.__rewardStore.rows = ['sns', 'review', 'both'].map((t, i) => ({
          id: 'r' + i, user_id: 'user-A', result_id: 'give-test:diplomat',
          reward_context: 'free_test', reward_type: t, unlocked: true, generated_content: {}, created_at: new Date().toISOString(),
        }));
        window.__login('user-A');
      });
      await p.waitForTimeout(700);
      await p.screenshot({ path: `/tmp/reward-${label}-unlocked.png` });
      await ctx.close();
    }
    console.log('  스크린샷: /tmp/reward-{mobile-390x844,desktop-1280x800}[-unlocked].png');

    failed = results.some((r) => !r.ok);
  } finally {
    await browser.close();
    preview.kill();
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${failed ? '실패' : '전체 통과'}: ${passed}/${results.length}`);
  if (failed) {
    for (const r of results.filter((x) => !x.ok)) console.log(`  ✗ ${r.name} — ${r.detail}`);
    process.exit(1);
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
