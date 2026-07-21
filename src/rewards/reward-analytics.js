// 보상 슬라이드 분석 이벤트. 기존 window.trackEvent 패턴을 그대로 쓰고,
// 새로고침·React 재마운트로 같은 이벤트가 중복 발화하지 않도록 세션 단위로 dedupe한다.
//
// 이메일 / user_id / 답변 원문 / 세부 점수 / 후기 본문은 절대 보내지 않는다.

import { REWARD_PLACEMENT } from './reward-types.js';

const SESSION_KEY = 'give_reward_events_v1';

function readFired() {
  try {
    return new Set(JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function writeFired(fired) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify([...fired]));
  } catch {
    /* 세션 스토리지를 못 쓰면 dedupe만 포기하고 이벤트는 계속 보낸다 */
  }
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} [params]
 */
export function trackReward(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.trackEvent !== 'function') return;
  window.trackEvent(name, { placement: REWARD_PLACEMENT, test: 'give', ...params });
}

/**
 * 세션당 한 번만 보내는 이벤트.
 * @param {string} name
 * @param {Record<string, unknown>} [params]
 * @param {string} [dedupeKey] 같은 이벤트를 결과별로 구분하고 싶을 때
 */
export function trackRewardOnce(name, params = {}, dedupeKey) {
  if (typeof window === 'undefined') return;
  const key = dedupeKey ? `${name}:${dedupeKey}` : name;
  const fired = readFired();
  if (fired.has(key)) return;
  fired.add(key);
  writeFired(fired);
  trackReward(name, params);
}
