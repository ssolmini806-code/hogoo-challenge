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
  const recordedScores = memoir.daily.filter((entry) => entry.anxiety !== null || entry.guilt !== null).length;
  const reflectionSignals = memoir.noteCount + recordedScores;
  const label = reflectionSignals >= 10
    ? '자기 관찰을 이어갈 준비가 된 유형'
    : reflectionSignals >= 5
      ? '반복하며 기준을 선명하게 만들 유형'
      : '간단한 기록 구조가 힘이 되는 유형';
  const reason = memoir.noteCount
    ? `7일 동안 행동 메모 ${memoir.noteCount}개와 감정 기록 ${recordedScores}일을 남겼어요.`
    : `미션 ${memoir.completedMissions}개를 완료했어요. 다음 단계에서는 짧은 행동 메모를 함께 남기면 변화가 더 선명해집니다.`;

  return {
    kind: 'challenge_fit_card',
    label,
    reason,
    nextAction: `30일 동안 매주 한 번 “${memoir.anchor}”를 기준으로 실제 선택을 돌아보세요.`,
  };
}
