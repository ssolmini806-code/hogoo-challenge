// 보상 도메인 로직 단위 테스트 (node --test, 추가 의존성 없음)
// 실행: node --test scripts/reward-tests.mjs  (또는 npm run verify)

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildResultId, normalizeTypeKey, parseTypeKey } from '../src/rewards/result-id.js';
import { TYPE_KEYS, AXIS_KEYS } from '../src/rewards/reward-types.js';
import {
  buildBoundaryCard,
  buildRiskScenes,
  buildGoodwillManual,
  highestAxis,
  normalizeScores,
} from '../src/rewards/give-reward-content.js';
import {
  sanitizeReturnPath,
  buildReviewStartUrl,
  buildRewardReturnPath,
} from '../src/rewards/reward-return-url.js';
import {
  buildResultShareUrl,
  buildDiagnosisUrl,
  FORBIDDEN_SHARE_PARAMS,
} from '../src/rewards/share-url.js';
import { createRewardService } from '../src/rewards/free-test-reward-service.js';

const ORIGIN = 'https://hogoo-challenge.pages.dev';

// ── 1. result_id 생성 ──────────────────────────────────────────────
test('result_id는 give-test:<typeKey> 형식으로 만들어진다', () => {
  assert.equal(buildResultId('diplomat'), 'give-test:diplomat');
  for (const key of TYPE_KEYS) {
    assert.equal(buildResultId(key), `give-test:${key}`);
    assert.equal(parseTypeKey(buildResultId(key)), key);
  }
});

test('잘못된 type은 fallback(mixed)으로 정규화된다', () => {
  assert.equal(normalizeTypeKey('does-not-exist'), 'mixed');
  assert.equal(normalizeTypeKey(null), 'mixed');
  assert.equal(normalizeTypeKey(undefined), 'mixed');
  assert.equal(normalizeTypeKey(42), 'mixed');
  assert.equal(buildResultId('<script>'), 'give-test:mixed');
  assert.equal(parseTypeKey('give-test:nope'), null);
  assert.equal(parseTypeKey('other-test:diplomat'), null);
});

// ── 2. 유형별 A 콘텐츠 ─────────────────────────────────────────────
test('A 보상은 유형마다 다른 경계 문장을 만든다', () => {
  const sentences = new Set();
  for (const key of TYPE_KEYS) {
    const card = buildBoundaryCard(key);
    assert.equal(card.typeKey, key);
    assert.ok(card.sentence.length > 10, `${key}: 경계 문장이 비어있다`);
    assert.ok(card.situation.length > 10, `${key}: 사용 상황이 비어있다`);
    assert.ok(card.title.includes('첫 문장'));
    assert.ok(card.teaserHint.includes('…'), '미리보기는 문장을 일부만 보여준다');
    assert.ok(!card.teaserHint.includes(card.sentence), '미리보기에 전체 문장이 노출되면 안 된다');
    sentences.add(card.sentence);
  }
  assert.equal(sentences.size, TYPE_KEYS.length, '유형별 문장이 중복되면 안 된다');
});

test('A 보상은 결정적이다 (같은 입력 → 같은 출력)', () => {
  assert.deepEqual(buildBoundaryCard('angel'), buildBoundaryCard('angel'));
});

// ── 3. 축별 B 콘텐츠 ───────────────────────────────────────────────
test('B 보상은 가장 높은 축을 골라 장면 3개를 만든다', () => {
  const scores = { burnout: 5, refusal: 15, reciprocity: 8, recovery: 6 };
  const result = buildRiskScenes('diplomat', scores);
  assert.equal(result.axis, 'refusal');
  assert.equal(result.axisTitle, '거절 곤란');
  assert.equal(result.axisLevelLabel, '죄책감 자동수락 구간');
  assert.equal(result.scenes.length, 3);
  for (const scene of result.scenes) {
    assert.ok(scene.scene && scene.signal && scene.response, '장면/신호/대응이 모두 있어야 한다');
  }
});

test('B 보상의 세 번째 대응 문장은 유형 고유 경계 문장이다 (축×유형 조합)', () => {
  const scores = { burnout: 15, refusal: 5, reciprocity: 5, recovery: 5 };
  const angel = buildRiskScenes('angel', scores);
  const blocker = buildRiskScenes('blocker', scores);
  assert.equal(angel.axis, blocker.axis, '같은 점수면 같은 축');
  assert.notEqual(angel.scenes[2].response, blocker.scenes[2].response, '유형이 다르면 대응 문장이 달라야 한다');
  assert.equal(angel.scenes[2].response, buildBoundaryCard('angel').sentence);
});

