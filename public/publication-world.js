(function () {
  "use strict";

  var body = document.body;
  if (!body || !body.classList.contains("publication-page")) return;
  var isHub = body.classList.contains("article-hub-page");

  var rail = document.createElement("aside");
  rail.className = "publication-progress";
  rail.setAttribute("aria-hidden", "true");
  var railLabel = document.createElement("span");
  railLabel.textContent = isHub ? "ARCHIVE · 10" : "COVER";
  rail.appendChild(railLabel);
  body.appendChild(rail);

  var chapters = [];
  if (!isHub) {
    chapters = Array.from(document.querySelectorAll(
      ".article-body>h2,article>.article-content>h2,article.article-content>h2"
    )).filter(function (heading) {
      return !heading.closest(".evidence-note,.reference-list,.white-psychology-bridge,.related-articles");
    });
    chapters.forEach(function (heading, index) {
      heading.dataset.chapter = "CHAPTER " + String(index + 1).padStart(2, "0");
    });
  }

  var frame = 0;
  function updateProgress() {
    frame = 0;
    var max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    var progress = Math.min(1, Math.max(0, window.scrollY / max));
    body.style.setProperty("--pub-progress", progress.toFixed(4));
    if (!isHub && chapters.length) {
      var marker = window.scrollY + window.innerHeight * .36;
      var current = chapters[0];
      chapters.forEach(function (heading) {
        var documentTop = heading.getBoundingClientRect().top + window.scrollY;
        if (documentTop <= marker) current = heading;
      });
      railLabel.textContent = current.dataset.chapter || "COVER";
    }
  }
  function requestProgress() {
    if (frame) return;
    frame = window.requestAnimationFrame(updateProgress);
  }
  updateProgress();
  window.addEventListener("scroll", requestProgress, { passive: true });
  window.addEventListener("resize", requestProgress, { passive: true });

  function track(name, params) {
    if (typeof window.trackEvent === "function") window.trackEvent(name, Object.assign({
      publication: isHub ? "hub" : "article",
      path: window.location.pathname
    }, params || {}));
  }
  track("publication_view");

  // 유료(givecosystem) 진입 배너를 칼럼 본문에 주입한다. 검색 유입 방문자가 유료 제품을
  // 인지하도록 본문 중간 1회 + 본문 끝에 배치. utm_campaign은 반드시 give_id_content
  // (give_id_diagnosis는 무료 완주자용 연결 화면을 띄우므로 칼럼 방문자에게 쓰면 안 됨).
  if (!isHub) injectPaidEntry();
  function buildPaidEntry(variant) {
    var el = document.createElement("aside");
    el.className = "paid-entry" + (variant === "mid" ? " is-mid" : "");
    el.setAttribute("aria-label", "GIVE ID 심화 안내");
    el.innerHTML =
      '<p class="paid-entry-kicker">GIVE ID · 심화</p>' +
      '<p class="paid-entry-title">지금 글이 신호를 짚었다면, 반복되는 이유까지</p>' +
      '<p class="paid-entry-copy">심화 리포트는 이 패턴이 반복되는 관계, 바로 쓸 수 있는 경계 문장, 30일 회복 루틴까지 정리해요. 64문항 자가점검은 결제 없이 시작할 수 있어요.</p>' +
      '<a class="paid-entry-btn" href="https://givecosystem.com/?utm_source=hogoo_free&utm_medium=article&utm_campaign=give_id_content" target="_blank" rel="noopener noreferrer" data-no-paid-decorate="true">GIVE ID 심화 살펴보기 <span aria-hidden="true">&rarr;</span></a>';
    return el;
  }
  function injectPaidEntry() {
    var container = document.querySelector(".article-body,article .article-content,article.article-content");
    if (!container) return;
    var tail = document.querySelector(".related-articles,.white-psychology-bridge,.reference-list");
    if (tail && tail.parentNode) tail.parentNode.insertBefore(buildPaidEntry("end"), tail);
    else container.appendChild(buildPaidEntry("end"));
    // 중간 1회: 본문 중간 챕터(h2) 앞에 배치 — 문단 중첩 구조에도 안정적으로 동작
    if (chapters.length >= 3) {
      var midHeading = chapters[Math.floor(chapters.length / 2)];
      if (midHeading && midHeading.parentNode) midHeading.parentNode.insertBefore(buildPaidEntry("mid"), midHeading);
    }
  }

  document.querySelectorAll('a[href*="give-test"],a[href*="hogoo-test"],a[href*="givecosystem.com"]').forEach(function (link) {
    link.addEventListener("click", function () {
      track("publication_cta_click", {
        destination: link.getAttribute("href"),
        label: (link.textContent || "").trim().slice(0, 80)
      });
    });
  });
})();
