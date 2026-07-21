// 결과별 보상 콘텐츠 생성기.
// 외부 생성형 API를 호출하지 않고, type key + 저장된 축 점수 + 검증된 기존 문구만으로
// 결정적(deterministic)으로 만든다. 같은 입력이면 항상 같은 결과가 나와야 한다.

import { AXIS_KEYS, FALLBACK_AXIS_KEY, AXIS_SCORE_MIN, AXIS_SCORE_MAX } from './reward-types.js';
import { normalizeTypeKey } from './result-id.js';
import { TYPES, AXES, AXIS_SCENES } from './give-type-data.js';

/** give-test-logic.js의 axisLevel과 동일한 기준 */
export function axisLevel(score) {
  if (score >= 13) return 'high';
  if (score >= 9) return 'mid';
  return 'low';
}

/**
 * 저장된 give_test_scores를 정규화한다. 값이 없거나 깨졌으면 null.
 * @param {unknown} raw
 * @returns {Record<string, number>|null}
 */
export function normalizeScores(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const scores = {};
  for (const axis of AXIS_KEYS) {
    const value = Number(raw[axis]);
    if (!Number.isFinite(value)) return null;
    scores[axis] = Math.min(AXIS_SCORE_MAX, Math.max(AXIS_SCORE_MIN, Math.round(value)));
  }
  return scores;
}

/**
 * 가장 높은 위험 축. 점수가 없으면 유형별 대표 축으로 fallback한다.
 * 동점이면 AXIS_KEYS 순서를 따라 결정적으로 고른다.
 * @param {unknown} rawScores
 * @param {string} typeKey
 */
export function highestAxis(rawScores, typeKey) {
  const scores = normalizeScores(rawScores);
  if (!scores) return fallbackAxisForType(typeKey);
  let best = AXIS_KEYS[0];
  for (const axis of AXIS_KEYS) {
    if (scores[axis] > scores[best]) best = axis;
  }
  return best;
}

/** 점수가 없을 때 쓰는 유형별 대표 축 (typeAxisProfiles의 최고 축과 같은 값) */
function fallbackAxisForType(typeKey) {
  const byType = {
    angel: 'refusal',
    diplomat: 'refusal',
    architect: 'recovery',
    guardian: 'burnout',
    burnout: 'burnout',
    blocker: 'reciprocity',
    mixed: 'reciprocity',
  };
  return byType[normalizeTypeKey(typeKey)] || FALLBACK_AXIS_KEY;
}

/**
 * 보상 A — 내 유형의 경계 문장 카드
 * @param {unknown} typeKey
 */
export function buildBoundaryCard(typeKey) {
  const key = normalizeTypeKey(typeKey);
  const type = TYPES[key];
  return {
    kind: 'boundary_card',
    typeKey: key,
    title: `${plainName(type.name)}의 첫 문장`,
    sentence: type.boundarySentence,
    situation: type.boundaryScene,
    // 결과 슬라이드에서 이미 보여준 '오늘의 조언' 전문 (대조용)
    fromAdvice: type.advice,
    // 공유 전 미리보기: 문장 전체 대신 앞부분만 보여준다 (과도한 blur 대신 자연스러운 생략)
    teaser: '당신이 가장 자주 삼키는 한 문장을 찾아뒀어요.',
    teaserHint: `“${type.swallowedLine}…”`,
  };
}

/**
 * 보상 B — 내가 흔들리기 쉬운 위험 장면 3개
 * 축(점수 기반) × 유형(검증된 경계 문장) 조합.
 * @param {unknown} typeKey
 * @param {unknown} rawScores
 */
export function buildRiskScenes(typeKey, rawScores) {
  const key = normalizeTypeKey(typeKey);
  const type = TYPES[key];
  const axis = highestAxis(rawScores, key);
  const axisDef = AXES[axis];
  const scores = normalizeScores(rawScores);
  const level = scores ? axisLevel(scores[axis]) : null;

  // 세 번째 장면의 대응 문장은 유형 고유 경계 문장으로 바꿔 유형×축 조합을 만든다.
  const scenes = AXIS_SCENES[axis].map((scene, index) => ({
    scene: scene.scene,
    signal: scene.signal,
    response: index === 2 ? type.boundarySentence : scene.response,
  }));

  return {
    kind: 'risk_scenes',
    typeKey: key,
    axis,
    axisTitle: axisDef.title,
    axisLevelLabel: level ? axisDef[level] : null,
    title: `${plainName(type.name)}가 ${axisDef.title}에서 흔들리기 쉬운 장면`,
    intro: `가장 높게 나온 축은 ${axisDef.title}(${axisDef.short})이에요. 이 축에서 반복되기 쉬운 장면 세 개입니다.`,
    scenes,
    note: '자가점검용 정리이고 의학적 진단이 아닙니다.',
  };
}

/**
 * A+B 보상 — 나의 선의 사용 설명서 (7개 섹션, 패널에서 3장으로 나눠 보여준다)
 * @param {unknown} typeKey
 * @param {unknown} rawScores
 */
export function buildGoodwillManual(typeKey, rawScores) {
  const key = normalizeTypeKey(typeKey);
  const type = TYPES[key];
  const riskScenes = buildRiskScenes(key, rawScores);
  const axisDef = AXES[riskScenes.axis];

  const sections = [
    {
      id: 'type',
      heading: '1. 내 GIVE ID 유형',
      body: `${plainName(type.name)} · ${type.tagline}`,
      detail: type.strength,
    },
    {
      id: 'axis',
      heading: '2. 가장 높은 위험 축',
      body: riskScenes.axisLevelLabel
        ? `${axisDef.title} — ${riskScenes.axisLevelLabel}`
        : `${axisDef.title} (${axisDef.short})`,
      detail: riskScenes.axisLevelLabel
        ? `${axisDef.short} 쪽에서 신호가 가장 자주 잡혔어요.`
        : '점수 기록이 없어 유형 기준으로 잡은 축이에요. 다시 검사하면 더 정확해집니다.',
    },
    {
      id: 'scene',
      heading: '3. 반복되기 쉬운 관계 장면',
      body: riskScenes.scenes[0].scene,
      detail: type.risk,
    },
    {
      id: 'signal',
      heading: '4. 멈춰야 할 신호',
      body: riskScenes.scenes.map((scene) => scene.signal),
    },
    {
      id: 'sentence',
      heading: '5. 나에게 맞는 경계 문장',
      body: type.boundarySentence,
      detail: type.boundaryScene,
    },
    {
      id: 'action',
      heading: '6. 이번 주 첫 행동',
      body: axisDef.action,
    },
    {
      id: 'next',
      heading: '7. 더 알아보고 싶다면',
      body: '나를 더 깊이 알고 싶다면, 결제 없이 새로운 64문항 검사를 시작할 수 있어요.',
    },
  ];

  return {
    kind: 'goodwill_manual',
    typeKey: key,
    axis: riskScenes.axis,
    title: '나의 선의 사용 설명서',
    sections,
    // 모바일에서 한 화면에 다 펼치지 않도록 3장으로 나눈다
    pages: [
      { label: '나', sectionIds: ['type', 'axis'] },
      { label: '장면', sectionIds: ['scene', 'signal'] },
      { label: '행동', sectionIds: ['sentence', 'action', 'next'] },
    ],
    note: '자가점검용 정리이고 의학적 진단이 아닙니다.',
  };
}

/** 이모지를 뺀 유형 이름 */
export function plainName(name) {
  return String(name).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
}

export { TYPES, AXES };
