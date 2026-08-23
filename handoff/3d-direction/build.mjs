import fs from 'node:fs';

const three = fs.readFileSync('three.min.js','utf8');
const temple = fs.readFileSync('temple.js','utf8');
const sylvaDoc = fs.readFileSync('sylva-doc.html','utf8');

/* ── GIVE 브랜드 조정 ──────────────────────────────────────────
   MIT는 수정을 명시적으로 허용한다. 원본 Sylva는 올리브/황록 계열인데,
   우리 브랜드 그린(--primary #00a885)에 맞춰 조명·바운스·안개·대기색을
   청록 쪽으로 옮기고 밀도를 다시 잡는다. 그대로 가져다 쓰지 않는다. */
const BRAND = [
  // [원본, 우리 값, 설명]
  ['new THREE.Color(1.14, 1.06, 0.88)', 'new THREE.Color(0.88, 1.12, 1.02)', '키 라이트: 따뜻한 황색 → 서늘한 민트'],
  ['new THREE.Color(0.78, 0.78, 0.62)', 'new THREE.Color(0.54, 0.86, 0.79)', '바닥 반사광: 올리브 → 청록'],
  ['new THREE.Color(0.086, 0.090, 0.080)', 'new THREE.Color(0.058, 0.098, 0.092)', '환경광: 중성 → 그린 편향'],
  ['new THREE.Color(0.176, 0.195, 0.145)', 'new THREE.Color(0.098, 0.196, 0.178)', '대기 헤이즈: 황록 → 브랜드 그린'],
  ['[0.176, 0.195, 0.145]', '[0.098, 0.196, 0.178]', '헤이즈 기본값(옵션 경로)'],
  ['var BLADES_NEAR = small ? 70000 : 190000;', 'var BLADES_NEAR = small ? 52000 : 138000;', '근경 잔디 밀도 하향 — 모바일 부담 완화'],
  ['var BLADES_FAR  = small ? 20000 :  60000;', 'var BLADES_FAR  = small ? 15000 :  44000;', '원경 잔디 밀도'],
  ['? 1500 : 4200;', '? 2100 : 5600;', '꽃가루 증량 — "선의가 흐르는 방향" 모티프'],
  ["background:#4a4d44!important", "background:#26332f!important", '월드 바탕: 올리브 그레이 → 딥 그린'],
];
let brandDoc = sylvaDoc;
for (const [from, to, why] of BRAND) {
  if (!brandDoc.includes(from)) { console.warn('  ⚠ 치환 실패:', why, '—', from.slice(0,40)); continue; }
  brandDoc = brandDoc.split(from).join(to);
  console.log('  ✓', why);
}

const css = fs.readFileSync('shell.css','utf8');
const loader = fs.readFileSync('loader.js','utf8');

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hahmlet:wght@400;500&family=Noto+Sans+KR:wght@400;600;700;800&display=swap">';

const LOADER_MARKUP = `
<div class="loader" role="status" aria-live="polite">
  <p class="loader-note">GIVE ECOSYSTEM · 3D 시안</p>
  <p class="loader-pct"><b>0</b><span>%</span></p>
  <div class="loader-track"><div class="loader-fill"></div></div>
  <p class="loader-msg"></p>
</div>`;

const HERO = `
<section class="stage">
  <div class="col">
    <p class="eyebrow">A Map of How You Give</p>
    <h1 class="wordmark">GIVE<small>ECOSYSTEM</small></h1>
    <p class="tagline">관계에서 자꾸 지치는 이유부터.<br>나의 선의가 흐르는 방향을 발견해 보세요.</p>
    <nav class="menu" aria-label="테스트 바로가기">
      <a class="lead" href="#"><span><strong>내 GIVE ID 찾기</strong><em>반복되는 마음과 행동의 패턴을 유형으로 확인해요</em></span><b aria-hidden="true">→</b></a>
      <a href="#">내가 호구인지 알아보기<b aria-hidden="true">→</b></a>
      <a href="#">나는 거절을 잘하는 편일까?<b aria-hidden="true">→</b></a>
      <a href="#">과연 내 주변은 괜찮을까?<b aria-hidden="true">→</b></a>
      <a href="#">7일 만에 거절 연습 시작하기<b aria-hidden="true">→</b></a>
    </nav>
  </div>
</section>`;

const KAGE_MSGS = `["밤의 산사에 등을 켜는 중","단풍을 떨어뜨리는 중","안개를 산등성이에 거는 중","달을 띄우는 중","관계의 지도를 펴는 중"]`;
const SYLVA_MSGS = `["이끼를 깨우는 중","고사리를 펼치는 중","꽃가루를 띄우는 중","나비를 부르는 중","생태계를 여는 중"]`;

