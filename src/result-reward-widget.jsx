// 결과 시퀀스의 보상 봉투 슬라이드 진입점.
// result-sequence.html은 순수 JS 슬라이드 엔진이라, 이 위젯은 슬라이드 안의
// 컨테이너에만 마운트되고 슬라이드 탐색(이전/계속/스와이프/키보드)은 건드리지 않는다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './supabase';
import LoginModal from './components/LoginModal';
import ResultRewardEnvelope from '../components/reward/ResultRewardEnvelope';
import { createRewardService } from './rewards/free-test-reward-service';
import { buildResultId, normalizeTypeKey } from './rewards/result-id';
import { buildGoodwillManual, buildBoundaryCard, buildRiskScenes } from './rewards/give-reward-content';
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
  const [sessionReady, setSessionReady] = useState(false);
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [loginOpen, setLoginOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const service = useMemo(() => createRewardService(supabase), []);
  const resultId = useMemo(() => buildResultId(typeKey), [typeKey]);
  const scores = useMemo(() => readScores(), []);
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);

  // 같은 결과(result_id)의 보상 상태만 읽는다. A와 B가 모두 있으면 A+B를 만든다.
  const refresh = useCallback(async () => {
    if (!userId) {
      setStatus(EMPTY_STATUS);
      return;
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
    } catch (error) {
      console.error('보상 상태를 불러오지 못했습니다:', error);
      setErrorMessage('보상 상태를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  }, [resultId, scores, service, typeKey, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  // 후기 작성 후 돌아온 경우: B 보상을 저장하고 해금 순간을 보여준다.
  useEffect(() => {
    if (!sessionReady || !userId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('reward') !== 'reviewed') return;

    let cancelled = false;
    (async () => {
      try {
        await service.saveReward(userId, resultId, 'review', buildRiskScenes(typeKey, scores));
        trackRewardOnce('review_complete', { result_type: typeKey, reward_type: 'review', logged_in: true }, resultId);
        trackRewardOnce('reward_b_unlocked', { result_type: typeKey, reward_type: 'review', logged_in: true }, resultId);
        if (!cancelled) await refresh();
      } catch (error) {
        console.error('후기 보상 저장 실패:', error);
        if (!cancelled) setErrorMessage('후기 보상 저장에 실패했어요. 새로고침하면 다시 시도합니다.');
        return;
      }
      // 새로고침해도 중복 저장/중복 이벤트가 나지 않도록 파라미터를 지운다
      const url = new URL(window.location.href);
      url.searchParams.delete('reward');
      window.history.replaceState(null, '', url.toString());
    })();

    return () => { cancelled = true; };
  }, [refresh, resultId, scores, service, sessionReady, typeKey, userId]);

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

const container = document.getElementById('result-reward-root');
if (container && !container.hidden) {
  // 슬라이드 엔진은 document 레벨에서 클릭/키를 듣고 페이지를 넘긴다.
  // 보상 UI 안에서의 상호작용이 슬라이드를 넘기지 않도록 여기서 막는다.
  ['click', 'pointerdown', 'keydown', 'touchstart', 'touchend'].forEach((name) => {
    container.addEventListener(name, (event) => event.stopPropagation());
  });

  const typeKey = normalizeTypeKey(new URLSearchParams(window.location.search).get('type'));
  createRoot(container).render(<ResultRewardWidget typeKey={typeKey} />);
}
