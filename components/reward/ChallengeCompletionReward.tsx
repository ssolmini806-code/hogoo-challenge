'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { toPng } from 'html-to-image';
import {
  Award,
  Check,
  ChevronRight,
  Download,
  Gift,
  Lock,
  MessageCircle,
  Share2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { openSevenDayChallengeShare } from '../../src/utils/challengeShare';

type ChallengeCompletionRewardProps = {
  userId: string | null;
  completionRate: number;
  completedDays: number;
  isShared: boolean;
  isReviewed: boolean;
  onLoginRequired: () => void;
  onShareComplete: () => void;
  onReviewClick: () => void;
  onBothComplete: () => void;
};

type Diagnosis = {
  title: string;
  description: string;
};

const CHALLENGE_COMPLETED_AT_KEY = 'challenge_completed_at';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const STARTER_ITEMS = [
  { label: '30일 목표 설정 PDF' },
  { label: '위기 구간 대처 가이드' },
  { label: '3,000원 할인권', badge: '준비 중' },
];

function getPaidSiteUrl() {
  return import.meta.env.VITE_PAID_SITE_URL ?? 'https://givecosystem.com/';
}

function getCompletionDate(): Date {
  if (typeof window === 'undefined') return new Date();

  const stored = window.localStorage.getItem(CHALLENGE_COMPLETED_AT_KEY);
  if (stored) {
    const parsed = new Date(stored);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const now = new Date();
  window.localStorage.setItem(CHALLENGE_COMPLETED_AT_KEY, now.toISOString());
  return now;
}

function formatCompletionDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatCountdown(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}일 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function downloadGoalSettingPdf() {
  if (typeof document === 'undefined') return;

  const stream = `BT
/F1 24 Tf
72 720 Td
(30 Day Goal Setting PDF) Tj
/F1 13 Tf
0 -44 Td
(1. Pick one boundary habit you will repeat for 30 days.) Tj
0 -26 Td
(2. Choose the time and situation where you will practice it.) Tj
0 -26 Td
(3. Write one fallback sentence for moments of guilt or anxiety.) Tj
0 -26 Td
(4. Review every 7 days and keep only what actually worked.) Tj
0 -52 Td
(GIVE Ecosystem) Tj
ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.download = '30day-goal-setting.pdf';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

function getDiagnosis(completionRate: number): Diagnosis {
  if (completionRate >= 100) {
    return {
      title: '30일 준비 완료 유형',
      description: '이미 7일 흐름을 끝까지 밀고 온 상태라 30일 확장에 바로 들어가기 좋습니다.',
    };
  }

  if (completionRate >= 70) {
    return {
      title: '루틴 형성 중 유형',
      description: '흐름은 만들어졌고, 흔들리는 구간을 보완하면 30일 루틴으로 이어질 가능성이 높습니다.',
    };
  }

  return {
    title: '구조 강화 필요 유형',
    description: '의지보다 구조가 먼저 필요한 상태입니다. 30일 챌린지에서 반복 가능한 장치를 만들어보세요.',
  };
}

function downloadCompletionCertificate(completionRate: number) {
  if (typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;

  const context = canvas.getContext('2d');
  if (!context) return;

  context.fillStyle = '#faf5ff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#6d28d9';
  context.textAlign = 'center';
  context.font = '700 64px sans-serif';
  context.fillText('7일 챌린지', 600, 390);
  context.fillStyle = '#111827';
  context.font = '800 96px sans-serif';
  context.fillText('완주 인증서', 600, 540);
  context.font = '500 42px sans-serif';
  context.fillText(`완료율 ${completionRate}%`, 600, 700);
  context.font = '600 36px sans-serif';
  context.fillText('지금 만든 흐름을 30일 루틴으로 이어가보세요', 600, 980);
  context.fillStyle = '#6b7280';
  context.font = '400 30px sans-serif';
  context.fillText(new Date().toLocaleDateString('ko-KR'), 600, 1220);

  const link = document.createElement('a');
  link.download = '7day-challenge-certificate.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function RewardActionButton({
  children,
  onClick,
  disabled = false,
  variant = 'dark',
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'dark' | 'purple' | 'outline';
}) {
  const variantClass = {
    dark: 'bg-gray-950 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400',
    purple:
      'bg-violet-700 text-white hover:bg-violet-800 disabled:bg-violet-100 disabled:text-violet-300',
    outline:
      'border border-gray-200 bg-white text-gray-950 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400',
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition ${variantClass} disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function RetrospectiveCard({ completedDays }: { completedDays: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const completionDate = useMemo(() => formatCompletionDate(getCompletionDate()), []);
  const safeCompletedDays = Math.min(7, Math.max(0, completedDays));

  const handleSave = async () => {
    if (!cardRef.current || isSaving) return;
    setIsSaving(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = '7day-challenge-retrospective.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to save retrospective image:', error);
      alert('회고록 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-4">
      <div
        ref={cardRef}
        className="rounded-lg border border-gray-200 bg-white p-6 text-gray-950 shadow-sm"
        style={{ width: '100%' }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <p className="text-xl font-extrabold tracking-normal text-gray-950">
              7일 챌린지 회고록
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-500">{completionDate}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
            완료
          </span>
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">완료한 미션 수</p>
          <p className="mt-2 text-4xl font-black text-gray-950">{safeCompletedDays}/7</p>
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">한 줄 소감</p>
          <p className="mt-2 text-lg font-extrabold leading-7 text-gray-950">
            경계를 연습한 7일이었습니다
          </p>
        </div>

        <p className="mt-8 text-right text-sm font-extrabold text-gray-700">GIVE 에코시스템</p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-200"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {isSaving ? '저장 중...' : '회고록 저장하기'}
      </button>
    </div>
  );
}

function PaidChallengeCta() {
  const paidSiteUrl = getPaidSiteUrl();
  const [now, setNow] = useState(() => Date.now());
  const completedAt = useMemo(() => getCompletionDate(), []);
  const remainingMs = completedAt.getTime() + THREE_DAYS_MS - now;
  const isExpired = remainingMs <= 0;

  useEffect(() => {
    if (isExpired) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isExpired]);

  if (isExpired) {
    return (
      <article className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <p className="text-base font-extrabold">기간이 지났어요.</p>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          30일 목표 설정 PDF는 여전히 받을 수 있어요.
        </p>
        <button
          type="button"
          onClick={downloadGoalSettingPdf}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-extrabold text-white transition hover:bg-amber-700"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          30일 목표 설정 PDF 다운로드
        </button>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-lg bg-gradient-to-br from-violet-700 via-fuchsia-700 to-indigo-800 p-5 text-white shadow-lg shadow-violet-900/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-violet-50 ring-1 ring-white/20">
          3일 안에 시작 시
        </p>
        <p className="rounded-lg bg-white/15 px-3 py-1 text-xs font-extrabold tabular-nums text-white ring-1 ring-white/20">
          {formatCountdown(remainingMs)}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {STARTER_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-3 text-sm font-semibold text-white/95">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">{item.label}</span>
            {item.badge ? (
              <span className="shrink-0 rounded-full bg-white/15 px-2 py-1 text-[11px] font-extrabold text-violet-50 ring-1 ring-white/20">
                {item.badge}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <a
        href={paidSiteUrl}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-extrabold text-violet-800 transition hover:bg-violet-50"
      >
        30일 챌린지 시작하기
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </article>
  );
}

function ShareRewardCard({
  userId,
  isShared,
  completedDays,
  onLoginRequired,
  onShareComplete,
}: Pick<
  ChallengeCompletionRewardProps,
  'userId' | 'isShared' | 'onLoginRequired' | 'onShareComplete' | 'completedDays'
>) {
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }

  function fallbackCopy(url: string) {
    const el = document.createElement('textarea');
    el.value = url;
    el.style.cssText = 'position:fixed;top:-999px;opacity:0';
    document.body.appendChild(el);
    el.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(el);
  }

  const handleKakaoShare = () => {
    if (!userId) { onLoginRequired(); return; }
    openSevenDayChallengeShare();
    onShareComplete();
  };

  const handleInstaShare = () => {
    if (!userId) { onLoginRequired(); return; }
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: '7일 호구 탈출 챌린지 완주! 🎉', url })
        .then(() => onShareComplete())
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url)
        .then(() => { showToast('링크 복사 완료! 인스타 스토리에 붙여넣기 해주세요 📸'); onShareComplete(); })
        .catch(() => { fallbackCopy(url); showToast('링크 복사 완료! 인스타 스토리에 붙여넣기 해주세요 📸'); onShareComplete(); });
    }
  };

  const handleXShare = () => {
    if (!userId) { onLoginRequired(); return; }
    const url = window.location.href;
    const text = '7일 호구 탈출 챌린지 완주! 🎉 나처럼 해봐!';
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer,width=600,height=400',
    );
    onShareComplete();
  };

  const handleCopyShare = () => {
    if (!userId) { onLoginRequired(); return; }
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => { showToast('링크가 복사되었어요 🔗'); onShareComplete(); })
      .catch(() => { fallbackCopy(url); showToast('링크가 복사되었어요 🔗'); onShareComplete(); });
  };

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Share2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold text-gray-950">혜택 A · 7일 회고록 + 배지</h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            공유 완료 후 회고록 PNG를 저장하고 후기 게시판 배지를 받을 수 있어요.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleKakaoShare}
          disabled={isShared}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#FEE500] px-3 text-xs font-bold text-[#191919] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.48 3 2 6.72 2 11.25c0 2.9 1.67 5.47 4.22 7.06l-1.1 4.03 4.52-2.14c.76.14 1.55.21 2.36.21 5.52 0 10-3.72 10-8.25S17.52 3 12 3z"/></svg>
          카카오톡
        </button>
        <button
          type="button"
          onClick={handleInstaShare}
          disabled={isShared}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#E1306C] px-3 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          인스타그램
        </button>
        <button
          type="button"
          onClick={handleXShare}
          disabled={isShared}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-black px-3 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X(트위터)
        </button>
        <button
          type="button"
          onClick={handleCopyShare}
          disabled={isShared}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          링크 복사
        </button>
      </div>

      {toast ? (
        <p className="mt-2 text-center text-xs font-semibold text-gray-600">{toast}</p>
      ) : null}

      {isShared ? (
        <p className="mt-3 flex items-start gap-2 text-sm font-medium text-emerald-700">
          <Award className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          후기 게시판에 닉네임 옆 배지가 표시돼요 🏅
        </p>
      ) : null}

      {isShared ? (
        <RetrospectiveCard completedDays={completedDays} />
      ) : null}
    </article>
  );
}

function ReviewRewardCard({
  userId,
  isReviewed,
  completionRate,
  onLoginRequired,
  onReviewClick,
}: Pick<
  ChallengeCompletionRewardProps,
  'userId' | 'isReviewed' | 'onLoginRequired' | 'onReviewClick'
> & {
  completionRate: number;
}) {
  const handleReviewClick = () => {
    if (!userId) {
      onLoginRequired();
      return;
    }

    onReviewClick();
  };

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold text-gray-950">혜택 B · 7일 완주 인증서</h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            후기를 작성하면 완주 인증서 다운로드가 활성화됩니다.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <RewardActionButton onClick={handleReviewClick} variant="outline">
          {isReviewed ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
          )}
          후기 작성하기
        </RewardActionButton>
        <RewardActionButton
          onClick={() => downloadCompletionCertificate(completionRate)}
          disabled={!isReviewed}
          variant="purple"
        >
          {isReviewed ? (
            <Download className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Lock className="h-4 w-4" aria-hidden="true" />
          )}
          인증서 다운로드
        </RewardActionButton>
      </div>
    </article>
  );
}

function BonusDiagnosisCard({ diagnosis }: { diagnosis: Diagnosis }) {
  const paidSiteUrl = getPaidSiteUrl();

  return (
    <article className="animate-[fadeIn_420ms_ease-out] rounded-lg border border-violet-200 bg-violet-50 p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-700 text-white">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold text-violet-950">{diagnosis.title}</h3>
          <p className="mt-1 text-sm leading-6 text-violet-900">{diagnosis.description}</p>
        </div>
      </div>

      <a
        href={paidSiteUrl}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-extrabold text-white transition hover:bg-violet-800"
      >
        30일 챌린지 시작하기
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </article>
  );
}

export default function ChallengeCompletionReward({
  userId,
  completionRate,
  completedDays,
  isShared,
  isReviewed,
  onLoginRequired,
  onShareComplete,
  onReviewClick,
  onBothComplete,
}: ChallengeCompletionRewardProps) {
  const hasNotifiedBothComplete = useRef(false);
  const isBothComplete = isShared && isReviewed;
  const safeCompletionRate = Math.min(100, Math.max(0, completionRate));
  const diagnosis = useMemo(() => getDiagnosis(safeCompletionRate), [safeCompletionRate]);

  useEffect(() => {
    if (!isBothComplete) {
      hasNotifiedBothComplete.current = false;
      return;
    }

    if (hasNotifiedBothComplete.current) return;
    hasNotifiedBothComplete.current = true;
    onBothComplete();
  }, [isBothComplete, onBothComplete]);

  return (
    <section className="w-full bg-white px-4 py-8 text-gray-950 sm:px-6">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto max-w-2xl">
        <header className="mb-5">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-700">
            <Award className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-normal text-gray-950">
            7일 챌린지 완주를 축하드립니다!! 🎉
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            이제 지금 만든 흐름을 30일 루틴으로 이어가보세요
          </p>
        </header>

        <div className="space-y-4">
          <PaidChallengeCta />

          <ShareRewardCard
            userId={userId}
            isShared={isShared}
            completedDays={completedDays}
            onLoginRequired={onLoginRequired}
            onShareComplete={onShareComplete}
          />

          <ReviewRewardCard
            userId={userId}
            isReviewed={isReviewed}
            completionRate={safeCompletionRate}
            onLoginRequired={onLoginRequired}
            onReviewClick={onReviewClick}
          />

          {isBothComplete ? (
            <BonusDiagnosisCard diagnosis={diagnosis} />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold text-gray-800">
                <Gift className="h-4 w-4 text-gray-500" aria-hidden="true" />
                A+B 보너스
              </p>
              <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-gray-600">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                SNS 공유와 후기 작성을 모두 완료하면 30일 확장 적합도 카드가 열립니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
