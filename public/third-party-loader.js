(function () {
  var config = window.GIVE_THIRD_PARTY || {};
  var loaded = {};
  var GA_ID = 'G-P6PM6JBJH1';
  var ADS_CLIENT = 'ca-pub-8564310871125079';
  var CLARITY_ID = 'wh9qtg72q5';
  var USERBACK_TOKEN = 'A-5n1vSEp2urCeuAdUdVofAoB0M';

  function appendScript(key, src, options) {
    if (loaded[key]) return;
    loaded[key] = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = src;
    if (options && options.crossOrigin) script.crossOrigin = options.crossOrigin;
    (document.head || document.body).appendChild(script);
  }

  function onIdle(callback, timeout) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout: timeout || 2500 });
      return;
    }
    window.setTimeout(callback, timeout || 1200);
  }

  function afterLoad(callback) {
    if (document.readyState === 'complete') {
      callback();
      return;
    }
    window.addEventListener('load', callback, { once: true });
  }

  function afterInteractionOrDelay(callback, delay) {
    var done = false;
    var events = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

    function run() {
      if (done) return;
      done = true;
      events.forEach(function (eventName) {
        window.removeEventListener(eventName, run, { passive: true });
      });
      callback();
    }

    events.forEach(function (eventName) {
      window.addEventListener(eventName, run, { once: true, passive: true });
    });
    window.setTimeout(run, delay);
  }

  function loadGa() {
    appendScript('ga', 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
  }

  function loadAds() {
    appendScript(
      'ads',
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADS_CLIENT,
      { crossOrigin: 'anonymous' }
    );
  }

  function loadClarity() {
    if (loaded.clarity) return;
    loaded.clarity = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  function loadUserback() {
    window.Userback = window.Userback || {};
    window.Userback.access_token = USERBACK_TOKEN;
    appendScript('userback', 'https://static.userback.io/widget/v1.js');
  }

  function loadAddToAny() {
    appendScript('addtoany', 'https://static.addtoany.com/menu/page.js');
  }

  afterLoad(function () {
    afterInteractionOrDelay(function () {
      if (config.ga !== false) loadGa();
    }, 45000);

    afterInteractionOrDelay(function () {
      if (config.ads === true) loadAds();
    }, 60000);

    afterInteractionOrDelay(function () {
      if (config.clarity) loadClarity();
    }, 70000);

    if (config.userback) {
      afterInteractionOrDelay(loadUserback, 90000);
    }
  });

  if (config.addToAny) {
    document.addEventListener('pointerover', function (event) {
      if (event.target.closest('[data-share-action], .a2a_kit, .share-actions')) loadAddToAny();
    }, { passive: true });
    document.addEventListener('focusin', function (event) {
      if (event.target.closest('[data-share-action], .a2a_kit, .share-actions')) loadAddToAny();
    });
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-share-action], .a2a_kit, .share-actions')) loadAddToAny();
    });
  }
})();
