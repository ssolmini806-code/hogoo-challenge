// 결과 시퀀스의 보상 봉투 슬라이드 진입점.
// result-sequence.html은 순수 JS 슬라이드 엔진이라, 이 위젯은 슬라이드 안의
// 컨테이너에만 마운트되고 슬라이드 탐색(이전/계속/스와이프/키보드)은 건드리지 않는다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './supabase';
import LoginModal from './components/LoginModal';
import ResultRewardEnvelope from '../components/reward/ResultRewardEnvelope';
import { createRewardService } from './rewards/free-test-reward-service';
import { buildResultId, normalizeTypeKey } from './rewards/result-id';
import { buildGoodwillManual, buildBoundaryCard } from './rewards/give-reward-content';
import { trackReward, trackRewardOnce } from './rewards/reward-analytics';

const EMPTY_STATUS = { sns: false, review: false, both: false, bothContent: null };

function readScores() {
  try {
    return JSON.parse(window.localStorage.getItem('give_test_scores') || 'null');
  } catch {
    return null;
  }
}

function ResultRewardWidget({ typeKey }) {
  const [session, setSession] = useState(null);
  // getSession은 비동기다. 응답 전에는 로그인 여부를 "모른다"로 다뤄야
  // 이미 로그인한 사용자에게 logged_in=false가 먼저 확정되지 않는다.
  const [sessionReady, setSessionReady] = useState(false);
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [loginOpen, setLoginOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // 후기 복귀 연출 상태. 보상 권한이 아니라 안내 문구를 고르는 데만 쓴다.
  const [reviewReturn, setReviewReturn] = useState('idle'); // idle | checking | confirmed | missing

  const service = useMemo(() => createRewardService(supabase), []);
  const resultId = useMemo(() => buildResultId(typeKey), [typeKey]);
  const scores = useMemo(() => readScores(), []);
  const userId = session?.user?.id ?? null;
  const returnedFromReview = useRef(
    new URLSearchParams(window.location.search).get('reward') === 'reviewed',
  );

  // 리스너를 매번 다시 등록하지 않으면서 최신 로그인 상태를 읽기 위해 ref를 쓴다.
  const loggedInRef = useRef(false);
  const sessionReadyRef = useRef(false);
  const pendingSlideViewRef = useRef(false);

  useEffect(() => { loggedInRef.current = Boolean(userId); }, [userId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      sessionReadyRef.current = true;
      setSessionReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);

  // reward_slide_view는 마운트가 아니라 보상 슬라이드가 실제로 보일 때 기록한다.
  // 로그인 상태를 아직 모르면 기록을 미뤘다가 getSession 응답 후에 확정한다.
  const recordSlideView = useCallback(() => {
    if (!sessionReadyRef.current) {
      pendingSlideViewRef.current = true;
      return;
    }
    trackRewardOnce(
      'reward_slide_view',
      { result_type: typeKey, logged_in: loggedInRef.current },
      typeKey,
    );
  }, [typeKey]);

  useEffect(() => {
    const onSlideChange = (event) => {
      if (event.detail?.slide?.id === 'slideReward') recordSlideView();
    };
    document.addEventListener('result:slidechange', onSlideChange);
    // #reward로 바로 복귀해 마운트 시점에 이미 활성 상태일 수 있다
    if (document.getElementById('slideReward')?.classList.contains('active')) recordSlideView();
    return () => document.removeEventListener('result:slidechange', onSlideChange);
  }, [recordSlideView]);

  // getSession이 끝난 뒤, 미뤄둔 노출 기록을 올바른 로그인 상태로 확정한다.
  useEffect(() => {
    if (!sessionReady || !pendingSlideViewRef.current) return;
    pendingSlideViewRef.current = false;
    recordSlideView();
  }, [sessionReady, recordSlideView]);

  // 같은 결과(result_id)의 보상 상태만 DB에서 읽는다. 해금 근거는 오직 DB row다.
  const refresh = useCallback(async () => {
    if (!userId) {
      setStatus(EMPTY_STATUS);
      return EMPTY_STATUS;
    }
    try {
      let next = await service.fetchRewardStatus(userId, resultId);
      if (next.sns && next.review && !next.both) {
        const result = await service.ensureBothReward(
          userId,
          resultId,
          () => buildGoodwillManual(typeKey, scores),
        );
        if (result.unlocked) {
          next = { ...next, both: true, bothContent: result.content };
          if (result.created) {
            trackRewardOnce('reward_both_unlocked', { result_type: typeKey, reward_type: 'both', logged_in: true }, resultId);
          }
        }
      }
      setStatus(next);
      setErrorMessage('');
      return next;
    } catch (error) {
      console.error('보상 상태를 불러오지 못했습니다:', error);
      setErrorMessage('보상 상태를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      return null;
    }
  }, [resultId, scores, service, typeKey, userId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const next = await refresh();
      if (cancelled || !returnedFromReview.current) return;

      // reward=reviewed는 "후기를 쓰고 돌아왔다"는 연출 신호일 뿐이다.
      // 실제 해금 여부는 위에서 읽은 DB 상태로만 판단한다.
      if (!userId) {
        setReviewReturn('missing');
        return;
      }
      if (next?.review) {
        setReviewReturn('confirmed');
        trackRewardOnce('review_complete', { result_type: typeKey, reward_type: 'review', logged_in: true }, resultId);
        trackRewardOnce('reward_b_unlocked', { result_type: typeKey, reward_type: 'review', logged_in: true }, resultId);
      } else if (next) {
        setReviewReturn('missing');
      }

      returnedFromReview.current = false;
      const url = new URL(window.location.href);
      url.searchParams.delete('reward');
      window.history.replaceState(null, '', url.toString());
    })();

    return () => { cancelled = true; };
  }, [refresh, resultId, typeKey, userId]);

  const handleConfirmShare = useCallback(async (channel) => {
    if (!userId) {
      setLoginOpen(true);
      return;
    }
    if (saving || status.sns) return;
    setSaving(true);
    try {
      await service.saveReward(userId, resultId, 'sns', buildBoundaryCard(typeKey));
      trackRewardOnce('reward_a_unlocked', { result_type: typeKey, reward_type: 'sns', channel, logged_in: true }, resultId);
      await refresh();
    } catch (error) {
      console.error('공유 보상 저장 실패:', error);
      setErrorMessage('공유 보상 저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }, [refresh, resultId, saving, service, status.sns, typeKey, userId]);

  const reviewNotice = reviewReturn === 'confirmed'
    ? '후기가 등록됐어요. 위험 장면 3개가 열렸습니다.'
    : reviewReturn === 'missing'
      ? '후기 완료 상태를 확인하지 못했어요. 후기가 저장됐는지 확인한 뒤 다시 시도해주세요.'
      : '';

  return (
    <>
      <ResultRewardEnvelope
        typeKey={typeKey}
        scores={scores}
        status={status}
        isLoggedIn={Boolean(userId)}
        onRequireLogin={() => setLoginOpen(true)}
        onConfirmShare={handleConfirmShare}
        saving={saving}
        errorMessage={errorMessage}
        reviewNotice={reviewNotice}
        reviewNoticeTone={reviewReturn === 'missing' ? 'warn' : 'info'}
      />
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          trackReward('reward_login_complete', { result_type: typeKey, logged_in: true });
        }}
      />
    </>
  );
}

// GIVE ID 결과에서만 마운트한다.
// 다른 테스트에서는 Supabase auth / 보상 DB / 분석 호출이 한 건도 나가면 안 된다.
function shouldMount(container) {
  if (!container) return false;
  const params = new URLSearchParams(window.location.search);
  if ((params.get('test') || 'give') !== 'give') return false;
  const slide = container.closest('.sequence-slide') || document.getElementById('slideReward');
  if (!slide || slide.hidden) return false;
  return true;
}

const container = document.getElementById('result-reward-root');
if (shouldMount(container)) {
  // 슬라이드 엔진은 document 레벨에서 클릭/키를 듣고 페이지를 넘긴다.
  // 보상 UI 안에서의 상호작용이 슬라이드를 넘기지 않도록 여기서 막는다.
  ['click', 'pointerdown', 'keydown', 'touchstart', 'touchend'].forEach((name) => {
    container.addEventListener(name, (event) => event.stopPropagation());
  });

  const typeKey = normalizeTypeKey(new URLSearchParams(window.location.search).get('type'));
  createRoot(container).render(<ResultRewardWidget typeKey={typeKey} />);
}
