// result_id 생성/파싱. 보상은 반드시 결과 단위(result_id)로 분리해서 저장·조회한다.

import { REWARD_TEST_ID, TYPE_KEYS, FALLBACK_TYPE_KEY } from './reward-types.js';

/**
 * 알 수 없는 유형 문자열은 fallback 유형으로 정규화한다.
 * @param {unknown} value
 * @returns {string} TYPE_KEYS 중 하나
 */
export function normalizeTypeKey(value) {
  if (typeof value !== 'string') return FALLBACK_TYPE_KEY;
  const key = value.trim().toLowerCase();
  return TYPE_KEYS.includes(key) ? key : FALLBACK_TYPE_KEY;
}

/**
 * 'give-test:<typeKey>' 형태의 result_id를 만든다.
 * @param {unknown} typeKey
 * @param {string} [testId]
 */
export function buildResultId(typeKey, testId = REWARD_TEST_ID) {
  return `${testId}:${normalizeTypeKey(typeKey)}`;
}

/**
 * result_id에서 유형 키를 뽑는다. 형식이 다르면 null.
 * @param {unknown} resultId
 * @returns {string|null}
 */
export function parseTypeKey(resultId) {
  if (typeof resultId !== 'string') return null;
  const [testId, typeKey] = resultId.split(':');
  if (testId !== REWARD_TEST_ID || !typeKey) return null;
  return TYPE_KEYS.includes(typeKey) ? typeKey : null;
}
