/*
 * 타이틀 화면 배경 셰이더 — "선의가 흐르는 방향"
 * ThreeUI Community (MIT, github.com/MengTo/threeui) 의 Stream Convergence 를
 * 프레임워크 없이 이식하고 GIVE Ecosystem 팔레트(테라코타/크림/샌드)로 다시 칠했다.
 * 대상: index.html 의 .ts-bg (기존 그라디언트 배경 위에 screen 블렌드로 얹음)
 */
(function () {
  var host = document.querySelector('.ts-bg');
  if (!host) return;

  // 모션 최소화 선호 시엔 아예 만들지 않는다 (기존 정적 배경 유지)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'ts-stream';
  canvas.setAttribute('aria-hidden', 'true');

  var gl = null;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' })
      || canvas.getContext('experimental-webgl', { alpha: true, antialias: false });
  } catch (e) { gl = null; }
  if (!gl) return; // WebGL 미지원 → 기존 배경 그대로

  var VERT = [
    'attribute vec2 position;',
    'varying vec2 vUv;',
    'void main(){ vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'uniform float u_time;',
    'uniform vec2 u_resolution;',
    'uniform float u_spread;',
    'varying vec2 vUv;',
    'mat2 rot(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a)); }',
    // GIVE 팔레트: 테라코타 / 크림 / 샌드
    'const vec3 C_TERRA = vec3(0.784, 0.373, 0.263);',
    'const vec3 C_CREAM = vec3(0.933, 0.898, 0.824);',
    'const vec3 C_SAND  = vec3(0.847, 0.812, 0.706);',
    'void main(){',
    '  vec2 p = vUv * 2.0 - 1.0;',
    '  p.x *= u_resolution.x / u_resolution.y;',
    '  p = rot(0.55) * p;',
    '  vec3 color = vec3(0.0);',
    '  for (int i = 0; i < 3; i++) {',
    '    float offset = float(1 - i) * u_spread;',
    '    float y = p.y + offset + sin(p.x * 2.5 - u_time * 1.5) * 0.12;',
    '    float wave = smoothstep(0.90, 0.999, sin(y * 9.0 + u_time * 2.0) * 0.5 + 0.5);',
    '    if (i == 0) color += wave * C_TERRA * 1.15;',
    '    if (i == 1) color += wave * C_CREAM * 0.42;',
    '    if (i == 2) color += wave * C_SAND  * 0.55;',
    '  }',
    // 중앙(=본문 텍스트 자리)으로 갈수록 어둡게 → 한글 가독성 보호
    '  float d = length(vUv * 2.0 - 1.0);',
    '  color *= exp(-d * 0.8) * smoothstep(0.15, 0.95, d);',
    '  gl_FragColor = vec4(color, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { gl.deleteShader(sh); return null; }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  var position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  var uTime = gl.getUniformLocation(program, 'u_time');
  var uResolution = gl.getUniformLocation(program, 'u_resolution');
  var uSpread = gl.getUniformLocation(program, 'u_spread');

  host.appendChild(canvas);

  var frame = 0;
  var visible = true;

  function resize() {
    var w = host.clientWidth || window.innerWidth;
    var h = host.clientHeight || window.innerHeight;
    // 모바일은 DPR 1.5로 캡 (풀 DPR 풀스크린 셰이더는 발열/배터리 부담)
    var cap = w < 768 ? 1.5 : 2;
    var dpr = Math.min(window.devicePixelRatio || 1, cap);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uSpread, w < 768 ? 0.075 : 0.06);
  }

  function render(now) {
    gl.uniform1f(uTime, now * 0.0003);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    frame = visible && !document.hidden ? requestAnimationFrame(render) : 0;
  }

  function start() { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render); }
  function stop() { if (frame) { cancelAnimationFrame(frame); frame = 0; } }

  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(resize).observe(host);
  } else {
    window.addEventListener('resize', resize);
  }

  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(function (entries) {
      visible = entries[0] ? entries[0].isIntersecting : true;
      if (visible) start(); else stop();
    }).observe(host);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  resize();
  start();
})();
