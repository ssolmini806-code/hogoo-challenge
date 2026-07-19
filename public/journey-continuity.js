(function () {
  "use strict";

  var STORAGE_KEY = "give_funnel_journey_v1";
  var DISMISS_KEY = "give_journey_bookmark_dismissed";
  var RESULT_KEY = "give_test_result";
  var CHALLENGE_DAY_KEY = "give_challenge_day";
  var CHALLENGE_START_KEY = "give_challenge_started";
  var allowedTypes = ["angel", "diplomat", "architect", "guardian", "burnout", "blocker", "mixed"];
  var pendingEvents = [];

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "gj_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function readState() {
    var state = {};
    try { state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; } catch (_) {}
    if (!state.id) state.id = makeId();
    if (!state.firstSeenAt) state.firstSeenAt = new Date().toISOString();
    if (!state.landingPath) state.landingPath = location.pathname + location.search;
    if (!state.firstReferrer && document.referrer) state.firstReferrer = document.referrer.slice(0, 500);
    var queryType = new URLSearchParams(location.search).get("type");
    var storedType = localStorage.getItem(RESULT_KEY);
    if (allowedTypes.indexOf(queryType) !== -1) state.resultType = queryType;
    else if (allowedTypes.indexOf(storedType) !== -1) state.resultType = storedType;
    state.challengeDay = Math.max(0, Math.min(7, parseInt(localStorage.getItem(CHALLENGE_DAY_KEY) || "0", 10) || 0));
    state.challengeStarted = !!localStorage.getItem(CHALLENGE_START_KEY);
    state.lastSeenAt = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    return state;
  }

  var state = readState();

  function track(name, params) {
    var payload = Object.assign({
      journey_id: state.id,
      result_type: state.resultType || "unknown",
      journey_stage: stageForPath(),
      challenge_day: state.challengeDay
    }, params || {});
    if (typeof window.trackEvent !== "function") {
      pendingEvents.push([name, payload]);
      return;
    }
    window.trackEvent(name, payload);
  }

  function stageForPath() {
    var path = location.pathname;
    if (path.indexOf("give-prologue") !== -1) return "prologue";
    if (path.indexOf("give-test") !== -1) return "give_test";
    if (path.indexOf("result-sequence") !== -1) return "give_result";
    if (path.indexOf("challenge-done") !== -1) return "challenge_complete";
    if (path.indexOf("hogoo-test") !== -1) return "free_challenge";
    if (path.indexOf("articles") !== -1) return "content";
    if (path === "/" || path.endsWith("/index.html")) return "home";
    return "site";
  }

  function paidBase() {
    var configured = window.__PAID_SITE_URL;
    return configured && !String(configured).includes("%VITE_") ? configured : "https://givecosystem.com/";
  }

  function paidUrl(product, options) {
    var opts = options || {};
    state = readState();
    var url = new URL(paidBase(), location.origin);
    url.pathname = "/start";
    url.search = "";
    url.searchParams.set("product", product || "give_id_challenge");
    url.searchParams.set("utm_source", opts.source || "hogoo_free");
    url.searchParams.set("utm_medium", opts.medium || stageForPath());
    url.searchParams.set("utm_campaign", opts.campaign || "first_path");
    if (opts.content) url.searchParams.set("utm_content", opts.content);
    url.searchParams.set("journey_id", state.id);
    if (state.resultType) url.searchParams.set("result_type", state.resultType);
    return url.toString();
  }

  function decoratePaidLink(link) {
    var product = link.dataset.product;
    var current;
    try { current = new URL(link.href, location.origin); } catch (_) { return; }
    if (!product && current.hostname !== "givecosystem.com") return;
    try {
      link.href = paidUrl(product || current.searchParams.get("product") || "give_id_challenge", {
        source: current.searchParams.get("utm_source") || "hogoo_free",
        medium: current.searchParams.get("utm_medium") || stageForPath(),
        campaign: current.searchParams.get("utm_campaign") || "first_path",
        content: current.searchParams.get("utm_content") || ""
      });
      link.dataset.journeyDecorated = "true";
    } catch (_) {}
  }

  function decorateAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('a[data-product],a[href*="givecosystem.com"]').forEach(decoratePaidLink);
  }

  function bookmarkRoute() {
    if (state.challengeDay >= 7) return {
      kicker: "YOUR PATH · COMPLETE",
      title: "7일의 길을 30일로 이어가기",
      copy: "완주 기록이 남아 있어요",
      href: "https://givecosystem.com/start?product=give_id_challenge_upgrade",
      product: "give_id_challenge_upgrade",
      progress: 100,
      kind: "challenge_upgrade"
    };
    if (state.challengeStarted || state.challengeDay > 0) return {
      kicker: "YOUR PATH · " + String(Math.max(1, state.challengeDay + 1)).padStart(2, "0"),
      title: "걷던 길에서 다시 시작하기",
      copy: state.challengeDay + "/7일의 기록이 기다리고 있어요",
      href: "/hogoo-test.html?resume=1",
      progress: Math.max(7, Math.round(state.challengeDay / 7 * 100)),
      kind: "challenge_resume"
    };
    if (state.resultType) return {
      kicker: "YOUR TYPE · SAVED",
      title: "내 결과에서 다음 길 보기",
      copy: "발견한 관계 패턴을 이어서 볼 수 있어요",
      href: "/result-sequence.html?test=give&type=" + encodeURIComponent(state.resultType) + "#next-path",
      progress: 58,
      kind: "result_resume"
    };
    return null;
  }

  function shouldShowBookmark() {
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return false;
    var path = location.pathname;
    return !/(give-prologue|give-test|result-sequence|hogoo-test|challenge-done|hogoo-check|refusal-test|relationship-risk|selfless-otherish-test)/.test(path);
  }

  function renderBookmark() {
    var route = bookmarkRoute();
    if (!route || !shouldShowBookmark() || document.querySelector(".journey-bookmark")) return;
    var aside = document.createElement("aside");
    aside.className = "journey-bookmark";
    aside.setAttribute("aria-label", "저장된 여정 이어가기");
    aside.innerHTML = '<a class="journey-bookmark-card" href="' + route.href + '">' +
      '<span class="journey-bookmark-kicker"></span><strong></strong><small></small>' +
      '<span class="journey-bookmark-arrow" aria-hidden="true">→</span>' +
      '<span class="journey-bookmark-progress" aria-hidden="true"><i></i></span></a>' +
      '<button class="journey-bookmark-dismiss" type="button" aria-label="이어가기 알림 닫기">×</button>';
    var anchor = aside.querySelector("a");
    if (route.product) anchor.dataset.product = route.product;
    aside.querySelector(".journey-bookmark-kicker").textContent = route.kicker;
    aside.querySelector("strong").textContent = route.title;
    aside.querySelector("small").textContent = route.copy;
    aside.style.setProperty("--journey-progress", route.progress + "%");
    document.body.appendChild(aside);
    decoratePaidLink(anchor);
    track("funnel_resume_prompt_view", { resume_kind: route.kind });
    anchor.addEventListener("click", function () { track("funnel_resume_prompt_click", { resume_kind: route.kind }); });
    aside.querySelector("button").addEventListener("click", function () {
      sessionStorage.setItem(DISMISS_KEY, "1");
      aside.remove();
      track("funnel_resume_prompt_dismiss", { resume_kind: route.kind });
    });
  }

  window.GiveJourney = {
    get: function () { return Object.assign({}, state); },
    refresh: function () { state = readState(); decorateAll(); },
    track: track,
    paidUrl: paidUrl,
    decoratePaidLink: decoratePaidLink
  };

  document.addEventListener("give:analytics-ready", function () {
    if (typeof window.trackEvent !== "function") return;
    pendingEvents.splice(0).forEach(function (entry) { window.trackEvent(entry[0], entry[1]); });
  });

  function init() {
    state = readState();
    decorateAll();
    renderBookmark();
    track("funnel_stage_view");
    document.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest('a[data-product],a[href*="givecosystem.com"]');
      if (!link) return;
      decoratePaidLink(link);
      track("funnel_paid_exit", { product: link.dataset.product || new URL(link.href).searchParams.get("product"), placement: link.id || link.className || "paid_link" });
    }, true);
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) { record.addedNodes.forEach(function (node) { if (node.nodeType === 1) decorateAll(node); }); });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("pagehide", function () { observer.disconnect(); }, { once: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
