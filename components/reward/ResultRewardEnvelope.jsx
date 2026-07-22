import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RewardEnvelope from './RewardEnvelope';
import RewardDetailPanel from './RewardDetailPanel';
import { buildBoundaryCard, buildRiskScenes, buildGoodwillManual } from '../../src/rewards/give-reward-content';
import { buildResultShareUrl, buildShareText, buildDiagnosisUrl } from '../../src/rewards/share-url';
import { buildReviewStartUrl } from '../../src/rewards/reward-return-url';
import { trackReward, trackRewardOnce } from '../../src/rewards/reward-analytics';

const PENDING_INTENT_KEY = 'give_reward_pending_intent_v1';

// 외부 공유창 방식은 게시 여부를 알 수 없어서, 창을 띄운 뒤 잠깐 기다렸다가
// 사용자가 직접 확인하는 버튼을 연다. "실제 검증"이 아님을 문구로 분명히 한다.
const SELF_CONFIRM_DELAY_MS = 4000;

function clearPendingIntent() {
  try {
    window.sessionStorage.removeItem(PENDING_INTENT_KEY);
  } catch {
    /* 지우지 못해도 흐름은 계속된다 */
  }
}

/**
 * 하려던 행동은 결과 유형과 함께 저장한다.
 * 다른 유형의 결과 화면에서 복원되면 안 되기 때문이다.
 */
function readPendingIntent(typeKey) {
  let parsed;
  try {
    parsed = JSON.parse(window.sessionStorage.getItem(PENDING_INTENT_KEY) || 'null');
  } catch {
    parsed = null;
  }
  const valid = parsed
    && (parsed.intent === 'share' || parsed.intent === 'review')
    && parsed.typeKey === typeKey;
  if (parsed && !valid) clearPendingIntent(); // 불일치·잘못된 값은 즉시 삭제
  return valid ? parsed.intent : '';
}

function writePendingIntent(typeKey, intent) {
  try {
    if (intent) window.sessionStorage.setItem(PENDING_INTENT_KEY, JSON.stringify({ typeKey, intent }));
    else clearPendingIntent();
  } catch {
    /* 저장 못 해도 흐름은 계속된다 */
  }
}

