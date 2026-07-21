// 무료 GIVE ID 결과 보상의 공통 상수. 도메인 모듈 전부가 여기를 기준으로 삼는다.

export const REWARD_CONTEXT = 'free_test';
export const REWARD_TEST_ID = 'give-test';
export const REWARD_PLACEMENT = 'result_reward_slide';

/** 보상 A = sns(공유), B = review(후기), A+B = both */
export const REWARD_TYPES = ['sns', 'review', 'both'];

/** 무료 GIVE ID 유형 키 (public/give-test-logic.js의 results와 동일) */
export const TYPE_KEYS = [
  'angel',
  'diplomat',
  'architect',
  'guardian',
  'burnout',
  'blocker',
  'mixed',
];

export const FALLBACK_TYPE_KEY = 'mixed';

/** 16문항 위험 축 (public/give-test-logic.js의 axisDefinitions와 동일) */
export const AXIS_KEYS = ['burnout', 'refusal', 'reciprocity', 'recovery'];

export const FALLBACK_AXIS_KEY = 'refusal';

/** 축 점수는 문항 4개 × 1~4점 = 4~16 범위 */
export const AXIS_SCORE_MIN = 4;
export const AXIS_SCORE_MAX = 16;

export const REWARD_TYPE_LABEL = {
  sns: '경계 문장 카드',
  review: '위험 장면 3개',
  both: '선의 사용 설명서',
};