const KAGE_BOOT = `
<script>
(function(){
  var L = window.LabLoader(${KAGE_MSGS});
  var canvas = document.querySelector('canvas.world');
  var TOTAL = 328; // 이 렌더러가 실제로 생성하는 THREE 객체 수 — 측정값
  var getCount = window.countThree(function(n){ L.set(6 + (n / TOTAL) * 84); });
  var renderer;
  try { renderer = window.createTempleNightRenderer(canvas); }
  catch (e) { L.fail('이 브라우저에서 3D를 열 수 없습니다 (WebGL 미지원)'); return; }
  if (!renderer) { L.fail('이 브라우저에서 3D를 열 수 없습니다 (WebGL 미지원)'); return; }
  L.set(94);
  var frame = 0, first = true;
  function tick(t){
    frame = 0;
    renderer.render(t);
    if (first) { first = false; L.done(); }
    if (!renderer.reducedMotion) schedule();
  }
  function schedule(){ if(!frame && !document.hidden) frame = requestAnimationFrame(tick); }
  new ResizeObserver(function(){ renderer.resize(); schedule(); }).observe(document.documentElement);
  document.addEventListener('visibilitychange', function(){
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; } else schedule();
  });
  document.addEventListener('pointermove', function(e){
    var b = canvas.getBoundingClientRect();
    renderer.setPointer(((e.clientX-b.left)/Math.max(1,b.width))*2-1, 1-((e.clientY-b.top)/Math.max(1,b.height))*2, true);
    schedule();
  }, {passive:true});
  __EXTRA__
  renderer.resize();
  schedule();
})();
</script>`;

function page({ title, world, boot, extraMarkup = '', extraCss = '', extraBoot = '' }) {
  return `<title>${title}</title>
${FONTS}
<style>
${css}
${extraCss}
</style>
${LOADER_MARKUP}
${world}
${HERO}
${extraMarkup}
<script>${loader}</script>
${boot.replace('__EXTRA__', extraBoot)}`;
}

/* ── A. Kage 히어로 ── */
fs.writeFileSync('a-kage-hero.html', page({
  title: '밤의 산사 히어로',
  world: `<canvas class="world" aria-label="밤의 산사 3D 월드" role="img"></canvas>
<script>${three}</script>
<script>${temple}</script>`,
  boot: KAGE_BOOT,
}));

/* ── B. Kage 스크롤 구성 ── */
const CHAPTERS = [
  ['소진의 개념 구분','착하게 살아서 번아웃 온 게 아닙니다','WHO의 직업적 번아웃 정의와 관계 소진이라는 일상 표현을 구분합니다.'],
  ['한국 문화 맥락','정·눈치·체면이 거절에 주는 압력','개인의 성격만 탓하지 않고 관계와 지위의 맥락을 함께 봅니다.'],
  ['자기주장 연습','죄책감 없이 범위를 말하는 세 칸','공감, 한계, 선택 가능한 대안을 연습 문장으로 정리합니다.'],
  ['호혜성 기록','호혜성이 무너진 관계를 보는 5가지 질문','성격을 추측하지 않고 요청·책임·거절 반응의 반복을 관찰합니다.'],
];
const chapterMarkup = `
<section class="chapters" aria-labelledby="ch-title">
  <div class="chapters-inner">
    <p class="eyebrow">Evidence &amp; Practice</p>
    <h2 id="ch-title">테스트 결과보다 먼저,<br>관계에서 반복된 장면을 읽습니다</h2>
    <div class="ch-grid">
      ${CHAPTERS.map(([k,t,d])=>`<article class="ch-card"><small>${k}</small><h3>${t}</h3><p>${d}</p><span class="ch-go">읽기 →</span></article>`).join('\n      ')}
    </div>
  </div>
</section>
<section class="closing">
  <div class="closing-inner">
    <p class="eyebrow">GIVE ID · 심화</p>
    <h2>패턴의 입구까지 왔다면,<br>반복되는 이유까지</h2>
    <p class="tagline">무료 검사가 신호를 보여줬다면, 심화 리포트는 이 패턴이 반복되는 관계와 바로 쓸 수 있는 경계 문장까지 정리합니다.</p>
    <a class="cta" href="#">GIVE ID 심화 살펴보기 →</a>
  </div>
</section>
<div class="scroll-rail" aria-hidden="true"><div class="scroll-rail-fill"></div></div>`;

