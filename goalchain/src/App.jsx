import { useState, useEffect, useRef, useCallback } from "react";

const INITIAL_GOALS = [
  { id: 1, author: "민지", avatar: "🦊", title: "매일 새벽 6시 기상", category: "생활습관", deadline: "2025-04-30", chains: 47, progress: 72, joined: true, color: "#FF6B35", members: ["🦊","🐺","🦁","🐯","🦝","🐻","🦌","🦋"], description: "30일 동안 6시 기상 챌린지. 함께하면 더 쉬워요!" },
  { id: 2, author: "준혁", avatar: "🐺", title: "책 한 달에 2권 읽기", category: "자기계발", deadline: "2025-05-31", chains: 32, progress: 45, joined: false, color: "#7C3AED", members: ["🐺","🦊","🐸","🦅","🐬"], description: "독서로 성장하는 우리들의 이야기" },
  { id: 3, author: "하은", avatar: "🦁", title: "주 3회 운동 습관", category: "건강", deadline: "2025-06-30", chains: 89, progress: 58, joined: false, color: "#059669", members: ["🦁","🐯","🦊","🦌","🐻","🦋","🐺","🦝","🐸","🦅","🐬","🦄"], description: "헬스, 러닝, 수영 뭐든 OK. 움직이는 것이 중요!" },
  { id: 4, author: "태양", avatar: "🐯", title: "하루 물 2L 마시기", category: "건강", deadline: "2025-04-15", chains: 156, progress: 91, joined: true, color: "#0EA5E9", members: ["🐯","🦊","🦁","🐺","🦝","🐻","🦌","🦋","🐸","🦅","🐬","🦄","🐙","🦞"], description: "가장 쉽지만 가장 중요한 습관" },
  { id: 5, author: "서연", avatar: "🦝", title: "SNS 하루 30분 제한", category: "디지털 디톡스", deadline: "2025-05-15", chains: 23, progress: 34, joined: false, color: "#F59E0B", members: ["🦝","🐻","🦌"], description: "진짜 삶에 집중하기 위한 디지털 디톡스" },
];

const CATEGORIES = ["전체","생활습관","자기계발","건강","디지털 디톡스"];
const CATCOLORS = {"생활습관":"#FF6B35","자기계발":"#7C3AED","건강":"#059669","디지털 디톡스":"#F59E0B"};

async function askAICoach(goal, userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `당신은 GoalChain의 AI 목표 코치입니다. 사용자가 목표를 달성할 수 있도록 따뜻하고 실용적인 조언을 해주세요.\n현재 목표: ${goal.title} (${goal.category}, ${goal.progress}% 달성, 마감 ${goal.deadline}, ${goal.chains}명 참여)\n설명: ${goal.description}\n한국어로 2-3문장, 핵심만, 이모지 1-2개 사용.`,
      messages: [{ role: "user", content: userMessage }]
    })
  });
  const data = await res.json();
  return data.content?.[0]?.text || "잠시 후 다시 시도해주세요.";
}

