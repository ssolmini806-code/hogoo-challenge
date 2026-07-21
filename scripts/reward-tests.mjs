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
  const state = { rows: rows.map((r) => ({ ...r })), deletes: 0, inserts: 0, updates: 0 };
  let nextId = state.rows.length + 1;

  function makeQuery(table) {
    const filters = {};
    let mode = 'select';
    let payload = null;
    let limit = Infinity;

    const query = {
      select() { mode = 'select'; return query; },
      insert(values) { mode = 'insert'; payload = values; return query; },
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
  assert.equal(await service.saveReward('user-1', 'give-test:angel', 'sns'), 'inserted');
  assert.equal(await service.saveReward('user-1', 'give-test:angel', 'sns'), 'updated');
  assert.equal(client.state.rows.length, 1);

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
