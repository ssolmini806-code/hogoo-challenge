(function () {
  "use strict";

  function initResultWorld() {
    var root = document.body;
    if (!root.className.match(/sequence-test-(give|hogoo|relationship|refusal|selfless)/)) return;

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    var targetX = 0;
    var targetY = 0;
    var currentX = 0;
    var currentY = 0;
    var frame = 0;

    function paintDepth() {
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;
      root.style.setProperty("--result-parallax-x", (currentX * -7).toFixed(2) + "px");
      root.style.setProperty("--result-parallax-y", (currentY * -5).toFixed(2) + "px");
      root.style.setProperty("--result-light-x", (78 + currentX * 8).toFixed(2) + "%");
      root.style.setProperty("--result-light-y", (36 + currentY * 7).toFixed(2) + "%");
      frame = window.requestAnimationFrame(paintDepth);
    }

    window.addEventListener("pointermove", function (event) {
      if (event.pointerType === "touch") return;
      targetX = event.clientX / window.innerWidth * 2 - 1;
      targetY = event.clientY / window.innerHeight * 2 - 1;
    }, { passive: true });

    window.addEventListener("pointerleave", function () {
      targetX = 0;
      targetY = 0;
    });

    document.addEventListener("pointerdown", function (event) {
      if (event.target.closest("a, button")) return;
      var bloom = document.createElement("span");
      bloom.className = "result-ink-bloom";
      bloom.setAttribute("aria-hidden", "true");
      bloom.style.left = event.clientX + "px";
      bloom.style.top = event.clientY + "px";
      document.body.appendChild(bloom);
      bloom.addEventListener("animationend", function () { bloom.remove(); }, { once: true });
    }, { passive: true });

    frame = window.requestAnimationFrame(paintDepth);
    window.addEventListener("pagehide", function () {
      window.cancelAnimationFrame(frame);
    }, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResultWorld, { once: true });
  } else {
    initResultWorld();
  }
})();
