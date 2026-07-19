(function () {
  var s = window.giveProgress.get();
  var startDate = s.started ? s.started.split('-') : null;

  if (startDate && startDate.length === 3) {
    document.getElementById('statStart').textContent = startDate[1] + '/' + startDate[2];
  }
  document.getElementById('dayNum').textContent = s.day || 7;
  document.getElementById('statDay').textContent = s.day || 7;

  if (typeof window.trackEvent === 'function') {
    window.trackEvent('challenge_complete_view', { completed_days: s.day || 7 });
  }

  var circle = document.querySelector('.badge-ring circle:last-child');
  var pct = s.isComplete ? 100 : s.percent;
  var r = 54;
  var circ = 2 * Math.PI * r;
  setTimeout(function () {
    circle.style.strokeDashoffset = String(circ * (1 - pct / 100));
  }, 200);

  function shareUrl(platform) {
    return 'https://hogoo-challenge.pages.dev/?utm_source=' + platform + '&utm_medium=share&utm_campaign=challenge_done';
  }

  var shareText = encodeURIComponent(
    '7일 GIVE 챌린지를 완주했습니다\n거절 연습, 경계 긋기, 나를 지키는 7일.\n\n' + shareUrl('threads') + ' #GIVEChallenge #스마트기버'
  );

  document.getElementById('threadsBtn').addEventListener('click', function () {
    window.open('https://www.threads.net/intent/post?text=' + shareText, '_blank', 'noopener,noreferrer');
    if (typeof window.trackEvent === 'function') window.trackEvent('challenge_shared', { platform: 'threads' });
  });

  document.getElementById('shareMoreBtn').addEventListener('click', function () {
    var plain = '7일 GIVE 챌린지를 완주했습니다\n거절 연습, 경계 긋기, 나를 지키는 7일.';
    if (navigator.share) {
      navigator.share({ title: 'GIVE 7일 챌린지 완주', text: plain, url: shareUrl('native_share') })
        .catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(plain + '\n\n' + shareUrl('clipboard')).then(function () {
        alert('문구가 복사됐어요. SNS에 붙여넣기 해주세요!');
      });
    }
    if (typeof window.trackEvent === 'function') window.trackEvent('challenge_shared', { platform: 'other' });
  });

  var paidPath = document.querySelector('.is-paid-path');
  if (paidPath) paidPath.addEventListener('click', function () {
    if (typeof window.trackEvent === 'function') window.trackEvent('paid_cta_click', {
      product: 'give_id_challenge_upgrade',
      placement: 'challenge_complete_path',
      challenge_day: s.day || 7
    });
  });

  document.getElementById('resetBtn').addEventListener('click', function () {
    if (confirm('정말 처음부터 다시 시작할까요? 지금까지의 진행 기록이 사라집니다.')) {
      window.giveProgress.reset();
      location.href = 'hogoo-test.html';
    }
  });
})();
