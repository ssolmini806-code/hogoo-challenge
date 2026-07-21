// user_rewards 저장·조회 서비스. 무료 결과 보상의 유일한 DB 접근 지점이다.
//
// 핵심 계약: 모든 조회·저장은 (user_id, reward_context='free_test', result_id, reward_type)
// 네 값을 함께 사용한다. result_id가 빠지면 다른 유형의 보상이 섞인다.
//
// supabase 클라이언트를 import하지 않고 주입받는다 (테스트에서 가짜 클라이언트 사용).

import { REWARD_CONTEXT } from './reward-types.js';

const SELECT_COLUMNS = 'id, result_id, reward_type, reward_context, unlocked, generated_content, created_at';

/**
 * @param {any} client supabase 클라이언트
 */
export function createRewardService(client) {
  /**
   * 특정 결과(result_id)의 보상 상태만 가져온다.
   * @param {string} userId
   * @param {string} resultId
   */
  async function fetchRewardStatus(userId, resultId) {
    const empty = { sns: false, review: false, both: false, bothContent: null, snsContent: null, reviewContent: null };
    if (!userId || !resultId) return empty;

    const { data, error } = await client
      .from('user_rewards')
      .select(SELECT_COLUMNS)
      .eq('user_id', userId)
      .eq('reward_context', REWARD_CONTEXT)
      .eq('result_id', resultId);

    if (error) throw error;

    const rows = data ?? [];
    const find = (type) => rows.find((row) => row.reward_type === type && row.unlocked);
    const sns = find('sns');
    const review = find('review');
    const both = find('both');
    return {
      sns: Boolean(sns),
      review: Boolean(review),
      both: Boolean(both),
      snsContent: sns?.generated_content ?? null,
      reviewContent: review?.generated_content ?? null,
      bothContent: both?.generated_content ?? null,
    };
  }

  /**
   * 보상을 해금 저장한다. 같은 (user, result, type) row가 있으면 update, 없으면 insert.
   * 기존 row를 삭제하지 않는다.
   * @param {string} userId
   * @param {string} resultId
   * @param {'sns'|'review'|'both'} rewardType
   * @param {unknown} [generatedContent]
   */
  async function saveReward(userId, resultId, rewardType, generatedContent) {
    if (!userId || !resultId) throw new Error('saveReward requires userId and resultId');

    const { data: existing, error: findError } = await client
      .from('user_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('reward_context', REWARD_CONTEXT)
      .eq('result_id', resultId)
      .eq('reward_type', rewardType)
      .limit(1);

    if (findError) throw findError;

    const payload = {
      user_id: userId,
      result_id: resultId,
      reward_context: REWARD_CONTEXT,
      reward_type: rewardType,
      unlocked: true,
      ...(generatedContent === undefined ? {} : { generated_content: generatedContent }),
    };

    if (existing?.[0]?.id) {
      const { error } = await client.from('user_rewards').update(payload).eq('id', existing[0].id);
      if (error) throw error;
      return 'updated';
    }

    const { error } = await client.from('user_rewards').insert(payload);
    if (error) throw error;
    return 'inserted';
  }

  /**
   * 같은 결과에서 A와 B가 모두 해금됐을 때만 A+B를 만든다.
   * 이미 있으면 다시 만들지 않는다 (중복 저장 방지).
   * @param {string} userId
   * @param {string} resultId
   * @param {() => unknown} buildContent
   * @returns {Promise<{unlocked: boolean, content: unknown, created: boolean}>}
   */
  async function ensureBothReward(userId, resultId, buildContent) {
    const status = await fetchRewardStatus(userId, resultId);
    if (status.both) return { unlocked: true, content: status.bothContent, created: false };
    if (!status.sns || !status.review) return { unlocked: false, content: null, created: false };

    const content = buildContent();
    await saveReward(userId, resultId, 'both', content);
    return { unlocked: true, content, created: true };
  }

  /**
   * 마이페이지 보관함용 — 이 사용자의 free_test 보상 전체.
   * result_id가 없는 예전 보상도 그대로 함께 돌려준다 (삭제·보정하지 않는다).
   * @param {string} userId
   */
  async function fetchArchive(userId) {
    if (!userId) return [];
    const { data, error } = await client
      .from('user_rewards')
      .select(SELECT_COLUMNS)
      .eq('user_id', userId)
      .eq('reward_context', REWARD_CONTEXT);
    if (error) throw error;
    return data ?? [];
  }

  return { fetchRewardStatus, saveReward, ensureBothReward, fetchArchive };
}
