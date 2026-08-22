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
  memoir: {
    title: string;
    completedMissions: number;
    noteCount: number;
    anxietyAverage: number | null;
    guiltAverage: number | null;
    anchor: string;
    daily: Array<{
      day: number;
      title: string;
      completedMissions: number;
      phrase: string;
      note: string;
      anxiety: number | null;
      guilt: number | null;
    }>;
  };
  fitCard: { label: string; reason: string; nextAction: string };
  paidChallengeUrl: string;
  onCertificateIssue: () => Promise<{ code: string; issuedAt: string; completedMissions: number }>;
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
  memoir,
  fitCard,
  paidChallengeUrl,
  onCertificateIssue,
}: ChallengeRewardSectionProps) {
  const bothCompleted = isShared && isReviewed;
  const hasCalledBothComplete = useRef(false);
  const safeCompletionDays = clampCompletionDays(completionDays);
  const diagnosisResult = useMemo(
    () => ({
      completionDays: safeCompletionDays,
      label: fitCard?.label || getDiagnosisLabel(safeCompletionDays),
    }),
    [fitCard, safeCompletionDays],
  );
  const [diagnosisVisible, setDiagnosisVisible] = useState(bothCompleted);
  const [shareMessage, setShareMessage] = useState(DEFAULT_SHARE_MESSAGE);
  const [certificateStatus, setCertificateStatus] = useState('');

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

  const handleCertificateDownload = async () => {
    if (!isShared || typeof document === 'undefined') return;

    setCertificateStatus('인증서를 발급하고 있어요…');
    let certificate;
    try {
      certificate = await onCertificateIssue();
    } catch (error) {
      console.error('Certificate issue failed:', error);
      setCertificateStatus('인증서를 발급하지 못했어요. 잠시 후 다시 시도해주세요.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;

    const context = canvas.getContext('2d');
    if (!context) return;

    const background = context.createLinearGradient(0, 0, 1200, 1600);
    background.addColorStop(0, '#f8f1df');
    background.addColorStop(1, '#eee1c4');
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#3f3020';
    context.lineWidth = 4;
    context.strokeRect(70, 70, 1060, 1460);
    context.strokeStyle = '#9f3223';
    context.lineWidth = 2;
    context.strokeRect(88, 88, 1024, 1424);
    context.fillStyle = '#9f3223';
    context.textAlign = 'center';
    context.font = '700 26px sans-serif';
    context.fillText('GIVE ECOSYSTEM · 7-DAY PRACTICE', 600, 230);
    context.fillStyle = '#1f241f';
    context.font = '700 72px sans-serif';
    context.fillText('7일 경계 연습', 600, 430);
    context.font = '800 96px sans-serif';
    context.fillText('완주 인증서', 600, 575);
    context.font = '500 42px sans-serif';
    context.fillText(`${safeCompletionDays}/7일 · 미션 ${certificate.completedMissions}/21 완료`, 600, 745);
    context.font = '600 40px sans-serif';
    context.fillText('내 선의를 지키는 기준을 끝까지 기록했습니다', 600, 900);
    context.beginPath();
    context.arc(600, 1080, 78, 0, Math.PI * 2);
    context.fillStyle = '#9f3223';
    context.fill();
    context.fillStyle = '#f8f1df';
    context.font = '800 30px sans-serif';
    context.fillText('7 DAYS', 600, 1091);
    context.fillStyle = '#1f241f';
    context.font = '400 27px monospace';
    context.fillText(`발급번호 ${certificate.code}`, 600, 1270);
    context.font = '400 25px sans-serif';
    context.fillText(new Date(certificate.issuedAt).toLocaleDateString('ko-KR'), 600, 1330);
    context.font = '400 22px sans-serif';
    context.fillText(`검증: hogoo-challenge.pages.dev/certificate.html?code=${certificate.code}`, 600, 1410);

    const link = document.createElement('a');
    link.download = '7day-challenge-certificate.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setCertificateStatus('검증 가능한 인증서를 다운로드했어요.');
  };

  return (
    <section className="challenge-reward w-full bg-white px-4 py-8 text-gray-950 sm:px-6">
      <div className="challenge-reward-inner mx-auto max-w-2xl">
        <div className="challenge-reward-intro mb-5">
          <p className="text-sm font-semibold text-emerald-700">
            공유하면 인증서를, 후기를 남기면 7일 회고록을 드려요.
          </p>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            둘 다 완료하면 30일 챌린지가 지금 나한테 필요한지 진단해드립니다.
          </p>
        </div>

        <div className="challenge-reward-list space-y-4">
          <article className="challenge-reward-step rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="challenge-reward-step-head flex items-start gap-3">
              <div className="challenge-reward-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
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
              className="challenge-reward-message mt-2 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-6 text-gray-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />

            <div className="challenge-reward-actions mt-4 grid gap-2 sm:grid-cols-2">
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
              <p className="challenge-reward-status mt-3 flex items-start gap-2 text-sm font-medium text-emerald-700">
                <Award className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                후기 게시판에 닉네임 옆 배지가 표시돼요 🏅
              </p>
            ) : null}
            {certificateStatus ? <p className="challenge-reward-certificate-status" role="status">{certificateStatus}</p> : null}
          </article>

          <article className="challenge-reward-step rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="challenge-reward-step-head flex items-start gap-3">
              <div className="challenge-reward-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
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
              <div className="challenge-reward-status mt-4 rounded-lg border border-dashed border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900">{memoir.title}</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  미션 {memoir.completedMissions}/21 · 행동 메모 {memoir.noteCount}개
                  {memoir.anxietyAverage !== null ? ` · 평균 불안 ${memoir.anxietyAverage}/10` : ''}
                  {memoir.guiltAverage !== null ? ` · 평균 죄책감 ${memoir.guiltAverage}/10` : ''}
                </p>
                <blockquote className="challenge-reward-quote">“{memoir.anchor}”</blockquote>
                <ol className="challenge-reward-memoir-days">
                  {memoir.daily.map((entry) => (
                    <li key={entry.day}>
                      <strong>Day {entry.day}. {entry.title}</strong>
                      <span>미션 {entry.completedMissions}/3</span>
                      {entry.note ? <p>{entry.note}</p> : null}
                      {entry.phrase ? <small>남긴 문장 · “{entry.phrase}”</small> : null}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </article>

          <article className="challenge-reward-step rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="challenge-reward-step-head flex items-start gap-3">
              <div className="challenge-reward-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                <Gift className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold">A+B 보너스</h2>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  둘 다 완료하면 → 30일 확장 적합도 카드
                </p>
              </div>
            </div>

            {diagnosisVisible ? (
              <div className="challenge-reward-unlock mt-4 rounded-lg bg-indigo-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-indigo-950">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {fitCard.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-indigo-800">
                  {fitCard.reason}
                </p>
                <p className="challenge-reward-next-action">{fitCard.nextAction}</p>
                <a
                  className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-indigo-700 px-4 text-sm font-bold text-white transition hover:bg-indigo-800"
                  href={paidChallengeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  30일 챌린지 시작하기
                </a>
              </div>
            ) : (
              <div className="challenge-reward-unlock mt-4 rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                SNS 공유와 후기 작성을 모두 완료하면 30일 확장 적합도 카드가 열립니다.
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
