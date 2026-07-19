/* ============================================================
   GIVE Ecosystem — 7일 챌린지 진행 저장 (localStorage · 서버 0원)
   index.html의 '이어보기' 띠가 읽는 give_challenge_day 값을 여기서 씁니다.

   사용법:
   1) 챌린지 페이지(hogoo-test.html 등) <head> 또는 본문 끝에 로드
      <script src="/give-progress.js"></script>
   2) 페이지 진입 시        giveProgress.start();
   3) 오늘 미션을 끝냈을 때  giveProgress.completeDay();
   4) 현재 상태 읽기        var s = giveProgress.get();
   ============================================================ */
(function (w) {
  var KEY       = 'give_challenge_day';     // 완료한 일수 (0~7) ← index 띠가 읽는 값
  var KEY_START = 'give_challenge_started'; // 시작일 (YYYY-M-D)
  var KEY_LAST  = 'give_challenge_last';    // 마지막 완료일 (YYYY-M-D)
  var TOTAL     = 7;
  var DAILY_GATE = false; // true면 '하루 1일만' 진행 가능(진짜 7일 루틴). false면 자유 진행.

  function today(){ var d = new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
  function getInt(k){ return parseInt(localStorage.getItem(k) || '0', 10) || 0; }
  function syncJourney(){ if (w.GiveJourney && typeof w.GiveJourney.refresh === 'function') w.GiveJourney.refresh(); }

  var api = {
    /* 현재 상태 객체 반환 */
    get: function () {
      var day = getInt(KEY);
      return {
        day: day,                            // 완료한 일수
        nextDay: Math.min(day + 1, TOTAL),   // 오늘 진행할 미션 번호
        total: TOTAL,
        started: localStorage.getItem(KEY_START),
        last: localStorage.getItem(KEY_LAST),
        completedToday: localStorage.getItem(KEY_LAST) === today(),
        isComplete: day >= TOTAL,
        percent: Math.round(day / TOTAL * 100)
      };
    },

    /* 챌린지 시작 표시(최초 1회). 진입 시 호출해도 안전(중복 무시). */
    start: function () {
      if (!localStorage.getItem(KEY_START)) {
        localStorage.setItem(KEY_START, today());
        if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, '0');
        if (typeof gtag === 'function') gtag('event', 'challenge_started');
      }
      syncJourney();
      return api.get();
    },

    /* 오늘 미션 완료 시 호출 → day +1, index 띠에 자동 반영 */
    completeDay: function () {
      var day = getInt(KEY);
      if (day >= TOTAL) return api.get();                       // 이미 완주
      if (DAILY_GATE && localStorage.getItem(KEY_LAST) === today()) return api.get(); // 오늘 이미 함
      var next = day + 1;
      localStorage.setItem(KEY, String(next));
      localStorage.setItem(KEY_LAST, today());
      if (!localStorage.getItem(KEY_START)) localStorage.setItem(KEY_START, today());
      if (typeof gtag === 'function') {
        gtag('event', 'challenge_day_complete', { day: next });
        if (next >= TOTAL) gtag('event', 'challenge_completed');
      }
      syncJourney();
      return api.get();
    },

    /* 오늘 진행 가능 여부 (DAILY_GATE=true일 때 하루 1회 제한 체크) */
    canDoToday: function () {
      if (getInt(KEY) >= TOTAL) return false;
      if (DAILY_GATE) return localStorage.getItem(KEY_LAST) !== today();
      return true;
    },

    /* 특정 일수로 직접 설정 (테스트/관리용) */
    setDay: function (n) {
      n = Math.max(0, Math.min(TOTAL, parseInt(n, 10) || 0));
      localStorage.setItem(KEY, String(n));
      localStorage.setItem(KEY_LAST, today());
      syncJourney();
      return api.get();
    },

    /* 초기화 (다시 시작하기) */
    reset: function () {
      localStorage.removeItem(KEY);
      localStorage.removeItem(KEY_START);
      localStorage.removeItem(KEY_LAST);
      localStorage.removeItem('give_challenge_map_v1');
      syncJourney();
    }
  };

  w.giveProgress = api;
})(window);
