import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import LoginModal from './components/LoginModal';
import FreeTestRewardSection from '../components/reward/FreeTestRewardSection';
import { initializeAdminModeFromUrl, isAdminModeEnabled } from './utils/adminMode';

type RewardType = 'sns' | 'review' | 'both';

type RewardRow = {
  id: string;
  reward_type: RewardType | null;
  unlocked: boolean | null;
  generated_content: unknown;
};

type RewardUpdateEvent = CustomEvent<{
  rootId?: string;
  resultType?: string;
}>;

type RetryRequestEvent = CustomEvent<{
  rootId?: string;
}>;

type FreeTestRewardWidgetProps = {
  rootId: string;
  testId: string;
  initialResultType: string;
};

function getResultId(testId: string, resultType: string) {
  return `${testId}:${resultType || 'unknown'}`;
}

function getReadableContent(content: unknown) {
  if (!content) return '';
  if (typeof content === 'string') return content;

  if (typeof content === 'object') {
    const record = content as Record<string, unknown>;
    const candidates = [record.summary, record.report, record.content, record.text];
    const text = candidates.find((value): value is string => typeof value === 'string');
    if (text) return text;
  }

  return JSON.stringify(content, null, 2);
}

async function saveReward(userId: string, resultId: string, rewardType: RewardType, generatedContent?: unknown) {
  const payload = {
    user_id: userId,
    result_id: resultId,
    reward_context: 'free_test',
    reward_type: rewardType,
    unlocked: true,
    ...(generatedContent ? { generated_content: generatedContent } : {}),
  };

  const { data: existingRewards, error: findError } = await supabase
    .from('user_rewards')
    .select('id')
    .eq('user_id', userId)
    .eq('reward_context', 'free_test')
    .eq('reward_type', rewardType)
    .limit(1);

  if (findError) throw findError;

  const existing = existingRewards?.[0];

  if (existing?.id) {
    const { error } = await supabase.from('user_rewards').update(payload).eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('user_rewards').insert(payload);
  if (error) throw error;
}

async function canUnlockBothReward(userId: string) {
  const { data, error } = await supabase
    .from('user_rewards')
    .select('reward_type, unlocked')
    .eq('user_id', userId)
    .eq('reward_context', 'free_test');

  if (error) throw error;

  const rewards = data ?? [];
  const hasExistingBoth = rewards.some(reward => reward.reward_type === 'both' && reward.unlocked);
  const hasShare = rewards.some(reward => reward.reward_type === 'sns' && reward.unlocked);
  const hasReview = rewards.some(reward => reward.reward_type === 'review' && reward.unlocked);
  return hasExistingBoth || (hasShare && hasReview);
}

function FreeTestRewardWidget({ rootId, testId, initialResultType }: FreeTestRewardWidgetProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [adminMode, setAdminMode] = useState(() => isAdminModeEnabled());
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [resultType, setResultType] = useState(initialResultType);
  const [isShared, setIsShared] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);
  const [bothContent, setBothContent] = useState('');
  const [bothLoading, setBothLoading] = useState(false);
  const [bothError, setBothError] = useState('');
  const [retryResetKey, setRetryResetKey] = useState(0);

  const userId = adminMode ? 'admin' : session?.user?.id ?? null;
  const resultId = useMemo(() => getResultId(testId, resultType), [testId, resultType]);

  useEffect(() => {
    let mounted = true;

    initializeAdminModeFromUrl().then((enabled) => {
      if (!mounted) return;
      setAdminMode(enabled);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('reviewed') === 'true') {
      window.localStorage.setItem('free_test_reviewed', 'true');
      setIsReviewed(true);
      url.searchParams.delete('reviewed');
      history.replaceState(null, '', url.toString());
    }
  }, []);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const { rootId: targetRootId, resultType: nextResultType } = (event as RewardUpdateEvent).detail ?? {};
      if (targetRootId && targetRootId !== rootId) return;
      if (nextResultType) setResultType(nextResultType);
    };

    window.addEventListener('free-test-result-ready', handleUpdate);
    return () => window.removeEventListener('free-test-result-ready', handleUpdate);
  }, [rootId]);

  const fetchRewardStatus = useCallback(async () => {
    if (adminMode) {
      setIsShared(true);
      setIsReviewed(true);
      window.dispatchEvent(new CustomEvent('free-test-reward-status', {
        detail: { rootId, isShared: true, isReviewed: true },
      }));
      return;
    }

    if (!userId) {
      setIsShared(false);
      setIsReviewed(false);
      setBothContent('');
      window.dispatchEvent(new CustomEvent('free-test-reward-status', {
        detail: { rootId, isShared: false, isReviewed: false },
      }));
      return;
    }

    const { data, error } = await supabase
      .from('user_rewards')
      .select('id, reward_type, unlocked, generated_content')
      .eq('user_id', userId)
      .eq('reward_context', 'free_test');

    if (error) {
      console.error('Error fetching reward status:', error);
      return;
    }

    const rewards = (data ?? []) as RewardRow[];
    const nextIsShared = rewards.some((reward) => reward.reward_type === 'sns' && reward.unlocked);
    const nextIsReviewed = rewards.some((reward) => reward.reward_type === 'review' && reward.unlocked);
    if (nextIsReviewed) {
      window.localStorage.setItem('free_test_reviewed', 'true');
    }
    setIsShared(nextIsShared);
    setIsReviewed(nextIsReviewed);
    window.dispatchEvent(new CustomEvent('free-test-reward-status', {
      detail: { rootId, isShared: nextIsShared, isReviewed: nextIsReviewed },
    }));

    const bothReward = rewards.find((reward) => reward.reward_type === 'both' && reward.unlocked);
    setBothContent(getReadableContent(bothReward?.generated_content));
  }, [adminMode, rootId, userId]);

  useEffect(() => {
    fetchRewardStatus();
  }, [fetchRewardStatus]);

  const resetRewardUi = useCallback(() => {
    if (adminMode) {
      setIsShared(true);
      setIsReviewed(true);
      setBothError('');
      setBothLoading(false);
      window.dispatchEvent(new CustomEvent('free-test-reward-status', {
        detail: { rootId, isShared: true, isReviewed: true },
      }));
      return;
    }

    setIsShared(false);
    setIsReviewed(false);
    setBothContent('');
    setBothError('');
    setBothLoading(false);
    setRetryResetKey((key) => key + 1);
    window.dispatchEvent(new CustomEvent('free-test-reward-status', {
      detail: { rootId, isShared: false, isReviewed: false },
    }));
  }, [adminMode, rootId]);

  const handleRetryRequest = useCallback(async () => {
    const confirmMessage = isShared && isReviewed
      ? '공유 및 후기 보상이 모두 초기화됩니다. 다시 시도하시겠어요?'
      : isShared
        ? 'SNS 공유 보상이 초기화됩니다. 다시 시도하시겠어요?'
        : isReviewed
          ? '후기 보상이 초기화됩니다. 다시 시도하시겠어요?'
          : '';

    if (confirmMessage && !window.confirm(confirmMessage)) return;

    try {
      if (userId) {
        const { error } = await supabase
          .from('user_rewards')
          .delete()
          .eq('user_id', userId)
          .eq('reward_context', 'free_test');

        if (error) throw error;
      }

      resetRewardUi();
      setResultType(initialResultType);
      window.dispatchEvent(new CustomEvent('free-test-reset-result', {
        detail: { rootId },
      }));
    } catch (error) {
      console.error('Error resetting free test rewards:', error);
      alert('보상 초기화에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [initialResultType, isReviewed, isShared, resetRewardUi, rootId, userId]);

  useEffect(() => {
    const handleRetryEvent = (event: Event) => {
      const { rootId: targetRootId } = (event as RetryRequestEvent).detail ?? {};
      if (targetRootId && targetRootId !== rootId) return;
      handleRetryRequest();
    };

    window.addEventListener('free-test-retry-requested', handleRetryEvent);
    return () => window.removeEventListener('free-test-retry-requested', handleRetryEvent);
  }, [handleRetryRequest, rootId]);

  const handleShareComplete = async () => {
    if (adminMode) {
      setIsShared(true);
      window.dispatchEvent(new CustomEvent('free-test-reward-status', {
        detail: { rootId, isShared: true, isReviewed: true },
      }));
      return;
    }

    if (!userId) {
      setLoginModalOpen(true);
      return;
    }

    try {
      await saveReward(userId, resultId, 'sns');
      setIsShared(true);
      window.dispatchEvent(new CustomEvent('free-test-reward-status', {
        detail: { rootId, isShared: true, isReviewed },
      }));
    } catch (error) {
      console.error('Error saving share reward:', error);
      alert('공유 보상 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleReviewClick = () => {
    if (adminMode) {
      setIsReviewed(true);
      window.dispatchEvent(new CustomEvent('free-test-reward-status', {
        detail: { rootId, isShared: true, isReviewed: true },
      }));
      return;
    }

    if (!userId) {
      setLoginModalOpen(true);
      return;
    }

    const returnUrl = window.location.href;
    window.location.href = `reviews.html?context=free_test&return=${encodeURIComponent(returnUrl)}&rid=${encodeURIComponent(resultId)}`;
  };

  const handleBothComplete = async () => {
    if (adminMode) return;
    if (!userId || bothLoading || bothContent) return;

    setBothLoading(true);
    setBothError('');

    try {
      const canUnlock = await canUnlockBothReward(userId);
      if (!canUnlock) {
        setBothError('공유와 후기 완료 상태를 확인한 뒤 다시 시도해주세요.');
        return;
      }

      const content = {
        summary: `[${resultType} 유형 선의 심리학 미니 리포트]\n\nSNS 공유와 후기 작성을 모두 완료하셨습니다. ${resultType} 성향은 관계에서 상대를 먼저 배려하는 강점이 있는 반면, 자신의 필요를 뒤로 미루는 경향이 있을 수 있어요.\n\n오늘은 부탁을 받자마자 답하지 말고 "확인하고 다시 말해줄게"라는 한 문장으로 시작해보세요.\n\n심화 리포트에서는 반복 패턴 해석, 관계별 완곡 경계 문장, 30일 회복 루틴까지 이어서 정리합니다. 이 리포트는 의학적 진단이 아니라, 선의를 오래 유지하기 위한 자기 점검 가이드입니다.`,
      };
      await saveReward(userId, resultId, 'both', content);
      setBothContent(getReadableContent(content));
    } catch (error) {
      console.error('Error saving both reward:', error);
      setBothError('보너스 리포트 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setBothLoading(false);
    }
  };

  return (
    <>
      <FreeTestRewardSection
        userId={userId}
        resultType={resultType}
        isShared={adminMode || isShared}
        isReviewed={adminMode || isReviewed}
        onLoginRequired={() => {
          if (!adminMode) setLoginModalOpen(true);
        }}
        onShareComplete={handleShareComplete}
        onReviewClick={handleReviewClick}
        onBothComplete={handleBothComplete}
        isBothRewardLoading={bothLoading}
        bothRewardError={bothError}
        bothRewardContent={bothContent ? <p className="whitespace-pre-wrap">{bothContent}</p> : null}
        retryResetKey={retryResetKey}
      />
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => setLoginModalOpen(false)}
      />
    </>
  );
}

document.querySelectorAll<HTMLElement>('[data-free-test-reward-root]').forEach((element) => {
  const rootId = element.dataset.freeTestRewardRoot || element.id;
  const testId = element.dataset.testId || 'free_test';
  const initialResultType = element.dataset.resultType || '검사 결과';

  createRoot(element).render(
    <FreeTestRewardWidget rootId={rootId} testId={testId} initialResultType={initialResultType} />,
  );
});