test('모든 축이 장면 3개를 갖는다', () => {
  for (const axis of AXIS_KEYS) {
    const scores = Object.fromEntries(AXIS_KEYS.map((a) => [a, a === axis ? 16 : 4]));
    const result = buildRiskScenes('mixed', scores);
    assert.equal(result.axis, axis);
    assert.equal(result.scenes.length, 3);
  }
});

test('축 동점이면 결정적으로 같은 축을 고른다', () => {
  const tied = { burnout: 10, refusal: 10, reciprocity: 10, recovery: 10 };
  assert.equal(highestAxis(tied, 'mixed'), highestAxis(tied, 'mixed'));
  assert.equal(highestAxis(tied, 'mixed'), 'burnout');
});

// ── 4. A+B 콘텐츠 ──────────────────────────────────────────────────
test('A+B는 7개 섹션과 3장 페이지 구성을 갖는다', () => {
  const manual = buildGoodwillManual('burnout', { burnout: 16, refusal: 9, reciprocity: 8, recovery: 14 });
  assert.equal(manual.sections.length, 7);
  assert.equal(manual.pages.length, 3);
  const ids = manual.sections.map((s) => s.id);
  assert.deepEqual(ids, ['type', 'axis', 'scene', 'signal', 'sentence', 'action', 'next']);
  const paged = manual.pages.flatMap((p) => p.sectionIds);
  assert.deepEqual([...paged].sort(), [...ids].sort(), '모든 섹션이 정확히 한 번씩 페이지에 배치돼야 한다');
});

test('A+B는 유형명만 바뀐 템플릿이 아니다', () => {
  const scores = { burnout: 16, refusal: 5, reciprocity: 5, recovery: 5 };
  const otherScores = { burnout: 5, refusal: 16, reciprocity: 5, recovery: 5 };
  const a = buildGoodwillManual('angel', scores);
  const b = buildGoodwillManual('angel', otherScores);
  assert.notEqual(a.axis, b.axis, '점수가 다르면 축이 달라진다');
  assert.notEqual(
    JSON.stringify(a.sections),
    JSON.stringify(b.sections),
    '같은 유형이라도 점수가 다르면 본문이 달라져야 한다',
  );
});

test('A+B에 가격·구매 유도 문구가 없다', () => {
  // "결제 없이"는 스펙이 요구하는 문구라 허용하고, 결제를 유도하는 표현만 막는다.
  const banned = [/\d[\d,]*\s*원/, /구매/, /결제하/, /결제 하/, /product/, /할인/, /가격/];
  for (const key of TYPE_KEYS) {
    const text = JSON.stringify(buildGoodwillManual(key, null));
    for (const pattern of banned) {
      assert.ok(!pattern.test(text), `${key}: 금지 문구 ${pattern} 발견`);
    }
    assert.ok(!/결제(?!\s*없이)/.test(text), `${key}: "결제 없이" 외의 결제 문구가 있다`);
  }
});

// ── 5. 점수 누락 fallback ──────────────────────────────────────────
test('점수가 없거나 깨졌으면 유형 기준 축으로 fallback한다', () => {
  assert.equal(normalizeScores(null), null);
  assert.equal(normalizeScores({ burnout: 5 }), null);
  assert.equal(normalizeScores({ burnout: 'x', refusal: 5, reciprocity: 5, recovery: 5 }), null);

  const noScores = buildRiskScenes('diplomat', null);
  assert.equal(noScores.axis, 'refusal');
  assert.equal(noScores.axisLevelLabel, null, '점수가 없으면 수준 라벨을 지어내지 않는다');
  assert.equal(noScores.scenes.length, 3);

  const manual = buildGoodwillManual('diplomat', undefined);
  assert.ok(manual.sections[1].detail.includes('점수 기록이 없어'));
});

test('축 점수는 4~16 범위로 정규화된다', () => {
  assert.deepEqual(
    normalizeScores({ burnout: 0, refusal: 99, reciprocity: 8.4, recovery: 12 }),
    { burnout: 4, refusal: 16, reciprocity: 8, recovery: 12 },
  );
});

// ── 6. 잘못된 type fallback ────────────────────────────────────────
test('알 수 없는 유형이 들어와도 콘텐츠가 만들어진다', () => {
  const card = buildBoundaryCard('completely-unknown');
  assert.equal(card.typeKey, 'mixed');
  const manual = buildGoodwillManual(null, null);
  assert.equal(manual.typeKey, 'mixed');
  assert.equal(manual.sections.length, 7);
});

