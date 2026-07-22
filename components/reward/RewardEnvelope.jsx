// 종이 봉투 + 잉크 봉인. 잠김 → 절반 번짐 → 열림 세 상태만 표현한다.
// 순수 장식이라 스크린리더에서는 감춘다 (진행 상태는 옆의 텍스트가 알려준다).

export default function RewardEnvelope({ unlockedCount }) {
  const state = unlockedCount >= 2 ? 'open' : unlockedCount === 1 ? 'half' : 'sealed';

  return (
    <div className={`reward-envelope is-${state}`} aria-hidden="true">
      <svg viewBox="0 0 120 84" focusable="false">
        {/* 올라오는 편지지 (A+B 해금 시에만 보인다) */}
        <rect className="reward-envelope-letter" x="24" y="6" width="72" height="52" rx="2" />
        <path className="reward-envelope-body" d="M6 18h108v58a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" />
        <path className="reward-envelope-flap" d="M6 18 60 54 114 18" />
        <g className="reward-envelope-seal">
          <circle cx="60" cy="50" r="11" />
          <path className="reward-envelope-seal-crack" d="M60 39v22" />
        </g>
        <path className="reward-envelope-thread" d="M18 67c22-13 63-13 86 0" />
        <circle className="reward-envelope-mark is-a" cx="38" cy="62" r="3.2" />
        <circle className="reward-envelope-mark is-b" cx="82" cy="62" r="3.2" />
      </svg>
    </div>
  );
}
