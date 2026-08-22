import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEFAULT_ORIGIN = 'https://hogoo-challenge.pages.dev';
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get('ALLOWED_ORIGINS') || DEFAULT_ORIGIN).split(',').map((item) => item.trim()).filter(Boolean),
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

async function completed(admin: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await admin.from('user_progress').select('day_index, missions').eq('user_id', userId);
  if (error) throw error;
  const days = new Set((data || []).filter((row) =>
    Number.isInteger(row.day_index)
    && row.day_index >= 0
    && row.day_index <= 6
    && Array.isArray(row.missions)
    && new Set(row.missions).size === 3
    && [0, 1, 2].every((mission) => row.missions.includes(mission)),
  ).map((row) => row.day_index));
  return days.size === 7;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: '허용되지 않은 요청입니다.' }, 405);

  const origin = req.headers.get('Origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(req, { error: '허용되지 않은 요청입니다.' }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const url = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

    if (body?.action === 'verify') {
      const code = String(body?.code || '');
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code)) {
        return json(req, { valid: false });
      }
      const { data, error } = await admin
        .from('challenge_certificates')
        .select('verification_code, completed_missions, issued_at')
        .eq('verification_code', code)
        .maybeSingle();
      if (error) throw error;
      return json(req, data ? {
        valid: true,
        certificate: {
          code: data.verification_code,
          completedMissions: data.completed_missions,
          issuedAt: data.issued_at,
        },
      } : { valid: false });
    }

    if (body?.action !== 'issue') return json(req, { error: '허용되지 않은 요청입니다.' }, 400);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json(req, { error: '로그인이 필요합니다.' }, 401);
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json(req, { error: '로그인 상태를 다시 확인해주세요.' }, 401);
    if (!(await completed(admin, user.id))) {
      return json(req, { error: '7일 미션을 모두 완료한 뒤 인증서를 받을 수 있습니다.' }, 403);
    }
    const { data, error } = await admin
      .from('challenge_certificates')
      .upsert({ user_id: user.id, completed_missions: 21 }, { onConflict: 'user_id' })
      .select('verification_code, completed_missions, issued_at')
      .single();
    if (error) throw error;
    return json(req, {
      certificate: {
        code: data.verification_code,
        completedMissions: data.completed_missions,
        issuedAt: data.issued_at,
      },
    });
  } catch (error) {
    console.error('challenge-certificate failed:', error);
    return json(req, { error: '인증서를 확인하지 못했습니다.' }, 500);
  }
});