// ── 7~8. return URL 보안 ───────────────────────────────────────────
test('허용된 내부 경로만 return으로 통과한다', () => {
  assert.equal(
    sanitizeReturnPath('/result-sequence.html?test=give&type=diplomat&reward=reviewed#reward', ORIGIN),
    '/result-sequence.html?test=give&type=diplomat&reward=reviewed#reward',
  );
  assert.equal(sanitizeReturnPath('/give-test.html', ORIGIN), '/give-test.html');
  assert.equal(
    sanitizeReturnPath(`${ORIGIN}/result-sequence.html?type=angel`, ORIGIN),
    '/result-sequence.html?type=angel',
  );
});

test('외부 URL과 위험한 스킴은 차단된다', () => {
  const blocked = [
    'https://evil.example.com/phish',
    'http://evil.example.com',
    '//evil.example.com',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'javascript:void(0)',
    `${ORIGIN}.evil.com/result-sequence.html`,
    '/admin-secret.html',
    '/privacy.html',
    '',
    null,
    undefined,
    123,
  ];
  for (const value of blocked) {
    assert.equal(sanitizeReturnPath(value, ORIGIN), '', `차단 실패: ${String(value)}`);
  }
});

test('후기 시작 URL은 context/rid/result_type/안전한 return을 담는다', () => {
  const url = new URL(buildReviewStartUrl('diplomat'), ORIGIN);
  assert.equal(url.pathname, '/reviews.html');
  assert.equal(url.searchParams.get('context'), 'free_test');
  assert.equal(url.searchParams.get('rid'), 'give-test:diplomat');
  assert.equal(url.searchParams.get('result_type'), 'diplomat');
  const back = url.searchParams.get('return');
  assert.equal(sanitizeReturnPath(back, ORIGIN), buildRewardReturnPath('diplomat'));
});

// ── 공유 URL ───────────────────────────────────────────────────────
test('공유 URL은 결과 URL이고 점수·사용자 정보를 담지 않는다', () => {
  const url = new URL(buildResultShareUrl(ORIGIN, 'diplomat'));
  assert.equal(url.origin, ORIGIN);
  assert.equal(url.pathname, '/result-sequence.html');
  assert.equal(url.searchParams.get('type'), 'diplomat');
  assert.equal(url.searchParams.get('utm_medium'), 'result_card');
  for (const param of FORBIDDEN_SHARE_PARAMS) {
    assert.equal(url.searchParams.get(param), null, `공유 URL에 ${param}이 있으면 안 된다`);
  }
});

test('진단 연결 URL에 product/result_type/가격이 없다', () => {
  const url = new URL(buildDiagnosisUrl('https://givecosystem.com'));
  assert.equal(url.pathname, '/start');
  assert.equal(url.searchParams.get('utm_campaign'), 'give_id_diagnosis');
  for (const param of ['product', 'result_type', 'price', 'journey_id']) {
    assert.equal(url.searchParams.get(param), null);
  }
});

// ── 9~11. 보상 서비스 계약 ─────────────────────────────────────────
function createFakeClient(rows = []) {
  const state = { rows: rows.map((r) => ({ ...r })), deletes: 0, inserts: 0, updates: 0, upserts: 0 };
  let nextId = state.rows.length + 1;

  function makeQuery(table) {
    const filters = {};
    let mode = 'select';
    let payload = null;
    let limit = Infinity;

    const query = {
      select() { mode = 'select'; return query; },
      insert(values) { mode = 'insert'; payload = values; return query; },
      upsert(values) { mode = 'upsert'; payload = values; return query; },
      update(values) { mode = 'update'; payload = values; return query; },
      delete() { mode = 'delete'; return query; },
      eq(column, value) { filters[column] = value; return query; },
      limit(n) { limit = n; return query; },
      then(resolve) { return Promise.resolve(query.run()).then(resolve); },
      run() {
        if (table !== 'user_rewards') return { data: [], error: null };
        const match = (row) => Object.entries(filters).every(([k, v]) => row[k] === v);

        if (mode === 'insert') {
          state.inserts += 1;
          state.rows.push({ id: `row-${nextId++}`, created_at: '2026-07-21T00:00:00Z', ...payload });
          return { data: null, error: null };
        }
        if (mode === 'upsert') {
          state.upserts += 1;
          const identity = ['user_id', 'reward_context', 'result_id', 'reward_type'];
          const existing = state.rows.find((row) => identity.every((key) => (row[key] ?? null) === (payload[key] ?? null)));
          if (existing) {
            state.updates += 1;
            Object.assign(existing, payload);
          } else {
            state.inserts += 1;
            state.rows.push({ id: `row-${nextId++}`, created_at: '2026-07-21T00:00:00Z', ...payload });
          }
          return { data: null, error: null };
        }
        if (mode === 'update') {
          state.updates += 1;
          state.rows.filter(match).forEach((row) => Object.assign(row, payload));
          return { data: null, error: null };
        }
        if (mode === 'delete') {
          state.deletes += 1;
          state.rows = state.rows.filter((row) => !match(row));
          return { data: null, error: null };
        }
        return { data: state.rows.filter(match).slice(0, limit), error: null };
      },
    };
    return query;
  }

  return { state, from: (table) => makeQuery(table) };
}

