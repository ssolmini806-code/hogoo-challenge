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
  document.querySelectorAll('a[href*="give-test"],a[href*="hogoo-test"],a[href*="givecosystem.com"]').forEach(function (link) {
    link.addEventListener("click", function () {
      track("publication_cta_click", {
        destination: link.getAttribute("href"),
        label: (link.textContent || "").trim().slice(0, 80)
      });
    });
  });
})();