export default function ResultRewardEnvelope({
  typeKey,
  scores,
  status,
  isLoggedIn,
  onRequireLogin,
  onConfirmShare,
  saving,
  errorMessage,
  reviewNotice,
  reviewNoticeTone = 'info',
}) {
  const [panel, setPanel] = useState('');
  const [manualPage, setManualPage] = useState(0);
  const [shareStage, setShareStage] = useState('idle'); // idle | waiting | confirmable
  const [shareChannel, setShareChannel] = useState('');
  const [toast, setToast] = useState('');
  const [pendingIntent, setPendingIntent] = useState(() => readPendingIntent(typeKey));
  const confirmTimer = useRef(null);
  const toastTimer = useRef(null);

  const boundaryCard = useMemo(() => buildBoundaryCard(typeKey), [typeKey]);
  const riskScenes = useMemo(() => buildRiskScenes(typeKey, scores), [typeKey, scores]);
  const manual = useMemo(() => buildGoodwillManual(typeKey, scores), [typeKey, scores]);

  const unlockedCount = (status.sns ? 1 : 0) + (status.review ? 1 : 0);
  const shareUrl = useMemo(() => buildResultShareUrl(window.location.origin, typeKey), [typeKey]);

  useEffect(() => {
    setPendingIntent(readPendingIntent(typeKey));
  }, [typeKey]);

  useEffect(() => () => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // 로그인하고 돌아왔을 때 하려던 행동을 잊지 않는다.
  // 팝업 차단 때문에 공유창을 자동으로 열지는 않고, 다음 클릭으로 이어가게 한다.
  useEffect(() => {
    if (isLoggedIn && pendingIntent) {
      trackRewardOnce('reward_login_complete', { result_type: typeKey, reward_type: pendingIntent === 'share' ? 'sns' : 'review' }, typeKey);
    }
  }, [isLoggedIn, pendingIntent, typeKey]);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  }, []);

  const clearIntent = useCallback(() => {
    writePendingIntent(typeKey, '');
    setPendingIntent('');
  }, [typeKey]);

  const requireLogin = useCallback((intent) => {
    writePendingIntent(typeKey, intent);
    setPendingIntent(intent);
    trackReward('reward_login_open', {
      result_type: typeKey,
      reward_type: intent === 'share' ? 'sns' : 'review',
      logged_in: false,
    });
    onRequireLogin();
  }, [onRequireLogin, typeKey]);

  const openPanel = useCallback((name) => {
    setPanel(name);
    setManualPage(0);
    const rewardType = name === 'boundary' ? 'sns' : name === 'scenes' ? 'review' : 'both';
    const unlocked = name === 'boundary' ? status.sns : name === 'scenes' ? status.review : status.both;
    trackReward(unlocked ? 'reward_reopened' : 'reward_preview_open', {
      result_type: typeKey,
      reward_type: rewardType,
      logged_in: isLoggedIn,
    });
  }, [isLoggedIn, status.both, status.review, status.sns, typeKey]);

  const armSelfConfirm = useCallback((channel, immediate) => {
    setShareChannel(channel);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    if (immediate) {
      setShareStage('confirmable');
      return;
    }
    setShareStage('waiting');
    confirmTimer.current = setTimeout(() => setShareStage('confirmable'), SELF_CONFIRM_DELAY_MS);
  }, []);

  const share = useCallback(async (channel) => {
    if (!isLoggedIn) {
      requireLogin('share');
      return;
    }
    clearIntent();
    trackReward('share_action_start', { result_type: typeKey, reward_type: 'sns', channel, logged_in: true });

    if (channel === 'native') {
      try {
        await navigator.share({ title: 'GIVE ID 결과', text: buildShareText(typeKey), url: shareUrl });
        // 네이티브 공유가 성공 resolve된 경우에만 바로 확인 단계로 넘어간다
        trackReward('share_action_success', { result_type: typeKey, reward_type: 'sns', channel, logged_in: true });
        armSelfConfirm(channel, true);
      } catch {
        // 사용자가 취소했거나 실패 — 확인 단계를 열지 않는다
        setShareStage('idle');
      }
      return;
    }

    if (channel === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('결과 링크를 복사했어요. 붙여넣어 공유해주세요.');
        trackReward('share_action_success', { result_type: typeKey, reward_type: 'sns', channel, logged_in: true });
        armSelfConfirm(channel, true);
      } catch {
        showToast('링크 복사에 실패했어요. 주소창의 링크를 직접 복사해주세요.');
        setShareStage('idle');
      }
      return;
    }

    const target = channel === 'kakao'
      ? `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}`
      : `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareText(typeKey))}&url=${encodeURIComponent(shareUrl)}`;
    const opened = window.open(target, '_blank', 'noopener,noreferrer,width=600,height=520');
    if (!opened) {
      // 팝업이 막혔는데 확인 단계를 열면 공유하지 않고도 해금된다
      showToast('공유창이 열리지 않았어요. 팝업 차단을 해제하거나 링크 복사를 사용해주세요.');
      setShareStage('idle');
      return;
    }
    armSelfConfirm(channel, false);
  }, [armSelfConfirm, clearIntent, isLoggedIn, requireLogin, shareUrl, showToast, typeKey]);

  const confirmShare = useCallback(() => {
    trackReward('share_confirmed', { result_type: typeKey, reward_type: 'sns', channel: shareChannel, logged_in: true });
    setShareStage('idle');
    onConfirmShare(shareChannel);
  }, [onConfirmShare, shareChannel, typeKey]);

  const startReview = useCallback(() => {
    if (!isLoggedIn) {
      requireLogin('review');
      return;
    }
    clearIntent();
    trackReward('review_start', { result_type: typeKey, reward_type: 'review', logged_in: true });
    window.location.href = buildReviewStartUrl(typeKey);
  }, [clearIntent, isLoggedIn, requireLogin, typeKey]);

  const diagnosisUrl = buildDiagnosisUrl(window.__PAID_SITE_URL);

  const resumeLabel = pendingIntent === 'share'
    ? '공유 계속하기'
    : pendingIntent === 'review'
      ? '후기 계속 작성하기'
      : '';

  return (
    <div className="reward-slide-inner">
      <p className="reward-eyebrow">A NOTE FOR YOU</p>
      <h2 className="reward-headline">결과를 남기면,<br />당신을 위한 한 장이 더 열려요</h2>

      <div className="reward-envelope-row">
        <RewardEnvelope unlockedCount={unlockedCount} />
        <div className="reward-progress" role="status" aria-live="polite">
          <strong>{unlockedCount}/2</strong>
          <span>
            {unlockedCount === 0 && '두 가지를 남기면 봉투가 열려요'}
            {unlockedCount === 1 && '하나 남았어요. 봉인이 절반 풀렸어요'}
            {unlockedCount === 2 && '봉투가 열렸어요. 선의 사용 설명서를 확인하세요'}
          </span>
        </div>
      </div>

      {isLoggedIn && resumeLabel ? (
        <p className="reward-resume">
          로그인됐어요. 이어서 진행할 수 있어요 —{' '}
          <button type="button" className="reward-link-btn" onClick={pendingIntent === 'share' ? () => share(navigator.share ? 'native' : 'copy') : startReview}>
            {resumeLabel}
          </button>
        </p>
      ) : null}

      {reviewNotice ? (
        <p className={reviewNoticeTone === 'warn' ? 'reward-error' : 'reward-resume'} role="status">
          {reviewNotice}
        </p>
      ) : null}

      {errorMessage ? <p className="reward-error" role="alert">{errorMessage}</p> : null}

      <div className="reward-cards">
        {/* 보상 A — 공유 */}
        <article className={`reward-card${status.sns ? ' is-unlocked' : ''}`}>
          <p className="reward-card-tag">보상 A · SNS 공유</p>
          <h3 className="reward-card-title">내 유형의 경계 문장 카드</h3>
          {status.sns ? (
            <p className="reward-card-copy">{boundaryCard.situation}</p>
          ) : (
            <p className="reward-card-copy">
              {boundaryCard.teaser} <span className="reward-card-hint">{boundaryCard.teaserHint}</span>
            </p>
          )}

          {status.sns ? (
            <button type="button" className="reward-btn is-primary" onClick={() => openPanel('boundary')}>
              경계 문장 카드 열어보기
            </button>
          ) : shareStage === 'idle' ? (
            <div className="reward-share-grid">
              {typeof navigator !== 'undefined' && navigator.share ? (
                <button type="button" className="reward-btn" onClick={() => share('native')}>공유하기</button>
              ) : null}
              <button type="button" className="reward-btn" onClick={() => share('kakao')}>카카오톡</button>
              <button type="button" className="reward-btn" onClick={() => share('x')}>X</button>
              <button type="button" className="reward-btn" onClick={() => share('copy')}>링크 복사</button>
            </div>
          ) : (
            <div className="reward-confirm" role="status" aria-live="polite">
              <p className="reward-confirm-note">
                공유했는지는 저희가 확인할 수 없어요. 직접 눌러 알려주세요.
              </p>
              <button
                type="button"
                className="reward-btn is-primary"
                onClick={confirmShare}
                disabled={shareStage !== 'confirmable' || saving}
              >
                {shareStage !== 'confirmable' ? '공유 중…' : saving ? '저장 중…' : '공유했어요 ✓'}
              </button>
              <button type="button" className="reward-link-btn" onClick={() => setShareStage('idle')}>
                다른 방법으로 공유하기
              </button>
            </div>
          )}
        </article>

        {/* 보상 B — 후기 */}
        <article className={`reward-card${status.review ? ' is-unlocked' : ''}`}>
          <p className="reward-card-tag">보상 B · 후기 작성</p>
          <h3 className="reward-card-title">내가 흔들리기 쉬운 위험 장면 3개</h3>
          <p className="reward-card-copy">
            {status.review
              ? `${riskScenes.axisTitle} 축에서 반복되기 쉬운 장면과 대응 문장을 정리했어요.`
              : '가장 높게 나온 위험 축을 기준으로, 당신이 흔들리기 쉬운 장면 세 개를 준비해뒀어요.'}
          </p>
          {status.review ? (
            <button type="button" className="reward-btn is-primary" onClick={() => openPanel('scenes')}>
              위험 장면 열어보기
            </button>
          ) : (
            <button type="button" className="reward-btn" onClick={startReview}>후기 쓰고 열기</button>
          )}
        </article>

        {/* A+B */}
        <article className={`reward-card is-final${status.both ? ' is-unlocked' : ''}`}>
          <p className="reward-card-tag">A + B</p>
          <h3 className="reward-card-title">나의 선의 사용 설명서</h3>
          <p className="reward-card-copy">
            {status.both
              ? '내 유형과 위험 축을 하나로 묶은 일곱 장의 정리예요.'
              : '두 가지를 모두 남기면, 유형과 위험 축을 묶은 한 장이 열려요.'}
          </p>
          <button
            type="button"
            className="reward-btn is-primary"
            onClick={() => openPanel('manual')}
            disabled={!status.both}
          >
            {status.both ? '설명서 열어보기' : '아직 잠겨 있어요'}
          </button>
        </article>
      </div>

      <p className="reward-skip">
        보상은 나중에 <a href="/mypage" className="reward-mypage-link" onClick={() => trackReward('reward_archive_open', { result_type: typeKey, logged_in: isLoggedIn })}>마이페이지</a>에서도 다시 볼 수 있어요.
      </p>

      {toast ? <p className="reward-toast" role="status">{toast}</p> : null}

      {panel === 'boundary' ? (
        <RewardDetailPanel eyebrow="보상 A" title={boundaryCard.title} onClose={() => setPanel('')}>
          <blockquote className="reward-quote">{boundaryCard.sentence}</blockquote>
          <p className="reward-panel-copy">{boundaryCard.situation}</p>
        </RewardDetailPanel>
      ) : null}

      {panel === 'scenes' ? (
        <RewardDetailPanel eyebrow="보상 B" title={riskScenes.title} onClose={() => setPanel('')}>
          <p className="reward-panel-copy">{riskScenes.intro}</p>
          <ol className="reward-scene-list">
            {riskScenes.scenes.map((scene, index) => (
              <li key={index}>
                <p className="reward-scene-title">{scene.scene}</p>
                <p className="reward-scene-signal"><span>알아차릴 신호</span>{scene.signal}</p>
                <p className="reward-scene-response"><span>바로 쓸 한 문장</span>“{scene.response}”</p>
              </li>
            ))}
          </ol>
          <p className="reward-panel-note">{riskScenes.note}</p>
        </RewardDetailPanel>
      ) : null}

      {panel === 'manual' ? (
        <RewardDetailPanel
          eyebrow={`A + B · ${manualPage + 1}/${manual.pages.length}`}
          title={manual.title}
          onClose={() => setPanel('')}
          footer={
            <div className="reward-panel-pager">
              <button type="button" className="reward-btn" onClick={() => setManualPage((p) => Math.max(0, p - 1))} disabled={manualPage === 0}>
                이전 장
              </button>
              {manualPage < manual.pages.length - 1 ? (
                <button type="button" className="reward-btn is-primary" onClick={() => setManualPage((p) => p + 1)}>
                  다음 장
                </button>
              ) : (
                <a
                  className="reward-btn is-primary"
                  href={diagnosisUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackReward('diagnosis_handoff_click', { result_type: typeKey, reward_type: 'both', logged_in: isLoggedIn })}
                >
                  결제 없이 64문항 검사 시작하기
                </a>
              )}
            </div>
          }
        >
          {manual.pages[manualPage].sectionIds.map((id) => {
            const section = manual.sections.find((s) => s.id === id);
            return (
              <section className="reward-manual-section" key={id}>
                <h4 className="reward-manual-heading">{section.heading}</h4>
                {Array.isArray(section.body) ? (
                  <ul className="reward-manual-list">
                    {section.body.map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                ) : (
                  <p className="reward-manual-body">{section.body}</p>
                )}
                {section.detail ? <p className="reward-manual-detail">{section.detail}</p> : null}
              </section>
            );
          })}
          {manualPage === manual.pages.length - 1 ? (
            <p className="reward-panel-note">{manual.note}</p>
          ) : null}
        </RewardDetailPanel>
      ) : null}
    </div>
  );
}
