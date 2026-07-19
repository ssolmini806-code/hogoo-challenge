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
  window.trackEvent = window.trackEvent || function (name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  };
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