const baseRow = (over) => ({
  user_id: 'user-1',
  reward_context: 'free_test',
  result_id: 'give-test:diplomat',
  reward_type: 'sns',
  unlocked: true,
  generated_content: null,
  ...over,
});

test('보상 상태는 result_id별로 격리된다', async () => {
  const client = createFakeClient([
    baseRow({ reward_type: 'sns' }),
    baseRow({ reward_type: 'review' }),
    baseRow({ result_id: 'give-test:angel', reward_type: 'sns' }),
  ]);
  const service = createRewardService(client);

  const diplomat = await service.fetchRewardStatus('user-1', 'give-test:diplomat');
  assert.equal(diplomat.sns, true);
  assert.equal(diplomat.review, true);

  const angel = await service.fetchRewardStatus('user-1', 'give-test:angel');
  assert.equal(angel.sns, true);
  assert.equal(angel.review, false, '다른 유형의 후기 보상이 섞이면 안 된다');

  const guardian = await service.fetchRewardStatus('user-1', 'give-test:guardian');
  assert.deepEqual(
    { sns: guardian.sns, review: guardian.review, both: guardian.both },
    { sns: false, review: false, both: false },
  );
});

test('다른 사용자의 보상이 섞이지 않는다', async () => {
  const client = createFakeClient([
    baseRow({ user_id: 'user-2', reward_type: 'sns' }),
    baseRow({ user_id: 'user-2', reward_type: 'review' }),
  ]);
  const service = createRewardService(client);
  const mine = await service.fetchRewardStatus('user-1', 'give-test:diplomat');
  assert.equal(mine.sns, false);
  assert.equal(mine.review, false);
});

test('result_id가 없는 레거시 보상은 현재 결과에 해금으로 적용되지 않는다', async () => {
  const client = createFakeClient([baseRow({ result_id: null, reward_type: 'sns' })]);
  const service = createRewardService(client);
  const status = await service.fetchRewardStatus('user-1', 'give-test:diplomat');
  assert.equal(status.sns, false);
  // 하지만 보관함에서는 그대로 보인다 (삭제하지 않는다)
  const archive = await service.fetchArchive('user-1');
  assert.equal(archive.length, 1);
});

test('A와 B가 같은 결과에서 모두 해금됐을 때만 both가 열린다', async () => {
  const build = () => ({ kind: 'goodwill_manual' });

  const onlyShare = createRewardService(createFakeClient([baseRow({ reward_type: 'sns' })]));
  assert.equal((await onlyShare.ensureBothReward('user-1', 'give-test:diplomat', build)).unlocked, false);

  const crossResult = createRewardService(createFakeClient([
    baseRow({ reward_type: 'sns' }),
    baseRow({ result_id: 'give-test:angel', reward_type: 'review' }),
  ]));
  assert.equal(
    (await crossResult.ensureBothReward('user-1', 'give-test:diplomat', build)).unlocked,
    false,
    '다른 결과의 후기 보상으로 both가 열리면 안 된다',
  );

  const client = createFakeClient([baseRow({ reward_type: 'sns' }), baseRow({ reward_type: 'review' })]);
  const service = createRewardService(client);
  const first = await service.ensureBothReward('user-1', 'give-test:diplomat', build);
  assert.equal(first.unlocked, true);
  assert.equal(first.created, true);

  // 두 번 호출해도 row가 늘지 않는다 (중복 저장 방지)
  const insertsAfterFirst = client.state.inserts;
  const second = await service.ensureBothReward('user-1', 'give-test:diplomat', build);
  assert.equal(second.created, false);
  assert.equal(client.state.inserts, insertsAfterFirst);
});

