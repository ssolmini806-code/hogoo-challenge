import { useState, useEffect } from "react";
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Award, Flame, Copy, Check, LogOut } from "lucide-react";
import DAYS from "./days";
import { supabase } from "./src/supabase";
import Auth from "./src/components/Auth";

const COLOR_MAP = {
  amber: { bg: "bg-amber-50", accent: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", light: "bg-amber-100", badge: "bg-amber-500" },
  orange: { bg: "bg-orange-50", accent: "bg-orange-500", text: "text-orange-700", border: "border-orange-200", light: "bg-orange-100", badge: "bg-orange-500" },
  red: { bg: "bg-red-50", accent: "bg-red-500", text: "text-red-700", border: "border-red-200", light: "bg-red-100", badge: "bg-red-500" },
  green: { bg: "bg-emerald-50", accent: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-200", light: "bg-emerald-100", badge: "bg-emerald-500" },
  teal: { bg: "bg-teal-50", accent: "bg-teal-500", text: "text-teal-700", border: "border-teal-200", light: "bg-teal-100", badge: "bg-teal-500" },
  purple: { bg: "bg-purple-50", accent: "bg-purple-500", text: "text-purple-700", border: "border-purple-200", light: "bg-purple-100", badge: "bg-purple-500" },
  blue: { bg: "bg-blue-50", accent: "bg-blue-500", text: "text-blue-700", border: "border-blue-200", light: "bg-blue-100", badge: "bg-blue-500" }
};

export default function App() {
  const [session, setSession] = useState(null);
  const [currentDay, setCurrentDay] = useState(0);
  const [missions, setMissions] = useState({});
  const [selectedPhrase, setSelectedPhrase] = useState({});
  const [notes, setNotes] = useState({});
  const [anxiety, setAnxiety] = useState({});
  const [guilt, setGuilt] = useState({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Fetch data when session or currentDay changes
  useEffect(() => {
    if (session) {
      fetchProgress();
    } else {
      setLoading(false);
    }
  }, [session]);

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

  const saveProgress = async (dayIdx, updates) => {
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
    setMissions(prev => {
      const key = `${dayIdx}`;
      const arr = prev[key] || [];
      const newArr = arr.includes(mIdx) ? arr.filter(i => i !== mIdx) : [...arr, mIdx];
      saveProgress(dayIdx, { missions: newArr });
      return { ...prev, [key]: newArr };
    });
  };

  const updateField = (dayIdx, field, value) => {
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
  const dayMissions = missions[`${currentDay}`] || [];
  const allMissionsDone = dayMissions.length === 3;

  const isDayUnlocked = (dayIdx) => {
    if (dayIdx === 0) return true;
    const prevDayMissions = missions[`${dayIdx - 1}`] || [];
    return prevDayMissions.length === 3;
  };

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

  if (!session) {
    return (
      <div style={{ background: "#1a1614", minHeight: "100vh", color: "#f5ede3", display: 'flex', alignItems: 'center' }}>
        <Auth />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ background: "#1a1614", minHeight: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#8a7f75' }}>
        불러오는 중...
      </div>
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
      `}</style>

      {/* Header */}
      <div style={{ background: "#231f1c", borderBottom: "1px solid #3a3530", padding: "20px 24px 16px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#8a7f75", textTransform: "uppercase" }}>7-Day Challenge</div>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  style={{ background: 'none', border: 'none', color: '#5a5048', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                >
                  <LogOut size={12} /> 로그아웃
                </button>
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

          {/* Progress bar */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {DAYS.map((d, i) => {
              const score = getDayScore(i);
              const isActive = i === currentDay;
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
                    if (unlocked) setCurrentDay(i);
                    else alert('이전 날짜의 미션을 모두 완료해야 합니다!');
                  }}
                  style={{
                    flex: 1, height: isActive ? 36 : 28, border: "none", cursor: unlocked ? "pointer" : "not-allowed",
                    borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isActive ? 13 : 11, fontWeight: isActive ? "bold" : "normal",
                    background: isActive ? hexColor : isDone ? "#2d4a35" : score > 0 ? "#3a3530" : "#2a2520",
                    color: isActive ? "#1a1614" : isDone ? "#7cc88a" : score > 0 ? "#c5b8ac" : "#5a5048",
                    outline: isActive ? `2px solid ${hexColor}` : "none", outlineOffset: 2
                  }}
                >
                  {isDone ? "✓" : `D${i + 1}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px 80px" }}>

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
              <div className="a2a_kit a2a_kit_size_32 a2a_default_style" data-a2a-url="https://hogoo-challenge.pages.dev" data-a2a-title="호구 탈출 챌린지 - 7일 만에 달라지는 관계 습관">
                <a className="a2a_button_kakao"></a>
                <a className="a2a_button_facebook"></a>
                <a className="a2a_button_x"></a>
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
                    <a className="a2a_button_facebook"></a>
                    <a className="a2a_button_x"></a>
                    <a className="a2a_button_copy_link"></a>
                </div>
            </div>
        </div>

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
    </div>
  );
}
