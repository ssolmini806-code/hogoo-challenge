import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.CHALLENGE_REWARD_TEST_PORT || 4176);
const BASE = `http://127.0.0.1:${PORT}`;
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${ok || !detail ? '' : ` — ${detail}`}`);
};

function startPreview() {
  return new Promise((resolve, reject) => {
    const vite = new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname;
    const processHandle = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
      cwd: new URL('..', import.meta.url).pathname,
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    processHandle.stderr.on('data', (chunk) => { stderr += chunk; });
    const poll = setInterval(async () => {
      try {
        if ((await fetch(BASE)).ok) { clearInterval(poll); resolve(processHandle); }
      } catch { /* starting */ }
    }, 150);
    processHandle.on('exit', (code) => reject(new Error(`preview exit ${code}: ${stderr}`)));
    setTimeout(() => { clearInterval(poll); reject(new Error(`preview timeout: ${stderr}`)); }, 20_000);
  });
}

const FAKE = `
const KEY='__challenge_reward_test__';
const initial={session:{user:{id:'challenge-user',email:'challenge@example.test'},access_token:'test-token'},rewards:[],reviews:[],progress:Array.from({length:7},(_,day_index)=>({user_id:'challenge-user',day_index,missions:[0,1,2],selected_phrase:day_index%3,note:'Day '+(day_index+1)+'에 실제로 경계 문장을 연습했습니다.',anxiety:Math.max(1,7-day_index),guilt:Math.max(1,6-day_index)}))};
const store=JSON.parse(localStorage.getItem(KEY)||'null')||initial; globalThis.__challengeStore=store;
const persist=()=>localStorage.setItem(KEY,JSON.stringify(store));
function rows(table){return table==='user_rewards'?store.rewards:table==='challenge_reviews'?store.reviews:table==='user_progress'?store.progress:[]}
function query(table){let mode='select',payload=null,filters={},nulls=[],cap=Infinity;const q={select(){return q},insert(v){mode='insert';payload=v;return q},upsert(v){mode='upsert';payload=v;return q},update(v){mode='update';payload=v;return q},delete(){mode='delete';return q},eq(k,v){filters[k]=v;return q},is(k,v){if(v===null)nulls.push(k);return q},order(){return q},limit(n){cap=n;return q},single(){const result=run();return Promise.resolve({...result,data:Array.isArray(result.data)?result.data[0]||null:result.data})},maybeSingle(){return q.single()},then(resolve){return Promise.resolve(run()).then(resolve)}};function match(r){return Object.entries(filters).every(([k,v])=>r[k]===v)&&nulls.every(k=>r[k]==null)}function run(){let list=rows(table);if(mode==='select')return{data:list.filter(match).slice(0,cap),error:null};if(mode==='insert'){const item={id:'item-'+(list.length+1),created_at:new Date().toISOString(),...payload};list.push(item);persist();return{data:item,error:null}}if(mode==='upsert'){const keys=table==='user_rewards'?['user_id','reward_context','result_id','reward_type']:['user_id','day_index'];let item=list.find(r=>keys.every(k=>(r[k]??null)===(payload[k]??null)));if(item)Object.assign(item,payload);else{item={id:'item-'+(list.length+1),created_at:new Date().toISOString(),...payload};list.push(item)}persist();return{data:item,error:null}}if(mode==='update'){list.filter(match).forEach(r=>Object.assign(r,payload));persist();return{data:null,error:null}}if(mode==='delete'){const kept=list.filter(r=>!match(r));if(table==='challenge_reviews')store.reviews=kept;persist();return{data:null,error:null}}}return q}
const supabase={auth:{getSession:()=>Promise.resolve({data:{session:store.session},error:null}),getUser:()=>Promise.resolve({data:{user:store.session.user},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:()=>Promise.resolve({error:null}),updateUser:()=>Promise.resolve({data:{},error:null})},from:query,functions:{invoke:(name,{body}={})=>{if(name==='claim-reward'){const item={user_id:store.session.user.id,reward_context:body.context,result_id:body.resultId??null,reward_type:body.rewardType,unlocked:true,generated_content:body.generatedContent??null};const old=store.rewards.find(r=>['user_id','reward_context','result_id','reward_type'].every(k=>(r[k]??null)===(item[k]??null)));if(old)Object.assign(old,item);else store.rewards.push({id:'reward-'+(store.rewards.length+1),created_at:new Date().toISOString(),...item});if(body.context==='seven_day_challenge'&&store.rewards.some(r=>r.reward_type==='sns'))store.reviews.forEach(r=>{if(r.user_id===store.session.user.id)r.reward_badge='seven_day_finisher'});persist();return Promise.resolve({data:{reward:item},error:null})}if(name==='challenge-certificate'){const certificate={code:'00000000-0000-4000-8000-000000000001',completedMissions:21,issuedAt:'2026-08-22T00:00:00Z'};return Promise.resolve({data:body.action==='verify'?{valid:true,certificate}:{certificate},error:null})}if(name==='save-challenge-progress')return Promise.resolve({data:{progress:{}},error:null});return Promise.resolve({data:{success:true},error:null})}}};
`;

const preview = await startPreview();
const browser = await chromium.launch();
try {
  for (const [name, viewport] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 800 }]]) {
    const context = await browser.newContext({ viewport, acceptDownloads: true });
    await context.route('**/*', async (route) => {
      const url = route.request().url();
      if (url === `${BASE}/mypage`) {
        const response = await route.fetch({ url: `${BASE}/hogoo-test.html` });
        await route.fulfill({ response });
        return;
      }
      if (/\/assets\/supabase-[^/]*\.js$/.test(url)) {
        const original = await (await route.fetch()).text();
        const names = [...original.matchAll(/export\s*\{([^}]*)\}/g)].flatMap((match) => match[1].split(','))
          .map((part) => part.trim().split(/\s+as\s+/).pop().trim()).filter(Boolean);
        await route.fulfill({ status: 200, contentType: 'text/javascript', body: `${FAKE}\nexport {${names.map((item) => `supabase as ${item}`).join(',')}};` });
        return;
      }
      if (!url.startsWith(BASE)) { await route.abort(); return; }
      await route.continue();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => { if (message.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(message.text())) errors.push(message.text()); });
    await page.goto(`${BASE}/hogoo-test.html`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("완료 보상")');
    await page.waitForSelector('.challenge-reward');
    check(`${name}: 잠긴 A/B/A+B 화면`, (await page.textContent('.challenge-reward')).includes('SNS 공유와 후기 작성을 모두 완료'));
    const shareDownloadWait = page.waitForEvent('download');
    await page.click('button:has-text("완주 카드 저장")');
    const shareDownload = await shareDownloadWait;
    await shareDownload.saveAs(`/tmp/challenge-share-card-${name}.png`);
    await page.waitForFunction(() => document.body.textContent.includes('인증서가 열렸습니다'));
    check(`${name}: 4:5 공유 카드 PNG 생성`, shareDownload.suggestedFilename().includes('7일-경계연습'));
    check(`${name}: A 서버 발급 후 인증서 활성화`, await page.isEnabled('button:has-text("인증서 다운로드")'));
    const downloadWait = page.waitForEvent('download');
    await page.click('button:has-text("인증서 다운로드")');
    const download = await downloadWait;
    await download.saveAs(`/tmp/challenge-certificate-${name}.png`);
    check(`${name}: 검증번호 인증서 PNG 다운로드`, (await page.textContent('.challenge-reward')).includes('검증번호가 담긴 완주 인증서'));
    await page.click('button:has-text("후기 작성하기")');
    await page.waitForSelector('#formContent');
    await page.fill('#formContent', '7일 동안 기록한 경계 연습이 실제 생활에서 도움이 됐습니다.');
    await page.click('#formSubmit');
    await page.waitForURL(/hogoo-test\.html/, { timeout: 10_000 });
    await page.click('button:has-text("완료 보상")');
    await page.waitForSelector('.challenge-memoir-pages');
    await page.click('.challenge-memoir-pager button:has-text("다음 장")');
    check(`${name}: B 변화 그래프가 실제 점수로 표시`, await page.isVisible('.challenge-memoir-chart svg'));
    await page.click('.challenge-memoir-pager button:has-text("다음 장")');
    await page.click('.challenge-memoir-pager button:has-text("다음 장")');
    const rewardText = await page.textContent('.challenge-reward');
    check(`${name}: B에 실제 7일 회고록 표시`, rewardText.includes('Day 7. 30일 기준표') && !rewardText.includes('API에서 생성'));
    const memoirDownloadWait = page.waitForEvent('download');
    await page.click('button:has-text("4장 회고록 PDF 저장")');
    const memoirDownload = await memoirDownloadWait;
    await memoirDownload.saveAs(`/tmp/challenge-memoir-${name}.pdf`);
    check(`${name}: 4장 회고록 PDF 생성`, memoirDownload.suggestedFilename().endsWith('.pdf'));
    check(`${name}: A+B 적합도 근거와 다음 행동 표시`, rewardText.includes('행동 메모 7개') && rewardText.includes('30일 동안 매주 한 번'));
    const paidHref = await page.getAttribute('a:has-text("30일 챌린지 시작하기")', 'href');
    check(`${name}: 30일 CTA가 실제 시작 URL에 연결`, /\/start\?.*product=challenge_30day/.test(paidHref || ''), paidHref || '');
    const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1, small: [...document.querySelectorAll('.challenge-reward button,.challenge-reward a')].filter((el) => el.offsetParent && el.getBoundingClientRect().height < 43.5).length }));
    check(`${name}: 가로 오버플로 없음`, !layout.overflow);
    check(`${name}: 터치 타깃 44px 이상`, layout.small === 0, String(layout.small));
    check(`${name}: 콘솔 오류 없음`, errors.length === 0, errors.join(' | '));
    await page.screenshot({ path: `/tmp/challenge-reward-${name}-secured.png`, fullPage: true });

    await page.goto(`${BASE}/reviews.html`, { waitUntil: 'networkidle' });
    check(`${name}: 후기 게시판에 전용 완주 배지 표시`, (await page.textContent('body')).includes('7일 완주'));

    await page.goto(`${BASE}/mypage`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.challenge-finisher-card');
    const archiveText = await page.textContent('.challenge-archive');
    check(`${name}: 마이페이지에 완주 인장 보관`, archiveText.includes('7일 경계 연습 완주자'));
    check(`${name}: A/B/A+B 획득 상태 보관`, archiveText.includes('완주 인장') && archiveText.includes('7일 회고록') && archiveText.includes('30일 적합도'));
    await page.screenshot({ path: `/tmp/challenge-archive-${name}.png`, fullPage: false });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/reviews.html?context=paid_30day`, { waitUntil: 'networkidle' });
  check('임의 paid_30day 후기 컨텍스트 차단', (await page.textContent('#writeSection')).includes('허용되지 않은 후기 경로'));
  await context.close();
} finally {
  await browser.close();
  preview.kill('SIGKILL');
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${failed.length ? '실패' : '전체 통과'}: ${results.length - failed.length}/${results.length}`);
if (failed.length) process.exitCode = 1;
