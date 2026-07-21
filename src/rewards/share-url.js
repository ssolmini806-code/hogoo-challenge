// 공유 URL 생성기. 공유 링크는 결과 URL이어야 하고,
// 점수·답변·이메일·user_id·product 같은 값은 절대 담지 않는다.

import { normalizeTypeKey } from './result-id.js';
import { TYPES } from './give-type-data.js';
import { plainName } from './give-reward-content.js';

/** 공유 URL에 절대 들어가면 안 되는 파라미터 (테스트로 고정) */
export const FORBIDDEN_SHARE_PARAMS = [
  'product',
  'score',
  'scores',
  'answers',
  'email',
  'user_id',
  'uid',
  'journey_id',
];

/**
 * 공유용 결과 URL.
 * @param {string} origin
 * @param {unknown} typeKey
 */
export function buildResultShareUrl(origin, typeKey) {
  const key = normalizeTypeKey(typeKey);
  const url = new URL('/result-sequence.html', origin);
  url.searchParams.set('test', 'give');
  url.searchParams.set('type', key);
  url.searchParams.set('utm_source', 'share');
  url.searchParams.set('utm_medium', 'result_card');
  url.searchParams.set('utm_campaign', 'give_id_result');
  return url.toString();
}

/** 공유 문구 (유형명만 노출, 점수 없음) */
export function buildShareText(typeKey) {
  const key = normalizeTypeKey(typeKey);
  return `내 GIVE ID는 ${plainName(TYPES[key].name)}. 내 관계 패턴을 확인해봤어요.`;
}

/**
 * 결제 없이 64문항 검사로 이어지는 진단 연결 URL.
 * product / result_type / 가격 관련 파라미터는 넣지 않는다.
 * @param {string} paidSiteUrl
 */
export function buildDiagnosisUrl(paidSiteUrl) {
  const base = paidSiteUrl && !String(paidSiteUrl).includes('%VITE_')
    ? paidSiteUrl
    : 'https://givecosystem.com/';
  try {
    const url = new URL(base);
    url.pathname = '/start';
    url.search = '';
    url.searchParams.set('utm_source', 'hogoo_free');
    url.searchParams.set('utm_medium', 'give_result');
    url.searchParams.set('utm_campaign', 'give_id_diagnosis');
    return url.toString();
  } catch {
    return 'https://givecosystem.com/start?utm_source=hogoo_free&utm_medium=give_result&utm_campaign=give_id_diagnosis';
  }
}
