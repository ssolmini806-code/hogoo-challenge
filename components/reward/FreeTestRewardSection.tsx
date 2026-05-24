import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Gift, MessageCircle, PenLine, Sparkles } from 'lucide-react';

type KakaoSharePayload = {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl?: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons?: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
};

type KakaoSdk = {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share?: {
    sendDefault: (payload: KakaoSharePayload) => void;
  };
  Link?: {
    sendDefault: (payload: KakaoSharePayload) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

export type FreeTestRewardSectionProps = {
  userId: string | null;
  resultType: string;
  isShared: boolean;
  isReviewed: boolean;
  onLoginRequired: () => void;
  onShareComplete: () => void;
  onReviewClick: () => void;
  onBothComplete: () => void;
  bothRewardContent?: ReactNode;
  isBothRewardLoading?: boolean;
  bothRewardError?: string;
  retryResetKey?: number;
};

function getCurrentUrl() {
  if (typeof window === 'undefined') return 'https://hogoo-challenge.pages.dev';
  return window.location.href;
}

function getKakao(): KakaoSdk | null {
  if (typeof window === 'undefined' || !window.Kakao) return null;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init('3e86388cd24e0ec392041b91dd3e238f');
  }
  return window.Kakao;
}

function openKakaoShare(resultType: string) {
  if (typeof window === 'undefined') return;

  const shareUrl = getCurrentUrl();
  const payload: KakaoSharePayload = {
    objectType: 'feed',
    content: {
      title: 'GIVE 무료 검사 결과',
      description: `${resultType} 유형 결과를 확인했어요. 나의 관계 패턴도 검사해보세요.`,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
    },
    buttons: [
      {
        title: '무료 검사하기',
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
    ],
  };

  const kakao = getKakao();
  const kakaoShare = kakao?.Share ?? kakao?.Link;

  if (kakaoShare?.sendDefault) {
    kakaoShare.sendDefault(payload);
    return;
  }

  window.open(
    `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}`,
    'kakao-share',
    'noopener,noreferrer,width=480,height=640',
  );
}

const styles = {
  section: {
    width: '100%',
    borderRadius: 16,
    border: '1px solid #3a3530',
    background: '#231f1c',
    padding: 16,
  } as React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  } as React.CSSProperties,

  iconCircle: (bg: string, color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: bg,
    color,
    flexShrink: 0,
  }),

  card: {
    borderRadius: 12,
    border: '1px solid #3a3530',
    padding: 16,
    marginBottom: 12,
  } as React.CSSProperties,

  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  } as React.CSSProperties,

  label: {
    fontSize: 13,
    fontWeight: 700,
    color: '#f5ede3',
    margin: 0,
  } as React.CSSProperties,

  unlockNotice: {
    margin: '0 0 16px',
    borderRadius: 10,
    border: '1px solid #4a3f30',
    background: '#2a2520',
    padding: '12px 14px',
    color: '#f5ede3',
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.5,
  } as React.CSSProperties,

  btn: (bg: string, color: string, border?: string, disabled?: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    padding: '0 16px',
    borderRadius: 12,
    border: border ?? 'none',
    background: bg,
    color,
    fontSize: 13,
    fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled ? 0.6 : 1,
    width: '100%',
  }),
};

