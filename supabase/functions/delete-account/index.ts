import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEFAULT_ORIGIN = 'https://hogoo-challenge.pages.dev';
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get('ALLOWED_ORIGINS') || DEFAULT_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

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

function isMissingTable(error: { code?: string; message?: string } | null) {
  return error?.code === '42P01'
    || error?.code === 'PGRST205'
    || /does not exist|schema cache/i.test(error?.message || '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: '허용되지 않은 요청입니다.' }, 405);

  const origin = req.headers.get('Origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(req, { error: '허용되지 않은 요청입니다.' }, 403);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json(req, { error: '로그인이 필요합니다.' }, 401);

    const body = await req.json().catch(() => ({}));
    if (body?.confirmation !== '계정 삭제') {
      return json(req, { error: '확인 문구가 일치하지 않습니다.' }, 400);
    }

    const url = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // 네트워크 검증을 거친 현재 사용자만 자기 계정을 지울 수 있다.
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json(req, { error: '로그인 상태를 다시 확인해주세요.' }, 401);

    // 공개 후기까지 포함해 이 서비스에서 만든 개인 활동 기록을 제거한다.
    const tables = ['user_rewards', 'user_progress', 'challenge_reviews', 'reviews', 'hall_of_fame', 'profiles'];
    for (const table of tables) {
      const column = table === 'profiles' ? 'id' : 'user_id';
      const { error } = await admin.from(table).delete().eq(column, user.id);
      if (error && !isMissingTable(error)) throw error;
    }

    // 결제 등 법정 보존 가능 기록의 참조 무결성을 위해 비가역 소프트 삭제한다.
    // 이메일·사용자 메타데이터는 제거되고 같은 계정으로 다시 로그인할 수 없다.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, true);
    if (deleteError) throw deleteError;

    return json(req, { success: true });
  } catch (error) {
    console.error('delete-account failed:', error);
    return json(req, { error: '계정 삭제를 완료하지 못했어요. 잠시 후 다시 시도해주세요.' }, 500);
  }
});
