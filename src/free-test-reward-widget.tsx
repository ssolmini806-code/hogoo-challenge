import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import LoginModal from './components/LoginModal';
import FreeTestRewardSection from '../components/reward/FreeTestRewardSection';

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
    .eq('result_id', resultId)
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

function FreeTestRewardWidget({ rootId, testId, initialResultType }: FreeTestRewardWidgetProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [resultType, setResultType] = useState(initialResultType);
  const [isShared, setIsShared] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);
  const [bothContent, setBothContent] = useState('');
  const [bothLoading, setBothLoading] = useState(false);
  const [bothError, setBothError] = useState('');

  const userId = session?.user?.id ?? null;
  const resultId = useMemo(() => getResultId(testId, resultType), [testId, resultType]);

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
    const handleUpdate = (event: Event) => {
      const { rootId: targetRootId, resultType: nextResultType } = (event as RewardUpdateEvent).detail ?? {};
      if (targetRootId && targetRootId !== rootId) return;
      if (nextResultType) setResultType(nextResultType);
    };

    window.addEventListener('free-test-result-ready', handleUpdate);
    return () => window.removeEventListener('free-test-result-ready', handleUpdate);
  }, [rootId]);

  const fetchRewardStatus = useCallback(async () => {
    if (!userId) {
      setIsShared(false);
      setIsReviewed(false);
      setBothContent('');
      return;
    }

    const { data, error } = await supabase
      .from('user_rewards')
      .select('id, reward_type, unlocked, generated_content')
      .eq('user_id', userId)
      .eq('result_id', resultId)
      .eq('reward_context', 'free_test');

    if (error) {
      console.error('Error fetching reward status:', error);
      return;
    }

    const rewards = (data ?? []) as RewardRow[];
    setIsShared(rewards.some((reward) => reward.reward_type === 'sns' && reward.unlocked));
    setIsReviewed(rewards.some((reward) => reward.reward_type === 'review' && reward.unlocked));

    const bothReward = rewards.find((reward) => reward.reward_type === 'both' && reward.unlocked);
    setBothContent(getReadableContent(bothReward?.generated_content));
  }, [resultId, userId]);

  useEffect(() => {
    fetchRewardStatus();
  }, [fetchRewardStatus]);

  const handleShareComplete = async () => {
    if (!userId) {
      setLoginModalOpen(true);
      return;
    }

    try {
      await saveReward(userId, resultId, 'sns');
      setIsShared(true);
    } catch (error) {
      console.error('Error saving share reward:', error);
      alert('공유 보상 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleReviewClick = () => {
    if (!userId) {
      setLoginModalOpen(true);
      return;
    }

    const returnUrl = window.location.href;
    window.location.href = `reviews.html?context=free_test&return=${encodeURIComponent(returnUrl)}`;
  };

  const handleBothComplete = async () => {
    if (!userId || bothLoading || bothContent) return;

    setBothLoading(true);
    setBothError('');

    try {
      const content = {
        summary: `[${resultType} 유형 종합 리포트]\n\nSNS 공유와 후기 작성을 모두 완료하셨습니다. ${resultType} 성향은 관계에서 상대를 먼저 배려하는 강점이 있는 반면, 자신의 필요를 뒤로 미루는 경향이 있을 수 있어요.\n\n작은 거절 연습부터 시작해보세요. 건강한 관계는 나를 지키는 것에서 출발합니다.`,
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
        isShared={isShared}
        isReviewed={isReviewed}
        onLoginRequired={() => setLoginModalOpen(true)}
        onShareComplete={handleShareComplete}
        onReviewClick={handleReviewClick}
        onBothComplete={handleBothComplete}
        isBothRewardLoading={bothLoading}
        bothRewardError={bothError}
        bothRewardContent={bothContent ? <p className="whitespace-pre-wrap">{bothContent}</p> : null}
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
