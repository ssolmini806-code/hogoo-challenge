import { useState, useEffect } from "react";
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Award, Flame, Copy, Check, MessageSquare, Send, Star } from "lucide-react";
import DAYS from "./days";
import { supabase } from "./src/supabase";
import LoginButton from "./src/components/LoginButton";
import LoginModal from "./src/components/LoginModal";
import ChallengeCompletionReward from "./components/reward/ChallengeCompletionReward";
import { initializeAdminModeFromUrl, isAdminModeEnabled } from "./src/utils/adminMode";

const CHALLENGE_COMPLETED_AT_KEY = 'challenge_completed_at';

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
  const [isShared, setIsShared] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);
  const [reviewConfirm, setReviewConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
      const { data, error } = await supabase
        .from('challenge_reviews')
        .select('id, user_id, display_name, rating, content, completed_missions, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setReviews(data && data.length ? data : fallbackReviews);
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
      return;
    }

    const { error } = await supabase.from('user_rewards').insert(payload);
    if (error) throw error;
  };

  const handleShareComplete = async () => {
    if (adminMode) {
      setIsShared(true);
      return;
    }
    if (!session) { setLoginModalOpen(true); return; }
    try {
      await saveReward('sns');
      setIsShared(true);
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
    if (!session) { setLoginModalOpen(true); return; }
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `reviews.html?context=seven_day_challenge&return=${returnUrl}`;
  };

  const handleBothComplete = async () => {
    if (adminMode) return;
    if (!session) return;
    try {
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
  
  const toggleMission = (dayIdx, mIdx) => {
    if (!adminMode && !session) { setLoginModalOpen(true); return; }
    setMissions(prev => {
      const key = `${dayIdx}`;
      const arr = prev[key] || [];
      const newArr = arr.includes(mIdx) ? arr.filter(i => i !== mIdx) : [...arr, mIdx];
      saveProgress(dayIdx, { missions: newArr });
      return { ...prev, [key]: newArr };
    });
  };

  const updateField = (dayIdx, field, value) => {
    if (!adminMode && !session) { setLoginModalOpen(true); return; }
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
  const completionRate = Math.round((completedMissions / (DAYS.length * 3)) * 100);
  const effectiveCompletionRate = adminMode ? 100 : completionRate;
  const dayMissions = missions[`${currentDay}`] || [];
  const allMissionsDone = adminMode || dayMissions.length === 3;
  const isChallengeCompleted = adminMode || completedDays === DAYS.length;

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
    if (!session) { setLoginModalOpen(true); return; }
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
        .select('id, user_id, display_name, rating, content, completed_missions, created_at')
        .single();
      if (error) throw error;
      setReviews(prev => [data, ...prev].slice(0, 6));
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
    } catch (error) {
      console.error('Delete review failed:', error);
      alert('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#1a1614", minHeight: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#8a7f75' }}>
        불러오는 중...
      </div>
    );
  }

  function CertificateImage() {
    const [error, setError] = useState(false);
    if (error) {
      return (
        <div style={{
          background: "#231f1c", border: "1px dashed #3a3530", borderRadius: 16,
          padding: "40px 24px", color: "#8a7f75", fontSize: 14
        }}>
          수료증 이미지 준비 중입니다
        </div>
      );
    }
    return (
      <img
        src="/images/certificate-7day.png"
        alt="7일 챌린지 수료증"
        onError={() => setError(true)}
        style={{ width: "100%", borderRadius: 16, display: "block" }}
      />
    );
  }

  return (
    <div style={{
      fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", name, sans-serif',
      background: "#1a1614", 
      minHeight: "100vh", 
      padding: "0",
      letterSpacing: "-0.02em",
      color: "#f5ede3"
    }}>
      <style>{`
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        textarea { font-family: inherit; resize: none; }
        .day-btn { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .day-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .mission-item { transition: all 0.2s ease; }
        .mission-item:hover { border-color: #5a5048 !important; background: #2a2522 !important; }
        .phrase-card { transition: all 0.2s ease; cursor: pointer; }
        .phrase-card:hover { transform: translateY(-1px); border-color: #4a4540 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3a3530; border-radius: 10px; }
        .locked { opacity: 0.4; cursor: not-allowed !important; filter: grayscale(1); }
        .a2a_kit img { max-width: none; }
        .a2a_kit_size_36 img { width: 36px; height: 36px; display: inline-block; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#231f1c", borderBottom: "1px solid #3a3530", padding: "20px 24px 16px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#8a7f75", textTransform: "uppercase" }}>7-Day Challenge</div>
                <LoginButton />
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#f5ede3", letterSpacing: "-0.03em" }}>
                호구 탈출 챌린지
              </h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: "#2e2925", borderRadius: 10, padding: "8px 14px", border: "1px solid #3a3530" }}>
                  <div style={{ fontSize: 10, color: "#8a7f75", marginBottom: 2 }}>총 점수</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: { amber: "#f59e0b", orange: "#f97316", red: "#ef4444", green: "#10b981", teal: "#14b8a6", purple: "#a855f7", blue: "#3b82f6" }[day.color], lineHeight: 1 }}>{totalScore}</div>
                </div>
                <div style={{ background: "#2e2925", borderRadius: 10, padding: "8px 14px", border: "1px solid #3a3530" }}>
                  <div style={{ fontSize: 10, color: "#8a7f75", marginBottom: 2 }}>미션 완료</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: "#7cc88a", lineHeight: 1 }}>{completedMissions}</div>
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
                amber: "#f59e0b", orange: "#f97316", red: "#ef4444", green: "#10b981", teal: "#14b8a6", purple: "#a855f7", blue: "#3b82f6"
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
                    flex: "1 1 64px", height: isActive ? 36 : 30, border: "none", cursor: unlocked ? "pointer" : "not-allowed",
                    borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isActive ? 13 : 11, fontWeight: isActive ? "bold" : "normal",
                    background: isActive ? hexColor : isDone ? "#2d4a35" : score > 0 ? "#3a3530" : "#2a2520",
                    color: isActive ? "#1a1614" : isDone ? "#7cc88a" : score > 0 ? "#c5b8ac" : "#5a5048",
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
                height: activeTab === "reward" ? 36 : 30,
                border: "none",
                borderRadius: 6,
                cursor: isChallengeCompleted ? "pointer" : "not-allowed",
                background: activeTab === "reward" ? "#7cc88a" : isChallengeCompleted ? "#2d4a35" : "#2a2520",
                color: activeTab === "reward" ? "#111814" : isChallengeCompleted ? "#7cc88a" : "#5a5048",
                fontSize: activeTab === "reward" ? 13 : 11,
                fontWeight: activeTab === "reward" ? "bold" : 700,
                outline: activeTab === "reward" ? "2px solid #7cc88a" : "none",
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
          <div>
            <div style={{ marginBottom: 24, textAlign: "center" }}>
              <CertificateImage />
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#8a7f75" }}>
                저장하려면 꾹 눌러주세요 (모바일)
              </p>
            </div>

            <ChallengeCompletionReward
              userId={adminMode ? 'admin' : session?.user?.id ?? null}
              completionRate={effectiveCompletionRate}
              completedDays={adminMode ? DAYS.length : completedDays}
              isShared={adminMode || isShared}
              isReviewed={adminMode || isReviewed}
              onLoginRequired={() => {
                if (!adminMode) setLoginModalOpen(true);
              }}
              onShareComplete={handleShareComplete}
              onReviewClick={handleReviewClick}
              onBothComplete={handleBothComplete}
            />
          </div>
        ) : (
          <>

        {/* Day Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <span style={{
                display: "inline-block", background: { amber: "#f59e0b", orange: "#f97316", red: "#ef4444", green: "#10b981", teal: "#14b8a6", purple: "#a855f7", blue: "#3b82f6" }[day.color], color: "#1a1614",
                fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 6,
                letterSpacing: "0.05em", marginBottom: 12
              }}>DAY {day.day}</span>
              <h2 style={{ margin: "0 0 8px", fontSize: 28, color: "#f5ede3", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.04em" }}>
                {day.title}
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "#a89f95", lineHeight: 1.6, fontWeight: 500 }}>
                목표: {day.goal}
              </p>
            </div>
          </div>
        </div>

        {/* Concept Card */}
        <div style={{
          background: "#231f1c", border: "1px solid #3a3530", borderLeft: `3px solid ${{ amber: "#f59e0b", orange: "#f97316", red: "#ef4444", green: "#10b981", teal: "#14b8a6", purple: "#a855f7", blue: "#3b82f6" }[day.color]}`,
          borderRadius: 10, padding: "14px 16px", marginBottom: 20
        }}>
          <div style={{ fontSize: 10, color: "#8a7f75", letterSpacing: 2, marginBottom: 6 }}>TODAY'S CORE</div>
          <p style={{ margin: 0, fontSize: 15, color: "#d4c8bc", lineHeight: 1.6, fontStyle: "italic" }}>
            "{day.concept}"
          </p>
        </div>

        {/* Missions */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#8a7f75", letterSpacing: 2, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Flame size={14} color={{ amber: "#f59e0b", orange: "#f97316", red: "#ef4444", green: "#10b981", teal: "#14b8a6", purple: "#a855f7", blue: "#3b82f6" }[day.color]} />
            <span>오늘의 미션 ({dayMissions.length}/3)</span>
            {allMissionsDone && <span style={{ color: "#7cc88a", fontSize: 11 }}>✓ 완료 (+6점)</span>}
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
                    background: done ? "#1e2e22" : "#231f1c",
                    border: `1px solid ${done ? "#2d4a35" : "#3a3530"}`,
                    borderRadius: 10, padding: "14px 16px",
                    cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12
                  }}
                >
                  <div style={{ marginTop: 1, flexShrink: 0 }}>
                    {done
                      ? <CheckCircle size={20} color="#7cc88a" />
                      : <Circle size={20} color="#4a4540" />
                    }
                  </div>
                  <span style={{
                    fontSize: 14, color: done ? "#7cc88a" : "#c5b8ac", lineHeight: 1.5,
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
            <div key={label} style={{ background: "#231f1c", border: "1px solid #3a3530", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#8a7f75", marginBottom: 10 }}>{label} (0–10)</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {Array.from({ length: 11 }, (_, n) => (
                  <button
                    key={n}
                    onClick={() => updateField(currentDay, key, n)}
                    style={{
                      width: 26, height: 26, borderRadius: 6, border: "1px solid",
                      borderColor: (key === 'anxiety' ? anxiety : guilt)[`${currentDay}`] === n ? "#f0a040" : "#3a3530",
                      background: (key === 'anxiety' ? anxiety : guilt)[`${currentDay}`] === n ? "#f0a040" : "transparent",
                      color: (key === 'anxiety' ? anxiety : guilt)[`${currentDay}`] === n ? "#1a1614" : "#6a6058",
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
          <div style={{ fontSize: 12, color: "#8a7f75", letterSpacing: 2, marginBottom: 12 }}>
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
                    background: selected ? "#1e2535" : "#231f1c",
                    border: `1px solid ${selected ? "#5a8fd4" : "#3a3530"}`,
                    borderRadius: 10, padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: 12
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${selected ? "#5a8fd4" : "#4a4540"}`,
                    background: selected ? "#5a8fd4" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <span style={{ fontSize: 14, color: selected ? "#a8c8f0" : "#9a8f85", lineHeight: 1.5, fontStyle: "italic" }}>
                    "{phrase}"
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personal Notes */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#8a7f75", letterSpacing: 2, marginBottom: 10 }}>
            오늘 내가 실제로 한 말 / 행동
          </div>
          <textarea
            rows={3}
            value={notes[`${currentDay}`] || ""}
            onChange={e => setNotes(prev => ({ ...prev, [`${currentDay}`]: e.target.value }))}
            onBlur={e => updateField(currentDay, 'note', e.target.value)}
            placeholder="짧게 써도 괜찮아. 한 문장이면 충분해..."
            style={{
              width: "100%", background: "#231f1c", border: "1px solid #3a3530",
              borderRadius: 10, padding: "14px 16px", color: "#d4c8bc",
              fontSize: 14, lineHeight: 1.6, outline: "none"
            }}
          />
        </div>

        {/* Personal Analysis & Character (New) */}
        <div style={{ 
          background: "linear-gradient(135deg, #2a2522 0%, #231f1c 100%)", 
          borderRadius: "20px", padding: "32px 24px", marginBottom: "24px", 
          textAlign: "center", border: "1px solid #3a3530", position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: "-10px", right: "-10px", fontSize: "80px", opacity: 0.1, pointerEvents: "none" }}>✨</div>
          
          {/* 캐릭터 이모지 및 타이틀 */}
          <div style={{ fontSize: "64px", marginBottom: "16px", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))" }}>
            {day.color === 'green' ? '🌿' : day.color === 'blue' ? '💎' : day.color === 'red' ? '🛡️' : day.color === 'purple' ? '🔮' : '⭐'}
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#f5ede3", marginBottom: "12px" }}>
            오늘의 당신은 <span style={{ color: { amber: "#f59e0b", orange: "#f97316", red: "#ef4444", green: "#10b981", teal: "#14b8a6", purple: "#a855f7", blue: "#3b82f6" }[day.color] }}>
              "{day.title.split(':')[0]}"
            </span> 군요!
          </h3>
          <p style={{ fontSize: "14px", color: "#a89f95", lineHeight: 1.6, marginBottom: "24px", wordBreak: "keep-all" }}>
            "착한 게 아니라 사려 깊은 거예요. 다만, 그 다정함이 당신을 깎아먹지 않도록 오늘은 조금 더 이기적이어도 괜찮아요."
          </p>

          {/* 심화 분석 리포트 CTA */}
          <div 
            onClick={() => window.open('https://givecosystem.com/', '_blank', 'noopener,noreferrer')}
            style={{ 
              display: "block", background: "linear-gradient(90deg, #00a885 0%, #007a62 100%)", 
              color: "#f5ede3", padding: "16px", borderRadius: "12px",
              fontWeight: 800, fontSize: "15px", cursor: "pointer",
              boxShadow: "0 10px 25px rgba(0, 168, 133, 0.24)",
              transition: "transform 0.2s ease"
            }}
            onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
          >
            📊 GIVE ID 심화 분석 바로 받기
            <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.8, fontWeight: 500 }}>
              givecosystem.com · 유료 정밀 진단으로 이동
            </div>
          </div>
        </div>

        {/* Certification Box */}
        <div style={{
          background: "#1e2219", border: "1px solid #2d4a35",
          borderRadius: 12, padding: "18px 18px 14px", marginBottom: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={16} color="#7cc88a" />
              <span style={{ fontSize: 12, color: "#7cc88a", letterSpacing: 1 }}>오픈채팅 인증 복붙</span>
            </div>
            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: copied ? "#2d4a35" : "#2a3525",
                border: `1px solid ${copied ? "#7cc88a" : "#3a4a35"}`,
                borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                color: copied ? "#7cc88a" : "#9aaa95", fontSize: 12
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "복사됨!" : "복사하기"}
            </button>
          </div>
          <pre style={{
            margin: 0, fontSize: 13, color: "#9aaa95", lineHeight: 1.7,
            whiteSpace: "pre-wrap", fontFamily: "inherit"
          }}>
            {getCertText()}
          </pre>
          
          {/* AddToAny SNS Share within Certification Box */}
          <div style={{ marginTop: 20, borderTop: "1px solid #2d4a35", paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: "#7cc88a", marginBottom: 12, textAlign: "center", fontWeight: 600, letterSpacing: "0.05em" }}>SNS로 오늘의 변화 공유하기</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div className="a2a_kit a2a_kit_size_36 a2a_default_style" data-a2a-url="https://hogoo-challenge.pages.dev" data-a2a-title="호구 탈출 챌린지 - 7일 만에 달라지는 관계 습관">
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
                flex: 1, background: "#2a2520", border: "1px solid #3a3530",
                borderRadius: 10, padding: "14px", color: "#8a7f75",
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
                flex: 1, background: allMissionsDone ? { amber: "#f59e0b", orange: "#f97316", red: "#ef4444", green: "#10b981", teal: "#14b8a6", purple: "#a855f7", blue: "#3b82f6" }[day.color] : "#2a2520",
                border: `1px solid ${allMissionsDone ? { amber: "#f59e0b", orange: "#f97316", red: "#ef4444", green: "#10b981", teal: "#14b8a6", purple: "#a855f7", blue: "#3b82f6" }[day.color] : "#3a3530"}`,
                borderRadius: 10, padding: "14px",
                color: allMissionsDone ? "#1a1614" : "#8a7f75",
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
        <div style={{ textAlign: 'center', marginBottom: 32, padding: '24px', background: '#231f1c', borderRadius: '16px', border: '1px solid #3a3530', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '14px', color: '#f5ede3', marginBottom: '16px', fontWeight: 700 }}>당신의 건강한 선의를 응원합니다</div>
            <div style={{ fontSize: '12px', color: '#8a7f75', marginBottom: '20px', lineHeight: 1.5 }}>이 챌린지가 필요한 친구에게 공유해보세요.<br/>함께하면 변화가 더 빨라집니다.</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="a2a_kit a2a_kit_size_36 a2a_default_style" data-a2a-url="https://hogoo-challenge.pages.dev" data-a2a-title="GIVE Ecosystem | 똑똑한 기버를 위한 관계 진단">
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
        <section id="review-section" style={{ marginBottom: 32, padding: 20, background: "#231f1c", border: "1px solid #3a3530", borderRadius: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7cc88a", fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>
                <MessageSquare size={15} /> 챌린지 후기
              </div>
              <h3 style={{ margin: 0, color: "#f5ede3", fontSize: 18, lineHeight: 1.35 }}>직접 해본 사람들의 변화</h3>
            </div>
            <button
              onClick={() => setShowReviewForm(prev => !prev)}
              style={{
                background: "#7cc88a", color: "#111814", border: 0, borderRadius: 10,
                padding: "10px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0
              }}
            >
              <MessageSquare size={14} /> 후기 남기기
            </button>
          </div>

          {showReviewForm && (
            <form onSubmit={submitReview} style={{ background: "#1a1614", border: "1px solid #3a3530", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 104px", gap: 10, marginBottom: 10 }}>
                <input
                  value={reviewForm.displayName}
                  onChange={e => setReviewForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="표시 이름 (선택)"
                  maxLength={24}
                  style={{
                    minWidth: 0, background: "#231f1c", border: "1px solid #3a3530", borderRadius: 8,
                    padding: "11px 12px", color: "#f5ede3", fontSize: 13, outline: "none"
                  }}
                />
                <select
                  value={reviewForm.rating}
                  onChange={e => setReviewForm(prev => ({ ...prev, rating: e.target.value }))}
                  style={{
                    background: "#231f1c", border: "1px solid #3a3530", borderRadius: 8,
                    padding: "11px 8px", color: "#f5ede3", fontSize: 13, outline: "none"
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
                  width: "100%", background: "#231f1c", border: "1px solid #3a3530", borderRadius: 8,
                  padding: "12px", color: "#f5ede3", fontSize: 13, lineHeight: 1.6, outline: "none", marginBottom: 10
                }}
              />
              {reviewError && <div style={{ color: "#ef7777", fontSize: 12, marginBottom: 10 }}>{reviewError}</div>}
              <button
                type="submit"
                style={{
                  width: "100%", background: "#7cc88a", color: "#111814", border: 0, borderRadius: 10,
                  padding: "12px", fontSize: 14, fontWeight: 900, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
              >
                <Send size={14} /> 후기 등록하기
              </button>
            </form>
          )}

          {reviewStatus && <div style={{ color: "#9aaa95", fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{reviewStatus}</div>}

          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {reviews.map(review => (
              <article key={review.id} style={{ background: "#1a1614", border: "1px solid #3a3530", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <strong style={{ color: "#f5ede3", fontSize: 14 }}>{review.display_name || "익명 참가자"}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 2, color: "#f0a040", fontSize: 12 }}>
                      {Array.from({ length: Number(review.rating) || 5 }, (_, i) => <Star key={i} size={12} fill="currentColor" />)}
                    </span>
                    {session?.user?.id && review.user_id === session.user.id && (
                      <button
                        onClick={() => setDeleteConfirm(review.id)}
                        style={{
                          background: "transparent", border: "1px solid #5a3a3a", borderRadius: 6,
                          padding: "2px 8px", color: "#c07070", fontSize: 11, cursor: "pointer"
                        }}
                      >삭제</button>
                    )}
                  </div>
                </div>
                <p style={{ margin: 0, color: "#b9aea4", fontSize: 13, lineHeight: 1.6 }}>{review.content}</p>
                <div style={{ marginTop: 10, color: "#6f665f", fontSize: 11 }}>
                  미션 {review.completed_missions || 0}개 완료
                </div>
              </article>
            ))}
          </div>

          <button
            onClick={() => window.location.href = "reviews.html"}
            style={{
              width: "100%", background: "transparent", border: "1px solid #3a3530", borderRadius: 10,
              padding: "12px", color: "#9aaa95", cursor: "pointer", fontSize: 13, fontWeight: 700
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
            width: "100%", background: "transparent", border: "1px solid #3a3530",
            borderRadius: 10, padding: "14px", color: "#8a7f75",
            cursor: "pointer", fontSize: 14, fontWeight: 500
          }}
        >
          ← 다른 테스트 보러가기 (메인으로)
        </button>
      </div>

      {reviewConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#231f1c", border: "1px solid #3a3530", borderRadius: 16, padding: 28, maxWidth: 340, width: "100%" }}>
            <div style={{ color: "#7cc88a", fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>후기 등록</div>
            <p style={{ margin: "0 0 6px", color: "#f5ede3", fontSize: 16, fontWeight: 700 }}>후기를 등록할까요?</p>
            <p style={{ margin: "0 0 24px", color: "#8a7f75", fontSize: 13, lineHeight: 1.6 }}>등록 후에는 수정이 불가합니다.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => setReviewConfirm(false)}
                style={{ background: "transparent", border: "1px solid #3a3530", borderRadius: 10, padding: 12, color: "#8a7f75", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
              >취소</button>
              <button
                onClick={confirmSubmitReview}
                style={{ background: "#7cc88a", border: 0, borderRadius: 10, padding: 12, color: "#111814", cursor: "pointer", fontSize: 14, fontWeight: 900 }}
              >등록하기</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#231f1c", border: "1px solid #3a3530", borderRadius: 16, padding: 28, maxWidth: 340, width: "100%" }}>
            <div style={{ color: "#ef7777", fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>후기 삭제</div>
            <p style={{ margin: "0 0 6px", color: "#f5ede3", fontSize: 16, fontWeight: 700 }}>후기를 삭제할까요?</p>
            <p style={{ margin: "0 0 24px", color: "#8a7f75", fontSize: 13, lineHeight: 1.6 }}>삭제한 후기는 복구할 수 없습니다.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ background: "transparent", border: "1px solid #3a3530", borderRadius: 10, padding: 12, color: "#8a7f75", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
              >취소</button>
              <button
                onClick={() => deleteReview(deleteConfirm)}
                style={{ background: "#c07070", border: 0, borderRadius: 10, padding: 12, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 900 }}
              >삭제하기</button>
            </div>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => setLoginModalOpen(false)}
      />
    </div>
  );
}
