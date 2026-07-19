(function () {
  "use strict";

  var answered = 0;
  var pressure = 0;

  function setWorldState(detail) {
    answered += 1;
    pressure += detail.value;
    var maxPressure = Math.max(answered * 3, 1);
    var relativePressure = pressure / maxPressure;
    var root = document.body;
    root.style.setProperty("--hogoo-progress", answered / detail.total);
    root.style.setProperty("--hogoo-pressure", relativePressure);
    root.classList.remove("hogoo-answer-pulse");
    void root.offsetWidth;
    root.classList.add("hogoo-answer-pulse");
  }

  window.addEventListener("hogoo:answer", function (event) {
    setWorldState(event.detail);
  });

  document.addEventListener("animationend", function (event) {
    if (event.animationName === "hogooInkPulse") {
      document.body.classList.remove("hogoo-answer-pulse");
    }
  });
})();
