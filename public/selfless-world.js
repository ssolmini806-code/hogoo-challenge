(function () {
  "use strict";
  var answered = 0;
  var score = 0;

  var start = document.getElementById("startTestBtn");
  if (start) start.addEventListener("click", function () {
    answered = 0;
    score = 0;
    document.body.style.setProperty("--selfless-progress", 0);
    document.body.style.setProperty("--selfless-balance", .5);
  });

  window.addEventListener("selfless:answer", function (event) {
    answered += 1;
    score += event.detail.value;
    var balance = score / Math.max(answered * 4, 1);
    document.body.style.setProperty("--selfless-progress", answered / event.detail.total);
    document.body.style.setProperty("--selfless-balance", balance);

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var world = document.querySelector(".selfless-balance-world");
      if (world) {
        var bloom = document.createElement("i");
        bloom.className = "balance-ink-drop";
        bloom.style.setProperty("--drop-x", balance);
        world.appendChild(bloom);
        window.setTimeout(function () { bloom.remove(); }, 950);
      }
    }
  });
})();
