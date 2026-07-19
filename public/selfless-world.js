(function () {
  "use strict";
  var answered = 0;
  var score = 0;

  window.addEventListener("selfless:answer", function (event) {
    answered += 1;
    score += event.detail.value;
    var balance = score / Math.max(answered * 4, 1);
    document.body.style.setProperty("--selfless-progress", answered / event.detail.total);
    document.body.style.setProperty("--selfless-balance", balance);
  });
})();
