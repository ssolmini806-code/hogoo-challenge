(function () {
  "use strict";
  var words = ["멈춤", "생각", "범위", "기준"];
  var count = 0;

  window.addEventListener("refusal:answer", function (event) {
    var world = document.getElementById("refusalPrintWorld");
    if (!world) return;
    count += 1;
    document.body.style.setProperty("--refusal-progress", count / event.detail.total);
    var stamp = document.createElement("span");
    stamp.className = "refusal-imprint";
    stamp.textContent = words[event.detail.answerIndex] || "기준";
    stamp.style.setProperty("--stamp-x", (54 + (count * 17 % 37)) + "%");
    stamp.style.setProperty("--stamp-y", (16 + (count * 23 % 65)) + "%");
    stamp.style.setProperty("--stamp-turn", ((count % 5) - 2) * 1.4 + "deg");
    world.appendChild(stamp);
    while (world.children.length > 6) world.firstElementChild.remove();
  });
})();
