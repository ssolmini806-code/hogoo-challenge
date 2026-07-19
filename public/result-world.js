(function () {
  "use strict";

  var TEST_CLASS = /sequence-test-(give|hogoo|relationship|refusal|selfless)/;

  function initResultWorld() {
    var root = document.body;
    if (!TEST_CLASS.test(root.className)) return;

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var disposers = [];

    function listen(target, name, handler, options) {
      target.addEventListener(name, handler, options);
      disposers.push(function () { target.removeEventListener(name, handler, options); });
    }

    function initLivingThread() {
      var atmosphere = document.querySelector(".result-atmosphere");
      var path = atmosphere && atmosphere.querySelector("path");
      var orb = atmosphere && atmosphere.querySelector(".result-thread-orb");
      var slides = Array.from(document.querySelectorAll(".sequence-slide"));
      if (!path || !orb || !slides.length) return;

      function moveOrb(detail) {
        var index = detail && Number.isFinite(detail.index)
          ? detail.index
          : Math.max(0, slides.findIndex(function (slide) { return slide.classList.contains("active"); }));
        var total = detail && detail.total ? detail.total : slides.length;
        var progress = total > 1 ? index / (total - 1) : 1;
        var point = path.getPointAtLength(path.getTotalLength() * progress);
        orb.style.transform = "translate(" + point.x.toFixed(2) + "px," + (point.y - 115).toFixed(2) + "px)";
      }

      listen(document, "result:slidechange", function (event) { moveOrb(event.detail); });
      moveOrb();
    }

    function initParallax() {
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

      listen(window, "pointermove", function (event) {
        if (event.pointerType === "touch") return;
        targetX = event.clientX / window.innerWidth * 2 - 1;
        targetY = event.clientY / window.innerHeight * 2 - 1;
      }, { passive: true });
      listen(window, "pointerleave", function () { targetX = 0; targetY = 0; });
      frame = window.requestAnimationFrame(paintDepth);
      disposers.push(function () { window.cancelAnimationFrame(frame); });
    }

    function initInkBloom() {
      if (reducedMotion.matches) return;
      listen(document, "pointerdown", function (event) {
        if (event.target.closest("a,button,.result-reveal-canvas,.sequence-risk-keyword")) return;
        var bloom = document.createElement("span");
        bloom.className = "result-ink-bloom";
        bloom.setAttribute("aria-hidden", "true");
        bloom.style.left = event.clientX + "px";
        bloom.style.top = event.clientY + "px";
        document.body.appendChild(bloom);
        bloom.addEventListener("animationend", function () { bloom.remove(); }, { once: true });
      }, { passive: true });
    }

    function initWatercolorDiscovery() {
      var poster = document.querySelector(".sequence-poster");
      var figure = poster && poster.querySelector(".sequence-poster-character");
      var canvas = figure && figure.querySelector(".result-reveal-canvas");
      var image = figure && figure.querySelector("#seqCharacter");
      if (!poster || !figure || !canvas || !image) return;

      if (reducedMotion.matches) {
        poster.classList.add("is-discovered");
        canvas.tabIndex = -1;
        return;
      }

      var context = canvas.getContext("2d");
      if (!context) return;
      var drawing = false;
      var lastPoint = null;
      var visited = new Set();
      var preparedWidth = 0;
      var preparedHeight = 0;
      var waterBrush = document.createElement("span");
      waterBrush.className = "result-water-brush";
      waterBrush.setAttribute("aria-hidden", "true");
      document.body.appendChild(waterBrush);
      disposers.push(function () { waterBrush.remove(); });

      function prepareVeil(force) {
        var rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height || poster.classList.contains("is-discovered")) return;
        if (!force && Math.abs(rect.width - preparedWidth) < 1 && Math.abs(rect.height - preparedHeight) < 1) return;
        preparedWidth = rect.width;
        preparedHeight = rect.height;
        var ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(rect.width * ratio);
        canvas.height = Math.round(rect.height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, rect.width, rect.height);

        var wash = context.createLinearGradient(0, 0, rect.width, rect.height);
        wash.addColorStop(0, "rgba(238,230,210,.2)");
        wash.addColorStop(.42, "rgba(216,207,180,.58)");
        wash.addColorStop(1, "rgba(63,48,32,.16)");
        context.fillStyle = wash;
        context.fillRect(0, 0, rect.width, rect.height);

        for (var i = 0; i < 18; i += 1) {
          var x = rect.width * (.08 + ((i * 37) % 83) / 100);
          var y = rect.height * (.06 + ((i * 53) % 88) / 100);
          var radius = Math.max(28, Math.min(rect.width, rect.height) * (.08 + (i % 4) * .024));
          var stain = context.createRadialGradient(x, y, 0, x, y, radius);
          stain.addColorStop(0, i % 3 === 0 ? "rgba(63,48,32,.13)" : "rgba(238,230,210,.3)");
          stain.addColorStop(1, "rgba(238,230,210,0)");
          context.fillStyle = stain;
          context.beginPath();
          context.ellipse(x, y, radius, radius * (.72 + (i % 3) * .1), (i % 5) * .18, 0, Math.PI * 2);
          context.fill();
        }
      }

      function revealAt(x, y) {
        var rect = canvas.getBoundingClientRect();
        var radius = Math.max(38, Math.min(88, rect.width * .115));
        context.save();
        context.globalCompositeOperation = "destination-out";
        var brush = context.createRadialGradient(x, y, 0, x, y, radius);
        brush.addColorStop(0, "rgba(0,0,0,1)");
        brush.addColorStop(.6, "rgba(0,0,0,.78)");
        brush.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = brush;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.restore();

        var column = Math.max(0, Math.min(5, Math.floor(x / rect.width * 6)));
        var row = Math.max(0, Math.min(4, Math.floor(y / rect.height * 5)));
        visited.add(column + ":" + row);
        if (visited.size >= 10) completeDiscovery();
      }

      function paintTo(point) {
        if (!lastPoint) {
          revealAt(point.x, point.y);
          lastPoint = point;
          return;
        }
        var distance = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
        var steps = Math.max(1, Math.ceil(distance / 18));
        for (var i = 1; i <= steps; i += 1) {
          revealAt(lastPoint.x + (point.x - lastPoint.x) * i / steps, lastPoint.y + (point.y - lastPoint.y) * i / steps);
        }
        lastPoint = point;
      }

      function localPoint(event) {
        var rect = canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top, rect: rect };
      }

      function respondToPoint(point) {
        var nx = point.x / point.rect.width * 2 - 1;
        var ny = point.y / point.rect.height * 2 - 1;
        poster.style.setProperty("--result-character-x", (nx * 5).toFixed(2) + "px");
        poster.style.setProperty("--result-character-y", (ny * 3).toFixed(2) + "px");
        poster.style.setProperty("--result-character-rotate", (nx * .55).toFixed(2) + "deg");
      }

      function moveWaterBrush(event) {
        waterBrush.style.left = event.clientX + "px";
        waterBrush.style.top = event.clientY + "px";
      }

      function resetCharacter() {
        poster.style.setProperty("--result-character-x", "0px");
        poster.style.setProperty("--result-character-y", "0px");
        poster.style.setProperty("--result-character-rotate", "0deg");
      }

      function completeDiscovery() {
        if (poster.classList.contains("is-discovered")) return;
        drawing = false;
        poster.classList.add("is-discovered");
        canvas.tabIndex = -1;
        canvas.setAttribute("aria-label", "수채화 색 발견 완료");
        waterBrush.classList.remove("is-on");
        resetCharacter();
        window.setTimeout(function () { context.clearRect(0, 0, canvas.width, canvas.height); }, 700);
      }

      function begin(event) {
        if (!poster.classList.contains("active") || !poster.classList.contains("is-developed")) return;
        event.preventDefault();
        event.stopPropagation();
        prepareVeil(false);
        drawing = true;
        lastPoint = null;
        canvas.setPointerCapture(event.pointerId);
        var point = localPoint(event);
        moveWaterBrush(event);
        waterBrush.classList.add("is-on");
        respondToPoint(point);
        paintTo(point);
      }

      function move(event) {
        if (!poster.classList.contains("active")) return;
        var point = localPoint(event);
        moveWaterBrush(event);
        respondToPoint(point);
        if (!drawing) return;
        event.preventDefault();
        event.stopPropagation();
        paintTo(point);
      }

      function end(event) {
        if (!drawing) return;
        event.preventDefault();
        event.stopPropagation();
        drawing = false;
        lastPoint = null;
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        waterBrush.classList.remove("is-on");
        resetCharacter();
      }

      listen(canvas, "pointerdown", begin);
      listen(canvas, "pointermove", move);
      listen(canvas, "pointerup", end);
      listen(canvas, "pointercancel", end);
      listen(canvas, "pointerleave", function () { if (!drawing) resetCharacter(); });
      listen(canvas, "click", function (event) { event.preventDefault(); event.stopPropagation(); });
      listen(canvas, "touchstart", function (event) { event.stopPropagation(); }, { passive: true });
      listen(canvas, "touchend", function (event) { event.stopPropagation(); }, { passive: true });
      listen(canvas, "keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        completeDiscovery();
      });
      listen(window, "resize", function () { prepareVeil(true); });
      listen(document, "result:slidechange", function (event) {
        if (!event.detail.slide.hasAttribute("data-sequence-poster")) {
          drawing = false;
          resetCharacter();
          return;
        }
        window.requestAnimationFrame(function () { prepareVeil(false); });
      });

      var posterObserver = new MutationObserver(function () {
        if (poster.classList.contains("active") && poster.classList.contains("is-developed")) prepareVeil(false);
      });
      posterObserver.observe(poster, { attributes: true, attributeFilter: ["class"] });
      disposers.push(function () { posterObserver.disconnect(); });
      if (image.complete) prepareVeil(false);
      else listen(image, "load", function () { prepareVeil(true); }, { once: true });
    }

    function initRiskInk() {
      var keyword = document.querySelector(".sequence-risk-keyword");
      var riskSlide = keyword && keyword.closest(".sequence-risk");
      if (!keyword || !riskSlide) return;
      if (reducedMotion.matches) {
        keyword.tabIndex = -1;
        keyword.removeAttribute("role");
        keyword.removeAttribute("aria-label");
        return;
      }

      function activate(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var rect = keyword.getBoundingClientRect();
        riskSlide.classList.add("is-inked");
        for (var i = 0; i < 4; i += 1) {
          var ink = document.createElement("span");
          ink.className = "result-risk-ink";
          ink.setAttribute("aria-hidden", "true");
          ink.style.left = (rect.left + rect.width * (.18 + i * .22)) + "px";
          ink.style.top = (rect.top + rect.height * (.35 + (i % 2) * .32)) + "px";
          ink.style.animationDelay = (i * 55) + "ms";
          document.body.appendChild(ink);
          ink.addEventListener("animationend", function (inkEvent) { inkEvent.currentTarget.remove(); }, { once: true });
        }
        window.setTimeout(function () { riskSlide.classList.remove("is-inked"); }, 1400);
      }

      listen(keyword, "pointerdown", function (event) { event.stopPropagation(); });
      listen(keyword, "click", activate);
      listen(keyword, "keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") activate(event);
      });
    }

    function initPathFork() {
      var fork = document.querySelector(".sequence-path-choices");
      var report = document.getElementById("seq-paid-report");
      var challenge = document.getElementById("seq-paid-cta");
      if (!fork || !report || !challenge) return;
      var previewed = {};

      function choose(kind) {
        fork.classList.toggle("is-report-path", kind === "report");
        fork.classList.toggle("is-challenge-path", kind === "challenge");
        if (!kind || previewed[kind]) return;
        previewed[kind] = true;
        if (typeof window.trackEvent === "function") window.trackEvent("result_path_preview", {
          path_choice: kind,
          placement: "result_final_path"
        });
      }

      [[report, "report"], [challenge, "challenge"]].forEach(function (entry) {
        listen(entry[0], "pointerenter", function () { choose(entry[1]); });
        listen(entry[0], "focus", function () { choose(entry[1]); });
        listen(entry[0], "pointerdown", function () { choose(entry[1]); });
      });
      listen(fork, "pointerleave", function () {
        if (!fork.contains(document.activeElement)) choose("");
      });
      listen(fork, "focusout", function (event) {
        if (!fork.contains(event.relatedTarget)) choose("");
      });
    }

    initLivingThread();
    initParallax();
    initInkBloom();
    initWatercolorDiscovery();
    initRiskInk();
    initPathFork();

    window.addEventListener("pagehide", function () {
      disposers.splice(0).forEach(function (dispose) { dispose(); });
    }, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResultWorld, { once: true });
  } else {
    initResultWorld();
  }
})();
