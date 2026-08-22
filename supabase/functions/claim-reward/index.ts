import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEFAULT_ORIGIN = 'https://hogoo-challenge.pages.dev';
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get('ALLOWED_ORIGINS') || DEFAULT_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const TYPE_KEYS = new Set(['angel', 'diplomat', 'architect', 'guardian', 'burnout', 'blocker', 'mixed']);
const REWARD_TYPES = new Set(['sns', 'review', 'both']);
const CONTEXTS = new Set(['free_test', 'seven_day_challenge']);

type ClaimBody = {
  context?: string;
  rewardType?: string;
  resultId?: string | null;
  resultType?: string | null;
  generatedContent?: unknown;
};

function cors(req: Request) {
  const origin = req.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function json(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), 'Content-Type': 'application/json' },
  });
}

function safeGeneratedContent(value: unknown) {
  if (value === undefined || value === null) return null;
  const encoded = JSON.stringify(value);
  if (encoded.length > 24_000) throw new Error('보상 콘텐츠가 허용 크기를 초과했습니다.');
  return JSON.parse(encoded);
}

async function challengeCompleted(admin: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await admin
    .from('user_progress')
    .select('day_index, missions')
    .eq('user_id', userId);
  if (error) throw error;

  const completed = new Set(
    (data || [])
      .filter((row) => Number.isInteger(row.day_index)
        && row.day_index >= 0
        && row.day_index <= 6
        && Array.isArray(row.missions)
        && new Set(row.missions).size === 3
        && [0, 1, 2].every((mission) => row.missions.includes(mission)))
      .map((row) => row.day_index),
  );
  return completed.size === 7;
}

async function hasReview(
  admin: ReturnType<typeof createClient>,
  userId: string,
  context: string,
  resultId: string | null,
) {
  let query = admin
    .from('challenge_reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('review_context', context);
  query = resultId ? query.eq('reward_result_id', resultId) : query.is('reward_result_id', null);
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

async function hasReward(
  admin: ReturnType<typeof createClient>,
  userId: string,
  context: string,
  resultId: string | null,
  rewardType: string,
) {
  let query = admin
    .from('user_rewards')
    .select('id')
    .eq('user_id', userId)
    .eq('reward_context', context)
    .eq('reward_type', rewardType)
    .eq('unlocked', true);
  query = resultId ? query.eq('result_id', resultId) : query.is('result_id', null);
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: '허용되지 않은 요청입니다.' }, 405);

  const origin = req.headers.get('Origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(req, { error: '허용되지 않은 요청입니다.' }, 403);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json(req, { error: '로그인이 필요합니다.' }, 401);

    const url = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json(req, { error: '로그인 상태를 다시 확인해주세요.' }, 401);

    const body = await req.json().catch(() => ({})) as ClaimBody;
    const context = String(body.context || '');
    const rewardType = String(body.rewardType || '');
    if (!CONTEXTS.has(context) || !REWARD_TYPES.has(rewardType)) {
      return json(req, { error: '허용되지 않은 보상 요청입니다.' }, 400);
    }

    let resultId: string | null = null;
    if (context === 'free_test') {
      const resultType = String(body.resultType || '');
      if (!TYPE_KEYS.has(resultType) || body.resultId !== `give-test:${resultType}`) {
        return json(req, { error: '결과 식별자가 일치하지 않습니다.' }, 400);
      }
      resultId = body.resultId;
    } else if (body.resultId != null) {
      return json(req, { error: '7일 챌린지에는 결과 식별자를 사용할 수 없습니다.' }, 400);
    }

    if (context === 'seven_day_challenge' && !(await challengeCompleted(admin, user.id))) {
      return json(req, { error: '7일 미션을 모두 완료한 뒤 받을 수 있는 보상입니다.', code: 'CHALLENGE_INCOMPLETE' }, 403);
    }

    if (rewardType === 'review' && !(await hasReview(admin, user.id, context, resultId))) {
      return json(req, { error: '저장된 후기를 확인하지 못했습니다.', code: 'REVIEW_REQUIRED' }, 403);
    }

    if (rewardType === 'both') {
      const [hasSns, hasReviewReward] = await Promise.all([
        hasReward(admin, user.id, context, resultId, 'sns'),
        hasReward(admin, user.id, context, resultId, 'review'),
      ]);
      if (!hasSns || !hasReviewReward) {
        return json(req, { error: '공유와 후기 보상을 먼저 완료해주세요.', code: 'PREREQUISITES_REQUIRED' }, 403);
      }
    }

    const payload = {
      user_id: user.id,
      reward_context: context,
      result_id: resultId,
      reward_type: rewardType,
      unlocked: true,
      generated_content: safeGeneratedContent(body.generatedContent),
    };
    const { data, error } = await admin
      .from('user_rewards')
      .upsert(payload, { onConflict: 'user_id,reward_context,result_id,reward_type' })
      .select('id, result_id, reward_context, reward_type, unlocked, generated_content, created_at')
      .single();
    if (error) throw error;

    if (context === 'seven_day_challenge') {
      const hasSns = rewardType === 'sns'
        || await hasReward(admin, user.id, context, null, 'sns');
      if (hasSns) {
        const { error: badgeError } = await admin
          .from('challenge_reviews')
          .update({ reward_badge: 'seven_day_finisher' })
          .eq('user_id', user.id)
          .eq('review_context', 'seven_day_challenge');
        if (badgeError) throw badgeError;
      }
    }

    return json(req, { reward: data });
  } catch (error) {
    console.error('claim-reward failed:', error);
    return json(req, { error: error instanceof Error ? error.message : '보상을 저장하지 못했습니다.' }, 500);
  }
});
