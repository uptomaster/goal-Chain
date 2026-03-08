import { useState, useEffect, useRef } from "react";

const INITIAL_GOALS = [
  {
    id: 1, author: "민지", avatar: "🦊", title: "매일 새벽 6시 기상",
    category: "생활습관", deadline: "2025-04-30", chains: 47,
    progress: 72, joined: true, color: "#FF6B35",
    members: ["🦊","🐺","🦁","🐯","🦝","🐻","🦌","🦋"],
    description: "30일 동안 6시 기상 챌린지. 함께하면 더 쉬워요!"
  },
  {
    id: 2, author: "준혁", avatar: "🐺", title: "책 한 달에 2권 읽기",
    category: "자기계발", deadline: "2025-05-31", chains: 32,
    progress: 45, joined: false, color: "#7C3AED",
    members: ["🐺","🦊","🐸","🦅","🐬"],
    description: "독서로 성장하는 우리들의 이야기"
  },
  {
    id: 3, author: "하은", avatar: "🦁", title: "주 3회 운동 습관",
    category: "건강", deadline: "2025-06-30", chains: 89,
    progress: 58, joined: false, color: "#059669",
    members: ["🦁","🐯","🦊","🦌","🐻","🦋","🐺","🦝","🐸","🦅","🐬","🦄"],
    description: "헬스, 러닝, 수영 뭐든 OK. 움직이는 것이 중요!"
  },
  {
    id: 4, author: "태양", avatar: "🐯", title: "하루 물 2L 마시기",
    category: "건강", deadline: "2025-04-15", chains: 156,
    progress: 91, joined: true, color: "#0EA5E9",
    members: ["🐯","🦊","🦁","🐺","🦝","🐻","🦌","🦋","🐸","🦅","🐬","🦄","🐙","🦞"],
    description: "가장 쉽지만 가장 중요한 습관"
  },
  {
    id: 5, author: "서연", avatar: "🦝", title: "SNS 하루 30분 제한",
    category: "디지털 디톡스", deadline: "2025-05-15", chains: 23,
    progress: 34, joined: false, color: "#F59E0B",
    members: ["🦝","🐻","🦌"],
    description: "진짜 삶에 집중하기 위한 디지털 디톡스"
  },
];

const CATEGORIES = ["전체", "생활습관", "자기계발", "건강", "디지털 디톡스"];

const categoryColors = {
  "생활습관": "#FF6B35", "자기계발": "#7C3AED",
  "건강": "#059669", "디지털 디톡스": "#F59E0B"
};

function ChainEffect({ active }) {
  return active ? (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999 }}>
      {[...Array(20)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: 8, height: 8,
          borderRadius: "50%",
          background: `hsl(${Math.random() * 360}, 80%, 60%)`,
          animation: `burst 0.8s ease-out forwards`,
          animationDelay: `${i * 0.03}s`,
        }} />
      ))}
    </div>
  ) : null;
}

function ProgressRing({ progress, color, size = 60 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)", strokeLinecap: "round" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={size * 0.22} fontWeight="700"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}>
        {progress}%
      </text>
    </svg>
  );
}

