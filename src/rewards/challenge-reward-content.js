import DAYS from '../../days.js';

const own = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, String(key));

function scoreEntries(values) {
  return DAYS.flatMap((_, index) => {
    const score = Number(values?.[String(index)]);
    return Number.isFinite(score)
      ? [{ day: index + 1, score: Math.max(0, Math.min(10, score)) }]
      : [];
  });
}

function average(entries) {
  if (!entries.length) return null;
  return Math.round((entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length) * 10) / 10;
}

function scoreChange(entries) {
  if (!entries.length) return null;
  const first = entries[0];
  const last = entries[entries.length - 1];
  return {
    start: first.score,
    end: last.score,
    change: Math.round((last.score - first.score) * 10) / 10,
    startDay: first.day,
    endDay: last.day,
  };
}

export function buildChallengeMemoir({ missions, notes, selectedPhrase, anxiety, guilt }) {
  const anxietyEntries = scoreEntries(anxiety);
  const guiltEntries = scoreEntries(guilt);
  const daily = DAYS.map((day, index) => {
    const phraseIndex = Number(selectedPhrase?.[String(index)]);
    return {
      day: day.day,
      title: day.title,
      completedMissions: new Set(missions?.[String(index)] || []).size,
      phrase: Number.isInteger(phraseIndex) ? day.phrases[phraseIndex] : '',
      note: String(notes?.[String(index)] || '').trim(),
      anxiety: own(anxiety, index) ? Number(anxiety[String(index)]) : null,
      guilt: own(guilt, index) ? Number(guilt[String(index)]) : null,
    };
  });
  const strongest = [...anxietyEntries, ...guiltEntries].sort((a, b) => b.score - a.score)[0] || null;
  const anchor = [...daily].reverse().find((entry) => entry.phrase)?.phrase
    || '나는 더 이상 자동으로 수락하지 않는다.';

  return {
    kind: 'challenge_memoir',
    title: '나의 7일 경계 연습 회고록',
    completedMissions: daily.reduce((sum, entry) => sum + entry.completedMissions, 0),
    noteCount: daily.filter((entry) => entry.note).length,
    anxietyAverage: average(anxietyEntries),
    guiltAverage: average(guiltEntries),
    anxietyChange: scoreChange(anxietyEntries),
    guiltChange: scoreChange(guiltEntries),
    anxietySeries: anxietyEntries,
    guiltSeries: guiltEntries,
    recordedScoreDays: new Set([...anxietyEntries, ...guiltEntries].map((entry) => entry.day)).size,
    strongestDay: strongest?.day ?? null,
    anchor,
    daily,
  };
}

export function buildChallengeFitCard(memoir) {
  const noteDays = memoir.daily.filter((entry) => entry.note).length;
  const phraseDays = memoir.daily.filter((entry) => entry.phrase).length;
  const scoreDays = memoir.recordedScoreDays || memoir.daily.filter((entry) => entry.anxiety !== null || entry.guilt !== null).length;
  const percent = (value, total) => Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  const endingScores = [memoir.anxietyChange?.end, memoir.guiltChange?.end].filter(Number.isFinite);
  const repetitionNeed = endingScores.length
    ? Math.round((endingScores.reduce((sum, score) => sum + score, 0) / endingScores.length) * 10)
    : null;
  const dimensions = [
    {
      key: 'execution',
      label: '실행 지속성',
      score: percent(memoir.completedMissions, 21),
      evidence: `실제 완료 미션 ${memoir.completedMissions}/21`,
    },
    {
      key: 'observation',
      label: '자기 관찰력',
      score: percent(noteDays + scoreDays, 14),
      evidence: `행동 메모 ${noteDays}일 · 감정 기록 ${scoreDays}일`,
    },
    {
      key: 'boundary',
      label: '경계 적용력',
      score: percent(phraseDays + noteDays, 14),
      evidence: `경계 문장 ${phraseDays}일 · 적용 메모 ${noteDays}일`,
    },
    {
      key: 'repetition',
      label: '반복 필요성',
      score: repetitionNeed,
      evidence: repetitionNeed === null
        ? '마지막 감정 점수 기록이 없어 판단을 보류했어요.'
        : `마지막 불안·죄책감 기록 평균 ${repetitionNeed / 10}/10`,
    },
  ];

  let decision = 'expand';
  if (noteDays < 3 || scoreDays < 3 || phraseDays < 4) decision = 'repeat';
  else if (repetitionNeed !== null && repetitionNeed <= 30) decision = 'practice';

  const copy = {
    expand: {
      label: '30일로 확장하기 좋은 상태',
      reason: `7일 동안 행동 메모 ${noteDays}일, 감정 기록 ${scoreDays}일, 경계 문장 ${phraseDays}일을 남겨 판단 근거가 충분해요.`,
      nextAction: `30일 동안 매주 한 번 “${memoir.anchor}”를 기준으로 실제 선택을 반복해보세요.`,
      ctaKind: 'paid',
      ctaLabel: '내 기록을 이어 30일 시작하기',
    },
    repeat: {
      label: '7일 기록을 보강한 뒤 판단하기',
      reason: `미션은 완주했지만 행동 메모 ${noteDays}일, 감정 기록 ${scoreDays}일, 경계 문장 ${phraseDays}일이라 30일 적합도를 단정하기에는 근거가 부족해요.`,
      nextAction: '기억나는 날의 행동 메모와 감정 점수를 먼저 보강하면 다음 판단이 더 정확해집니다.',
      ctaKind: 'review',
      ctaLabel: '7일 기록 다시 살펴보기',
    },
    practice: {
      label: '지금은 기록보다 실전 적용이 우선',
      reason: `기록 근거는 충분하고 마지막 감정 마찰 평균이 ${repetitionNeed / 10}/10으로 낮았어요. 지금 바로 유료 확장이 꼭 필요하다고 보기는 어려워요.`,
      nextAction: `“${memoir.anchor}”를 이번 주 실제 부탁 한 번에 사용해보고, 다시 흔들릴 때 확장을 검토하세요.`,
      ctaKind: 'practice',
      ctaLabel: '실전 경계 문장 더 연습하기',
    },
  }[decision];

  return {
    kind: 'challenge_fit_card',
    decision,
    dimensions,
    ...copy,
  };
}
