(function () {
  "use strict";

  var body = document.body;
  if (!body || !body.classList.contains("trust-page")) return;

  var pageKey = body.classList.contains("reviews-page") ? "reviews" :
    body.classList.contains("about-page") ? "about" : "white_psychology";
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var progress = document.createElement("aside");
  progress.className = "editorial-progress";
  progress.setAttribute("aria-hidden", "true");
  var progressLabel = document.createElement("span");
  progressLabel.textContent = "READING PATH";
  progress.appendChild(progressLabel);
  body.appendChild(progress);

  var folioTargets = body.classList.contains("reviews-page")
    ? document.querySelectorAll(".review-info,.related-block")
    : body.classList.contains("about-page")
      ? document.querySelectorAll("main>h2")
      : document.querySelectorAll(".block");
  folioTargets.forEach(function (node, index) {
    var folio = index + (body.classList.contains("about-page") ? 2 : 1);
    node.dataset.folio = String(folio).padStart(2, "0");
  });

  var sectionSelector = body.classList.contains("reviews-page")
    ? ".review-hero,.review-grid,.review-cta,.review-info,.related-block"
    : body.classList.contains("about-page")
      ? "main>h1,main>.lead,.highlight-box,.stats-row,main>h2,.value-grid,.research-box,.team-grid,.faq-section,.cta-box"
      : ".theory-hero,.block";
  var sections = Array.from(document.querySelectorAll(sectionSelector));
  sections.forEach(function (node) { node.setAttribute("data-editorial-section", ""); });

  var observer = null;
  if (!reducedMotion && "IntersectionObserver" in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-seen");
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: "0px 0px -7% 0px" });
    sections.forEach(function (node) { observer.observe(node); });
  } else {
    sections.forEach(function (node) { node.classList.add("is-seen"); });
  }
  body.classList.add("trust-ready");

  var frame = 0;
  function updateReadingPath() {
    frame = 0;
    var max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    var value = Math.min(1, Math.max(0, window.scrollY / max));
    body.style.setProperty("--read-progress", value.toFixed(4));
  }
  function requestReadingPath() {
    if (frame) return;
    frame = window.requestAnimationFrame(updateReadingPath);
  }
  updateReadingPath();
  window.addEventListener("scroll", requestReadingPath, { passive: true });
  window.addEventListener("resize", requestReadingPath, { passive: true });

  function track(name, params) {
    if (typeof window.trackEvent === "function") window.trackEvent(name, Object.assign({ page: pageKey }, params || {}));
  }
  track("trust_editorial_view");
  document.querySelectorAll('a[href*="give-test"],a[href*="hogoo-test"]').forEach(function (link) {
    link.addEventListener("click", function () {
      track("trust_editorial_cta_click", {
        destination: link.getAttribute("href"),
        label: (link.textContent || "").trim().slice(0, 80)
      });
    });
  });
})();
