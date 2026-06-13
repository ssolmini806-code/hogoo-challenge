import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGIN = 'https://hogoo-challenge.pages.dev';
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get('ALLOWED_ORIGINS') || ALLOWED_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin');
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    const origin = req.headers.get('Origin');
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse(req, { error: '허용되지 않은 요청입니다' }, 403);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(req, { error: '인증이 필요합니다' }, 401);
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return jsonResponse(req, { error: '유효한 이메일을 입력해주세요' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse(req, { error: '인증이 필요합니다' }, 401);
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
    );

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://hogoo-challenge.pages.dev/hogoo-test.html',
    });

    if (error) throw error;

    return jsonResponse(req, { success: true });
  } catch (err) {
    console.error('invite-user failed:', err);
    return jsonResponse(req, { error: '초대 처리에 실패했습니다' }, 500);
  }
});
