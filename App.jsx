import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Award, Flame, Copy, Check, MessageSquare, Send, Star, Trash2 } from "lucide-react";

const PAID_SITE_URL = import.meta.env.VITE_PAID_SITE_URL ?? 'https://givecosystem.com/';
import DAYS from "./days";
import { supabase } from "./src/supabase";
import LoginButton from "./src/components/LoginButton";
import { initializeAdminModeFromUrl, isAdminModeEnabled } from "./src/utils/adminMode";

const LoginModal = lazy(() => import('./src/components/LoginModal'));
const ChallengeRewardSection = lazy(() => import('./components/reward/ChallengeRewardSection'));
const MyPage = lazy(() => import('./src/components/MyPage'));

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
}

async function syncUserTimezone(userId) {
  if (!userId) return;
  const timezone = getBrowserTimezone();
  await supabase.from('profiles').upsert({ id: userId, timezone }, { onConflict: 'id' });
}

const CHALLENGE_COMPLETED_AT_KEY = 'challenge_completed_at';

function trackEvent(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}

function openLoginModal(setFn, trigger) {
  trackEvent('login_modal_opened', { trigger: trigger });
  setFn(true);
}

export default function App() {
  const [session, setSession] = useState(null);
  const [adminMode, setAdminMode] = useState(() => isAdminModeEnabled());
  const [currentDay, setCurrentDay] = useState(0);
  const [activeTab, setActiveTab] = useState("day");
  const [missions, setMissions] = useState({});
  const [selectedPhrase, setSelectedPhrase] = useState({});
  const [notes, setNotes] = useState({});
  const [anxiety, setAnxiety] = useState({});
  const [guilt, setGuilt] = useState({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ displayName: "", rating: 5, content: "" });
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);
  const [reviewConfirm, setReviewConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // GA4: challenge landing view (non-logged-in visitors only)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!initialSession) {
        trackEvent('challenge_landing_viewed');
      }
    });
  }, []);

  // Admin token listener
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

  // Auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordReset(true);
      }
      if (session?.user?.id) {
        syncUserTimezone(session.user.id).catch(err => console.warn('timezone sync failed:', err));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when session or currentDay changes
  useEffect(() => {
    if (adminMode) {
      setIsShared(true);
      setIsReviewed(true);
      setLoading(false);
      fetchReviews();
      return;
    }

    if (session) {
      fetchProgress();
      fetchReviews();
      fetchRewardState();
    } else {
      setIsShared(false);
      setIsReviewed(false);
      setLoading(false);
      fetchReviews();
    }
  }, [session, adminMode]);

  const fallbackReviews = [
    {
      id: "sample-1",
      display_name: "7일 완주자",
      rating: 5,
      content: "부탁을 받으면 바로 답하던 습관이 줄었어요. 특히 '확인하고 말해줄게' 한 문장이 제일 도움이 됐습니다.",
      completed_missions: 21,
      created_at: "2026-05-01T09:00:00.000Z"
    },
    {
      id: "sample-2",
      display_name: "경계 연습 중",
      rating: 5,
      content: "거절을 연습하는 게 막연했는데 하루 미션으로 쪼개져 있어서 부담이 덜했습니다.",
      completed_missions: 14,
      created_at: "2026-05-03T09:00:00.000Z"
    }
  ];

  const fetchReviews = async () => {
    try {
      const { data: publicReviews, error } = await supabase
        .from('challenge_reviews')
        .select('id, display_name, rating, content, completed_missions, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      let nextReviews = (publicReviews ?? []).map(review => ({ ...review, is_own: false }));
      if (session?.user?.id) {
        const { data: ownReviews, error: ownError } = await supabase
          .from('challenge_reviews')
          .select('id, display_name, rating, content, completed_missions, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(6);

        if (ownError) throw ownError;

        const reviewById = new Map(nextReviews.map(review => [review.id, review]));
        (ownReviews ?? []).forEach(review => {
          reviewById.set(review.id, { ...review, is_own: true });
        });
        nextReviews = Array.from(reviewById.values());
      }

      setReviews(nextReviews.length ? nextReviews : fallbackReviews);
    } catch (error) {
      console.warn('Using fallback reviews:', error);
      setReviews(fallbackReviews);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;

      if (data) {
        const missionsObj = {};
        const phrasesObj = {};
        const notesObj = {};
        const anxietyObj = {};
        const guiltObj = {};

        data.forEach(item => {
          missionsObj[item.day_index] = item.missions;
          phrasesObj[item.day_index] = item.selected_phrase;
          notesObj[item.day_index] = item.note;
          anxietyObj[item.day_index] = item.anxiety;
          guiltObj[item.day_index] = item.guilt;
        });

        setMissions(missionsObj);
        setSelectedPhrase(phrasesObj);
        setNotes(notesObj);
        setAnxiety(anxietyObj);
        setGuilt(guiltObj);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRewardState = async () => {
    if (adminMode) {
      setIsShared(true);
      setIsReviewed(true);
      return;
    }
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('user_rewards')
        .select('reward_type, unlocked')
        .eq('user_id', session.user.id)
        .eq('reward_context', 'seven_day_challenge');

      if (error) throw error;

      const rewards = data ?? [];
      setIsShared(rewards.some(reward => reward.unlocked && ['sns', 'both'].includes(reward.reward_type)));
      setIsReviewed(rewards.some(reward => reward.unlocked && ['review', 'both'].includes(reward.reward_type)));
    } catch (err) {
      console.warn('Failed to fetch reward state:', err);
    }
  };

  const saveReward = async (rewardType, generatedContent) => {
    if (adminMode) return;

    const payload = {
      user_id: session.user.id,
      reward_context: 'seven_day_challenge',
      reward_type: rewardType,
      unlocked: true,
      ...(generatedContent ? { generated_content: generatedContent } : {}),
    };

    const { data: existingRewards, error: findError } = await supabase
      .from('user_rewards')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('reward_context', 'seven_day_challenge')
      .eq('reward_type', rewardType)
      .limit(1);

    if (findError) throw findError;

    if (existingRewards?.[0]?.id) {
      const { error } = await supabase
        .from('user_rewards')
        .update(payload)
        .eq('id', existingRewards[0].id);
      if (error) throw error;
      trackEvent('challenge_reward_unlocked', { reward_type: rewardType });
      return;
    }

    const { error } = await supabase.from('user_rewards').insert(payload);
    if (error) throw error;
    trackEvent('challenge_reward_unlocked', { reward_type: rewardType });
  };

  const canUnlockBothReward = async () => {
    if (!session?.user?.id) return false;

    const { data, error } = await supabase
      .from('user_rewards')
      .select('reward_type, unlocked')
      .eq('user_id', session.user.id)
      .eq('reward_context', 'seven_day_challenge');

    if (error) throw error;

    const rewards = data ?? [];
    const hasExistingBoth = rewards.some(reward => reward.unlocked && reward.reward_type === 'both');
    const hasShare = rewards.some(reward => reward.unlocked && reward.reward_type === 'sns');
    const hasReview = rewards.some(reward => reward.unlocked && reward.reward_type === 'review');
    return hasExistingBoth || (hasShare && hasReview);
  };

  const handleShareComplete = async () => {
    if (adminMode) {
      setIsShared(true);
      return;
    }
    if (!session) { openLoginModal(setLoginModalOpen, 'share'); return; }
    try {
      await saveReward('sns');
      setIsShared(true);
      trackEvent('challenge_share_completed');
    } catch (err) {
      console.error('Failed to save share reward:', err);
      alert('공유 보상 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleReviewClick = () => {
    if (adminMode) {
      setIsReviewed(true);
      return;
    }
    if (!session) { openLoginModal(setLoginModalOpen, 'review'); return; }
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `reviews.html?context=seven_day_challenge&return=${returnUrl}`;
  };

  const handleBothComplete = async () => {
    if (adminMode) return;
    if (!session) return;
    try {
      const canUnlock = await canUnlockBothReward();
      if (!canUnlock) return;

      const content = {
        completionRate,
        completedMissions,
        totalMissions: DAYS.length * 3,
      };
      await saveReward('both', content);
    } catch (err) {
      console.warn('Failed to save both reward:', err);
    }
  };

  const saveProgress = async (dayIdx, updates) => {
    if (adminMode) return;
    if (!session) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: session.user.id,
          day_index: dayIdx,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id, day_index' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const day = DAYS[currentDay];
  
  const updateField = (dayIdx, field, value) => {
    if (!adminMode && !session) { openLoginModal(setLoginModalOpen, 'field_update'); return; }
    const setters = {
      note: setNotes,
      phrase: setSelectedPhrase,
      anxiety: setAnxiety,
      guilt: setGuilt
    };
    
    setters[field](prev => {
      const newObj = { ...prev, [`${dayIdx}`]: value };
      const dbField = field === 'phrase' ? 'selected_phrase' : field;
      saveProgress(dayIdx, { [dbField]: value });
      return newObj;
    });
  };

  const getDayScore = (dayIdx) => {
    const m = (missions[`${dayIdx}`] || []).length;
    const p = selectedPhrase[`${dayIdx}`] !== undefined && selectedPhrase[`${dayIdx}`] !== null ? 1 : 0;
    return m * 2 + p;
  };

  const totalScore = DAYS.reduce((sum, _, i) => sum + getDayScore(i), 0);
  const completedMissions = Object.values(missions).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
  const completedDays = DAYS.reduce((sum, _, i) => sum + ((missions[`${i}`] || []).length === 3 ? 1 : 0), 0);

  const toggleMission = (dayIdx, mIdx) => {
    if (!adminMode && !session) { openLoginModal(setLoginModalOpen, 'mission_click'); return; }
    const key = `${dayIdx}`;
    const arr = missions[key] || [];
    const isAdding = !arr.includes(mIdx);
    const newArr = isAdding ? [...arr, mIdx] : arr.filter(i => i !== mIdx);
    saveProgress(dayIdx, { missions: newArr });
    setMissions(prev => ({ ...prev, [key]: newArr }));

    if (isAdding) {
      const totalForDay = DAYS[dayIdx].missions.length;
      trackEvent('challenge_mission_completed', {
        day_index: dayIdx + 1,
        missions_done: newArr.length,
        missions_total: totalForDay,
      });
      if (newArr.length === totalForDay) {
        if (window.giveProgress && window.giveProgress.get().day < dayIdx + 1) {
          var s = window.giveProgress.completeDay();
          if (s.isComplete) {
            location.href = 'challenge-done.html';
          }
        }
        const newTotalMissions = completedMissions + 1;
        const newCompletionRate = Math.round((newTotalMissions / (DAYS.length * 3)) * 100);
        trackEvent('challenge_day_completed', {
          day_index: dayIdx + 1,
          completion_rate: newCompletionRate,
        });
        if (completedDays + 1 === DAYS.length) {
          trackEvent('challenge_all_completed', {
            completion_rate: newCompletionRate,
            total_days: DAYS.length,
          });
        }
      }
    }
  };

  const completionRate = Math.round((completedMissions / (DAYS.length * 3)) * 100);
  const effectiveCompletionRate = adminMode ? 100 : completionRate;
  const dayMissions = missions[`${currentDay}`] || [];
  const allMissionsDone = adminMode || dayMissions.length === 3;
  const isChallengeCompleted = adminMode || completedDays === DAYS.length;

  const prevDayRef = useRef(null);
  useEffect(() => {
    if (prevDayRef.current !== null && prevDayRef.current !== currentDay) {
      trackEvent('challenge_day_started', { day_index: currentDay + 1 });
    }
    prevDayRef.current = currentDay;
  }, [currentDay]);

  const isDayUnlocked = (dayIdx) => {
    if (adminMode) return true;
    if (dayIdx === 0) return true;
    const prevDayMissions = missions[`${dayIdx - 1}`] || [];
    return prevDayMissions.length === 3;
  };

  useEffect(() => {
    if (typeof window === 'undefined' || adminMode || completedDays < DAYS.length) return;
    if (!window.localStorage.getItem(CHALLENGE_COMPLETED_AT_KEY)) {
      window.localStorage.setItem(CHALLENGE_COMPLETED_AT_KEY, new Date().toISOString());
    }
  }, [adminMode, completedDays]);

  const getCertText = () => {
    const phrase = (selectedPhrase[`${currentDay}`] !== undefined && selectedPhrase[`${currentDay}`] !== null)
      ? day.phrases[selectedPhrase[`${currentDay}`]]
      : "(오늘의 대사 선택 필요)";
    const noteText = notes[`${currentDay}`] || "(아직 작성 안 됨)";
    const anxietyVal = anxiety[`${currentDay}`] ?? "?";
    const guiltVal = guilt[`${currentDay}`] ?? "?";
    return `🔥 Day${day.day} 인증\n\n오늘 한 행동 1개:\n${noteText}\n\n불안 ${anxietyVal}/10 · 죄책감 ${guiltVal}/10\n\n오늘의 대사:\n"${phrase}"\n\n내일 한 문장: `;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCertText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitReview = (event) => {
    event.preventDefault();
    if (adminMode) {
      setIsReviewed(true);
      setReviewStatus("어드민 모드에서 후기 보상이 해금됐습니다.");
      setShowReviewForm(false);
      return;
    }
    if (!session) { openLoginModal(setLoginModalOpen, 'review'); return; }
    const content = reviewForm.content.trim();
    if (content.length < 10) {
      setReviewError("후기는 10자 이상으로 남겨주세요.");
      return;
    }
    setReviewError("");
    setReviewConfirm(true);
  };

  const confirmSubmitReview = async () => {
    setReviewConfirm(false);
    setReviewStatus("저장 중...");
    const content = reviewForm.content.trim();
    const displayName = reviewForm.displayName.trim() || "익명 참가자";
    const payload = {
      user_id: session?.user?.id,
      display_name: displayName.slice(0, 24),
      rating: Number(reviewForm.rating),
      content: content.slice(0, 500),
      challenge_day: currentDay + 1,
      completed_missions: completedMissions,
      is_public: true
    };
    try {
      const { data, error } = await supabase
        .from('challenge_reviews')
        .insert(payload)
        .select('id, display_name, rating, content, completed_missions, created_at')
        .single();
      if (error) throw error;
      setReviews(prev => [{ ...data, is_own: true }, ...prev].slice(0, 6));
      setReviewStatus("후기가 등록됐습니다.");
      setReviewForm({ displayName: "", rating: 5, content: "" });
      setShowReviewForm(false);
      setIsReviewed(true);
      await saveReward('review');
    } catch (error) {
      console.error('Review insert failed:', error);
      setReviewStatus("후기 등록에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const deleteReview = async (reviewId) => {
    setDeleteConfirm(null);
    try {
      const { error } = await supabase
        .from('challenge_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', session.user.id);
      if (error) throw error;

      setReviews(prev => prev.filter(r => r.id !== reviewId));

      // B 보상(review) 비활성화
      await supabase
        .from('user_rewards')
        .update({ unlocked: false })
        .eq('user_id', session.user.id)
        .eq('reward_context', 'seven_day_challenge')
        .eq('reward_type', 'review');

      // A+B(both) 보상은 A(sns)로 다운그레이드
      await supabase
        .from('user_rewards')
        .update({ reward_type: 'sns' })
        .eq('user_id', session.user.id)
        .eq('reward_context', 'seven_day_challenge')
        .eq('reward_type', 'both');

      setIsReviewed(false);
    } catch (error) {
      console.error('Delete review failed:', error);
      alert('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#FAF8F3", minHeight: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#5C635E' }}>
        불러오는 중...
      </div>
    );
  }

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (pathname === '/mypage') {
    return (
      <Suspense fallback={<div style={{ background: "#FAF8F3", minHeight: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#5C635E' }}>불러오는 중...</div>}>
        <MyPage
          session={session}
          challenge="seven_day_challenge"
          onBack={() => { window.location.href = '/'; }}
        />
      </Suspense>
    );
  }

  function CertificateImage() {
    const [error, setError] = useState(false);
    if (error) {
      return (
        <div style={{
          background: "#FFFFFF", border: "1px dashed #E7E1D5", borderRadius: 16,
          padding: "40px 24px", color: "#5C635E", fontSize: 14
        }}>
          수료증 이미지 준비 중입니다
        </div>
      );
    }
    return (
      <img
        src="/images/certificate-7day.webp"
        alt="7일 챌린지 수료증"
        onError={() => setError(true)}
        style={{ width: "100%", borderRadius: 16, display: "block" }}
      />
    );
  }

  return (
    <div style={{
      fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", name, sans-serif',
      background: "linear-gradient(180deg, #E9F2EC 0%, #FAF8F3 42%, #FFFFFF 100%)",
      minHeight: "100vh", 
      padding: "0",
      letterSpacing: 0,
      color: "#1A1F1C"
    }}>
      <style>{`
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        textarea { font-family: inherit; resize: none; }
        .day-btn { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .day-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .mission-item { transition: all 0.2s ease; }
        .mission-item:hover { border-color: #E7E1D5 !important; background: #E9F2EC !important; }
        .phrase-card { transition: all 0.2s ease; cursor: pointer; }
        .phrase-card:hover { transform: translateY(-1px); border-color: #8C9088 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E7E1D5; border-radius: 10px; }
        .locked { opacity: 0.4; cursor: not-allowed !important; filter: grayscale(1); }
        .a2a_kit img { max-width: none; }
        .a2a_kit_size_36 img { width: 36px; height: 36px; display: inline-block; }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #E9F2EC 0%, #FFFFFF 100%)", borderBottom: "1px solid #E7E1D5", padding: "24px 24px 18px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <img
                src="/images/tests/hogoo-check-illustration-v3.webp"
                alt=""
                aria-hidden="true"
                style={{ width: 58, height: 58, borderRadius: 14, objectFit: "cover", border: "1px solid #E7E1D5", boxShadow: "0 10px 24px rgba(17,75,60,.08)", flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", color: "#114B3C", textTransform: "uppercase" }}>7-Day Challenge</div>
                  <LoginButton />
                </div>
                <h1 style={{ margin: 0, fontSize: 25, fontWeight: 900, color: "#1A1F1C", letterSpacing: 0, lineHeight: 1.15 }}>
                  호구 탈출 챌린지
                </h1>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: "#F3EFE7", borderRadius: 10, padding: "8px 14px", border: "1px solid #E7E1D5" }}>
                  <div style={{ fontSize: 10, color: "#5C635E", marginBottom: 2 }}>총 점수</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: { amber: "#9A6516", orange: "#9A6516", red: "#9A6516", green: "#114B3C", teal: "#00A885", purple: "#0A5F4D", blue: "#0D3B2F" }[day.color], lineHeight: 1 }}>{totalScore}</div>
                </div>
                <div style={{ background: "#F3EFE7", borderRadius: 10, padding: "8px 14px", border: "1px solid #E7E1D5" }}>
                  <div style={{ fontSize: 10, color: "#5C635E", marginBottom: 2 }}>미션 완료</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: "#114B3C", lineHeight: 1 }}>{completedMissions}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Challenge tabs */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {DAYS.map((d, i) => {
              const score = getDayScore(i);
              const isActive = activeTab === "day" && i === currentDay;
              const isDone = (missions[`${i}`] || []).length === 3;
              const unlocked = isDayUnlocked(i);
              const hexColor = {
                amber: "#9A6516", orange: "#9A6516", red: "#9A6516", green: "#114B3C", teal: "#00A885", purple: "#0A5F4D", blue: "#0D3B2F"
              }[d.color];

              return (
                <button
                  key={i}
                  className={`day-btn ${!unlocked && !isActive ? 'locked' : ''}`}
                  onClick={() => {
                    if (unlocked) {
                      setCurrentDay(i);
                      setActiveTab("day");
                    }
                    else alert('이전 날짜의 미션을 모두 완료해야 합니다!');
                  }}
                  style={{
                    flex: "1 1 64px", height: 44, border: "none", cursor: unlocked ? "pointer" : "not-allowed",
                    borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isActive ? 13 : 11, fontWeight: isActive ? "bold" : "normal",
                    background: isActive ? hexColor : isDone ? "#E9F2EC" : score > 0 ? "#E7E1D5" : "#F3EFE7",
                    color: isActive ? "#FAF8F3" : isDone ? "#114B3C" : score > 0 ? "#1A1F1C" : "#5C635E",
                    outline: isActive ? `2px solid ${hexColor}` : "none", outlineOffset: 2
                  }}
                >
                  {isDone ? `✓ Day ${i + 1}` : `Day ${i + 1}`}
                </button>
              );
            })}
            <button
              type="button"
              className={`day-btn ${!isChallengeCompleted && activeTab !== "reward" ? 'locked' : ''}`}
              onClick={() => {
                if (isChallengeCompleted) {
                  setActiveTab("reward");
                  return;
                }
                alert("7일을 모두 완료하면 열려요");
              }}
              style={{
                flex: "1 1 112px",
                height: 44,
                border: "none",
                borderRadius: 6,
                cursor: isChallengeCompleted ? "pointer" : "not-allowed",
                background: activeTab === "reward" ? "#114B3C" : isChallengeCompleted ? "#E9F2EC" : "#F3EFE7",
                color: activeTab === "reward" ? "#FFFFFF" : isChallengeCompleted ? "#114B3C" : "#5C635E",
                fontSize: activeTab === "reward" ? 13 : 11,
                fontWeight: activeTab === "reward" ? "bold" : 700,
                outline: activeTab === "reward" ? "2px solid #114B3C" : "none",
                outlineOffset: 2
              }}
            >
              🎁 완료 보상
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px 80px" }}>
        {activeTab === "reward" ? (
          <Suspense fallback={<div style={{ textAlign: "center", padding: "40px 0", color: "#5C635E" }}>불러오는 중...</div>}>
            <div>
              <div style={{ marginBottom: 24, textAlign: "center" }}>
                <CertificateImage />
                <p style={{ margin: "10px 0 0", fontSize: 12, color: "#5C635E" }}>
                  저장하려면 꾹 눌러주세요 (모바일)
                </p>
              </div>

              <ChallengeRewardSection
                userId={adminMode ? 'admin' : session?.user?.id ?? null}
                completionDays={adminMode ? DAYS.length : completedDays}
                isShared={adminMode || isShared}
                isReviewed={adminMode || isReviewed}
                onLoginRequired={() => {
                  if (!adminMode) openLoginModal(setLoginModalOpen, 'challenge_reward');
                }}
                onShareComplete={handleShareComplete}
                onReviewClick={handleReviewClick}
                onBothComplete={handleBothComplete}
              />
            </div>
          </Suspense>
        ) : (
          <>

        {/* Day Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <span style={{
                display: "inline-block", background: { amber: "#9A6516", orange: "#9A6516", red: "#9A6516", green: "#114B3C", teal: "#00A885", purple: "#0A5F4D", blue: "#0D3B2F" }[day.color], color: "#FAF8F3",
                fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 6,
                letterSpacing: "0.05em", marginBottom: 12
              }}>DAY {day.day}</span>
              <h2 style={{ margin: "0 0 8px", fontSize: 28, color: "#1A1F1C", fontWeight: 800, lineHeight: 1.2, letterSpacing: 0 }}>
                {day.title}
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "#5C635E", lineHeight: 1.6, fontWeight: 650 }}>
                목표: {day.goal}
              </p>
            </div>
          </div>
        </div>

        {/* Concept Card */}
        <div style={{
          background: "#FFFFFF", border: "1px solid #E7E1D5", borderLeft: `3px solid ${{ amber: "#9A6516", orange: "#9A6516", red: "#9A6516", green: "#114B3C", teal: "#00A885", purple: "#0A5F4D", blue: "#0D3B2F" }[day.color]}`,
          borderRadius: 10, padding: "14px 16px", marginBottom: 20
        }}>
          <div style={{ fontSize: 10, color: "#5C635E", letterSpacing: 2, marginBottom: 6 }}>TODAY'S CORE</div>
          <p style={{ margin: 0, fontSize: 15, color: "#1A1F1C", lineHeight: 1.6, fontStyle: "italic" }}>
            "{day.concept}"
          </p>
        </div>

        {/* Missions */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#5C635E", letterSpacing: 2, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Flame size={14} color={{ amber: "#9A6516", orange: "#9A6516", red: "#9A6516", green: "#114B3C", teal: "#00A885", purple: "#0A5F4D", blue: "#0D3B2F" }[day.color]} />
            <span>오늘의 미션 ({dayMissions.length}/3)</span>
            {allMissionsDone && <span style={{ color: "#114B3C", fontSize: 11 }}>✓ 완료 (+6점)</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {day.missions.map((mission, i) => {
              const done = dayMissions.includes(i);
              return (
                <div
                  key={i}
                  className="mission-item"
                  onClick={() => toggleMission(currentDay, i)}
                  style={{
                    background: done ? "#E9F2EC" : "#FFFFFF",
                    border: `1px solid ${done ? "#E9F2EC" : "#E7E1D5"}`,
                    borderRadius: 10, padding: "14px 16px",
                    cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12
                  }}
                >
                  <div style={{ marginTop: 1, flexShrink: 0 }}>
                    {done
                      ? <CheckCircle size={20} color="#114B3C" />
                      : <Circle size={20} color="#5C635E" />
                    }
                  </div>
                  <span style={{
                    fontSize: 14, color: done ? "#114B3C" : "#1A1F1C", lineHeight: 1.5,
                    textDecoration: done ? "line-through" : "none",
                    opacity: done ? 0.7 : 1
                  }}>
                    {mission}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scores */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "불안 점수", key: "anxiety" },
            { label: "죄책감 점수", key: "guilt" }
          ].map(({ label, key }) => (
            <div key={label} style={{ background: "#FFFFFF", border: "1px solid #E7E1D5", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#5C635E", marginBottom: 10 }}>{label} (0–10)</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {Array.from({ length: 11 }, (_, n) => (
                  <button
                    key={n}
                    onClick={() => updateField(currentDay, key, n)}
                    style={{
                      width: 40, height: 40, borderRadius: 8, border: "1px solid",
                      borderColor: (key === 'anxiety' ? anxiety : guilt)[`${currentDay}`] === n ? "#9A6516" : "#E7E1D5",
                      background: (key === 'anxiety' ? anxiety : guilt)[`${currentDay}`] === n ? "#9A6516" : "transparent",
                      color: (key === 'anxiety' ? anxiety : guilt)[`${currentDay}`] === n ? "#FAF8F3" : "#5C635E",
                      fontSize: 11, cursor: "pointer", fontWeight: (key === 'anxiety' ? anxiety : guilt)[`${currentDay}`] === n ? "bold" : "normal"
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Today's Phrases */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#5C635E", letterSpacing: 2, marginBottom: 12 }}>
            오늘의 대사 — 하나 골라봐 (+1점)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {day.phrases.map((phrase, i) => {
              const selected = selectedPhrase[`${currentDay}`] === i;
              return (
                <div
                  key={i}
                  className="phrase-card"
                  onClick={() => updateField(currentDay, 'phrase', i)}
                  style={{
                    background: selected ? "#E2F4EE" : "#FFFFFF",
                    border: `1px solid ${selected ? "#0A5F4D" : "#E7E1D5"}`,
                    borderRadius: 10, padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: 12
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${selected ? "#0A5F4D" : "#8C9088"}`,
                    background: selected ? "#0A5F4D" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <span style={{ fontSize: 14, color: selected ? "#0A5F4D" : "#5C635E", lineHeight: 1.5, fontStyle: "italic" }}>
                    "{phrase}"
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personal Notes */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#5C635E", letterSpacing: 2, marginBottom: 10 }}>
            오늘 내가 실제로 한 말 / 행동
          </div>
          <textarea
            rows={3}
            value={notes[`${currentDay}`] || ""}
            onChange={e => setNotes(prev => ({ ...prev, [`${currentDay}`]: e.target.value }))}
            onBlur={e => updateField(currentDay, 'note', e.target.value)}
            placeholder="짧게 써도 괜찮아. 한 문장이면 충분해..."
            style={{
              width: "100%", background: "#FFFFFF", border: "1px solid #E7E1D5",
              borderRadius: 10, padding: "14px 16px", color: "#1A1F1C",
              fontSize: 14, lineHeight: 1.6, outline: "none"
            }}
          />
        </div>

        {/* Personal Analysis & Character (New) */}
        <div style={{ 
          background: "linear-gradient(135deg, #E9F2EC 0%, #FFFFFF 100%)", 
          borderRadius: "20px", padding: "32px 24px", marginBottom: "24px", 
          textAlign: "center", border: "1px solid #E7E1D5", position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: 12, right: 12, fontSize: "56px", opacity: 0.1, pointerEvents: "none" }}>✨</div>
          
          {/* 캐릭터 이모지 및 타이틀 */}
          <div style={{ fontSize: "64px", marginBottom: "16px", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))" }}>
            {day.color === 'green' ? '🌿' : day.color === 'blue' ? '💎' : day.color === 'red' ? '🛡️' : day.color === 'purple' ? '🔮' : '⭐'}
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1A1F1C", marginBottom: "12px", lineHeight: 1.35, wordBreak: "keep-all", overflowWrap: "break-word" }}>
            오늘의 당신은 <span style={{ color: { amber: "#9A6516", orange: "#9A6516", red: "#9A6516", green: "#114B3C", teal: "#00A885", purple: "#0A5F4D", blue: "#0D3B2F" }[day.color] }}>
              "{day.title.split(':')[0]}"
            </span> 군요!
          </h3>
          <p style={{ fontSize: "14px", color: "#5C635E", lineHeight: 1.6, marginBottom: "24px", wordBreak: "keep-all", overflowWrap: "break-word" }}>
            "착한 게 아니라 사려 깊은 거예요. 다만, 그 다정함이 당신을 깎아먹지 않도록 오늘은 조금 더 이기적이어도 괜찮아요."
          </p>

          {/* 심화 리포트 CTA */}
          <div 
            onClick={() => window.open(PAID_SITE_URL, '_blank', 'noopener,noreferrer')}
            style={{ 
              display: "block", background: "linear-gradient(90deg, #00A885 0%, #0A5F4D 100%)", 
              color: "#FFFFFF", padding: "16px", borderRadius: "12px",
              fontWeight: 800, fontSize: "15px", cursor: "pointer",
              boxShadow: "0 10px 25px rgba(0, 168, 133, 0.24)",
              transition: "transform 0.2s ease", lineHeight: 1.35, wordBreak: "keep-all", overflowWrap: "break-word"
            }}
            onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
          >
            GIVE ID 심화 리포트 바로 받기
            <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.8, fontWeight: 500 }}>
              givecosystem.com · 유료 심화 리포트로 이동
            </div>
          </div>
        </div>

        {/* Certification Box */}
        <div style={{
          background: "#E9F2EC", border: "1px solid #E9F2EC",
          borderRadius: 12, padding: "18px 18px 14px", marginBottom: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={16} color="#114B3C" />
              <span style={{ fontSize: 12, color: "#114B3C", letterSpacing: 1 }}>오픈채팅 인증 복붙</span>
            </div>
            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: copied ? "#E9F2EC" : "#E2F4EE",
                border: `1px solid ${copied ? "#114B3C" : "#E7E1D5"}`,
                borderRadius: 8, padding: "9px 12px", minHeight: 40, cursor: "pointer",
                color: copied ? "#114B3C" : "#5C635E", fontSize: 12
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "복사됨!" : "복사하기"}
            </button>
          </div>
          <pre style={{
            margin: 0, fontSize: 13, color: "#5C635E", lineHeight: 1.7,
            whiteSpace: "pre-wrap", fontFamily: "inherit"
          }}>
            {getCertText()}
          </pre>
          
          {/* AddToAny SNS Share within Certification Box */}
          <div style={{ marginTop: 20, borderTop: "1px solid #E9F2EC", paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: "#114B3C", marginBottom: 12, textAlign: "center", fontWeight: 600, letterSpacing: "0.05em" }}>SNS로 오늘의 변화 공유하기</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div className="a2a_kit a2a_kit_size_36 a2a_default_style" data-a2a-url="https://hogoo-challenge.pages.dev" data-a2a-title="호구 탈출 챌린지 - 7일 동안 시작하는 관계 경계 연습">
                <a className="a2a_button_kakao"></a>
                <a className="a2a_button_instagram"></a>
                <a className="a2a_button_threads"></a>
                <a className="a2a_button_facebook"></a>
                <a className="a2a_button_line"></a>
                <a className="a2a_button_copy_link"></a>
              </div>
            </div>
          </div>
        </div>

        {/* Day Navigation */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {currentDay > 0 && (
            <button
              onClick={() => setCurrentDay(d => d - 1)}
              style={{
                flex: 1, background: "#F3EFE7", border: "1px solid #E7E1D5",
                borderRadius: 10, padding: "14px", color: "#5C635E",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 14
              }}
            >
              <ChevronLeft size={16} /> Day {currentDay}
            </button>
          )}
          {currentDay < 6 && (
            <button
              onClick={() => {
                if (allMissionsDone) setCurrentDay(d => d + 1);
                else alert('오늘의 미션 3개를 모두 완료해야 다음 날로 넘어갈 수 있습니다!');
              }}
              style={{
                flex: 1, background: allMissionsDone ? { amber: "#9A6516", orange: "#9A6516", red: "#9A6516", green: "#114B3C", teal: "#00A885", purple: "#0A5F4D", blue: "#0D3B2F" }[day.color] : "#F3EFE7",
                border: `1px solid ${allMissionsDone ? { amber: "#9A6516", orange: "#9A6516", red: "#9A6516", green: "#114B3C", teal: "#00A885", purple: "#0A5F4D", blue: "#0D3B2F" }[day.color] : "#E7E1D5"}`,
                borderRadius: 10, padding: "14px",
                color: allMissionsDone ? "#FAF8F3" : "#5C635E",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 14, fontWeight: allMissionsDone ? "bold" : "normal",
                opacity: allMissionsDone ? 1 : 0.5
              }}
            >
              {allMissionsDone ? "Day " + (currentDay + 2) + " 시작하기 →" : `Day ${currentDay + 2} (미완료)`}
              {allMissionsDone && <ChevronRight size={16} />}
            </button>
          )}
        </div>
        
        {/* Share Section Before Back to Portal */}
        <div style={{ textAlign: 'center', marginBottom: 32, padding: '24px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7E1D5', boxShadow: '0 14px 34px rgba(17,75,60,.06)' }}>
            <div style={{ fontSize: '14px', color: '#1A1F1C', marginBottom: '16px', fontWeight: 700 }}>당신의 건강한 선의를 응원합니다</div>
            <div style={{ fontSize: '12px', color: '#5C635E', marginBottom: '20px', lineHeight: 1.5 }}>이 챌린지가 필요한 친구에게 공유해보세요.<br/>함께하면 변화가 더 빨라집니다.</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="a2a_kit a2a_kit_size_36 a2a_default_style" data-a2a-url="https://hogoo-challenge.pages.dev" data-a2a-title="GIVE Ecosystem | 똑똑한 기버를 위한 관계 자가점검">
                    <a className="a2a_button_kakao"></a>
                    <a className="a2a_button_instagram"></a>
                    <a className="a2a_button_threads"></a>
                    <a className="a2a_button_facebook"></a>
                    <a className="a2a_button_line"></a>
                    <a className="a2a_button_copy_link"></a>
                </div>
            </div>
        </div>

        {/* Reviews */}
        <section id="review-section" style={{ marginBottom: 32, padding: 20, background: "#FFFFFF", border: "1px solid #E7E1D5", borderRadius: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#114B3C", fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>
                <MessageSquare size={15} /> 챌린지 후기
              </div>
              <h3 style={{ margin: 0, color: "#1A1F1C", fontSize: 18, lineHeight: 1.35 }}>직접 해본 사람들의 변화</h3>
            </div>
            <button
              onClick={() => setShowReviewForm(prev => !prev)}
              style={{
                background: "#114B3C", color: "#FFFFFF", border: 0, borderRadius: 10,
                padding: "10px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0
              }}
            >
              <MessageSquare size={14} /> 후기 남기기
            </button>
          </div>

          {showReviewForm && (
            <form onSubmit={submitReview} style={{ background: "#FAF8F3", border: "1px solid #E7E1D5", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 104px", gap: 10, marginBottom: 10 }}>
                <input
                  value={reviewForm.displayName}
                  onChange={e => setReviewForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="표시 이름 (선택)"
                  maxLength={24}
                  style={{
                    minWidth: 0, background: "#FFFFFF", border: "1px solid #E7E1D5", borderRadius: 8,
                    padding: "11px 12px", color: "#1A1F1C", fontSize: 13, outline: "none"
                  }}
                />
                <select
                  value={reviewForm.rating}
                  onChange={e => setReviewForm(prev => ({ ...prev, rating: e.target.value }))}
                  style={{
                    background: "#FFFFFF", border: "1px solid #E7E1D5", borderRadius: 8,
                    padding: "11px 8px", color: "#1A1F1C", fontSize: 13, outline: "none"
                  }}
                >
                  <option value="5">5점</option>
                  <option value="4">4점</option>
                  <option value="3">3점</option>
                  <option value="2">2점</option>
                  <option value="1">1점</option>
                </select>
              </div>
              <textarea
                rows={4}
                value={reviewForm.content}
                onChange={e => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="챌린지를 하면서 달라진 점, 도움이 된 미션, 아쉬웠던 점을 남겨주세요."
                maxLength={500}
                style={{
                  width: "100%", background: "#FFFFFF", border: "1px solid #E7E1D5", borderRadius: 8,
                  padding: "12px", color: "#1A1F1C", fontSize: 13, lineHeight: 1.6, outline: "none", marginBottom: 10
                }}
              />
              {reviewError && <div style={{ color: "#7A4E12", fontSize: 12, marginBottom: 10 }}>{reviewError}</div>}
              <button
                type="submit"
                style={{
                  width: "100%", background: "#114B3C", color: "#FFFFFF", border: 0, borderRadius: 10,
                  padding: "12px", fontSize: 14, fontWeight: 900, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
              >
                <Send size={14} /> 후기 등록하기
              </button>
            </form>
          )}

          {reviewStatus && <div style={{ color: "#5C635E", fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{reviewStatus}</div>}

          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {[...reviews]
              .sort((a, b) => {
                if (a.is_own) return -1;
                if (b.is_own) return 1;
                return 0;
              })
              .map(review => {
                const isOwn = !!review.is_own || !!(session?.user?.id && review.user_id === session.user.id);
                return (
                  <article key={review.id} style={{
                    background: "#FAF8F3",
                    border: isOwn ? "1px solid #00A885" : "1px solid #E7E1D5",
                    borderRadius: 12, padding: 14
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        {isOwn && (
                          <span style={{
                            background: "#E2F4EE", color: "#114B3C", fontSize: 10,
                            fontWeight: 800, padding: "2px 7px", borderRadius: 20, flexShrink: 0
                          }}>내 후기</span>
                        )}
                        <strong style={{ color: "#1A1F1C", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {review.display_name || "익명 참가자"}
                        </strong>
                      </div>
                      <span style={{ display: "flex", alignItems: "center", gap: 2, color: "#9A6516", fontSize: 12, flexShrink: 0 }}>
                        {Array.from({ length: Number(review.rating) || 5 }, (_, i) => <Star key={i} size={12} fill="currentColor" />)}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "#5C635E", fontSize: 13, lineHeight: 1.6 }}>{review.content}</p>
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ color: "#5C635E", fontSize: 11 }}>미션 {review.completed_missions || 0}개 완료</span>
                      {isOwn && (
                        <button
                          onClick={() => setDeleteConfirm(review.id)}
                          style={{
                            background: "transparent", border: "1px solid #9A6516", borderRadius: 8,
                            padding: "8px 12px", color: "#9A6516", fontSize: 12, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 5, fontWeight: 700
                          }}
                        >
                          <Trash2 size={12} /> 삭제
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>

          <button
            onClick={() => window.location.href = "reviews.html"}
            style={{
              width: "100%", background: "transparent", border: "1px solid #E7E1D5", borderRadius: 10,
              padding: "12px", color: "#5C635E", cursor: "pointer", fontSize: 13, fontWeight: 700
            }}
          >
            전체 후기 보기
          </button>
        </section>
          </>
        )}

        {/* Back to Portal */}
        <button
          onClick={() => window.location.href = 'index.html'}
          style={{
            width: "100%", background: "transparent", border: "1px solid #E7E1D5",
            borderRadius: 10, padding: "14px", color: "#5C635E",
            cursor: "pointer", fontSize: 14, fontWeight: 500
          }}
        >
          ← 다른 테스트 보러가기 (메인으로)
        </button>
      </div>

      {reviewConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E7E1D5", borderRadius: 16, padding: 28, maxWidth: 340, width: "100%" }}>
            <div style={{ color: "#114B3C", fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>후기 등록</div>
            <p style={{ margin: "0 0 6px", color: "#1A1F1C", fontSize: 16, fontWeight: 700 }}>후기를 등록할까요?</p>
            <p style={{ margin: "0 0 24px", color: "#5C635E", fontSize: 13, lineHeight: 1.6 }}>등록 후에는 수정이 불가합니다.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => setReviewConfirm(false)}
                style={{ background: "transparent", border: "1px solid #E7E1D5", borderRadius: 10, padding: 12, color: "#5C635E", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
              >취소</button>
              <button
                onClick={confirmSubmitReview}
                style={{ background: "#114B3C", border: 0, borderRadius: 10, padding: 12, color: "#FFFFFF", cursor: "pointer", fontSize: 14, fontWeight: 900 }}
              >등록하기</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E7E1D5", borderRadius: 16, padding: 28, maxWidth: 340, width: "100%" }}>
            <div style={{ color: "#7A4E12", fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>후기 삭제</div>
            <p style={{ margin: "0 0 6px", color: "#1A1F1C", fontSize: 16, fontWeight: 700 }}>후기를 삭제할까요?</p>
            <p style={{ margin: "0 0 24px", color: "#5C635E", fontSize: 13, lineHeight: 1.6 }}>삭제한 후기는 복구할 수 없습니다.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ background: "transparent", border: "1px solid #E7E1D5", borderRadius: 10, padding: 12, color: "#5C635E", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
              >취소</button>
              <button
                onClick={() => deleteReview(deleteConfirm)}
                style={{ background: "#9A6516", border: 0, borderRadius: 10, padding: 12, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 900 }}
              >삭제하기</button>
            </div>
          </div>
        </div>
      )}

      {showPasswordReset && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.72)', padding: '16px',
          }}
        >
          <div style={{
            width: '100%', maxWidth: 360,
            background: '#FFFFFF', borderRadius: 20, padding: '32px 24px',
            border: '1px solid #E7E1D5',
          }}>
            <h2 style={{ color: '#1A1F1C', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>새 비밀번호 설정</h2>
            <p style={{ color: '#5C635E', fontSize: 13, lineHeight: 1.5, marginBottom: 24 }}>
              새로 사용할 비밀번호를 입력해주세요
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPasswordResetLoading(true);
                try {
                  const { error } = await supabase.auth.updateUser({ password: newPassword });
                  if (error) throw error;
                  alert('비밀번호가 변경됐어요! 다시 로그인해주세요.');
                  setShowPasswordReset(false);
                  setNewPassword('');
                  await supabase.auth.signOut();
                } catch (err) {
                  alert(err.message);
                } finally {
                  setPasswordResetLoading(false);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <input
                type="password"
                placeholder="새 비밀번호 (6자 이상)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                style={{
                  padding: '13px 14px', borderRadius: 10, border: '1px solid #E7E1D5',
                  background: '#FAF8F3', color: '#1A1F1C', outline: 'none', fontSize: 14,
                }}
              />
              <button
                type="submit"
                disabled={passwordResetLoading}
                style={{
                  padding: '13px', borderRadius: 10, border: 'none',
                  background: '#00A885', color: '#fff', fontWeight: 800,
                  cursor: passwordResetLoading ? 'not-allowed' : 'pointer', fontSize: 15,
                  opacity: passwordResetLoading ? 0.7 : 1,
                }}
              >
                {passwordResetLoading ? '변경 중...' : '비밀번호 변경하기'}
              </button>
            </form>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={() => setLoginModalOpen(false)}
        />
      </Suspense>
    </div>
  );
}
