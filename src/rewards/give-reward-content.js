// 결과별 보상 콘텐츠 생성기.
// 외부 생성형 API를 호출하지 않고, type key + 저장된 축 점수 + 검증된 기존 문구만으로
// 결정적(deterministic)으로 만든다. 같은 입력이면 항상 같은 결과가 나와야 한다.

import { AXIS_KEYS, FALLBACK_AXIS_KEY, AXIS_SCORE_MIN, AXIS_SCORE_MAX } from './reward-types.js';
import { normalizeTypeKey } from './result-id.js';
import { TYPES, AXES, AXIS_SCENES } from './give-type-data.js';

const BOUNDARY_VARIANTS = {
  angel: [
    ['직장', '지금 일정으로는 맡기 어려워요. 가능해지면 제가 먼저 말씀드릴게요.'],
    ['가족', '도와주고 싶은 마음은 있지만 지금은 어려워. 가능해지면 내가 먼저 말할게.'],
    ['친구·연인', '네 마음은 이해하지만 지금은 어려워. 괜찮아지면 내가 먼저 이야기할게.'],
  ],
  diplomat: [
    ['직장', '지금 바로 확답하기는 어렵습니다. 확인한 뒤 가능한 범위를 말씀드릴게요.'],
    ['가족', '지금 바로 답하지 않을게. 확인하고 내가 할 수 있는 만큼 말해줄게.'],
    ['친구·연인', '분위기 때문에 서두르고 싶지 않아. 생각한 뒤 다시 말할게.'],
  ],
  architect: [
    ['직장', '이번 업무를 제가 맡기는 어렵습니다. 필요한 방법은 함께 정리할 수 있어요.'],
    ['가족', '이번에는 내가 맡지 않을게. 대신 방법을 찾는 건 같이 해볼 수 있어.'],
    ['친구·연인', '내가 대신 하지는 않을게. 네가 해볼 방법은 같이 생각해보자.'],
  ],
  guardian: [
    ['직장', '이 범위까지는 가능하지만 그 이상은 맡기 어렵습니다.'],
    ['가족', '여기까지는 도울게. 그다음은 네가 맡아줘.'],
    ['친구·연인', '내가 할 수 있는 건 여기까지야. 그 이상은 어렵다고 말할게.'],
  ],
  burnout: [
    ['직장', '오늘은 추가 요청을 맡기 어렵습니다. 회복한 뒤 다시 말씀드릴게요.'],
    ['가족', '오늘은 쉬어야 해서 어렵겠어. 회복하고 다시 이야기할게.'],
    ['친구·연인', '지금은 내 여유를 먼저 돌봐야 해. 오늘은 여기서 멈출게.'],
  ],
  blocker: [
    ['직장', '그 방식으로는 어렵습니다. 범위를 줄인다면 검토해볼게요.'],
    ['가족', '그 부탁 전체는 어렵고, 이 작은 부분까지만 할게.'],
    ['친구·연인', '그 방식에는 동의하기 어려워. 다만 이 정도는 같이 해볼 수 있어.'],
  ],
  mixed: [
    ['직장', '이번에 제가 맡을 수 있는 기준은 여기까지입니다.'],
    ['가족', '이번에는 여기까지가 내가 도울 수 있는 기준이야.'],
    ['친구·연인', '상황마다 바꾸지 않고 이번 기준은 여기까지로 할게.'],
  ],
};

const RESPONSE_TONES = {
  burnout: {
    gentle: '지금은 여유가 부족해서 이번에는 어렵겠어요.',
    firm: '이번 요청은 맡지 않겠습니다.',
  },
  refusal: {
    gentle: '확인하고 가능한 범위를 다시 말씀드릴게요.',
    firm: '지금은 답하지 않겠습니다. 정리되면 제가 먼저 연락할게요.',
  },
  reciprocity: {
    gentle: '이번에는 역할을 나눠서 진행하면 가능해요.',
    firm: '역할 분담이 없는 방식에는 참여하지 않겠습니다.',
  },
  recovery: {
    gentle: '지금은 회복 시간이 필요해서 다음에 이야기할게요.',
    firm: '오늘은 여기서 멈추겠습니다.',
  },
};

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
    variants: BOUNDARY_VARIANTS[key].map(([context, sentence]) => ({ context, sentence })),
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
    gentleResponse: index === 2 ? BOUNDARY_VARIANTS[key][2][1] : RESPONSE_TONES[axis].gentle,
    firmResponse: index === 2 ? type.boundarySentence : RESPONSE_TONES[axis].firm,
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
