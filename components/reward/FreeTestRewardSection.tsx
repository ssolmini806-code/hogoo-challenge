import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Gift, MessageCircle, PenLine, Sparkles, Unlock } from 'lucide-react';
import AdviceCard from '../advice/AdviceCard';
import { getAdviceByType } from '../../lib/advice/freeTestAdvice';

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

function fallbackCopyLink(url: string) {
  const el = document.createElement('textarea');
  el.value = url;
  el.style.cssText = 'position:fixed;top:-999px;opacity:0';
  document.body.appendChild(el);
  el.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(el);
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

  smallBtn: (bg: string, color: string, border?: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10,
    border: border ?? 'none',
    background: bg,
    color,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
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
  const [shareToast, setShareToast] = useState('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBothComplete = isShared && isReviewed;
  const advice = getAdviceByType(resultType);

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

  const showShareToast = (msg: string) => {
    setShareToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShareToast(''), 3000);
  };

  const handleKakaoShare = () => {
    if (!userId) { onLoginRequired(); return; }
    openKakaoShare(resultType);
    setHasOpenedShare(true);
  };

  const handleInstaShare = () => {
    if (!userId) { onLoginRequired(); return; }
    const url = getCurrentUrl();
    if (navigator.share) {
      navigator.share({ title: `GIVE ID ${resultType} 결과`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => fallbackCopyLink(url));
      showShareToast('링크 복사 완료! 인스타 스토리에 붙여넣기 해주세요 📸');
    }
    setHasOpenedShare(true);
  };

  const handleXShare = () => {
    if (!userId) { onLoginRequired(); return; }
    const url = getCurrentUrl();
    const text = `내 GIVE ID는 ${resultType}. 내 관계 패턴을 확인해봤어요.`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer,width=600,height=400',
    );
    setHasOpenedShare(true);
  };

  const handleCopyShare = () => {
    if (!userId) { onLoginRequired(); return; }
    const url = getCurrentUrl();
    navigator.clipboard.writeText(url).catch(() => fallbackCopyLink(url));
    showShareToast('링크가 복사되었어요 🔗');
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

  const openHogooCheck = () => {
    window.location.href = 'hogoo-check.html';
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
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button type="button" onClick={handleKakaoShare} style={styles.smallBtn('#FEE500', '#191919')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.48 3 2 6.72 2 11.25c0 2.9 1.67 5.47 4.22 7.06l-1.1 4.03 4.52-2.14c.76.14 1.55.21 2.36.21 5.52 0 10-3.72 10-8.25S17.52 3 12 3z"/></svg>
                    카카오톡
                  </button>
                  <button type="button" onClick={handleInstaShare} style={styles.smallBtn('#E1306C', '#fff')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    인스타그램
                  </button>
                  <button type="button" onClick={handleXShare} style={styles.smallBtn('#000', '#fff')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X(트위터)
                  </button>
                  <button type="button" onClick={handleCopyShare} style={styles.smallBtn('#2a2520', '#c5b8ac', '1px solid #3a3530')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    링크 복사
                  </button>
                </div>
                {shareToast ? (
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#3a3530', color: '#f5ede3', fontSize: 12, fontWeight: 600, textAlign: 'center' as const }}>
                    {shareToast}
                  </div>
                ) : null}
                {hasOpenedShare || isShared ? (
                  <button
                    type="button"
                    onClick={handleShareComplete}
                    disabled={isShared}
                    style={{
                      ...(isShared
                        ? styles.btn('#1e2e22', '#7cc88a', '1px solid #2d4a35', true)
                        : styles.btn('#2a2520', '#c5b8ac', '1px solid #3a3530')),
                      marginTop: 8,
                    }}
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
              {isShared ? (
                <div style={{ marginTop: 10, borderRadius: 8, background: '#2a241c', border: '1px solid #4a3f30', padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true">🏅</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#f7c56b', margin: '0 0 4px' }}>SNS 공유 완료 배지</p>
                    <p style={{ fontSize: 12, color: '#dccdbf', lineHeight: 1.55, margin: 0 }}>
                      후기 게시판에서 닉네임 옆에 이 배지가 표시돼요.<br />다른 완주자들이 볼 수 있어요.
                    </p>
                  </div>
                </div>
              ) : null}
              {isShared ? <AdviceCard advice={advice} /> : null}
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
              <p style={styles.label}>혜택 B: 나는 호구인가? 테스트 unlock</p>
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
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#a5b4fc', margin: '0 0 10px' }}>
                    <Unlock size={14} aria-hidden="true" />
                    🔓 호구인가? 테스트가 열렸어요!
                  </p>
                  <button
                    type="button"
                    onClick={openHogooCheck}
                    style={styles.btn('#818cf8', '#111827')}
                  >
                    테스트 하러 가기
                  </button>
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
              {isBothComplete ? (
                <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14 }}>
                  <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.4 }}>
                    무료 검사는 패턴을 보여줬어요
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.78)', margin: '0 0 12px', lineHeight: 1.65 }}>
                    GIVE ID 심화 테스트에서는 왜 이 패턴이 반복되는지, 어떻게 바꿀 수 있는지를 알 수 있어요.
                  </p>
                  <a
                    href="https://givecosystem.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.15)',
                      color: '#e0d8ff',
                      fontSize: 13,
                      fontWeight: 800,
                      textDecoration: 'none',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    GIVE ID 심화 테스트 →
                  </a>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.66)', margin: '10px 0 0' }}>
                    무료 결과는 유지됩니다.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
