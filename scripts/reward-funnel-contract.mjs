import { readFile } from 'node:fs/promises';

const sources = await Promise.all([
  readFile(new URL('../components/reward/ResultRewardEnvelope.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/result-reward-widget.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/MyPage.jsx', import.meta.url), 'utf8'),
]);
const combined = sources.join('\n');
const requiredEvents = [
  'reward_slide_view',
  'share_action_start',
  'review_start',
  'reward_login_open',
  'reward_login_complete',
  'reward_a_unlocked',
  'reward_b_unlocked',
  'reward_both_unlocked',
  'reward_archive_open',
  'reward_archive_view',
  'diagnosis_handoff_click',
];

const missing = requiredEvents.filter((event) => !combined.includes(`'${event}'`));
if (missing.length) throw new Error(`보상 퍼널 이벤트 누락: ${missing.join(', ')}`);

const analyticsSource = await readFile(new URL('../src/rewards/reward-analytics.js', import.meta.url), 'utf8');
for (const forbidden of ['email:', 'user_id:', 'review_content:', 'answers:', 'scores:']) {
  if (analyticsSource.includes(forbidden)) throw new Error(`분석 이벤트에 금지 필드 발견: ${forbidden}`);
}

console.log(`reward funnel contract: ${requiredEvents.length} events OK`);