const chapterCss = `
.chapters,.closing{position:relative;z-index:10;padding:clamp(60px,12vh,120px) clamp(24px,6vw,72px)}
.chapters{background:linear-gradient(180deg,transparent,rgba(10,8,6,.42) 22%,rgba(10,8,6,.5))}
.chapters-inner,.closing-inner{width:min(100%,1040px);margin:0 auto;display:flex;flex-direction:column;gap:20px}
.chapters h2,.closing h2{text-shadow:0 2px 26px rgba(10,8,6,.95),0 1px 4px rgba(10,8,6,.9);font-family:var(--display);font-weight:500;font-size:clamp(1.7rem,4.4vw,2.5rem);line-height:1.3;text-wrap:balance}
.ch-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:16px}
.ch-card{display:flex;flex-direction:column;gap:9px;padding:26px;border:1px solid var(--line);background:rgba(14,11,8,.5);backdrop-filter:blur(9px) saturate(.85);transition:border-color .3s,transform .3s,background .3s}
.ch-card:hover{background:rgba(14,11,8,.68)}
.ch-card:hover{border-color:var(--accent);transform:translateY(-3px)}
.ch-card small{font-size:.72rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.ch-card h3{font-family:var(--display);font-weight:500;font-size:1.16rem;line-height:1.42}
.ch-card p{font-size:.88rem;color:var(--ink-dim)}
.ch-go{margin-top:6px;font-size:.82rem;color:var(--sand)}
.closing{background:linear-gradient(180deg,rgba(10,8,6,.5),rgba(10,8,6,.82));border-top:1px solid var(--line)}
.cta{align-self:flex-start;margin-top:10px;padding:15px 30px;border:1px solid var(--accent);color:var(--accent);text-decoration:none;font-weight:700;transition:background .3s,color .3s}
.cta:hover{background:var(--accent);color:var(--ground-deep)}
.scroll-rail{position:fixed;top:0;left:0;right:0;height:2px;z-index:40;background:transparent}
.scroll-rail-fill{height:100%;width:0;background:var(--accent)}
`;

const scrollBoot = `
  // 스크롤 위치로 월드 시점을 움직인다 (렌더러가 노출하는 setPointer 파라랙스를 실제로 구동)
  var rail = document.querySelector('.scroll-rail-fill');
  var world = canvas;
  var target = 0, current = 0, raf = 0;
  function apply(){
    current += (target - current) * 0.12;
    // 월드 자체를 밀어넣고 끌어올린다 — setPointer 파랄랙스만으로는 눈에 안 띈다
    world.style.transform = 'scale(' + (1 + current * 0.34).toFixed(4) + ') translate3d(0,' + (-current * 7).toFixed(2) + '%,0)';
    world.style.transformOrigin = '58% ' + (42 + current * 26).toFixed(1) + '%';
    renderer.setPointer(current * 1.6 - 0.8, 0.55 - current * 1.5, true);
    schedule();
    if (Math.abs(target - current) > 0.0004) raf = requestAnimationFrame(apply); else raf = 0;
  }
  window.addEventListener('scroll', function(){
    var max = document.documentElement.scrollHeight - innerHeight;
    target = max > 0 ? scrollY / max : 0;
    rail.style.width = (target*100).toFixed(1) + '%';
    if (!raf) raf = requestAnimationFrame(apply);
  }, {passive:true});
`;

fs.writeFileSync('b-kage-scroll.html', page({
  title: '산사 스크롤 여정',
  world: `<canvas class="world" aria-label="밤의 산사 3D 월드" role="img"></canvas>
<script>${three}</script>
<script>${temple}</script>`,
  boot: KAGE_BOOT,
  extraMarkup: chapterMarkup,
  extraCss: chapterCss,
  extraBoot: scrollBoot,
}));

/* ── C. Sylva ── */
const sylvaBoot = `
<script>
(function(){
  var L = window.LabLoader(${SYLVA_MSGS});
  var TOTAL = 54; // Sylva 씬이 실제로 생성하는 THREE 객체 수 — 측정값
  var frame = document.querySelector('iframe.world');
  var settled = false;
  window.addEventListener('message', function(e){
    if (!e.data) return;
    if (e.data.sylvaProgress) L.set(8 + (e.data.sylvaProgress / TOTAL) * 86);
    if (e.data.sylvaDone && !settled) { settled = true; L.done(); }
  });
  frame.addEventListener('load', function(){ if (!settled) { settled = true; L.done(); } });
  frame.srcdoc = window.__SYLVA_DOC__;
})();
</script>`;

fs.writeFileSync('c-sylva-hero.html', page({
  title: '이끼 정원 히어로',
  world: `<iframe class="world" title="Sylva Living Green 3D 월드" sandbox="allow-scripts"></iframe>
<script>window.__SYLVA_DOC__ = ${JSON.stringify(brandDoc).replace(/<\/script/gi, "<\\/script")};</script>`,
  boot: sylvaBoot,
  extraCss: `iframe.world{pointer-events:none}`,
}));

for (const f of ['a-kage-hero.html','b-kage-scroll.html','c-sylva-hero.html']) {
  console.log(f, (fs.statSync(f).size/1024/1024).toFixed(2)+'MB');
}
