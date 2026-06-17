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
  window.gtag('config', 'G-P6PM6JBJH1');
  window.trackEvent = window.trackEvent || function (name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  };

  window.addEventListener('load', function () {
    document.querySelectorAll('link[data-defer-style]').forEach(function (link) {
      link.rel = 'stylesheet';
      link.removeAttribute('as');
      link.removeAttribute('data-defer-style');
    });
  }, { once: true });
})();