async function generateCelebration(goal) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `GoalChain의 AI 코치입니다. 목표 달성 축하 메시지를 만드세요. JSON으로만 응답하세요 (마크다운 없이): {"message":"축하 메시지(2문장)","tip":"앞으로의 조언(1문장)","nextChallenge":"다음 도전 추천(짧게)"}`,
      messages: [{ role: "user", content: `목표 '${goal.title}' 완전 달성! ${goal.chains}명이 함께했어요.` }]
    })
  });
  const data = await res.json();
  try {
    return JSON.parse(data.content?.[0]?.text?.replace(/```json|```/g,"").trim() || "{}");
  } catch { return { message: "정말 대단해요! 목표를 완주하셨군요 🎉", tip: "꾸준함이 쌓여 진짜 변화가 만들어집니다.", nextChallenge: "더 큰 목표에 도전해보세요!" }; }
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const items = useRef([...Array(70)].map((_, i) => ({
    id: i, x: 40 + Math.random() * 20, y: 40 + Math.random() * 20,
    tx: (Math.random()-0.5)*200, ty: -(Math.random()*300+100),
    color: `hsl(${Math.random()*360},80%,60%)`,
    size: Math.random()*10+4, delay: i*0.015,
    isRect: Math.random()>0.5, rot: Math.random()*720,
  })));
  if (!active) return null;
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
      {items.current.map(p => (
        <div key={p.id} style={{
          position:"absolute", left:`${p.x}%`, top:`${p.y}%`,
          width:p.size, height:p.size,
          borderRadius:p.isRect?2:"50%",
          background:p.color,
          animation:`cflyAnim 1.5s ease-out forwards`,
          animationDelay:`${p.delay}s`,
          "--tx":`${p.tx}px`, "--ty":`${p.ty}px`, "--rot":`${p.rot}deg`,
        }}/>
      ))}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ items, onDismiss }) {
  const bg = { success:"rgba(5,150,105,0.96)", chain:"rgba(255,107,53,0.96)", ai:"rgba(124,58,237,0.96)", reminder:"rgba(14,165,233,0.96)" };
  return (
    <div style={{position:"fixed",top:76,right:20,zIndex:600,display:"flex",flexDirection:"column",gap:8,maxWidth:340}}>
      {items.map(n => (
        <div key={n.id} onClick={()=>onDismiss(n.id)} style={{
          background: bg[n.type]||"rgba(20,20,30,0.96)",
          backdropFilter:"blur(16px)",
          borderRadius:14, padding:"12px 16px", cursor:"pointer",
          animation:"toastSlide 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
          display:"flex", alignItems:"flex-start", gap:10,
        }}>
          <span style={{fontSize:20,flexShrink:0}}>{n.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:"white",marginBottom:2}}>{n.title}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",lineHeight:1.4}}>{n.body}</div>
          </div>
          <span style={{color:"rgba(255,255,255,0.5)",fontSize:16,flexShrink:0,marginTop:-2}}>×</span>
        </div>
      ))}
    </div>
  );
}