test('같은 보상을 다시 저장해도 row가 중복 생성되지 않는다', async () => {
  const client = createFakeClient([]);
  const service = createRewardService(client);
  assert.equal(await service.saveReward('user-1', 'give-test:angel', 'sns'), 'saved');
  assert.equal(await service.saveReward('user-1', 'give-test:angel', 'sns'), 'saved');
  assert.equal(client.state.rows.length, 1);
  assert.equal(client.state.upserts, 2, '조회 후 저장이 아니라 원자적 upsert를 사용해야 한다');

  // 다른 결과는 별도 row로 저장된다
  await service.saveReward('user-1', 'give-test:diplomat', 'sns');
  assert.equal(client.state.rows.length, 2);
});

test('보상 서비스에는 삭제 경로가 없다 (재검사가 DB 보상을 지우지 못한다)', async () => {
  const client = createFakeClient([baseRow({ reward_type: 'sns' })]);
  const service = createRewardService(client);
  assert.equal(typeof service.delete, 'undefined');
  assert.equal(Object.keys(service).some((k) => /delete|reset|clear/i.test(k)), false);

  // 서비스 전체를 한 바퀴 돌려도 delete가 한 번도 호출되지 않는다
  await service.fetchRewardStatus('user-1', 'give-test:diplomat');
  await service.saveReward('user-1', 'give-test:diplomat', 'review');
  await service.ensureBothReward('user-1', 'give-test:diplomat', () => ({}));
  await service.fetchArchive('user-1');
  assert.equal(client.state.deletes, 0);
  assert.equal(client.state.rows.length, 3, '기존 보상이 그대로 남아 있어야 한다');
});

// ── 회귀: 후기 보상은 DB row로만 판정된다 ──────────────────────────
test('review row가 없으면 both를 만들지 않는다 (URL 파라미터로 해금 불가)', async () => {
  // reward=reviewed를 수동 입력해도 위젯은 saveReward('review')를 하지 않는다.
  // 서비스 관점에서는 "sns만 있는 상태"이므로 both가 열리면 안 된다.
  const client = createFakeClient([baseRow({ reward_type: 'sns' })]);
  const service = createRewardService(client);
  const status = await service.fetchRewardStatus('user-1', 'give-test:diplomat');
  assert.equal(status.review, false);
  const both = await service.ensureBothReward('user-1', 'give-test:diplomat', () => ({}));
  assert.equal(both.unlocked, false);
  assert.equal(client.state.rows.length, 1, 'row가 새로 생기면 안 된다');
});

test('실제 review row가 있으면 B가 해금되고 both가 열린다', async () => {
  const client = createFakeClient([
    baseRow({ reward_type: 'sns' }),
    baseRow({ reward_type: 'review' }),
  ]);
  const service = createRewardService(client);
  const status = await service.fetchRewardStatus('user-1', 'give-test:diplomat');
  assert.equal(status.review, true);
  assert.equal((await service.ensureBothReward('user-1', 'give-test:diplomat', () => ({ ok: 1 }))).unlocked, true);
});

test('보상 저장 오류는 삼켜지지 않고 호출자에게 전달된다', async () => {
  const denied = { data: null, error: { message: 'rls denied' } };
  const failing = {
    from: () => ({
      select() { return this; },
      upsert() { return Promise.resolve(denied); },
      eq() { return this; },
      limit() { return Promise.resolve(denied); },
      then(resolve) { return Promise.resolve(denied).then(resolve); },
    }),
  };
  const service = createRewardService(failing);
  await assert.rejects(
    () => service.saveReward('user-1', 'give-test:angel', 'review'),
    (err) => err.message === 'rls denied',
  );
  await assert.rejects(() => service.fetchRewardStatus('user-1', 'give-test:angel'));
});

test('보상 저장만 재시도해도 후기 row는 건드리지 않는다', async () => {
  // reviews.html은 후기 저장(challenge_reviews)과 보상 저장을 분리한다.
  // 보상 저장 재시도는 user_rewards만 건드려야 한다.
  const client = createFakeClient([]);
  const service = createRewardService(client);
  await service.saveReward('user-1', 'give-test:angel', 'review', { kind: 'risk_scenes' });
  const touched = new Set(client.state.rows.map((r) => r.reward_context));
  assert.deepEqual([...touched], ['free_test']);
  assert.equal(client.state.rows.length, 1);
  // 재시도해도 중복 생성되지 않는다
  await service.saveReward('user-1', 'give-test:angel', 'review', { kind: 'risk_scenes' });
  assert.equal(client.state.rows.length, 1);
});