function GoalCard({ goal, onJoin, onView }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hover ? goal.color + "60" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 20, padding: 24, cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hover ? `0 20px 40px ${goal.color}20` : "none",
        position: "relative", overflow: "hidden",
      }}>
      {/* glow bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${goal.color}, transparent)`,
        opacity: hover ? 1 : 0.3, transition: "opacity 0.3s"
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              background: goal.color + "25", color: goal.color,
              fontSize: 11, fontWeight: 700, padding: "3px 10px",
              borderRadius: 20, letterSpacing: "0.05em", textTransform: "uppercase"
            }}>{goal.category}</span>
            {goal.joined && (
              <span style={{
                background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                fontSize: 11, padding: "3px 10px", borderRadius: 20
              }}>참여중 ✓</span>
            )}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 6, fontFamily: "inherit" }}>
            {goal.title}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
            <span>{goal.avatar}</span>
            <span>{goal.author}</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span>마감 {goal.deadline}</span>
          </div>
        </div>
        <ProgressRing progress={goal.progress} color={goal.color} size={64} />
      </div>

      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.6 }}>
        {goal.description}
      </div>

      {/* Members */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ display: "flex" }}>
          {goal.members.slice(0, 8).map((m, i) => (
            <span key={i} style={{
              fontSize: 18, marginLeft: i > 0 ? -6 : 0,
              filter: "drop-shadow(0 0 4px rgba(0,0,0,0.8))"
            }}>{m}</span>
          ))}
          {goal.members.length > 8 && (
            <span style={{
              fontSize: 12, color: "rgba(255,255,255,0.5)",
              marginLeft: 4, alignSelf: "center"
            }}>+{goal.members.length - 8}</span>
          )}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 22 }}>⛓️</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: goal.color }}>{goal.chains}</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>체인</span>
        </div>
      </div>

      {/* Action */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={(e) => { e.stopPropagation(); onView(goal); }} style={{
          flex: 1, padding: "10px 0", borderRadius: 12,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s"
        }}>자세히 보기</button>
        {!goal.joined && (
          <button onClick={(e) => { e.stopPropagation(); onJoin(goal.id); }} style={{
            flex: 2, padding: "10px 0", borderRadius: 12,
            background: `linear-gradient(135deg, ${goal.color}, ${goal.color}cc)`,
            border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: `0 4px 20px ${goal.color}40`, transition: "all 0.2s",
          }}>나도 할래! 🔗</button>
        )}
        {goal.joined && (
          <button onClick={(e) => { e.stopPropagation(); }} style={{
            flex: 2, padding: "10px 0", borderRadius: 12,
            background: "rgba(255,255,255,0.04)", border: `1px solid ${goal.color}40`,
            color: goal.color, fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>달성 체크 ✓</button>
        )}
      </div>
    </div>
  );
}

function StatsBar({ goals }) {
  const totalChains = goals.reduce((s, g) => s + g.chains, 0);
  const avgProgress = Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length);
  const joined = goals.filter(g => g.joined).length;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32
    }}>
      {[
        { label: "총 체인", value: totalChains, icon: "⛓️", color: "#FF6B35" },
        { label: "평균 달성률", value: avgProgress + "%", icon: "📈", color: "#7C3AED" },
        { label: "내 참여", value: joined + "개", icon: "🎯", color: "#059669" },
      ].map((s) => (
        <div key={s.label} style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "16px 20px", textAlign: "center"
        }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function Modal({ goal, onClose, onJoin }) {
  if (!goal) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0F0F14", border: `1px solid ${goal.color}40`,
        borderRadius: 24, padding: 32, maxWidth: 480, width: "100%",
        boxShadow: `0 40px 80px ${goal.color}20`
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <span style={{ background: goal.color + "25", color: goal.color, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{goal.category}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ fontSize: 24, fontWeight: 900, color: "white", marginBottom: 8 }}>{goal.title}</div>
        <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24, lineHeight: 1.7 }}>{goal.description}</div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <ProgressRing progress={goal.progress} color={goal.color} size={120} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "총 체인", value: goal.chains + "명" },
            { label: "달성률", value: goal.progress + "%" },
            { label: "마감일", value: goal.deadline },
            { label: "개설자", value: goal.avatar + " " + goal.author },
          ].map(item => (
            <div key={item.label} style={{
              background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 16px"
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontWeight: 700, color: "white" }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
            함께하는 사람들 ({goal.members.length}명)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {goal.members.map((m, i) => (
              <span key={i} style={{ fontSize: 24 }}>{m}</span>
            ))}
          </div>
        </div>

        {!goal.joined ? (
          <button onClick={() => { onJoin(goal.id); onClose(); }} style={{
            width: "100%", padding: "16px 0", borderRadius: 14,
            background: `linear-gradient(135deg, ${goal.color}, ${goal.color}aa)`,
            border: "none", color: "white", fontSize: 16, fontWeight: 800, cursor: "pointer",
            boxShadow: `0 8px 30px ${goal.color}40`
          }}>🔗 나도 이거 할래!</button>
        ) : (
          <div style={{ textAlign: "center", color: goal.color, fontWeight: 700, padding: 16 }}>
            ✓ 이미 참여 중인 목표입니다
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoalChain() {
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [category, setCategory] = useState("전체");
  const [burst, setBurst] = useState(false);
  const [modal, setModal] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", category: "생활습관", description: "", deadline: "" });
  const [feed, setFeed] = useState([
    { id: 1, text: "🦁 하은님이 '주 3회 운동 습관' 달성 체크!", time: "방금" },
    { id: 2, text: "🐯 태양님이 '하루 물 2L' 7일 연속 달성!", time: "3분 전" },
    { id: 3, text: "🦊 민지님이 새 목표 '매일 영어 30분' 올림", time: "10분 전" },
  ]);

  const handleJoin = (id) => {
    setBurst(true);
    setTimeout(() => setBurst(false), 1000);
    setGoals(prev => prev.map(g =>
      g.id === id ? { ...g, chains: g.chains + 1, joined: true, members: ["🦊", ...g.members] } : g
    ));
    const g = goals.find(x => x.id === id);
    setFeed(prev => [{ id: Date.now(), text: `🦊 내가 '${g?.title}' 체인에 합류!`, time: "방금" }, ...prev.slice(0, 4)]);
  };

  const handleCreate = () => {
    if (!newGoal.title || !newGoal.deadline) return;
    const colors = ["#FF6B35", "#7C3AED", "#059669", "#0EA5E9", "#F59E0B"];
    const created = {
      id: Date.now(), author: "나", avatar: "🦊",
      title: newGoal.title, category: newGoal.category,
      deadline: newGoal.deadline, chains: 1, progress: 0,
      joined: true, color: colors[Math.floor(Math.random() * colors.length)],
      members: ["🦊"], description: newGoal.description || "새로운 목표에 함께해요!"
    };
    setGoals(prev => [created, ...prev]);
    setFeed(prev => [{ id: Date.now(), text: `🦊 내가 새 목표 '${newGoal.title}' 개설!`, time: "방금" }, ...prev.slice(0, 4)]);
    setNewGoal({ title: "", category: "생활습관", description: "", deadline: "" });
    setShowCreate(false);
    setBurst(true);
    setTimeout(() => setBurst(false), 1000);
  };

  const filtered = category === "전체" ? goals : goals.filter(g => g.category === category);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080810",
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
      color: "white",
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @keyframes burst {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random()*200-100}px, ${Math.random()*200-100}px) scale(0); opacity: 0; }
        }
        @keyframes chainPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes feedSlide {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        input, textarea, select {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          color: white !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          outline: none !important;
          width: 100% !important;
          font-family: inherit !important;
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3) !important; }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(255,107,53,0.5) !important;
          box-shadow: 0 0 0 3px rgba(255,107,53,0.1) !important;
        }
        select option { background: #1a1a2e; }
      `}</style>

      <ChainEffect active={burst} />

      {/* Header */}
      <div style={{
        background: "rgba(8,8,16,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 50, padding: "0 24px"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28, animation: "chainPulse 2s infinite" }}>⛓️</span>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em" }}>
              Goal<span style={{ color: "#FF6B35" }}>Chain</span>
            </span>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} style={{
            background: "linear-gradient(135deg, #FF6B35, #FF8C42)",
            border: "none", color: "white", padding: "10px 20px",
            borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(255,107,53,0.4)",
            display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit"
          }}>
            <span>+</span> 목표 만들기
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Create form */}
        {showCreate && (
          <div style={{
            background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.25)",
            borderRadius: 20, padding: 28, marginBottom: 28,
            animation: "slideIn 0.3s ease"
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>🎯 새 목표 만들기</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <input value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="목표 제목 (예: 매일 독서 30분)" />
              </div>
              <select value={newGoal.category} onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}>
                {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="date" value={newGoal.deadline} onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })} />
              <div style={{ gridColumn: "1/-1" }}>
                <textarea rows={2} value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="목표 설명 (선택)" style={{ resize: "none" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowCreate(false)} style={{
                padding: "12px 24px", borderRadius: 12,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
              }}>취소</button>
              <button onClick={handleCreate} style={{
                flex: 1, padding: "12px 0", borderRadius: 12,
                background: "linear-gradient(135deg, #FF6B35, #FF8C42)",
                border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 20px rgba(255,107,53,0.3)"
              }}>⛓️ 체인 시작하기</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
          {/* Main */}
          <div>
            <StatsBar goals={goals} />

            {/* Category filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  padding: "8px 16px", borderRadius: 20,
                  background: category === c ? (c === "전체" ? "#FF6B35" : (categoryColors[c] || "#FF6B35")) : "rgba(255,255,255,0.05)",
                  border: category === c ? "none" : "1px solid rgba(255,255,255,0.08)",
                  color: category === c ? "white" : "rgba(255,255,255,0.5)",
                  fontSize: 13, fontWeight: category === c ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.2s"
                }}>{c}</button>
              ))}
            </div>

            {/* Goal cards */}
            <div style={{ display: "grid", gap: 16 }}>
              {filtered.map((goal, i) => (
                <div key={goal.id} style={{ animation: `slideIn 0.4s ease ${i * 0.05}s both` }}>
                  <GoalCard goal={goal} onJoin={handleJoin} onView={setModal} />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Live feed */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: 20, marginBottom: 20, position: "sticky", top: 84
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#4ade80",
                  boxShadow: "0 0 8px #4ade80", display: "inline-block",
                  animation: "chainPulse 2s infinite"
                }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>실시간 피드</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {feed.map((item, i) => (
                  <div key={item.id} style={{
                    padding: "10px 14px", borderRadius: 12,
                    background: "rgba(255,255,255,0.03)", fontSize: 13,
                    color: "rgba(255,255,255,0.75)", lineHeight: 1.5,
                    animation: i === 0 ? "feedSlide 0.3s ease" : "none",
                    borderLeft: i === 0 ? "2px solid #FF6B35" : "2px solid transparent"
                  }}>
                    <div>{item.text}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{item.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 인기 체인 */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: 20
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🔥 이번 주 인기 체인</div>
              {[...goals].sort((a, b) => b.chains - a.chains).slice(0, 3).map((g, i) => (
                <div key={g.id} style={{
                  display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
                  padding: "10px 12px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)"
                }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: ["#FFD700", "#C0C0C0", "#CD7F32"][i], minWidth: 20 }}>
                    {["🥇","🥈","🥉"][i]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.title}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                      {g.chains}명 참여
                    </div>
                  </div>
                  <span style={{ fontSize: 18 }}>⛓️</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal goal={modal} onClose={() => setModal(null)} onJoin={handleJoin} />
    </div>
  );
}
