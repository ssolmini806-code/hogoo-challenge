import { useEffect, useMemo, useRef, useState } from 'react';
import { Award, BookOpenText, Check, Download, Gift, Lock, MessageCircle, Share2, Sparkles } from 'lucide-react';

const DEFAULT_SHARE_MESSAGE = '7일 호구 탈출 챌린지 완주! 🎉 7일 동안 해냈어. 나처럼 해봐!';

type ChallengeDiagnosisResult = {
  completionDays: number;
  label: string;
};

type Props = {
  userId: string | null;
  completionDays: number;
  onLoginRequired: () => void;
  onShareComplete: () => void;
  onReviewClick: () => void;
  onBothComplete: (result: ChallengeDiagnosisResult) => void;
  isShared: boolean;
  isReviewed: boolean;
};

function getDiagnosisLabel(days: number): string {
  if (days >= 7) return '30일 준비 완료 유형';
  if (days >= 5) return '루틴 형성 중, 30일이 강화해줄 수 있어요';
  return '구조가 필요한 유형, 30일 챌린지가 그걸 만들어줍니다';
}

const card: React.CSSProperties = {
  background: '#231f1c',
  border: '1px solid #3a3530',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
};

const iconCircle = (bg: string): React.CSSProperties => ({
  background: bg,
  borderRadius: '50%',
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const btn = (bg: string, color: string, border?: string): React.CSSProperties => ({
  background: bg,
  color,
  border: border ?? 'none',
  borderRadius: 10,
  padding: '12px',
  fontWeight: 800,
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  width: '100%',
  fontFamily: 'inherit',
});

export default function ChallengeRewardSection({
  userId,
  completionDays,
  onLoginRequired,
  onShareComplete,
  onReviewClick,
  onBothComplete,
  isShared,
  isReviewed,
}: Props) {
  const safe = Math.min(7, Math.max(0, completionDays));
  const bothDone = isShared && isReviewed;
  const hasCalledBoth = useRef(false);
  const [showDiagnosis, setShowDiagnosis] = useState(bothDone);
  const [shareMessage, setShareMessage] = useState(DEFAULT_SHARE_MESSAGE);
  const [hasOpenedShare, setHasOpenedShare] = useState(false);

  const diagnosisResult = useMemo<ChallengeDiagnosisResult>(
    () => ({ completionDays: safe, label: getDiagnosisLabel(safe) }),
    [safe],
  );

  useEffect(() => {
    if (!bothDone) {
      hasCalledBoth.current = false;
      setShowDiagnosis(false);
      return;
    }
    setShowDiagnosis(true);
    if (hasCalledBoth.current) return;
    hasCalledBoth.current = true;
    onBothComplete(diagnosisResult);
  }, [bothDone, diagnosisResult, onBothComplete]);

  const handleOpenShare = () => {
    if (!userId) { onLoginRequired(); return; }

    const shareUrl = typeof window === 'undefined' ? 'https://hogoo-challenge.pages.dev' : window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: '7일 호구 탈출 챌린지',
        text: shareMessage,
        url: shareUrl,
      }).catch(() => undefined);
    } else if (typeof window !== 'undefined') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'width=600,height=400,noopener,noreferrer',
      );
    }
    setHasOpenedShare(true);
  };

  const handleShareComplete = () => {
    if (!userId) { onLoginRequired(); return; }
    onShareComplete();
  };

  const handleReview = () => {
    if (!userId) { onLoginRequired(); return; }
    onReviewClick();
  };

  const handleDownload = () => {
    if (!isShared) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1a1614';
    ctx.fillRect(0, 0, 1200, 1600);
    ctx.fillStyle = '#00a885';
    ctx.textAlign = 'center';
    ctx.font = '700 72px sans-serif';
    ctx.fillText('7일 호구 탈출 챌린지', 600, 420);
    ctx.fillStyle = '#f5ede3';
    ctx.font = '800 96px sans-serif';
    ctx.fillText('완주 인증서', 600, 560);
    ctx.font = '500 42px sans-serif';
    ctx.fillText(`${safe}/7일 동안 해냈어요`, 600, 720);
    ctx.fillStyle = '#8a7f75';
    ctx.font = '400 30px sans-serif';
    ctx.fillText(new Date().toLocaleDateString('ko-KR'), 600, 1220);
    const link = document.createElement('a');
    link.download = '7day-challenge-certificate.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#00a885', margin: '0 0 4px' }}>
        공유하면 인증서를, 후기를 남기면 7일 회고록을 드려요.
      </p>
      <p style={{ fontSize: 13, color: '#8a7f75', lineHeight: 1.6, margin: '0 0 16px' }}>
        둘 다 완료하면 30일 챌린지가 지금 나한테 필요한지 진단해드립니다.
      </p>

      {/* A: SNS 공유 */}
      <article style={card}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={iconCircle('#1e2e22')}>
            <Share2 size={18} color="#00a885" />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f5ede3', margin: '0 0 4px' }}>SNS 공유</h2>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#c5b8ac', margin: 0 }}>혜택 A: 7일 완주 인증서 이미지 + 배지</p>
          </div>
        </div>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8a7f75', marginBottom: 6 }}>
          공유 문구
        </label>
        <textarea
          value={shareMessage}
          onChange={e => setShareMessage(e.target.value)}
          rows={2}
          style={{
            width: '100%', background: '#1a1614', border: '1px solid #3a3530',
            color: '#f5ede3', borderRadius: 8, padding: 10, fontSize: 13,
            lineHeight: 1.6, outline: 'none', resize: 'none', boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          <button
            onClick={handleOpenShare}
            style={btn('#00a885', '#fff')}
          >
            <Share2 size={15} />
            SNS에 공유하기
          </button>
          <button
            onClick={handleDownload}
            disabled={!isShared}
            style={{
              ...btn('#2a2520', isShared ? '#c5b8ac' : '#5a5048', '1px solid #3a3530'),
              cursor: isShared ? 'pointer' : 'not-allowed',
              opacity: isShared ? 1 : 0.6,
            }}
          >
            {isShared ? <Download size={15} /> : <Lock size={15} />}
            인증서 저장
          </button>
        </div>

        {(hasOpenedShare || isShared) && (
          <button
            onClick={handleShareComplete}
            disabled={isShared}
            style={{
              ...btn(
                isShared ? '#1e2e22' : '#00a885',
                isShared ? '#7cc88a' : '#fff',
                isShared ? '1px solid #2d4a35' : undefined,
              ),
              marginTop: 8,
              cursor: isShared ? 'default' : 'pointer',
              opacity: isShared ? 0.85 : 1,
            }}
          >
            {isShared && <Check size={15} />}
            {isShared ? '공유 완료' : '공유했어요 ✓'}
          </button>
        )}

        {isShared && (
          <p style={{ marginTop: 10, fontSize: 12, color: '#7cc88a', display: 'flex', alignItems: 'center', gap: 5, margin: '10px 0 0' }}>
            <Award size={13} /> 후기 게시판에 닉네임 옆 배지가 표시돼요 🏅
          </p>
        )}
      </article>

      {/* B: 후기 작성 */}
      <article style={card}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={iconCircle('#2d2a1a')}>
            <BookOpenText size={18} color="#f59e0b" />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f5ede3', margin: '0 0 4px' }}>후기 작성</h2>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#c5b8ac', margin: 0 }}>혜택 B: 7일 회고록</p>
          </div>
        </div>

        <button
          onClick={handleReview}
          style={btn(
            isReviewed ? '#2d2a1a' : '#d97706',
            isReviewed ? '#f59e0b' : '#fff',
            isReviewed ? '1px solid #3a3018' : undefined,
          )}
        >
          {isReviewed ? <Check size={15} /> : <MessageCircle size={15} />}
          {isReviewed ? '후기 작성 완료' : '후기 작성하기'}
        </button>

        {isReviewed && (
          <div style={{ marginTop: 12, background: '#2d2a1a', border: '1px dashed #3a3018', borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', margin: '0 0 4px' }}>7일 회고록</p>
            <p style={{ fontSize: 12, color: '#b09050', lineHeight: 1.6, margin: 0 }}>
              후기가 저장됐어요. 30일 챌린지로 이어가면 자동으로 회고록이 작성됩니다.
            </p>
          </div>
        )}
      </article>

      {/* A+B 보너스 */}
      <article style={{ ...card, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={iconCircle('#1e1e35')}>
            <Gift size={18} color="#818cf8" />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f5ede3', margin: '0 0 4px' }}>A+B 보너스</h2>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#c5b8ac', margin: 0 }}>둘 다 완료하면 → 30일 적합도 진단</p>
          </div>
        </div>

        {showDiagnosis ? (
          <div style={{ background: '#1e1e35', borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 8px' }}>
              <Sparkles size={14} /> {diagnosisResult.label}
            </p>
            <p style={{ fontSize: 13, color: '#a5b4fc', lineHeight: 1.6, margin: '0 0 12px' }}>
              완료 기록 {safe}/7을 기준으로 30일 챌린지 적합도를 확인했어요.
            </p>
            <a
              href={import.meta.env.VITE_PAID_SITE_URL || 'https://givecosystem.com/'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center', background: '#4f46e5',
                color: '#fff', borderRadius: 10, padding: '12px',
                fontWeight: 800, fontSize: 14, textDecoration: 'none',
              }}
            >
              30일 챌린지 시작하기
            </a>
          </div>
        ) : (
          <div style={{ background: '#1a1614', borderRadius: 10, padding: 12, fontSize: 13, color: '#5a5048', lineHeight: 1.6 }}>
            SNS 공유와 후기 작성을 모두 완료하면 진단 결과가 열립니다.
          </div>
        )}
      </article>
    </section>
  );
}