test('rid는 result_type으로 만든 result_id와 일치해야 한다', () => {
  // reviews.html이 저장 전에 검증하는 규칙
  assert.equal(buildResultId('diplomat'), 'give-test:diplomat');
  assert.notEqual(buildResultId('angel'), 'give-test:diplomat');
  // 위조된 rid는 result_type과 어긋나므로 저장이 거부된다
  const forged = 'give-test:guardian';
  assert.notEqual(forged, buildResultId('diplomat'));
});

// ── 회귀: 후기 삭제가 보상 row를 중복 생성하지 않는다 ──────────────
// 예전 코드는 both row의 reward_type을 'sns'로 바꿔 "다운그레이드"했다.
// A+B를 받았다면 sns row는 반드시 존재하므로, 이 update는 sns 중복 row를 만들고
// A+B용 generated_content까지 잃는다. 잠금(unlocked)만 내려야 한다.
test('후기 삭제 경로는 reward_type을 다시 쓰지 않는다', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const root = fileURLToPath(new URL('..', import.meta.url));
  for (const file of ['reviews.html', 'App.jsx']) {
    const source = readFileSync(root + file, 'utf8');
    assert.ok(
      !/update\(\s*\{\s*reward_type\s*:/.test(source),
      `${file}: reward_type을 update하면 보상 row가 중복된다`,
    );
  }
});

// ── 회귀: 마이페이지 빈 상태 모순 ──────────────────────────────────
// MyPage는 로그인 뒤에만 렌더되어 브라우저 테스트로 넣기 어렵다.
// "무료 보상이 있는데 '아직 해금된 보상이 없어요'가 같이 뜨는" 모순만 소스 수준에서 고정한다.
test('마이페이지에 무료 보상과 빈 보상 문구가 동시에 표시되지 않는다', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/components/MyPage.jsx', import.meta.url), 'utf8');
  assert.ok(
    !source.includes('아직 해금된 보상이 없어요'),
    '무료 보상 봉투와 모순되는 빈 상태 문구가 남아 있다',
  );
  assert.ok(
    source.includes('{otherRewards > 0 && ('),
    '보상 현황 섹션은 챌린지·유료 보상이 있을 때만 렌더돼야 한다',
  );
  assert.ok(
    source.includes('<RewardArchive rewards={freeTestRewards} />'),
    '무료 결과 보상은 보상 봉투 섹션에서 렌더돼야 한다',
  );
  assert.ok(
    source.includes("reward_context === 'free_test'"),
    'free_test 컨텍스트로 무료 보상을 골라야 한다',
  );
});

// ── 회귀: 마이페이지 '내 후기' 데이터 소스 ─────────────────────────
// reviews.html은 challenge_reviews에 저장하는데 MyPage는 레거시 reviews만 읽고 있었다.
// 두 곳을 함께 읽되, 남의 후기가 섞이거나 RLS 밖 컬럼을 요구하면 안 된다.
test('현재 후기와 레거시 후기를 최신순으로 합친다', async () => {
  const { mergeMyReviews } = await import('../src/rewards/my-reviews.js');
  const merged = mergeMyReviews(
    [
      { content: '무료 진단 후기', rating: 5, review_context: 'free_test', created_at: '2026-07-20T10:00:00Z' },
      { content: '챌린지 후기', rating: 4, review_context: 'seven_day_challenge', created_at: '2026-07-18T10:00:00Z' },
    ],
    [{ content: '예전 후기', review_context: 'giveid', created_at: '2026-07-19T10:00:00Z' }],
  );
  assert.deepEqual(merged.map((r) => r.content), ['무료 진단 후기', '예전 후기', '챌린지 후기']);
  assert.deepEqual(merged.map((r) => r.isLegacy), [false, true, false]);
  assert.equal(merged[0].rating, 5);
});

test('레거시 테이블이 없거나 조회에 실패해도 현재 후기는 보인다', async () => {
  const { mergeMyReviews } = await import('../src/rewards/my-reviews.js');
  const rows = [{ content: '무료 진단 후기', review_context: 'free_test', created_at: '2026-07-20T10:00:00Z' }];
  for (const legacy of [null, undefined, [], { error: 'relation does not exist' }]) {
    const merged = mergeMyReviews(rows, legacy);
    assert.equal(merged.length, 1, `legacy=${JSON.stringify(legacy)}`);
    assert.equal(merged[0].content, '무료 진단 후기');
  }
  // 반대로 현재 후기 조회가 실패해도 레거시는 남는다
  assert.equal(mergeMyReviews(null, [{ content: '예전 후기', created_at: '2026-01-01T00:00:00Z' }]).length, 1);
  assert.deepEqual(mergeMyReviews(null, null), []);
});

