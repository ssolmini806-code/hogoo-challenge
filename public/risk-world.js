(function () {
  "use strict";

  var answered = 0;
  var strainTotal = 0;

  window.addEventListener("risk:answer", function (event) {
    answered += 1;
    strainTotal += event.detail.value;
    var progress = answered / event.detail.total;
    var strain = strainTotal / Math.max(answered * 3, 1);
    document.body.style.setProperty("--hogoo-progress", progress);
    document.body.style.setProperty("--risk-strain", strain);
    document.body.classList.toggle("risk-is-recovering", event.detail.value <= 1);
    window.setTimeout(function () {
      document.body.classList.remove("risk-is-recovering");
    }, 720);
  });
})();
