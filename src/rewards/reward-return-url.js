// 후기 작성 왕복(結果 → reviews.html → 결과 보상 슬라이드)에 쓰는 URL 생성·검증.
// return 파라미터는 open redirect가 되지 않도록 동일 출처 + 허용 경로만 통과시킨다.

import { REWARD_CONTEXT } from './reward-types.js';
import { buildResultId, normalizeTypeKey } from './result-id.js';

/** return으로 되돌아갈 수 있는 내부 경로 화이트리스트 */
export const ALLOWED_RETURN_PATHS = [
  '/result-sequence.html',
  '/give-test.html',
  '/hogoo-test.html',
];

/**
 * 외부 URL·javascript:·허용되지 않은 경로를 모두 막고 안전한 상대 경로만 돌려준다.
 * @param {unknown} value 사용자 입력(쿼리 파라미터)
 * @param {string} origin 현재 출처
 * @returns {string} 안전한 경로 또는 ''
 */
export function sanitizeReturnPath(value, origin) {
  if (typeof value !== 'string' || !value) return '';
  // 스킴 상대 URL(//evil.com)은 new URL에서 출처가 바뀌므로 아래 origin 비교로 걸러진다.
  let url;
  try {
    url = new URL(value, origin);
  } catch {
    return '';
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
  if (url.origin !== new URL(origin).origin) return '';
  if (!ALLOWED_RETURN_PATHS.includes(url.pathname)) return '';
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * 후기 작성 후 돌아올 결과 보상 슬라이드 경로.
 * @param {unknown} typeKey
 */
export function buildRewardReturnPath(typeKey) {
  const key = normalizeTypeKey(typeKey);
  return `/result-sequence.html?test=give&type=${encodeURIComponent(key)}&reward=reviewed#reward`;
}

/**
 * 보상 슬라이드 → reviews.html 이동 URL.
 * @param {unknown} typeKey
 */
export function buildReviewStartUrl(typeKey) {
  const key = normalizeTypeKey(typeKey);
  const params = new URLSearchParams({
    context: REWARD_CONTEXT,
    rid: buildResultId(key),
    result_type: key,
    return: buildRewardReturnPath(key),
  });
  return `/reviews.html?${params.toString()}`;
}
