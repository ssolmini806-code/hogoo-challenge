(function () {
  "use strict";
  var body = document.body;
  if (!body || !body.classList.contains("utility-world")) return;

  var main = document.querySelector("main");
  var labelSource = main && main.dataset.folio;
  if (!labelSource) {
    var folioNode = document.querySelector("[data-folio]");
    labelSource = folioNode && folioNode.dataset.folio;
  }

  if (!body.classList.contains("utility-error")) {
    var rail = document.createElement("aside");
    rail.className = "utility-reading-rail";
    rail.setAttribute("aria-hidden", "true");
    var railLabel = document.createElement("span");
    railLabel.textContent = labelSource || "GIVE · NOTE";
    rail.appendChild(railLabel);
    body.appendChild(rail);
  }

  var frame = 0;
  function updateProgress() {
    frame = 0;
    var max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    var progress = Math.min(1, Math.max(0, window.scrollY / max));
    body.style.setProperty("--utility-progress", progress.toFixed(4));
  }
  function requestProgress() {
    if (frame) return;
    frame = window.requestAnimationFrame(updateProgress);
  }
  updateProgress();
  window.addEventListener("scroll", requestProgress, { passive: true });
  window.addEventListener("resize", requestProgress, { passive: true });

  if (typeof window.trackEvent === "function") {
    window.trackEvent("utility_page_view", { path: window.location.pathname });
  }
})();
