import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEFAULT_ORIGIN = 'https://hogoo-challenge.pages.dev';
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get('ALLOWED_ORIGINS') || DEFAULT_ORIGIN).split(',').map((item) => item.trim()).filter(Boolean),
);
const FIELDS = new Set(['missions', 'selected_phrase', 'note', 'anxiety', 'guilt']);

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
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } });
}

function sanitizeUpdates(raw: unknown) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('저장할 진행 정보가 없습니다.');
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length !== 1 || !FIELDS.has(entries[0][0])) throw new Error('한 번에 하나의 진행 항목만 저장할 수 있습니다.');
  const [field, value] = entries[0];
  if (field === 'missions') {
    if (!Array.isArray(value) || value.some((item) => !Number.isInteger(item) || item < 0 || item > 2)) {
      throw new Error('미션 정보가 올바르지 않습니다.');
    }
    const unique = [...new Set(value)].sort();
    if (unique.length !== value.length) throw new Error('중복된 미션 정보입니다.');
    return { missions: unique };
  }
  if (field === 'selected_phrase') {
    if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 2) throw new Error('선택 문장이 올바르지 않습니다.');
    return { selected_phrase: value };
  }
  if (field === 'note') return { note: String(value || '').slice(0, 1000) };
  const score = Number(value);
  if (!Number.isInteger(score) || score < 0 || score > 10) throw new Error('감정 점수는 0~10이어야 합니다.');
  return { [field]: score };
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

    const body = await req.json().catch(() => ({}));
    const dayIndex = Number(body?.dayIndex);
    if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) return json(req, { error: '일차 정보가 올바르지 않습니다.' }, 400);
    const updates = sanitizeUpdates(body?.updates);

    if (dayIndex > 0) {
      const { data: previous, error: previousError } = await admin
        .from('user_progress')
        .select('missions')
        .eq('user_id', user.id)
        .eq('day_index', dayIndex - 1)
        .maybeSingle();
      if (previousError) throw previousError;
      if (!Array.isArray(previous?.missions) || ![0, 1, 2].every((mission) => previous.missions.includes(mission))) {
        return json(req, { error: '이전 일차를 먼저 완료해주세요.', code: 'PREVIOUS_DAY_REQUIRED' }, 403);
      }
    }

    if ('missions' in updates) {
      const { data: current, error: currentError } = await admin
        .from('user_progress')
        .select('missions')
        .eq('user_id', user.id)
        .eq('day_index', dayIndex)
        .maybeSingle();
      if (currentError) throw currentError;
      const before = new Set(Array.isArray(current?.missions) ? current.missions : []);
      const after = new Set(updates.missions);
      const difference = [...after].filter((mission) => !before.has(mission)).length
        + [...before].filter((mission) => !after.has(mission)).length;
      if (difference > 1) return json(req, { error: '미션은 한 번에 하나씩 변경해주세요.' }, 400);
    }

    const { data, error } = await admin
      .from('user_progress')
      .upsert({ user_id: user.id, day_index: dayIndex, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'user_id,day_index' })
      .select('*')
      .single();
    if (error) throw error;
    return json(req, { progress: data });
  } catch (error) {
    console.error('save-challenge-progress failed:', error);
    return json(req, { error: error instanceof Error ? error.message : '진행 정보를 저장하지 못했습니다.' }, 500);
  }
});