export default function FreeTestRewardSection({
  userId,
  resultType,
  isShared,
  isReviewed,
  onLoginRequired,
  onShareComplete,
  onReviewClick,
  onBothComplete,
  bothRewardContent,
  isBothRewardLoading = false,
  bothRewardError,
  retryResetKey = 0,
}: FreeTestRewardSectionProps) {
  const hasNotifiedBothComplete = useRef(false);
  const [hasOpenedShare, setHasOpenedShare] = useState(false);
  const isBothComplete = isShared && isReviewed;

  useEffect(() => {
    getKakao();
  }, []);

  useEffect(() => {
    if (!isBothComplete || hasNotifiedBothComplete.current) return;
    hasNotifiedBothComplete.current = true;
    onBothComplete();
  }, [isBothComplete, onBothComplete]);

  useEffect(() => {
    setHasOpenedShare(false);
    hasNotifiedBothComplete.current = false;
  }, [retryResetKey]);

  const handleShareClick = () => {
    if (!userId) { onLoginRequired(); return; }
    openKakaoShare(resultType);
    setHasOpenedShare(true);
  };

  const handleShareComplete = () => {
    if (!userId) { onLoginRequired(); return; }
    onShareComplete();
  };

  const handleReviewClick = () => {
    if (!userId) { onLoginRequired(); return; }
    onReviewClick();
  };

  return (
    <section style={styles.section}>
      <style>{`
        @keyframes bounceIn {
          0%   { transform: scale(0.94); opacity: 0; }
          60%  { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
      `}</style>
      <div style={styles.header}>
        <span style={styles.iconCircle('#1e2e22', '#00a885')}>
          <Gift size={18} aria-hidden="true" />
        </span>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f5ede3', margin: 0 }}>완료 보상 받기</h2>
      </div>

      <p style={styles.unlockNotice}>🔒 잠긴 해석을 보려면 아래에서 완료해주세요</p>

      <div>
        {/* A: SNS 공유 */}
        <article style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.iconCircle('#2d2a1a', '#f59e0b')}>
              <MessageCircle size={16} aria-hidden="true" />
            </span>
            <div style={{ flex: 1 }}>
              <p style={styles.label}>혜택 A: 유형별 추가 조언 공개</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleShareClick}
                  style={styles.btn('#FEE500', '#191919')}
                >
                  SNS에 공유하기
                </button>
                {hasOpenedShare || isShared ? (
                  <button
                    type="button"
                    onClick={handleShareComplete}
                    disabled={isShared}
                    style={
                      isShared
                        ? styles.btn('#1e2e22', '#7cc88a', '1px solid #2d4a35', true)
                        : styles.btn('#2a2520', '#c5b8ac', '1px solid #3a3530')
                    }
                  >
                    {isShared ? (
                      <>
                        <Check size={14} aria-hidden="true" />
                        공유 완료
                      </>
                    ) : '공유했어요 ✓'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </article>

        {/* B: 후기 작성 */}
        <article style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.iconCircle('#1e2233', '#818cf8')}>
              <PenLine size={16} aria-hidden="true" />
            </span>
            <div style={{ flex: 1 }}>
              <p style={styles.label}>혜택 B: 결과별 추가 해석 공개</p>
              <button
                type="button"
                onClick={handleReviewClick}
                style={{ ...styles.btn('#2a2520', '#c5b8ac', '1px solid #3a3530'), marginTop: 12 }}
              >
                <PenLine size={14} aria-hidden="true" />
                후기 작성하기
              </button>

              {isReviewed ? (
                <div style={{ marginTop: 12, borderRadius: 10, background: '#1e1e35', padding: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#818cf8', margin: '0 0 6px' }}>
                    {resultType} 결과별 추가 해석
                  </p>
                  <p style={{ fontSize: 13, color: '#a5b4fc', lineHeight: 1.6, margin: 0 }}>
                    이 결과는 단순히 많이 베푸는 성향만 뜻하지 않습니다. 상대의 반응을 먼저
                    살피느라 내 기준이 뒤로 밀릴 때가 있는지 함께 점검하는 신호로 볼 수 있어요.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </article>

        {/* A+B 보너스 */}
        <article
          style={{
            ...styles.card,
            marginBottom: 0,
            border: isBothComplete ? '1px solid #a78bfa' : '1px solid #3a3530',
            background: isBothComplete
              ? 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)'
              : '#1a1614',
            animation: isBothComplete ? 'bounceIn 0.6s cubic-bezier(0.36,0.07,0.19,0.97) both' : 'none',
          }}
        >
          <div style={styles.cardHeader}>
            <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }} aria-hidden="true">🎁</span>
            <div style={{ flex: 1 }}>
              {isBothComplete ? (
                <p style={{ ...styles.label, color: '#fff', fontSize: 15, marginBottom: 6 }}>
                  보너스 잠금 해제!
                </p>
              ) : null}
              <p style={{ ...styles.label, color: isBothComplete ? 'rgba(255,255,255,0.9)' : '#8a7f75', fontSize: 13 }}>
                둘 다 완료하면 → 개인화 요약 리포트
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: isBothComplete ? 'rgba(255,255,255,0.6)' : '#6a6060' }}>
                  심화 테스트 준비 리포트
                </span>
                <span style={{
                  background: isBothComplete ? 'rgba(255,255,255,0.18)' : '#2a2520',
                  color: isBothComplete ? '#e0d8ff' : '#7a7070',
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                }}>
                  곧 제공될 예정이에요 🔜
                </span>
              </div>
              {isBothRewardLoading ? (
                <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: isBothComplete ? 'rgba(255,255,255,0.7)' : '#8a7f75', lineHeight: 1.6 }}>
                  보너스 리포트를 준비 중입니다.
                </p>
              ) : null}
              {bothRewardError ? (
                <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#f87171', lineHeight: 1.6 }}>
                  {bothRewardError}
                </p>
              ) : null}
              {bothRewardContent ? (
                <div style={{ marginTop: 10, borderRadius: 8, background: 'rgba(0,0,0,0.2)', padding: 12, fontSize: 13, lineHeight: 1.6, color: isBothComplete ? '#fff' : '#c5b8ac' }}>
                  {bothRewardContent}
                </div>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
