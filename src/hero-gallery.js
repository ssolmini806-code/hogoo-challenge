/*
 * 타이틀 화면 3D 갤러리 타워 — GIVE ID 유형 7종
 * ThreeUI Community(MIT, github.com/MengTo/threeui) 의 Gallery 컴포넌트를
 * React 없이 이식하고, 이미지 소스를 우리 GIVE ID 마스코트로 교체했다.
 * 원본은 three r149 API(sRGBEncoding/outputEncoding)를 쓰므로 r155+ 컬러스페이스 API로 옮겼다.
 */

const MASCOTS = [
  'type-angel',
  'type-diplomat',
  'type-gatekeeper',
  'type-awakening',
  'type-hamster',
  'type-hedgehog',
  'type-balancer',
];

const PANEL_COUNT = 14;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function mount() {
  const host = document.querySelector('.ts-bg');
  if (!host) return;

  // WebGL 미지원이면 기존 2D 마스코트 레이어를 그대로 둔다
  try {
    const probe = document.createElement('canvas');
    if (!probe.getContext('webgl2') && !probe.getContext('webgl')) return;
  } catch (e) { return; }

  const THREE = await import('three');

  const canvas = document.createElement('canvas');
  canvas.className = 'ts-gallery';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 18;

  const tower = new THREE.Group();
  scene.add(tower);

  // 원통 한 조각(약 72°)을 패널로 써서, 이미지가 원통 표면을 따라 휘어 붙는다
  const geometry = new THREE.CylinderGeometry(1.9, 1.9, 1.0, 48, 1, true, 0, Math.PI * 0.34);
  const loader = new THREE.TextureLoader();

  const textures = MASCOTS.map((name) => {
    const texture = loader.load(`/images/types/give-id/${name}.webp`, () => {
      renderer.render(scene, camera);
      host.classList.add('has-gallery'); // 로드 완료 후에만 2D 마스코트를 숨긴다
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return texture;
  });

  const materials = [];
  for (let i = 0; i < PANEL_COUNT; i++) {
    const material = new THREE.MeshBasicMaterial({
      map: textures[i % textures.length],
      opacity: 0.9,
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: true,
    });
    materials.push(material);
    const panel = new THREE.Mesh(geometry, material);
    panel.position.y = (i - PANEL_COUNT / 2) * 1.3;
    panel.rotation.y = (i / PANEL_COUNT) * Math.PI * 4; // 나선으로 감기게
    tower.add(panel);
  }

  let frame = 0;
  let elapsed = 0;
  let previousTime = 0;
  let hostVisible = true;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render(time = performance.now()) {
    if (previousTime) elapsed += Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    tower.rotation.y = elapsed * 0.18;
    tower.position.y = Math.sin(elapsed * 0.5) * 1.5;
    renderer.render(scene, camera);
  }

  function tick(time) {
    if (!hostVisible || document.hidden) { frame = 0; previousTime = 0; return; }
    render(time);
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (reducedMotion) { render(0); return; }
    if (!frame && hostVisible && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }

  function resize() {
    const width = Math.max(1, host.clientWidth || window.innerWidth);
    const height = Math.max(1, host.clientHeight || window.innerHeight);
    // 모바일은 DPR 1.5 캡 (풀스크린 3D는 발열/배터리 부담)
    renderer.setPixelRatio(clamp(window.devicePixelRatio || 1, 1, width < 768 ? 1.5 : 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const narrow = width < 768;
    // 좁은 화면에서는 뒤로 물리고 오른쪽으로 비켜서 본문 위를 피한다
    camera.position.z = narrow ? 19 : 12;
    tower.position.x = narrow ? 3.1 : -0.7;
    camera.updateProjectionMatrix();
    render();
  }

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry]) => {
    hostVisible = entry ? entry.isIntersecting : true;
    if (hostVisible) start(); else stop();
  }).observe(host);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });

  resize();
  start();
}

// LCP를 건드리지 않도록 유휴 시점에 three 청크를 불러온다
const boot = () => { mount().catch(() => {}); };
if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 2000 });
else setTimeout(boot, 600);