test('내용이 빈 후기는 목록에 넣지 않는다', async () => {
  const { mergeMyReviews } = await import('../src/rewards/my-reviews.js');
  const merged = mergeMyReviews(
    [{ content: '   ', created_at: '2026-07-20T10:00:00Z' }, { content: '실제 후기', created_at: '2026-07-19T10:00:00Z' }],
    null,
  );
  assert.deepEqual(merged.map((r) => r.content), ['실제 후기']);
});

test('무료 GIVE ID 후기 컨텍스트가 사람이 읽는 이름으로 표시된다', async () => {
  const { reviewContextLabel } = await import('../src/rewards/my-reviews.js');
  assert.equal(reviewContextLabel('free_test'), '무료 GIVE ID 진단');
  assert.equal(reviewContextLabel('seven_day_challenge'), '7일 챌린지');
  // 모르는 값이나 빈 값에서도 화면이 깨지지 않는다
  assert.equal(reviewContextLabel('unknown_ctx'), 'unknown_ctx');
  assert.equal(reviewContextLabel(null), '후기');
  assert.equal(reviewContextLabel(''), '후기');
});

test('마이페이지 후기 조회는 challenge_reviews를 본인 user_id로만 읽는다', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/components/MyPage.jsx', import.meta.url), 'utf8');

  assert.ok(source.includes("supabase.from('challenge_reviews')"), '현재 후기 테이블을 읽어야 한다');
  assert.ok(source.includes("supabase.from('reviews')"), '레거시 후기도 함께 읽어야 한다');

  // 두 조회 모두 본인 user_id로 걸려야 남의 후기가 섞이지 않는다
  for (const table of ['challenge_reviews', 'reviews']) {
    const start = source.indexOf(`supabase.from('${table}')`);
    assert.ok(start > -1);
    const statement = source.slice(start, source.indexOf('\n', source.indexOf('order(', start)));
    assert.ok(statement.includes(".eq('user_id', uid)"), `${table} 조회에 user_id 필터가 없다`);
  }
});

test('후기 조회 컬럼이 RLS grant 범위 안에 있다', async () => {
  const { readFileSync } = await import('node:fs');
  const { CHALLENGE_REVIEW_COLUMNS, LEGACY_REVIEW_COLUMNS } = await import('../src/rewards/my-reviews.js');
  const migration = readFileSync(
    new URL('../supabase/migrations/20260613000000_challenge_reviews_rls.sql', import.meta.url),
    'utf8',
  );
  // 마이그레이션의 select 컬럼 grant 목록을 뽑는다
  const grantBlock = migration.slice(migration.indexOf('grant select ('), migration.indexOf(') on public.challenge_reviews'));
  const granted = grantBlock.replace('grant select (', '').split(',').map((c) => c.trim()).filter(Boolean);

  for (const column of CHALLENGE_REVIEW_COLUMNS.split(',').map((c) => c.trim())) {
    assert.ok(granted.includes(column), `challenge_reviews.${column}은 select grant 대상이 아니다`);
  }
  // 레거시 테이블은 컬럼 grant가 아니라 정책만 있으므로 존재 컬럼만 확인
  assert.deepEqual(
    LEGACY_REVIEW_COLUMNS.split(',').map((c) => c.trim()),
    ['content', 'review_context', 'created_at'],
  );
});

test('마이페이지 공개 경로는 챌린지 React 엔트리로 정확히 rewrite된다', async () => {
  const { readFileSync } = await import('node:fs');
  const redirects = readFileSync(new URL('../public/_redirects', import.meta.url), 'utf8');
  assert.match(redirects, /^\/mypage\s+\/hogoo-test\s+200$/m);
});

test('보상 화면에는 실제 마이페이지 링크가 있고 비로그인 접근은 인증으로 막힌다', async () => {
  const { readFileSync } = await import('node:fs');
  const reward = readFileSync(new URL('../components/reward/ResultRewardEnvelope.jsx', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');
  assert.ok(reward.includes('href="/mypage"'), '보상 화면에 /mypage 링크가 없다');
  assert.ok(app.includes("pathname === '/mypage'"), '앱이 /mypage 경로를 판정하지 않는다');
  assert.ok(app.includes('if (!authReady)'), '인증 확인 전 상태를 구분하지 않는다');
  assert.ok(app.includes('if (!session)'), '비로그인 마이페이지 게이트가 없다');
  assert.ok(app.includes('로그인하고 보상 보기'), '로그인 CTA가 없다');
});

test('classic 검사와 React 보상은 같은 유형·축 카탈로그를 사용한다', async () => {
  const { readFileSync } = await import('node:fs');
  const { runInNewContext } = await import('node:vm');
  const { TYPES, AXES } = await import('../src/rewards/give-type-data.js');
  const generated = readFileSync(new URL('../public/give-type-catalog.generated.js', import.meta.url), 'utf8');
  const sandbox = { window: {} };
  runInNewContext(generated, sandbox);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.window.GIVE_TYPE_CATALOG.types)), TYPES);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.window.GIVE_TYPE_CATALOG.axes)), AXES);

  const logic = readFileSync(new URL('../public/give-test-logic.js', import.meta.url), 'utf8');
  assert.ok(logic.includes('...typeCatalog.angel'));
  assert.ok(logic.includes('const axisDefinitions = sharedAxisDefinitions'));
  assert.doesNotMatch(logic, /name:\s*["']다 퍼주는 강아지/);
  assert.doesNotMatch(logic, /const legacyAxisDefinitions/);
});

