'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  Award,
  BookOpenText,
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

const STARTER_ITEMS = [
  '30일 목표 설정 PDF',
  '위기 구간 대처 가이드',
  '완주 인증서',
  '30일 스타터 체크리스트',
];

function getPaidSiteUrl() {
  return import.meta.env.VITE_PAID_SITE_URL ?? 'https://givecosystem.com/';
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

function PaidChallengeCta() {
  const paidSiteUrl = getPaidSiteUrl();

  return (
    <article className="overflow-hidden rounded-lg bg-gradient-to-br from-violet-700 via-fuchsia-700 to-indigo-800 p-5 text-white shadow-lg shadow-violet-900/20">
      <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-violet-50 ring-1 ring-white/20">
        3일 안에 시작 시
      </p>

      <div className="mt-4 space-y-3">
        {STARTER_ITEMS.map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm font-semibold text-white/95">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            {item}
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
  onLoginRequired,
  onShareComplete,
}: Pick<
  ChallengeCompletionRewardProps,
  'userId' | 'isShared' | 'onLoginRequired' | 'onShareComplete'
>) {
  const handleShareClick = () => {
    if (!userId) {
      onLoginRequired();
      return;
    }

    openSevenDayChallengeShare();
    onShareComplete();
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
            후기 작성 후 다운 받은 7일 완주 인증서를 공유하면 30일 스타터 체크리스트가
            열려요
          </p>
        </div>
      </div>

      <div className="mt-4">
        <RewardActionButton onClick={handleShareClick} disabled={isShared}>
          {isShared ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              공유했어요 ✓
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" aria-hidden="true" />
              SNS에 공유하기
            </>
          )}
        </RewardActionButton>
      </div>

      <div
        className={`mt-4 rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-4 transition duration-500 ${
          isShared ? 'animate-[fadeIn_420ms_ease-out] opacity-100 blur-0' : 'opacity-70 blur-sm'
        }`}
      >
        <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-950">
          {isShared ? (
            <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          ) : (
            <Lock className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          )}
          30일 스타터 체크리스트
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-900">
          <li>1일차 목표를 한 문장으로 고정하기</li>
          <li>흔들리는 시간대와 대체 행동 정하기</li>
          <li>7일 회고에서 반복할 장점 1개 고르기</li>
        </ul>
      </div>

      {isShared ? (
        <div className="mt-4 animate-[fadeIn_420ms_ease-out] rounded-lg bg-gray-50 p-4">
          <p className="flex items-center gap-2 text-sm font-extrabold text-gray-950">
            <BookOpenText className="h-4 w-4 text-gray-700" aria-hidden="true" />
            7일 회고록
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            7일 동안 유지한 행동, 흔들린 순간, 30일로 이어갈 한 가지 기준이 여기에
            표시됩니다.
          </p>
        </div>
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
                SNS 공유와 후기 작성을 모두 완료하면 30일 적합도 진단 카드가 열립니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
