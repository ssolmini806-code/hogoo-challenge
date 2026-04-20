import { useState } from "react";
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Award, Flame, Copy, Check } from "lucide-react";

const DAYS = [
  {
    day: 1,
    title: "내가 호구가 되는 순간 포착",
    goal: "내 패턴을 감정이 아니라 상황으로 잡아낸다",
    concept: "호구는 성격이 아니라 반복되는 상황 루프다 — 부탁 → 긴장 → 미루기 → 결국 수락 → 후회",
    missions: [
      "최근 30일 호구 사건 3개 적기 (누가 / 무엇을 / 나는 왜 / 결과는)",
      "내 트리거 1개 선택하기 (예: '거절하면 나쁜 사람 될까봐' '분위기 깨질까봐')",
      "나의 경계 문장 1개 만들기: '나는 ~~는 어렵고, ~~는 가능해'"
    ],
    phrases: [
      "내가 불편한데도 웃고 있다면 그건 신호야",
      "이번엔 내 마음이 먼저야. 내 마음을 확인하고 답할게",
      "도와주고 싶은 마음과 도와줘야 한다는 의무는 달라"
    ],
    color: "amber"
  },
  {
    day: 2,
    title: "즉답 금지",
    goal: "부탁 받는 순간 자동 수락을 멈춘다",
    concept: "호구를 만드는 건 '착함'이 아니라 즉답 습관이다",
    missions: [
      "즉답 금지 문장 3개 외우기: '지금은 바로 답이 어려워. 확인하고 알려줄게'",
      "오늘 최소 1번 실제로 써보기 (카톡/대면/전화)",
      "즉답 못하게 하는 내 불안을 1문장으로 적기"
    ],
    phrases: [
      "지금 대답하지 않는 것도 내 선택이야",
      "재촉은 상대의 감정이고, 결정은 내 몫이야",
      "바로 답하면 내 하루가 흔들려. 그래서 확인하고 말할게"
    ],
    color: "orange"
  },
  {
    day: 3,
    title: "착한 거절 3단계",
    goal: "설명하다 말려드는 패턴을 끊는다",
    concept: "거절은 '설명'이 아니라 구조다 — 공감 1줄 → 불가 1줄 → 대안/조건 1줄",
    missions: [
      "내 상황에 맞는 거절문 3개 만들기 (공감 → 불가 → 대안)",
      "그중 1개를 실제로 보내기 (작은 것부터)",
      "보내고 나서 죄책감 다루기 90초: '내가 나를 지킨 건 이기심이 아니라 책임이다'"
    ],
    phrases: [
      "어렵다는 말은 미안함이 아니라 사실이야",
      "결론은 어렵고, 가능한 건 여기까지야",
      "설명을 늘리면 설득이 시작돼. 오늘은 짧게 끝낸다"
    ],
    color: "red"
  },
  {
    day: 4,
    title: "조건부 도움",
    goal: "무조건 도움을 조건 있는 도움으로 바꾼다",
    concept: "기버는 도움을 끊을 필요가 없다. 조건을 붙이면 된다",
    missions: [
      "내가 자주 받는 부탁 1개를 골라 '조건 3개' 적기 (시간 / 범위 / 보상)",
      "오늘 한 번은 조건을 말해보기: '내가 도와줄 수는 있는데, ~~ 조건이면 가능해'",
      "테이커 신호 체크리스트 확인 (재촉 / 고맙다 없음 / 당연시 / 책임전가 / 반복)"
    ],
    phrases: [
      "도움은 줄 수 있어. 대신 내 조건으로",
      "'해줄게'가 아니라 '어디까지 가능해'가 내 언어야",
      "부탁엔 범위와 시간과 대가가 있어야 공정해"
    ],
    color: "green"
  },
  {
    day: 5,
    title: "선긋기 대사",
    goal: "애매한 말로 끌려다니는 걸 끝낸다",
    concept: "선긋기는 차갑게가 아니라 명확하게다",
    missions: [
      "선긋기 대사 5개 중 2개를 내 말투로 바꿔 적기",
      "오늘 1번은 선긋기 대사 사용하기 (작은 상황부터)",
      "선긋기 후 '관계 불안'이 올라오면 사실 확인 3문장 적기"
    ],
    phrases: [
      "불편함을 참는 순간 선은 사라진다",
      "애매한 말은 다음 호구 예약이야. 오늘은 명확하게 말한다",
      "여기까지가 내 한계야. 더는 안 한다"
    ],
    color: "teal"
  },
  {
    day: 6,
    title: "분노를 경계로 번역",
    goal: "참다가 터지는 패턴을 끊는다",
    concept: "분노는 나쁘지 않아. 경계가 무너졌다는 신호야",
    missions: [
      "최근 분노 사건 1개를 '경계 문장'으로 번역: '나는 ~~가 반복되는 게 싫다'",
      "'경고 메시지' 1개 작성: '앞으로 ~~는 어렵고, 계속되면 나는 ~~할 거야'",
      "내 회복 루틴 1개 정하기 (10분 컷: 산책/샤워/호흡/운동/일기)"
    ],
    phrases: [
      "분노는 나쁜 감정이 아니라, 경계 붕괴 알림이야",
      "다음엔 참지 않고 규칙을 말할 거야",
      "반복되면 나는 거리를 둘 거야. 내 삶을 지키기 위해서"
    ],
    color: "purple"
  },
  {
    day: 7,
    title: "기준 문서화 + 30일 유지",
    goal: "7일 효과가 7일로 끝나지 않게 만든다",
    concept: "호구탈출은 '각오'가 아니라 시스템이다",
    missions: [
      "내 기준 10개를 적기 (예: '당일 요청은 거절' '밤 10시 이후 답장 X')",
      "내 주변 사람을 3그룹으로 분류: 안전한 사람 / 애매한 사람 / 위험한 사람",
      "30일 유지 계획 세우기 (주 2회: 화-즉답금지, 목-선긋기 1회, 토-회고 10분)"
    ],
    phrases: [
      "나는 착하게 살되, 쉽게 쓰이지 않는다",
      "나는 관계를 위해 나를 희생하지 않는다. 기준으로 돕는다",
      "오늘부터 나는 내 기준을 문서로 살겠다"
    ],
    color: "blue"
  }
];

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
  const [currentDay, setCurrentDay] = useState(0);
  const [missions, setMissions] = useState({});
  const [selectedPhrase, setSelectedPhrase] = useState({});
  const [notes, setNotes] = useState({});
  const [anxiety, setAnxiety] = useState({});
  const [guilt, setGuilt] = useState({});
  const [copied, setCopied] = useState(false);

  const day = DAYS[currentDay];
  const c = COLOR_MAP[day.color];

  const toggleMission = (dayIdx, mIdx) => {
    setMissions(prev => {
      const key = `${dayIdx}`;
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(mIdx) ? arr.filter(i => i !== mIdx) : [...arr, mIdx] };
    });
  };

  const getDayScore = (dayIdx) => {
    const m = (missions[`${dayIdx}`] || []).length;
    const p = selectedPhrase[`${dayIdx}`] !== undefined ? 1 : 0;
    return m * 2 + p;
  };

  const totalScore = DAYS.reduce((sum, _, i) => sum + getDayScore(i), 0);
  const completedMissions = Object.values(missions).reduce((sum, arr) => sum + arr.length, 0);
  const dayMissions = missions[`${currentDay}`] || [];
  const allMissionsDone = dayMissions.length === 3;

  const getCertText = () => {
    const phrase = selectedPhrase[`${currentDay}`] !== undefined
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

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#1a1614", minHeight: "100vh", padding: "0" }}>
      <style>{`
        * { box-sizing: border-box; }
        textarea { font-family: inherit; resize: none; }
        .day-btn { transition: all 0.15s; }
        .day-btn:hover { transform: translateY(-1px); }
        .mission-item { transition: all 0.2s; }
        .phrase-card { transition: all 0.15s; cursor: pointer; }
        .phrase-card:hover { transform: scale(1.01); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3a3530; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#231f1c", borderBottom: "1px solid #3a3530", padding: "20px 24px 16px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#8a7f75", textTransform: "uppercase", marginBottom: 4 }}>7-Day Challenge</div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: "bold", color: "#f5ede3", letterSpacing: -0.5 }}>
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
              const dayColor = COLOR_MAP[d.color];
              const hexColor = {
                amber: "#f59e0b", orange: "#f97316", red: "#ef4444", green: "#10b981", teal: "#14b8a6", purple: "#a855f7", blue: "#3b82f6"
              }[d.color];

              return (
                <button
                  key={i}
                  className="day-btn"
                  onClick={() => setCurrentDay(i)}
                  style={{
                    flex: 1, height: isActive ? 36 : 28, border: "none", cursor: "pointer",
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
                fontSize: 11, fontWeight: "bold", padding: "3px 10px", borderRadius: 20,
                letterSpacing: 1, marginBottom: 10
              }}>DAY {day.day}</span>
              <h2 style={{ margin: "0 0 6px", fontSize: 26, color: "#f5ede3", fontWeight: "bold", lineHeight: 1.2 }}>
                {day.title}
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "#8a7f75", lineHeight: 1.5 }}>
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
            { label: "불안 점수", key: "anxiety", state: anxiety, setter: setAnxiety },
            { label: "죄책감 점수", key: "guilt", state: guilt, setter: setGuilt }
          ].map(({ label, state, setter }) => (
            <div key={label} style={{ background: "#231f1c", border: "1px solid #3a3530", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#8a7f75", marginBottom: 10 }}>{label} (0–10)</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {Array.from({ length: 11 }, (_, n) => (
                  <button
                    key={n}
                    onClick={() => setter(prev => ({ ...prev, [`${currentDay}`]: n }))}
                    style={{
                      width: 26, height: 26, borderRadius: 6, border: "1px solid",
                      borderColor: state[`${currentDay}`] === n ? "#f0a040" : "#3a3530",
                      background: state[`${currentDay}`] === n ? "#f0a040" : "transparent",
                      color: state[`${currentDay}`] === n ? "#1a1614" : "#6a6058",
                      fontSize: 11, cursor: "pointer", fontWeight: state[`${currentDay}`] === n ? "bold" : "normal"
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
                  onClick={() => setSelectedPhrase(prev => ({ ...prev, [`${currentDay}`]: i }))}
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
        </div>

        {/* Day Navigation */}
        <div style={{ display: "flex", gap: 12 }}>
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
              onClick={() => setCurrentDay(d => d + 1)}
              style={{
                flex: 1, background: allMissionsDone ? { amber: "#f59e0b", orange: "#f97316", red: "#ef4444", green: "#10b981", teal: "#14b8a6", purple: "#a855f7", blue: "#3b82f6" }[day.color] : "#2a2520",
                border: `1px solid ${allMissionsDone ? { amber: "#f59e0b", orange: "#f97316", red: "#ef4444", green: "#10b981", teal: "#14b8a6", purple: "#a855f7", blue: "#3b82f6" }[day.color] : "#3a3530"}`,
                borderRadius: 10, padding: "14px",
                color: allMissionsDone ? "#1a1614" : "#8a7f75",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 14, fontWeight: allMissionsDone ? "bold" : "normal"
              }}
            >
              {allMissionsDone ? "Day " + (currentDay + 2) + " 시작하기 →" : `Day ${currentDay + 2}`}
              {!allMissionsDone && <ChevronRight size={16} />}
            </button>
          )}
          {currentDay === 6 && allMissionsDone && (
            <div style={{
              flex: 1, background: "#1e2e22", border: "1px solid #2d4a35",
              borderRadius: 10, padding: "14px", color: "#7cc88a",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: 14, fontWeight: "bold"
            }}>
              🎉 7일 챌린지 완주! 총 {totalScore}점
            </div>
          )}
        </div>
      </div>
    </div>
  );
}