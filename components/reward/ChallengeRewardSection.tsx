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
import {
  createChallengeCertificate,
  createChallengeShareCard,
  downloadRewardImage,
} from '../../src/rewards/challenge-reward-images.js';

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
  onShareComplete: () => void | Promise<void>;
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
  const [shareStatus, setShareStatus] = useState('');
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

  const handleShareComplete = async () => {
    if (!userId) {
      onLoginRequired();
      return;
    }

    setShareStatus('나만의 완주 카드를 만들고 있어요…');
    try {
      const blob = await createChallengeShareCard({ memoir, completionDays: safeCompletionDays });
      const file = new File([blob], '나의-7일-경계연습.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '나의 7일 경계 연습', text: shareMessage });
        setShareStatus('완주 카드를 공유했어요. 인증서가 열렸습니다.');
      } else {
        downloadRewardImage(blob, file.name);
        setShareStatus('공유용 완주 카드를 저장했어요. 인증서가 열렸습니다.');
      }
      await onShareComplete();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setShareStatus('공유를 취소했어요. 카드는 언제든 다시 만들 수 있어요.');
        return;
      }
      console.error('Share card creation failed:', error);
      setShareStatus('공유 카드를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
    }
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

    try {
      const blob = await createChallengeCertificate({
        certificate,
        completionDays: safeCompletionDays,
        memoir,
      });
      downloadRewardImage(blob, '나의-7일-경계연습-완주인증서.png');
      setCertificateStatus('내 기록과 검증번호가 담긴 완주 인증서를 저장했어요.');
    } catch (error) {
      console.error('Certificate image creation failed:', error);
      setCertificateStatus('인증서 이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
    }
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

            <div className="challenge-share-preview" aria-label="공유 카드 미리보기">
              <p>7-DAY BOUNDARY PRACTICE · COMPLETED</p>
              <strong>나는 7일 동안,<br />자동 수락 대신<br /><em>내 기준을 연습했다.</em></strong>
              <blockquote>“{memoir.anchor}”</blockquote>
              <dl>
                <div><dt>{safeCompletionDays}/7</dt><dd>완주</dd></div>
                <div><dt>{memoir.completedMissions}/21</dt><dd>미션</dd></div>
                <div><dt>{memoir.noteCount}</dt><dd>기록</dd></div>
              </dl>
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
                {isShared ? '완주 카드 다시 받기' : '완주 카드 저장·공유'}
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

            {shareStatus ? <p className="challenge-reward-certificate-status" role="status">{shareStatus}</p> : null}

            {isShared ? (
              <p className="challenge-reward-status mt-3 flex items-start gap-2 text-sm font-medium text-emerald-700">
                <Award className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                공유 카드, 검증 가능한 완주 인증서, 후기 배지가 모두 열렸어요.
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
              <div className="challenge-reward-status challenge-memoir mt-4 rounded-lg border border-dashed border-amber-200 bg-amber-50 p-4">
                <div className="challenge-memoir-cover">
                  <span>MY SEVEN DAYS</span>
                  <p>{memoir.title}</p>
                  <strong>친절함을 버리지 않고<br />나를 지킨 기록</strong>
                </div>
                <p className="challenge-memoir-summary mt-1 text-sm leading-6 text-amber-800">
                  미션 {memoir.completedMissions}/21 · 행동 메모 {memoir.noteCount}개
                  {memoir.anxietyAverage !== null ? ` · 평균 불안 ${memoir.anxietyAverage}/10` : ''}
                  {memoir.guiltAverage !== null ? ` · 평균 죄책감 ${memoir.guiltAverage}/10` : ''}
                </p>
                <blockquote className="challenge-reward-quote"><small>앞으로 가져갈 한 문장</small>“{memoir.anchor}”</blockquote>
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
              <div className="challenge-reward-unlock challenge-fit-card mt-4 rounded-lg bg-indigo-50 p-4">
                <span className="challenge-fit-kicker">YOUR NEXT 30 DAYS</span>
                <p className="challenge-fit-title flex items-center gap-2 text-sm font-bold text-indigo-950">
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