// ── Notification Center ───────────────────────────────────────────────────────
function NotifCenter({ log, unread, onMarkRead, open, setOpen }) {
  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>{setOpen(!open);if(!open)onMarkRead();}} style={{
        position:"relative",background:"rgba(255,255,255,0.07)",
        border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,
        width:40,height:40,cursor:"pointer",fontSize:18,
        display:"flex",alignItems:"center",justifyContent:"center",
      }}>🔔
        {unread>0 && <span style={{position:"absolute",top:-5,right:-5,background:"#FF6B35",color:"white",fontSize:10,fontWeight:800,minWidth:18,height:18,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #080810",padding:"0 4px"}}>{unread>9?"9+":unread}</span>}
      </button>
      {open && (
        <div style={{position:"absolute",top:50,right:0,width:320,background:"#111120",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.7)",animation:"slideIn 0.2s ease",zIndex:300}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,fontSize:14}}>알림센터</span>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>{log.length}개</span>
          </div>
          <div style={{maxHeight:380,overflowY:"auto"}}>
            {log.length===0
              ? <div style={{padding:36,textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:13}}>알림이 없습니다</div>
              : log.map(n=>(
                <div key={n.id} style={{padding:"12px 18px",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",gap:10,background:n.read?"transparent":"rgba(255,107,53,0.04)"}}>
                  <span style={{fontSize:18}}>{n.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:n.read?500:700,color:n.read?"rgba(255,255,255,0.55)":"white"}}>{n.title}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.38)",marginTop:2}}>{n.body}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.22)",marginTop:4}}>{n.time}</div>
                  </div>
                  {!n.read && <div style={{width:6,height:6,borderRadius:"50%",background:"#FF6B35",flexShrink:0,marginTop:6}}/>}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chain Celebration ─────────────────────────────────────────────────────────
function ChainCelebration({ goal, aiData, onClose, onNext }) {
  const [phase, setPhase] = useState(0);
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),500);
    const t2=setTimeout(()=>setPhase(2),1200);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:5000,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(14px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:460,width:"100%",textAlign:"center",animation:"celebIn 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}>

        <div style={{fontSize:72,marginBottom:8,filter:`drop-shadow(0 0 40px ${goal.color})`,animation:"trophyFloat 2.5s ease-in-out infinite"}}>🏆</div>
        <div style={{fontSize:30,fontWeight:900,marginBottom:6,background:`linear-gradient(135deg,${goal.color},#fff)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>체인 완료!</div>
        <div style={{fontSize:17,color:"rgba(255,255,255,0.65)",marginBottom:24}}>
          <strong style={{color:"white"}}>"{goal.title}"</strong>
        </div>

        {/* Members wave */}
        <div style={{display:"flex",justifyContent:"center",flexWrap:"wrap",gap:4,marginBottom:24,padding:"14px 20px",background:"rgba(255,255,255,0.04)",borderRadius:16,border:`1px solid ${goal.color}25`}}>
          {goal.members.map((m,i)=>(
            <span key={i} style={{fontSize:24,animation:`memberPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards`,animationDelay:`${0.5+i*0.04}s`,opacity:0,transform:"scale(0)",display:"inline-block"}}>{m}</span>
          ))}
        </div>

        {/* Stats */}
        {phase>=1 && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20,animation:"slideIn 0.45s ease"}}>
            {[{icon:"⛓️",label:"체인 인원",val:goal.chains+"명"},{icon:"📈",label:"최종 달성률",val:"100%"},{icon:"🔥",label:"연속 달성",val:`${Math.floor(Math.random()*15+10)}일`}].map(s=>(
              <div key={s.label} style={{background:"rgba(255,255,255,0.05)",borderRadius:14,padding:"14px 6px",border:`1px solid ${goal.color}18`}}>
                <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                <div style={{fontSize:19,fontWeight:900,color:goal.color}}>{s.val}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.38)"}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* AI message */}
        {phase>=2 && (
          <div style={{background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:16,padding:18,marginBottom:22,animation:"slideIn 0.45s ease",textAlign:"left"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:16}}>🤖</span>
              <span style={{fontSize:12,fontWeight:700,color:"#a78bfa"}}>AI 코치 메시지</span>
              {!aiData && <span style={{fontSize:11,color:"rgba(255,255,255,0.3)",animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>}
            </div>
            {aiData
              ? <>
                  <p style={{fontSize:14,color:"rgba(255,255,255,0.88)",lineHeight:1.7,marginBottom:10}}>{aiData.message}</p>
                  <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10}}>💡 {aiData.tip}</p>
                  {aiData.nextChallenge && <p style={{fontSize:13,color:"#9f67f7",marginTop:8}}>🚀 다음 도전: {aiData.nextChallenge}</p>}
                </>
              : <p style={{fontSize:13,color:"rgba(255,255,255,0.35)"}}>AI 코치가 메시지를 작성하는 중입니다...</p>
            }
          </div>
        )}

        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"13px 0",borderRadius:13,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>돌아가기</button>
          <button onClick={onNext} style={{flex:2,padding:"13px 0",borderRadius:13,background:`linear-gradient(135deg,${goal.color},${goal.color}bb)`,border:"none",color:"white",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 8px 28px ${goal.color}40`}}>다음 목표 찾기 🔗</button>
        </div>
      </div>
    </div>
  );
}

// ── AI Coach Panel ────────────────────────────────────────────────────────────
function AICoachPanel({ goal, onClose }) {
  const [msgs, setMsgs] = useState([{role:"assistant",text:`안녕하세요! "${goal.title}" 목표 코치예요 🤖\n현재 ${goal.progress}% 달성 중이시네요. 무엇이든 물어보세요!`}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  const send = async (q) => {
    const text = q || input.trim();
    if(!text||loading) return;
    setInput("");
    setMsgs(m=>[...m,{role:"user",text}]);
    setLoading(true);
    try {
      const reply = await askAICoach(goal, text);
      setMsgs(m=>[...m,{role:"assistant",text:reply}]);
    } catch { setMsgs(m=>[...m,{role:"assistant",text:"잠시 후 다시 시도해주세요 🙏"}]); }
    setLoading(false);
  };

  const QUICK = ["오늘 동기부여","슬럼프 극복법","목표 달성 팁","체인 친구에게 한 마디"];

  return (
    <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:20,pointerEvents:"none"}}>
      <div style={{width:360,height:530,background:"#0e0e1a",border:"1px solid rgba(124,58,237,0.4)",borderRadius:20,display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(124,58,237,0.25)",animation:"slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",pointerEvents:"all",overflow:"hidden"}}>
        <div style={{padding:"13px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"linear-gradient(135deg,rgba(124,58,237,0.18),rgba(124,58,237,0.05))",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(124,58,237,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🤖</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14}}>AI 목표 코치</div>
            <div style={{fontSize:11,color:"#a78bfa",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{goal.title}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:20,cursor:"pointer"}}>×</button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              {m.role==="assistant" && <span style={{fontSize:18,marginRight:6,alignSelf:"flex-end",flexShrink:0}}>🤖</span>}
              <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"linear-gradient(135deg,#7C3AED,#9f67f7)":"rgba(255,255,255,0.07)",fontSize:13,lineHeight:1.65,color:"rgba(255,255,255,0.92)",whiteSpace:"pre-wrap",animation:"messageIn 0.3s ease"}}>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>🤖</span>
              <div style={{background:"rgba(255,255,255,0.07)",borderRadius:"16px 16px 16px 4px",padding:"10px 14px",display:"flex",gap:5}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#a78bfa",animation:`dotBounce 1s ease-in-out ${i*0.2}s infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        <div style={{padding:"8px 12px",display:"flex",gap:6,overflowX:"auto",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          {QUICK.map(q=>(
            <button key={q} onClick={()=>send(q)} style={{flexShrink:0,padding:"5px 10px",borderRadius:20,background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.3)",color:"#a78bfa",fontSize:11,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{q}</button>
          ))}
        </div>

        <div style={{padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="코치에게 물어보세요..." style={{flex:1,padding:"9px 14px",borderRadius:12,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"white",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={()=>send()} disabled={loading} style={{width:38,height:38,borderRadius:12,border:"none",background:loading?"rgba(124,58,237,0.3)":"#7C3AED",color:"white",fontSize:16,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>↑</button>
        </div>
      </div>
    </div>
  );
}

// ── Progress Ring ─────────────────────────────────────────────────────────────
function Ring({ progress, color, size=60 }) {
  const r=(size-8)/2, c=2*Math.PI*r, off=c-(progress/100)*c;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={c} strokeDashoffset={off}
        style={{transition:"stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",strokeLinecap:"round"}}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={size*0.22} fontWeight="700"
        style={{transform:`rotate(90deg)`,transformOrigin:`${size/2}px ${size/2}px`}}>{progress}%</text>
    </svg>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, onJoin, onView, onCheck, onCoach }) {
  const [hov, setHov] = useState(false);
  const hot = goal.progress >= 80;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:hov?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.03)",border:`1px solid ${hov?goal.color+"55":hot?goal.color+"28":"rgba(255,255,255,0.08)"}`,borderRadius:20,padding:22,cursor:"pointer",transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)",transform:hov?"translateY(-4px)":"none",boxShadow:hov?`0 20px 40px ${goal.color}1a`:hot?`0 0 24px ${goal.color}0d`:"none",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${goal.color},transparent)`,opacity:hov?1:hot?0.6:0.25,transition:"opacity 0.3s"}}/>
      {hot && <div style={{position:"absolute",top:10,right:10,fontSize:10,fontWeight:800,color:goal.color,background:goal.color+"20",padding:"2px 8px",borderRadius:10}}>🔥 완료 임박!</div>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{flex:1,paddingRight:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            <span style={{background:goal.color+"22",color:goal.color,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{goal.category}</span>
            {goal.joined && <span style={{background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.45)",fontSize:11,padding:"3px 10px",borderRadius:20}}>참여중 ✓</span>}
          </div>
          <div style={{fontSize:17,fontWeight:800,color:"white",marginBottom:5}}>{goal.title}</div>
          <div style={{fontSize:12.5,color:"rgba(255,255,255,0.38)",display:"flex",alignItems:"center",gap:5}}>
            <span>{goal.avatar}</span><span>{goal.author}</span>
            <span style={{color:"rgba(255,255,255,0.18)"}}>·</span>
            <span>마감 {goal.deadline}</span>
          </div>
        </div>
        <Ring progress={goal.progress} color={goal.color} size={62}/>
      </div>

      <div style={{fontSize:13,color:"rgba(255,255,255,0.42)",marginBottom:14,lineHeight:1.6}}>{goal.description}</div>

      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <div style={{display:"flex"}}>{goal.members.slice(0,8).map((m,i)=><span key={i} style={{fontSize:16,marginLeft:i>0?-5:0,filter:"drop-shadow(0 0 3px rgba(0,0,0,0.9))"}}>{m}</span>)}{goal.members.length>8&&<span style={{fontSize:12,color:"rgba(255,255,255,0.38)",marginLeft:4,alignSelf:"center"}}>+{goal.members.length-8}</span>}</div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontSize:17}}>⛓️</span>
          <span style={{fontSize:17,fontWeight:800,color:goal.color}}>{goal.chains}</span>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.38)"}}>체인</span>
        </div>
      </div>

      <div style={{display:"flex",gap:6}}>
        <button onClick={e=>{e.stopPropagation();onView(goal);}} style={{flex:1,padding:"9px 0",borderRadius:11,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.55)",fontSize:12,fontWeight:600,cursor:"pointer"}}>상세보기</button>
        {goal.joined && <button onClick={e=>{e.stopPropagation();onCoach(goal);}} style={{flex:1,padding:"9px 0",borderRadius:11,background:"rgba(124,58,237,0.14)",border:"1px solid rgba(124,58,237,0.3)",color:"#a78bfa",fontSize:12,fontWeight:600,cursor:"pointer"}}>🤖 AI 코치</button>}
        {!goal.joined
          ? <button onClick={e=>{e.stopPropagation();onJoin(goal.id);}} style={{flex:2,padding:"9px 0",borderRadius:11,background:`linear-gradient(135deg,${goal.color},${goal.color}cc)`,border:"none",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 16px ${goal.color}3a`}}>나도 할래! 🔗</button>
          : <button onClick={e=>{e.stopPropagation();onCheck(goal);}} style={{flex:2,padding:"9px 0",borderRadius:11,background:hot?`linear-gradient(135deg,${goal.color},${goal.color}cc)`:"rgba(255,255,255,0.04)",border:hot?"none":`1px solid ${goal.color}40`,color:hot?"white":goal.color,fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:hot?`0 4px 16px ${goal.color}3a`:"none"}}>{hot?"🏁 완료 선언!":"달성 체크 ✓"}</button>
        }
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GoalChain() {
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [cat, setCat] = useState("전체");
  const [confetti, setConfetti] = useState(false);
  const [modal, setModal] = useState(null);
  const [celeb, setCeleb] = useState(null);
  const [celebAI, setCelebAI] = useState(null);
  const [coachGoal, setCoachGoal] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({title:"",category:"생활습관",description:"",deadline:""});
  const [toasts, setToasts] = useState([]);
  const [notifLog, setNotifLog] = useState([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [feed, setFeed] = useState([
    {id:1,text:"🦁 하은님이 '주 3회 운동 습관' 달성 체크!",time:"방금"},
    {id:2,text:"🐯 태양님이 '하루 물 2L' 7일 연속 달성!",time:"3분 전"},
    {id:3,text:"🦊 민지님이 새 목표 '매일 영어 30분' 올림",time:"10분 전"},
  ]);

  const push = useCallback((n) => {
    const id = Date.now()+Math.random();
    const item = {...n,id,time:"방금",read:false};
    setToasts(t=>[item,...t].slice(0,4));
    setNotifLog(l=>[item,...l].slice(0,30));
    setUnread(u=>u+1);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 4500);
  },[]);

  useEffect(()=>{
    const msgs=[
      {icon:"🔗",type:"chain",title:"새 체인 연결!",body:"🐸 준후님이 '하루 물 2L' 목표에 합류했어요!"},
      {icon:"🎯",type:"success",title:"체인 친구 달성!",body:"🦅 지호님이 '매일 새벽 6시 기상' 달성 체크!"},
      {icon:"⏰",type:"reminder",title:"오늘 체크 잊지 마세요",body:"'매일 새벽 6시 기상' 오늘 달성 체크를 아직 안 하셨어요"},
      {icon:"🏆",type:"chain",title:"달성 임박!",body:"'하루 물 2L' 목표 91% 달성! 거의 다 왔어요 💪"},
      {icon:"🔗",type:"chain",title:"새 체인!",body:"🦄 수아님이 '책 한 달에 2권' 목표에 합류했어요!"},
    ];
    let i=0;
    const iv=setInterval(()=>{if(i<msgs.length){push(msgs[i]);i++;}},7000);
    return()=>clearInterval(iv);
  },[push]);

  const handleJoin=(id)=>{
    const g=goals.find(x=>x.id===id);
    setGoals(p=>p.map(x=>x.id===id?{...x,chains:x.chains+1,joined:true,members:["🦊",...x.members]}:x));
    push({icon:"🔗",type:"chain",title:"체인 연결!",body:`'${g?.title}' 목표에 합류했어요!`});
    setFeed(p=>[{id:Date.now(),text:`🦊 내가 '${g?.title}' 체인에 합류!`,time:"방금"},...p.slice(0,5)]);
    setConfetti(true); setTimeout(()=>setConfetti(false),1800);
  };

  const handleCheck=async(goal)=>{
    const np=Math.min(100, goal.progress+Math.floor(Math.random()*8+4));
    setGoals(p=>p.map(x=>x.id===goal.id?{...x,progress:np}:x));
    setFeed(p=>[{id:Date.now(),text:`🦊 내가 '${goal.title}' 달성 체크! (${np}%)`,time:"방금"},...p.slice(0,5)]);

    if(np>=100){
      setConfetti(true); setTimeout(()=>setConfetti(false),3500);
      setCeleb({...goal,progress:100}); setCelebAI(null);
      push({icon:"🏆",type:"success",title:"체인 완료! 🎉",body:`'${goal.title}' 완전 달성! 대단해요!`});
      generateCelebration({...goal,progress:100}).then(d=>setCelebAI(d));
    } else {
      push({icon:"✅",type:"success",title:"달성 체크!",body:`'${goal.title}' ${np}% 달성! 파이팅 💪`});
      if(np>=80) push({icon:"🔥",type:"chain",title:"완료 임박!",body:`${goal.chains}명 체인 친구들도 응원하고 있어요!`});
    }
  };

  const handleCreate=()=>{
    if(!form.title||!form.deadline) return;
    const colors=["#FF6B35","#7C3AED","#059669","#0EA5E9","#F59E0B","#EC4899"];
    const g={id:Date.now(),author:"나",avatar:"🦊",title:form.title,category:form.category,deadline:form.deadline,chains:1,progress:0,joined:true,color:colors[Math.floor(Math.random()*colors.length)],members:["🦊"],description:form.description||"새로운 목표에 함께해요!"};
    setGoals(p=>[g,...p]);
    push({icon:"🎯",type:"chain",title:"목표 생성!",body:`'${form.title}' 체인을 시작했어요!`});
    setFeed(p=>[{id:Date.now(),text:`🦊 내가 새 목표 '${form.title}' 개설!`,time:"방금"},...p.slice(0,5)]);
    setForm({title:"",category:"생활습관",description:"",deadline:""});
    setShowCreate(false);
    setConfetti(true); setTimeout(()=>setConfetti(false),1800);
  };

  const totalChains=goals.reduce((s,g)=>s+g.chains,0);
  const avgProg=goals.length?Math.round(goals.reduce((s,g)=>s+g.progress,0)/goals.length):0;
  const joined=goals.filter(g=>g.joined).length;
  const filtered=cat==="전체"?goals:goals.filter(g=>g.category===cat);
  const myGoals=goals.filter(g=>g.joined);

  return (
    <div style={{minHeight:"100vh",background:"#080810",fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif",color:"white"}}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
        @keyframes cflyAnim{0%{transform:translate(0,0) rotate(0deg);opacity:1;}100%{transform:translate(var(--tx),var(--ty)) rotate(var(--rot));opacity:0;}}
        @keyframes toastSlide{from{transform:translateX(110%);opacity:0;}to{transform:translateX(0);opacity:1;}}
        @keyframes slideIn{from{transform:translateY(14px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes slideUp{from{transform:translateY(40px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes celebIn{from{transform:scale(0.72) translateY(36px);opacity:0;}to{transform:scale(1) translateY(0);opacity:1;}}
        @keyframes trophyFloat{0%,100%{transform:translateY(0) rotate(-4deg);}50%{transform:translateY(-14px) rotate(4deg);}}
        @keyframes memberPop{to{opacity:1;transform:scale(1);}}
        @keyframes dotBounce{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-6px);}}
        @keyframes messageIn{from{transform:translateY(6px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes chainPulse{0%,100%{opacity:0.6;transform:scale(1);}50%{opacity:1;transform:scale(1.06);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes feedSlide{from{transform:translateX(-8px);opacity:0;}to{transform:translateX(0);opacity:1;}}
        input,textarea,select{background:rgba(255,255,255,0.05)!important;border:1px solid rgba(255,255,255,0.12)!important;color:white!important;border-radius:12px!important;padding:12px 16px!important;font-size:14px!important;outline:none!important;width:100%!important;font-family:inherit!important;}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.3)!important;}
        input:focus,textarea:focus,select:focus{border-color:rgba(255,107,53,0.5)!important;box-shadow:0 0 0 3px rgba(255,107,53,0.08)!important;}
        select option{background:#111120;}
        button{font-family:inherit;}
      `}</style>

      <Confetti active={confetti}/>
      <Toast items={toasts} onDismiss={id=>setToasts(t=>t.filter(x=>x.id!==id))}/>
      {celeb && <ChainCelebration goal={celeb} aiData={celebAI} onClose={()=>{setCeleb(null);setCelebAI(null);}} onNext={()=>{setCeleb(null);setCelebAI(null);setCat("전체");}}/>}
      {coachGoal && <AICoachPanel goal={coachGoal} onClose={()=>setCoachGoal(null)}/>}

      {/* Header */}
      <div style={{background:"rgba(8,8,16,0.94)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.06)",position:"sticky",top:0,zIndex:100,padding:"0 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:62}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:24,animation:"chainPulse 2s infinite"}}>⛓️</span>
            <span style={{fontSize:20,fontWeight:900,letterSpacing:"-0.03em"}}>Goal<span style={{color:"#FF6B35"}}>Chain</span></span>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <NotifCenter log={notifLog} unread={unread} onMarkRead={()=>{setUnread(0);setNotifLog(l=>l.map(n=>({...n,read:true})));}} open={notifOpen} setOpen={setNotifOpen}/>
            <button onClick={()=>setShowCreate(!showCreate)} style={{background:"linear-gradient(135deg,#FF6B35,#FF8C42)",border:"none",color:"white",padding:"9px 18px",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 20px rgba(255,107,53,0.4)",display:"flex",alignItems:"center",gap:6}}>+ 목표 만들기</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"26px 24px"}}>

        {/* Create form */}
        {showCreate && (
          <div style={{background:"rgba(255,107,53,0.06)",border:"1px solid rgba(255,107,53,0.25)",borderRadius:20,padding:24,marginBottom:22,animation:"slideIn 0.3s ease"}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:16}}>🎯 새 목표 만들기</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div style={{gridColumn:"1/-1"}}><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="목표 제목 (예: 매일 독서 30분)"/></div>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.slice(1).map(c=><option key={c}>{c}</option>)}</select>
              <input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/>
              <div style={{gridColumn:"1/-1"}}><textarea rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="목표 설명 (선택)" style={{resize:"none"}}/></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowCreate(false)} style={{padding:"11px 22px",borderRadius:11,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",fontSize:14,fontWeight:600,cursor:"pointer"}}>취소</button>
              <button onClick={handleCreate} style={{flex:1,padding:"11px 0",borderRadius:11,background:"linear-gradient(135deg,#FF6B35,#FF8C42)",border:"none",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(255,107,53,0.3)"}}>⛓️ 체인 시작하기</button>
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:22}}>
          {/* Main */}
          <div>
            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:11,marginBottom:26}}>
              {[{label:"총 체인",val:totalChains,icon:"⛓️",color:"#FF6B35"},{label:"평균 달성률",val:avgProg+"%",icon:"📈",color:"#7C3AED"},{label:"내 참여",val:joined+"개",icon:"🎯",color:"#059669"}].map(s=>(
                <div key={s.label} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"14px 18px",textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontSize:21,fontWeight:900,color:s.color}}>{s.val}</div>
                  <div style={{fontSize:11.5,color:"rgba(255,255,255,0.38)",marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div style={{display:"flex",gap:7,marginBottom:18,flexWrap:"wrap"}}>
              {CATEGORIES.map(c=>(
                <button key={c} onClick={()=>setCat(c)} style={{padding:"7px 15px",borderRadius:20,background:cat===c?(c==="전체"?"#FF6B35":CATCOLORS[c]||"#FF6B35"):"rgba(255,255,255,0.05)",border:cat===c?"none":"1px solid rgba(255,255,255,0.08)",color:cat===c?"white":"rgba(255,255,255,0.48)",fontSize:13,fontWeight:cat===c?700:500,cursor:"pointer",transition:"all 0.2s"}}>{c}</button>
              ))}
            </div>

            {/* Cards */}
            <div style={{display:"grid",gap:13}}>
              {filtered.map((g,i)=>(
                <div key={g.id} style={{animation:`slideIn 0.35s ease ${i*0.04}s both`}}>
                  <GoalCard goal={g} onJoin={handleJoin} onView={setModal} onCheck={handleCheck} onCoach={setCoachGoal}/>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{position:"sticky",top:80,alignSelf:"start",display:"flex",flexDirection:"column",gap:14}}>

            {/* Live feed */}
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 8px #4ade80",display:"inline-block",animation:"chainPulse 2s infinite"}}/>
                <span style={{fontWeight:700,fontSize:13}}>실시간 피드</span>
              </div>
              {feed.slice(0,5).map((item,i)=>(
                <div key={item.id} style={{padding:"8px 11px",borderRadius:10,background:"rgba(255,255,255,0.03)",fontSize:12.5,color:"rgba(255,255,255,0.68)",lineHeight:1.5,marginBottom:7,animation:i===0?"feedSlide 0.3s ease":"none",borderLeft:i===0?"2px solid #FF6B35":"2px solid transparent"}}>
                  <div>{item.text}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.28)",marginTop:3}}>{item.time}</div>
                </div>
              ))}
            </div>

            {/* AI Coach CTA */}
            <div style={{background:"linear-gradient(135deg,rgba(124,58,237,0.14),rgba(124,58,237,0.04))",border:"1px solid rgba(124,58,237,0.28)",borderRadius:18,padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:18}}>🤖</span>
                <span style={{fontWeight:700,fontSize:13}}>AI 목표 코치</span>
                <span style={{marginLeft:"auto",fontSize:10,background:"rgba(124,58,237,0.3)",color:"#a78bfa",padding:"2px 7px",borderRadius:10,fontWeight:700}}>BETA</span>
              </div>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.45)",lineHeight:1.6,marginBottom:11}}>참여 중인 목표 코치에게 동기부여, 슬럼프 극복법을 물어보세요.</p>
              {myGoals.slice(0,2).map(g=>(
                <button key={g.id} onClick={()=>setCoachGoal(g)} style={{width:"100%",marginBottom:7,padding:"9px 13px",borderRadius:11,textAlign:"left",background:"rgba(255,255,255,0.04)",border:`1px solid ${g.color}28`,color:"rgba(255,255,255,0.72)",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13}}>🤖</span>
                  <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.title}</span>
                  <span style={{color:g.color,fontWeight:700}}>{g.progress}%</span>
                </button>
              ))}
            </div>

            {/* 인기 체인 */}
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:16}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:11}}>🔥 이번 주 인기</div>
              {[...goals].sort((a,b)=>b.chains-a.chains).slice(0,3).map((g,i)=>(
                <div key={g.id} style={{display:"flex",alignItems:"center",gap:9,marginBottom:9,padding:"8px 10px",borderRadius:10,background:"rgba(255,255,255,0.03)"}}>
                  <span style={{fontSize:14,minWidth:20}}>{["🥇","🥈","🥉"][i]}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12.5,fontWeight:600,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.title}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.38)"}}>{g.chains}명 참여</div>
                  </div>
                  <span style={{fontSize:15}}>⛓️</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {modal && (
        <div onClick={()=>setModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#0f0f1a",border:`1px solid ${modal.color}38`,borderRadius:24,padding:28,maxWidth:450,width:"100%",boxShadow:`0 40px 80px ${modal.color}1a`,animation:"slideIn 0.3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
              <span style={{background:modal.color+"22",color:modal.color,fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20}}>{modal.category}</span>
              <button onClick={()=>setModal(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:20,cursor:"pointer"}}>×</button>
            </div>
            <div style={{fontSize:21,fontWeight:900,color:"white",marginBottom:7}}>{modal.title}</div>
            <div style={{color:"rgba(255,255,255,0.48)",marginBottom:18,lineHeight:1.7,fontSize:13.5}}>{modal.description}</div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:18}}><Ring progress={modal.progress} color={modal.color} size={106}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:18}}>
              {[["총 체인",modal.chains+"명"],["달성률",modal.progress+"%"],["마감일",modal.deadline],["개설자",modal.avatar+" "+modal.author]].map(([l,v])=>(
                <div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 13px"}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.38)",marginBottom:3}}>{l}</div>
                  <div style={{fontWeight:700,color:"white",fontSize:13.5}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.38)",marginBottom:8}}>함께하는 {modal.members.length}명</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:2}}>{modal.members.map((m,i)=><span key={i} style={{fontSize:22}}>{m}</span>)}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {modal.joined && <button onClick={()=>{setCoachGoal(modal);setModal(null);}} style={{flex:1,padding:"12px 0",borderRadius:12,background:"rgba(124,58,237,0.18)",border:"1px solid rgba(124,58,237,0.38)",color:"#a78bfa",fontSize:13,fontWeight:700,cursor:"pointer"}}>🤖 AI 코치</button>}
              {!modal.joined
                ? <button onClick={()=>{handleJoin(modal.id);setModal(null);}} style={{flex:2,padding:"12px 0",borderRadius:12,background:`linear-gradient(135deg,${modal.color},${modal.color}cc)`,border:"none",color:"white",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:`0 8px 28px ${modal.color}3a`}}>🔗 나도 이거 할래!</button>
                : <button onClick={()=>{handleCheck(modal);setModal(null);}} style={{flex:2,padding:"12px 0",borderRadius:12,background:`linear-gradient(135deg,${modal.color},${modal.color}cc)`,border:"none",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>달성 체크 ✓</button>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
