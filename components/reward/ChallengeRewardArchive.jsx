import { useMemo } from 'react';

const LABELS = {
  sns: ['완주 인장', '검증 가능한 인증서와 공유 카드'],
  review: ['7일 회고록', '실제 행동·감정 기록으로 만든 회고'],
  both: ['30일 적합도', '나의 기록을 근거로 한 다음 단계 카드'],
};

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ChallengeRewardArchive({ rewards }) {
  const earned = useMemo(() => {
    const byType = new Map();
    for (const row of rewards ?? []) {
      if (row.unlocked && LABELS[row.reward_type]) byType.set(row.reward_type, row);
    }
    return byType;
  }, [rewards]);

  if (!earned.size) {
    return (
      <div className="challenge-archive-empty">
        <strong>아직 완주 인장이 비어 있어요.</strong>
        <p>7일·21개 미션을 완료하고 공유 카드를 만들면 첫 인장이 기록됩니다.</p>
        <a href="/hogoo-test.html">7일 챌린지 이어가기</a>
      </div>
    );
  }

  const badgeReward = earned.get('sns');
  const completedCount = ['sns', 'review', 'both'].filter((type) => earned.has(type)).length;

  return (
    <div className="challenge-archive">
      <div className="challenge-finisher-card">
        <div className="challenge-finisher-seal" aria-label="7일 경계 연습 완주자 배지">
          <span>7</span>
          <small>DAYS</small>
        </div>
        <div>
          <p>BOUNDARY PRACTICE · FINISHER</p>
          <h3>7일 경계 연습 완주자</h3>
          <span>21개 미션을 마치고 내 선의를 지키는 기준을 기록했습니다.</span>
          {badgeReward?.created_at ? <time dateTime={badgeReward.created_at}>획득일 · {formatDate(badgeReward.created_at)}</time> : null}
        </div>
      </div>

      <div className="challenge-archive-progress" aria-label={`7일 챌린지 보상 ${completedCount}/3 획득`}>
        {Object.entries(LABELS).map(([type, [title, description]], index) => {
          const row = earned.get(type);
          return (
            <div className={row ? 'is-earned' : ''} key={type}>
              <span>{row ? '✓' : index + 1}</span>
              <p><strong>{title}</strong><small>{row ? description : '아직 잠겨 있어요'}</small></p>
            </div>
          );
        })}
      </div>

      <div className="challenge-archive-actions">
        <a href="/hogoo-test.html?reward=archive">인증서·보상 다시 열기</a>
        <a href="/reviews.html">완주자 후기 보기</a>
      </div>
      <p className="challenge-archive-note">획득한 완주 인장과 보상은 후기를 삭제하거나 챌린지를 다시 시작해도 유지됩니다.</p>
    </div>
  );
}
