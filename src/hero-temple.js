/*
 * 타이틀 화면 3D 월드 — Kage Temple Night
 * ThreeUI Community(MIT, github.com/MengTo/threeui)의 temple-night 렌더러를
 * React 없이 index.html의 .ts-bg 위에 마운트한다.
 * 절차적 생성이라 외부 씬 에셋은 0개. three r149 기준 렌더러.
 */
async function mount() {
  const host = document.querySelector('.ts-bg');
  if (!host) return;

  try {
    const probe = document.createElement('canvas');
    if (!probe.getContext('webgl2') && !probe.getContext('webgl')) return;
  } catch (e) { return; }

  const canvas = document.createElement('canvas');
  canvas.className = 'ts-temple';
  canvas.setAttribute('aria-label', '밤의 산사 3D 배경');
  canvas.setAttribute('role', 'img');
  host.appendChild(canvas);

  let renderer;
  try {
    const mod = await import('./vendor/temple-night-renderer.js');
    renderer = mod.createTempleNightRenderer(canvas);
  } catch (e) {
    canvas.remove(); // 실패하면 기존 2D 배경을 그대로 둔다
    return;
  }
  if (!renderer) { canvas.remove(); return; }

  let frame = 0;
  let visible = true;
  let rendered = false;

  const schedule = () => {
    if (visible && !document.hidden && !frame) frame = requestAnimationFrame(render);
  };

  function render(time) {
    frame = 0;
    renderer.render(time);
    if (!rendered) {
      rendered = true;
      host.classList.add('has-temple'); // 첫 프레임이 나온 뒤에만 페이드인
    }
    if (!renderer.reducedMotion) schedule();
  }

  const resize = () => { renderer.resize(); schedule(); };

  const setPointer = (event) => {
    const b = canvas.getBoundingClientRect();
    renderer.setPointer(
      ((event.clientX - b.left) / Math.max(1, b.width)) * 2 - 1,
      1 - ((event.clientY - b.top) / Math.max(1, b.height)) * 2,
      true
    );
    schedule();
  };
  const clearPointer = () => { renderer.setPointer(0, 0, false); schedule(); };

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry]) => {
    visible = entry ? entry.isIntersecting : true;
    if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; } else schedule();
  }).observe(host);

  // 포인터 패럴랙스 — .ts-bg는 pointer-events:none이라 문서 단위로 받는다
  document.addEventListener('pointermove', setPointer, { passive: true });
  window.addEventListener('blur', clearPointer);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; } else schedule();
  });

  resize();
}

const boot = () => { mount().catch(() => {}); };
if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 2000 });
else setTimeout(boot, 600);
