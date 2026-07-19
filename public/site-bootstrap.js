(function () {
  var currentScript = document.currentScript;
  var thirdParty = {};
  var thirdPartyList = currentScript && currentScript.dataset.thirdParty
    ? currentScript.dataset.thirdParty.split(',')
    : [];

  thirdPartyList.forEach(function (key) {
    var normalized = key.trim();
    if (normalized) thirdParty[normalized] = true;
  });

  window.GIVE_THIRD_PARTY = thirdParty;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', 'G-P6PM6JBJH1', {
    allow_linker: true,
    linker: { domains: ['hogoo-challenge.pages.dev', 'givecosystem.com'] }
  });

  function journeyStage() {
    var path = window.location.pathname;
    if (path.indexOf('give-prologue') !== -1) return 'prologue';
    if (path.indexOf('give-test') !== -1) return 'give_test';
    if (path.indexOf('result-sequence') !== -1) return 'give_result';
    if (path.indexOf('challenge-done') !== -1) return 'challenge_complete';
    if (path.indexOf('hogoo-test') !== -1) return 'free_challenge';
    if (path.indexOf('articles') !== -1) return 'content';
    if (path === '/' || path.endsWith('/index.html')) return 'home';
    return 'site';
  }

  function analyticsContext() {
    var state = {};
    try { state = JSON.parse(localStorage.getItem('give_funnel_journey_v1') || '{}') || {}; } catch (_) {}
    if (!state.id) {
      state.id = window.crypto && typeof window.crypto.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : 'gj_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      state.firstSeenAt = state.firstSeenAt || new Date().toISOString();
      state.landingPath = state.landingPath || window.location.pathname + window.location.search;
      try { localStorage.setItem('give_funnel_journey_v1', JSON.stringify(state)); } catch (_) {}
    }
    var resultType = state.resultType;
    try { resultType = resultType || localStorage.getItem('give_test_result'); } catch (_) {}
    var challengeDay = 0;
    try { challengeDay = Math.max(0, Math.min(7, parseInt(localStorage.getItem('give_challenge_day') || '0', 10) || 0)); } catch (_) {}
    return {
      journey_id: state.id,
      result_type: resultType || 'unknown',
      journey_stage: journeyStage(),
      challenge_day: challengeDay
    };
  }

  window.trackEvent = function (name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, Object.assign(analyticsContext(), params || {}));
    }
  };
  window.trackEvent.__giveContextual = true;
  window.GiveAnalytics = { context: analyticsContext, stage: journeyStage };
  document.dispatchEvent(new CustomEvent('give:analytics-ready'));

  window.addEventListener('load', function () {
    document.querySelectorAll('link[data-defer-style]').forEach(function (link) {
      link.rel = 'stylesheet';
      link.removeAttribute('as');
      link.removeAttribute('data-defer-style');
    });
  }, { once: true });

  if (!document.querySelector('link[href="/journey-continuity.css"]')) {
    var journeyStyle = document.createElement('link');
    journeyStyle.rel = 'stylesheet';
    journeyStyle.href = '/journey-continuity.css';
    document.head.appendChild(journeyStyle);
  }
  if (!document.querySelector('script[src="/journey-continuity.js"]')) {
    var journeyScript = document.createElement('script');
    journeyScript.src = '/journey-continuity.js';
    journeyScript.defer = true;
    document.head.appendChild(journeyScript);
  }
})();