test('user_rewards는 DB 유니크 식별자와 원자적 upsert를 함께 쓴다', async () => {
  const { readFileSync } = await import('node:fs');
  const migration = readFileSync(new URL('../supabase/migrations/20260722000000_user_rewards_unique_identity.sql', import.meta.url), 'utf8');
  const service = readFileSync(new URL('../src/rewards/free-test-reward-service.js', import.meta.url), 'utf8');
  assert.match(migration, /nulls not distinct/i);
  assert.match(migration, /user_id, reward_context, result_id, reward_type/);
  assert.match(service, /\.upsert\(payload/);
  assert.ok(service.includes("onConflict: 'user_id,reward_context,result_id,reward_type'"));
});

test('계정 삭제는 서버 함수에서 사용자 JWT를 검증하고 관리자 키를 브라우저에 노출하지 않는다', async () => {
  const { readFileSync } = await import('node:fs');
  const edge = readFileSync(new URL('../supabase/functions/delete-account/index.ts', import.meta.url), 'utf8');
  const mypage = readFileSync(new URL('../src/components/MyPage.jsx', import.meta.url), 'utf8');
  assert.ok(edge.includes('userClient.auth.getUser()'));
  assert.ok(edge.includes('admin.auth.admin.deleteUser(user.id, true)'));
  assert.ok(edge.includes("code: 'SHARED_ACCOUNT'"));
  assert.ok(edge.includes("'give_id_results', 'challenge_bases', 'challenge_days', 'give_flow_logs', 'user_subscriptions'"));
  assert.ok(edge.includes("body?.confirmation !== '계정 삭제'"));
  assert.doesNotMatch(mypage, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.ok(mypage.includes("supabase.functions.invoke('delete-account'"));
  assert.ok(mypage.includes("deleteText !== '계정 삭제'"));
});

test('챌린지와 인증 입력 컨트롤은 스크린리더용 이름을 가진다', async () => {
  const { readFileSync } = await import('node:fs');
  const app = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');
  const challengeCss = readFileSync(new URL('../public/challenge-world.css', import.meta.url), 'utf8');
  const loginButton = readFileSync(new URL('../src/components/LoginButton.tsx', import.meta.url), 'utf8');
  const loginModal = readFileSync(new URL('../src/components/LoginModal.tsx', import.meta.url), 'utf8');

  for (const label of [
    '오늘 내가 실제로 한 말 또는 행동', '후기에 표시할 이름', '후기 평점',
    '챌린지 후기 내용', '새 비밀번호',
  ]) assert.ok(app.includes(`aria-label="${label}"`));
  for (const label of ['초대할 친구 이메일 주소', '변경할 새 이메일 주소']) {
    assert.ok(loginButton.includes(`aria-label="${label}"`));
  }
  for (const label of ['비밀번호 재설정 이메일', 'aria-label="이메일"', 'aria-label="비밀번호"']) {
    assert.ok(loginModal.includes(label));
  }
  assert.match(challengeCss, /#root\{min-height:100vh;\}/);
});

test('결과 화면은 숨겨진 매칭 이미지를 지연하고 배경 이미지를 우선 로드한다', async () => {
  const { readFileSync } = await import('node:fs');
  const resultSequence = readFileSync(new URL('../result-sequence.html', import.meta.url), 'utf8');
  assert.ok(resultSequence.includes('rel="preload" as="image" href="/images/results/give-result-path-v2.webp"'));
  assert.ok(resultSequence.includes('img.dataset.src = matchType.character'));
  assert.ok(resultSequence.includes('function loadSlideImages(slide)'));
  assert.doesNotMatch(resultSequence, /img\.src = matchType\.character/);
});
