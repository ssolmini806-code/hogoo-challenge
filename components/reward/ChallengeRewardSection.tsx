'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpenText,
  Check,
  Download,
  Gift,
  Lock,
  MessageCircle,
  Share2,
  Sparkles,
} from 'lucide-react';

const DEFAULT_SHARE_MESSAGE =
  '7일 호구 탈출 챌린지 완주! 🎉 7일 동안 해냈어. 나처럼 해봐!';

type ChallengeDiagnosisResult = {
  completionDays: number;
  label: string;
};

type ChallengeRewardSectionProps = {
  userId: string | null;
  completionDays: number;
  onLoginRequired: () => void;
  onShareComplete: () => void;
  onReviewClick: () => void;
  onBothComplete: (diagnosisResult: ChallengeDiagnosisResult) => void;
  isShared: boolean;
  isReviewed: boolean;
};

function getDiagnosisLabel(completionDays: number) {
  if (completionDays >= 7) return '30일 준비 완료 유형';
  if (completionDays >= 5) return '루틴 형성 중, 30일이 강화해줄 수 있어요';
  return '구조가 필요한 유형, 30일 챌린지가 그걸 만들어줍니다';
}

function clampCompletionDays(completionDays: number) {
  return Math.min(7, Math.max(0, completionDays));
}

export default function ChallengeRewardSection({
  userId,
  completionDays,
  onLoginRequired,
  onShareComplete,
  onReviewClick,
  onBothComplete,
  isShared,
  isReviewed,
}: ChallengeRewardSectionProps) {
  const bothCompleted = isShared && isReviewed;
  const hasCalledBothComplete = useRef(false);
  const safeCompletionDays = clampCompletionDays(completionDays);
  const diagnosisResult = useMemo(
    () => ({
      completionDays: safeCompletionDays,
      label: getDiagnosisLabel(safeCompletionDays),
    }),
    [safeCompletionDays],
  );
  const [diagnosisVisible, setDiagnosisVisible] = useState(bothCompleted);
  const [shareMessage, setShareMessage] = useState(DEFAULT_SHARE_MESSAGE);

  useEffect(() => {
    if (!bothCompleted) {
      hasCalledBothComplete.current = false;
      setDiagnosisVisible(false);
      return;
    }

    setDiagnosisVisible(true);

    if (hasCalledBothComplete.current) return;
    hasCalledBothComplete.current = true;
    onBothComplete(diagnosisResult);
  }, [bothCompleted, diagnosisResult, onBothComplete]);

  const handleShareComplete = () => {
    if (!userId) {
      onLoginRequired();
      return;
    }

    onShareComplete();
  };

  const handleReviewClick = () => {
    if (!userId) {
      onLoginRequired();
      return;
    }

    onReviewClick();
  };

  const handleCertificateDownload = () => {
    if (!isShared || typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#fff7ed';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111827';
    context.textAlign = 'center';
    context.font = '700 72px sans-serif';
    context.fillText('7일 호구 탈출 챌린지', 600, 420);
    context.font = '800 96px sans-serif';
    context.fillText('완주 인증서', 600, 560);
    context.font = '500 42px sans-serif';
    context.fillText(`${safeCompletionDays}/7일 동안 해냈어요`, 600, 720);
    context.font = '600 40px sans-serif';
    context.fillText('후기 게시판 배지 지급 대상', 600, 980);
    context.font = '400 30px sans-serif';
    context.fillText(new Date().toLocaleDateString('ko-KR'), 600, 1220);

    const link = document.createElement('a');
    link.download = '7day-challenge-certificate.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <section className="w-full bg-white px-4 py-8 text-gray-950 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <p className="text-sm font-semibold text-emerald-700">
            공유하면 인증서를, 후기를 남기면 7일 회고록을 드려요.
          </p>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            둘 다 완료하면 30일 챌린지가 지금 나한테 필요한지 진단해드립니다.
          </p>
        </div>

        <div className="space-y-4">
          <article className="rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Share2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold">SNS 공유</h2>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  혜택 A: 7일 완주 인증서 이미지 + 배지
                </p>
              </div>
            </div>

            <label className="mt-4 block text-sm font-semibold text-gray-800" htmlFor="share-message">
              카카오 공유 문구
            </label>
            <textarea
              id="share-message"
              value={shareMessage}
              onChange={(event) => setShareMessage(event.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-6 text-gray-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleShareComplete}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 text-sm font-bold text-white transition hover:bg-gray-800"
              >
                {isShared ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                공유했어요 ✓
              </button>
              <button
                type="button"
                onClick={handleCertificateDownload}
                disabled={!isShared}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-bold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                {isShared ? (
                  <Download className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Lock className="h-4 w-4" aria-hidden="true" />
                )}
                인증서 다운로드
              </button>
            </div>

            {isShared ? (
              <p className="mt-3 flex items-start gap-2 text-sm font-medium text-emerald-700">
                <Award className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                후기 게시판에 닉네임 옆 배지가 표시돼요 🏅
              </p>
            ) : null}
          </article>

          <article className="rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                <BookOpenText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold">후기 작성</h2>
                <p className="mt-1 text-sm font-semibold text-gray-800">혜택 B: 7일 회고록</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReviewClick}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-white transition hover:bg-amber-600"
            >
              {isReviewed ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              )}
              후기 작성하기
            </button>

            {isReviewed ? (
              <div className="mt-4 rounded-lg border border-dashed border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900">7일 회고록</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  API에서 생성된 회고록 내용이 여기에 표시됩니다.
                </p>
              </div>
            ) : null}
          </article>

          <article className="rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                <Gift className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold">A+B 보너스</h2>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  둘 다 완료하면 → 30일 적합도 진단
                </p>
              </div>
            </div>

            {diagnosisVisible ? (
              <div className="mt-4 rounded-lg bg-indigo-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-indigo-950">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {diagnosisResult.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-indigo-800">
                  완료 기록 {safeCompletionDays}/7을 기준으로 30일 챌린지 적합도를
                  확인했어요.
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-indigo-700 px-4 text-sm font-bold text-white transition hover:bg-indigo-800"
                >
                  30일 챌린지 시작하기
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                SNS 공유와 후기 작성을 모두 완료하면 진단 결과가 열립니다.
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
