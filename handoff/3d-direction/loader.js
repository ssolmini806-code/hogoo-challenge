/* 진행률은 실측 기반이다.
   Kage: 월드 구축 중 생성되는 THREE 객체 수를 실제로 세어 보정치(328개, 이 환경에서 실측)로 나눈다.
   Sylva: iframe 안에서 같은 방식으로 센 값을 postMessage로 받는다(보정치 54개, 실측).
   시간 기반으로 흉내낸 수치가 아니다. */
window.LabLoader = function (messages) {
  var pctEl = document.querySelector('.loader-pct b');
  var fillEl = document.querySelector('.loader-fill');
  var msgEl = document.querySelector('.loader-msg');
  var shown = 0, i = 0;

  var rotate = setInterval(function () {
    i = (i + 1) % messages.length;
    msgEl.style.opacity = 0;
    setTimeout(function () { msgEl.textContent = messages[i]; msgEl.style.opacity = 1; }, 220);
  }, 2100);
  msgEl.textContent = messages[0];
  msgEl.style.transition = 'opacity .22s ease';

  function set(p) {
    p = Math.max(0, Math.min(100, Math.round(p)));
    if (p <= shown) return;           // 뒤로 가지 않는다
    shown = p;
    pctEl.textContent = p;
    fillEl.style.width = p + '%';
  }

  return {
    set: set,
    done: function () {
      clearInterval(rotate);
      set(100);
      setTimeout(function () { document.body.classList.add('ready'); }, 340);
    },
    fail: function (why) {
      clearInterval(rotate);
      msgEl.textContent = why;
      msgEl.style.color = '#c85f43';
    }
  };
};

/* THREE 생성자를 감싸 실제 생성 횟수를 센다 */
window.countThree = function (onTick) {
  var n = 0;
  ['Mesh','InstancedMesh','Points','LineSegments','BufferGeometry','ShaderMaterial','MeshStandardMaterial','MeshBasicMaterial'].forEach(function (k) {
    var O = window.THREE[k];
    if (!O) return;
    function W() { n++; onTick(n); return new (O.bind.apply(O, [null].concat([].slice.call(arguments)))); }
    W.prototype = O.prototype;
    window.THREE[k] = W;
  });
  return function () { return n; };
};
