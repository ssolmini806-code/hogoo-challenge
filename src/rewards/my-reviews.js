// 마이페이지 "내 후기" 병합 로직.
//
// 후기 저장 위치가 두 곳으로 나뉘어 있다.
//  - public.challenge_reviews : 현재 쓰이는 테이블. reviews.html이 여기에 저장한다.
//                               7일 챌린지 후기와 무료 GIVE ID 후기(free_test)가 모두 들어온다.
//  - public.reviews           : 레거시. RLS 정책 이름부터 "own legacy reviews"이고
//                               INSERT 정책이 없어 새로 쌓이지 않는다.
//                               to_regclass 가드로 감싸져 있어 아예 없을 수도 있다.
//
// 두 곳을 함께 읽되, 없거나 실패해도 화면이 깨지지 않아야 한다.
// 조회는 항상 본인 user_id로 걸고, RLS가 허용하는 컬럼만 사용한다.

export const REVIEW_CONTEXT_LABEL = {
  free_test: '무료 GIVE ID 진단',
  seven_day_challenge: '7일 챌린지',
  giveid: 'GIVE ID',
  paid_30day: '30일 플랜',
};

/**
 * challenge_reviews에서 읽어도 되는 컬럼.
 * 마이그레이션의 column-level grant(select)에 포함된 것만 넣는다.
 */
export const CHALLENGE_REVIEW_COLUMNS = 'content, rating, review_context, created_at';

/** 레거시 reviews 테이블에서 읽는 컬럼 */
export const LEGACY_REVIEW_COLUMNS = 'content, review_context, created_at';

/**
 * 후기 컨텍스트를 사람이 읽는 이름으로 바꾼다.
 * 모르는 값이면 원본을 그대로 보여주고, 비어 있으면 '후기'로 둔다.
 * @param {unknown} context
 */
export function reviewContextLabel(context) {
  if (typeof context !== 'string' || !context) return '후기';
  return REVIEW_CONTEXT_LABEL[context] || context;
}

function toEntry(row, source) {
  return {
    source,
    content: typeof row?.content === 'string' ? row.content : '',
    rating: Number.isFinite(Number(row?.rating)) ? Number(row.rating) : null,
    context: typeof row?.review_context === 'string' ? row.review_context : null,
    createdAt: row?.created_at ?? null,
    isLegacy: source === 'legacy',
  };
}

/**
 * 현재 후기와 레거시 후기를 하나의 목록으로 합친다.
 * 최신순 정렬. 내용이 비어 있는 row는 표시하지 않는다.
 *
 * @param {Array|null|undefined} challengeRows public.challenge_reviews 결과
 * @param {Array|null|undefined} legacyRows    public.reviews 결과 (없을 수 있음)
 */
export function mergeMyReviews(challengeRows, legacyRows) {
  const rows = [
    ...(Array.isArray(challengeRows) ? challengeRows : []).map((row) => toEntry(row, 'challenge')),
    ...(Array.isArray(legacyRows) ? legacyRows : []).map((row) => toEntry(row, 'legacy')),
  ].filter((entry) => entry.content.trim().length > 0);

  return rows.sort((a, b) => {
    const left = a.createdAt ? Date.parse(a.createdAt) : 0;
    const right = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (Number.isNaN(left) || Number.isNaN(right) || left === right) {
      // 시간을 못 읽으면 현재 테이블을 앞에 둔다 (결정적 순서 유지)
      if (a.isLegacy !== b.isLegacy) return a.isLegacy ? 1 : -1;
      return 0;
    }
    return right - left;
  });
}
