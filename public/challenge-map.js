(function () {
  'use strict';

  var STORAGE_KEY = 'give_challenge_map_v1';
  var canvas = document.getElementById('changeMapCanvas');
  var stage = document.getElementById('changeMapStage');
  var detail = document.getElementById('changeMapDetail');
  var summary = document.getElementById('changeMapSummary');
  var replayButton = document.getElementById('changeMapReplay');
  var shareButton = document.getElementById('changeMapShare');
  if (!canvas || !stage) return;

  var context = canvas.getContext('2d');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var selectedDay = -1;
  var points = [];
  var revealProgress = reducedMotion ? 1 : 0;
  var animationFrame = 0;
  var viewTracked = false;

  function track(name, params) {
    if (typeof window.trackEvent === 'function') window.trackEvent(name, params || {});
    else if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  function numberOrNull(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(10, parsed)) : null;
  }

  function loadData() {
    var raw = null;
    try { raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) {}
    var progress = window.giveProgress ? window.giveProgress.get() : { day: 0 };
    var savedDays = raw && Array.isArray(raw.days) ? raw.days : [];
    var days = Array.from({ length: 7 }, function (_, index) {
      var saved = savedDays[index] || {};
      var missionValue = Number(saved.missions);
      var hasSavedMission = Number.isFinite(missionValue);
      return {
        day: index + 1,
        missions: hasSavedMission
          ? Math.max(0, Math.min(3, missionValue))
          : (index < (progress.day || 0) ? 3 : 0),
        anxiety: numberOrNull(saved.anxiety),
        guilt: numberOrNull(saved.guilt),
        hasPhrase: saved.hasPhrase === true,
      };
    });
    return {
      days: days,
      resultType: raw && raw.resultType ? raw.resultType : null,
      hasScores: days.some(function (day) { return day.anxiety !== null || day.guilt !== null; }),
    };
  }

  var mapData = loadData();

  function dayDescription(day) {
    var parts = ['Day ' + day.day, '미션 ' + day.missions + '/3'];
    if (day.anxiety !== null) parts.push('불안 ' + day.anxiety + '/10');
    if (day.guilt !== null) parts.push('죄책감 ' + day.guilt + '/10');
    if (day.anxiety === null && day.guilt === null) parts.push('감정 점수 기록 없음');
    return parts.join(' · ');
  }

  function updateSummary() {
    summary.innerHTML = '';
    mapData.days.forEach(function (day) {
      var item = document.createElement('li');
      item.textContent = dayDescription(day);
      summary.appendChild(item);
    });
    canvas.setAttribute('aria-label', mapData.hasScores
      ? '7일의 미션 완료 수와 불안, 죄책감 변화가 수채화 길로 표현되어 있습니다.'
      : '7일의 미션 완료 기록이 수채화 길로 표현되어 있습니다. 감정 점수 기록은 없습니다.');
  }

  function seeded(index, salt) {
    var x = Math.sin((index + 1) * 9283.17 + salt * 77.3) * 43758.5453;
    return x - Math.floor(x);
  }

  function getPoints(width, height) {
    var left = width * .09;
    var usable = width * .82;
    return mapData.days.map(function (day, index) {
      var scores = [day.anxiety, day.guilt].filter(function (value) { return value !== null; });
      var average = scores.length ? scores.reduce(function (sum, value) { return sum + value; }, 0) / scores.length : null;
      var neutralWave = Math.sin(index * 1.22) * height * .075;
      var scoreOffset = average === null ? neutralWave : (average - 5) / 5 * height * .22;
      return {
        x: left + usable * index / 6,
        y: height * .49 + scoreOffset,
        radius: Math.max(4, width * (.007 + day.missions * .0022)),
        day: day,
      };
    });
  }

  function pathAt(ctx, pathPoints, progress) {
    var segments = pathPoints.length - 1;
    var scaled = Math.max(0, Math.min(1, progress)) * segments;
    var whole = Math.floor(scaled);
    var fraction = scaled - whole;
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (var index = 0; index < whole; index += 1) {
      var current = pathPoints[index];
      var next = pathPoints[index + 1];
      var midX = (current.x + next.x) / 2;
      ctx.bezierCurveTo(midX, current.y, midX, next.y, next.x, next.y);
    }
    if (whole < segments && fraction > 0) {
      var from = pathPoints[whole];
      var to = pathPoints[whole + 1];
      var partialX = from.x + (to.x - from.x) * fraction;
      var partialY = from.y + (to.y - from.y) * fraction;
      var controlX = (from.x + to.x) / 2;
      ctx.bezierCurveTo(controlX, from.y, controlX, partialY, partialX, partialY);
    }
  }

  function drawWash(ctx, point, index, scale, selected) {
    var base = point.radius * (selected ? 3.4 : 2.6) * scale;
    for (var layer = 0; layer < 7; layer += 1) {
      var dx = (seeded(index, layer) - .5) * base * .8;
      var dy = (seeded(index + 11, layer) - .5) * base * .7;
      var radius = base * (.65 + seeded(index + 27, layer) * .65);
      var gradient = ctx.createRadialGradient(point.x + dx, point.y + dy, 0, point.x + dx, point.y + dy, radius);
      gradient.addColorStop(0, selected ? 'rgba(238,143,103,.24)' : 'rgba(200,95,67,.15)');
      gradient.addColorStop(1, 'rgba(200,95,67,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x + dx, point.y + dy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawScene(ctx, width, height, progress, activeDay, exportMode) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#17130e';
    ctx.fillRect(0, 0, width, height);

    var glow = ctx.createRadialGradient(width * .78, height * .15, 0, width * .78, height * .15, width * .65);
    glow.addColorStop(0, 'rgba(200,95,67,.16)');
    glow.addColorStop(1, 'rgba(23,19,14,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    if (exportMode) {
      ctx.fillStyle = '#eee5d2';
      ctx.font = '600 ' + Math.round(width * .055) + 'px Hahmlet, serif';
      ctx.fillText('당신이 지나온 길', width * .075, height * .13);
      ctx.fillStyle = '#cbbda7';
      ctx.font = '700 ' + Math.round(width * .014) + 'px Pretendard, sans-serif';
      ctx.fillText('GIVE · YOUR 7-DAY MAP', width * .077, height * .175);
    }

    var topOffset = exportMode ? height * .16 : 0;
    var mapHeight = exportMode ? height * .72 : height;
    var localPoints = getPoints(width, mapHeight).map(function (point) {
      return Object.assign({}, point, { y: point.y + topOffset });
    });
    if (!exportMode) points = localPoints;

    for (var stroke = 0; stroke < 7; stroke += 1) {
      ctx.save();
      ctx.translate((seeded(stroke, 2) - .5) * 5, (seeded(stroke, 5) - .5) * 4);
      pathAt(ctx, localPoints, progress);
      ctx.strokeStyle = stroke < 2 ? 'rgba(238,229,210,.16)' : 'rgba(200,95,67,.15)';
      ctx.lineWidth = width * (.004 + seeded(stroke, 4) * .006);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
    pathAt(ctx, localPoints, progress);
    ctx.strokeStyle = '#c85f43';
    ctx.lineWidth = Math.max(1.2, width * .0022);
    ctx.lineCap = 'round';
    ctx.stroke();

    var visible = progress * 6;
    localPoints.forEach(function (point, index) {
      if (index > visible + .06) return;
      var bloom = Math.min(1, Math.max(.15, (visible - index + .35) * 2.8));
      var isSelected = index === activeDay;
      drawWash(ctx, point, index, bloom, isSelected);
      ctx.save();
      ctx.translate(point.x, point.y);
      if (index === 6 && point.day.missions === 3) {
        ctx.rotate(-.09);
        ctx.strokeStyle = isSelected ? '#eee5d2' : '#c85f43';
        ctx.lineWidth = Math.max(1.2, width * .0014);
        ctx.strokeRect(-point.radius * 1.45, -point.radius * 1.45, point.radius * 2.9, point.radius * 2.9);
      } else {
        ctx.fillStyle = isSelected ? '#eee5d2' : '#c85f43';
        ctx.beginPath();
        ctx.arc(0, 0, point.radius * (isSelected ? 1.18 : .82), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = isSelected ? '#eee5d2' : 'rgba(238,229,210,.64)';
      ctx.font = '700 ' + Math.max(9, width * .011) + 'px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(index + 1).padStart(2, '0'), 0, -point.radius * 2.6);
      ctx.restore();
    });

    if (exportMode) {
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(238,229,210,.62)';
      ctx.font = '500 ' + Math.round(width * .013) + 'px Pretendard, sans-serif';
      ctx.fillText(mapData.hasScores ? '미션과 감정 기록이 만든 단 하나의 길' : '완료한 미션이 만든 단 하나의 길', width * .075, height * .93);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#c85f43';
      ctx.font = '700 ' + Math.round(width * .012) + 'px Pretendard, sans-serif';
      ctx.fillText('giveecosystem.com', width * .925, height * .93);
    }
  }

  function resizeAndDraw() {
    var rect = canvas.getBoundingClientRect();
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawScene(context, rect.width, rect.height, revealProgress, selectedDay, false);
  }

  function animate() {
    cancelAnimationFrame(animationFrame);
    if (reducedMotion) {
      revealProgress = 1;
      resizeAndDraw();
      detail.textContent = '길 위를 움직이면 하루의 기록을 볼 수 있어요.';
      return;
    }
    var start = performance.now();
    detail.textContent = '기록이 한 줄의 길로 피어나는 중이에요.';
    function frame(now) {
      var elapsed = Math.min(1, (now - start) / 1750);
      revealProgress = 1 - Math.pow(1 - elapsed, 3);
      resizeAndDraw();
      if (elapsed < 1) animationFrame = requestAnimationFrame(frame);
      else detail.textContent = '길 위를 움직이면 하루의 기록을 볼 수 있어요.';
    }
    animationFrame = requestAnimationFrame(frame);
  }

  function selectNearest(event, intentional) {
    if (!points.length || revealProgress < .9) return;
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var nearest = points.reduce(function (best, point, index) {
      var distance = Math.hypot(point.x - x, point.y - y);
      return distance < best.distance ? { index: index, distance: distance } : best;
    }, { index: -1, distance: Infinity });
    if (nearest.index !== selectedDay && (intentional || nearest.distance < Math.max(48, rect.width * .09))) {
      selectedDay = nearest.index;
      detail.textContent = dayDescription(mapData.days[selectedDay]);
      resizeAndDraw();
      if (intentional) track('challenge_map_day_selected', { day: selectedDay + 1 });
    }
  }

  canvas.addEventListener('pointermove', function (event) { selectNearest(event, false); });
  canvas.addEventListener('pointerdown', function (event) { selectNearest(event, true); });
  canvas.addEventListener('pointerleave', function () {
    if (selectedDay < 0) detail.textContent = '길 위를 움직이면 하루의 기록을 볼 수 있어요.';
  });

  replayButton.addEventListener('click', function () {
    selectedDay = -1;
    revealProgress = reducedMotion ? 1 : 0;
    animate();
    track('challenge_map_replay', { reduced_motion: reducedMotion });
  });

  function downloadBlob(blob) {
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'give-7day-path.png';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  shareButton.addEventListener('click', async function () {
    shareButton.disabled = true;
    shareButton.textContent = '지도를 만드는 중…';
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      var exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1200;
      exportCanvas.height = 800;
      var exportContext = exportCanvas.getContext('2d');
      drawScene(exportContext, 1200, 800, 1, -1, true);
      var blob = await new Promise(function (resolve) { exportCanvas.toBlob(resolve, 'image/png', .96); });
      if (!blob) throw new Error('image export failed');
      var file = new File([blob], 'give-7day-path.png', { type: 'image/png' });
      var canShareFile = navigator.share && navigator.canShare && navigator.canShare({ files: [file] });
      if (canShareFile) {
        await navigator.share({ title: '나의 GIVE 7일 변화 지도', text: '7일 동안 지나온 길을 기록했어요.', files: [file] });
        track('challenge_map_export', { method: 'share', has_scores: mapData.hasScores });
      } else {
        downloadBlob(blob);
        track('challenge_map_export', { method: 'download', has_scores: mapData.hasScores });
      }
      shareButton.textContent = '저장됐어요 ✓';
    } catch (error) {
      if (error && error.name === 'AbortError') shareButton.textContent = '변화 지도 저장·공유';
      else {
        console.warn('Change map export failed:', error);
        shareButton.textContent = '다시 시도해 주세요';
      }
    } finally {
      shareButton.disabled = false;
      setTimeout(function () { shareButton.textContent = '변화 지도 저장·공유'; }, 2200);
    }
  });

  updateSummary();
  var observer = new ResizeObserver(resizeAndDraw);
  observer.observe(stage);
  animate();
  if (!viewTracked) {
    viewTracked = true;
    track('challenge_map_view', { has_scores: mapData.hasScores });
  }
})();
