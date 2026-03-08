import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */
const GOALS = [
  { id:1, author:"민지", avatar:"🦊", title:"매일 새벽 6시 기상", category:"생활습관", deadline:"2025-04-30", chains:47, progress:72, joined:true,  color:"#FF4D00", glow:"rgba(255,77,0,0.5)",   members:["🦊","🐺","🦁","🐯","🦝","🐻","🦌","🦋"], desc:"30일 동안 6시 기상 챌린지. 함께하면 더 쉬워요!" },
  { id:2, author:"준혁", avatar:"🐺", title:"책 한 달에 2권 읽기",  category:"자기계발", deadline:"2025-05-31", chains:32, progress:45, joined:false, color:"#00E5FF", glow:"rgba(0,229,255,0.5)",   members:["🐺","🦊","🐸","🦅","🐬"],            desc:"독서로 성장하는 우리들의 이야기" },
  { id:3, author:"하은", avatar:"🦁", title:"주 3회 운동 습관",     category:"건강",    deadline:"2025-06-30", chains:89, progress:58, joined:false, color:"#39FF14", glow:"rgba(57,255,20,0.5)",    members:["🦁","🐯","🦊","🦌","🐻","🦋","🐺","🦝","🐸","🦅","🐬","🦄"], desc:"헬스, 러닝, 수영 뭐든 OK. 움직이는 것이 중요!" },
  { id:4, author:"태양", avatar:"🐯", title:"하루 물 2L 마시기",    category:"건강",    deadline:"2025-04-15", chains:156,progress:91, joined:true,  color:"#FF00AA", glow:"rgba(255,0,170,0.5)",   members:["🐯","🦊","🦁","🐺","🦝","🐻","🦌","🦋","🐸","🦅","🐬","🦄","🐙","🦞"], desc:"가장 쉽지만 가장 중요한 습관" },
  { id:5, author:"서연", avatar:"🦝", title:"SNS 하루 30분 제한",   category:"디톡스",  deadline:"2025-05-15", chains:23, progress:34, joined:false, color:"#FFD600", glow:"rgba(255,214,0,0.5)",   members:["🦝","🐻","🦌"],                       desc:"진짜 삶에 집중하기 위한 디지털 디톡스" },
  { id:6, author:"준수", avatar:"🦅", title:"매일 명상 10분",       category:"자기계발",deadline:"2025-07-01", chains:61, progress:63, joined:false, color:"#BF5FFF", glow:"rgba(191,95,255,0.5)",  members:["🦅","🦊","🐸","🦌","🐯"],            desc:"하루 10분, 내면의 고요를 찾아서" },
];

const CATS = ["ALL","생활습관","자기계발","건강","디톡스"];

async function askCoach(goal, msg) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:1000,
      system:`GoalChain AI 코치. 목표: ${goal.title} (${goal.progress}% 달성, ${goal.chains}명 참여). 한국어, 2-3문장, 이모지 포함.`,
      messages:[{role:"user",content:msg}]
    })
  });
  const d = await res.json();
  return d.content?.[0]?.text || "잠시 후 다시 시도해주세요.";
}

async function genCelebration(goal) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:1000,
      system:`GoalChain 축하 AI. JSON만 응답: {"msg":"축하(2문장)","tip":"조언(1문장)","next":"다음도전(짧게)"}`,
      messages:[{role:"user",content:`'${goal.title}' 완전 달성! ${goal.chains}명과 함께.`}]
    })
  });
  const d = await res.json();
  try { return JSON.parse(d.content?.[0]?.text?.replace(/```json|```/g,"").trim()||"{}"); }
  catch { return {msg:"완주를 진심으로 축하해요! 🎉",tip:"꾸준함이 진짜 실력입니다.",next:"더 큰 도전에 도전해보세요!"}; }
}

/* ═══════════════════════════════════════════════════════
   LOGIN / SIGNUP
═══════════════════════════════════════════════════════ */
const authInputStyle = { background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.12)", color:"white", borderRadius:12, padding:"12px 16px", fontSize:14, outline:"none", width:"100%", fontFamily:"inherit" };

function LoginScreen({ onLogin, onSwitchSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErr("이메일과 비밀번호를 입력하세요.");
      return;
    }
    onLogin({ email: email.trim(), nickname: email.split("@")[0] });
  };
  return (
    <div style={{minHeight:"100vh",background:"#06060A",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:400,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.1)",borderRadius:24,padding:40,boxShadow:"0 24px 60px rgba(0,0,0,.5)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <span style={{fontSize:28,display:"block",marginBottom:8}}>⛓</span>
          <span style={{fontSize:24,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:".06em"}}>GOAL<span style={{color:"#FF4D00"}}>CHAIN</span></span>
          <p style={{fontSize:13,color:"rgba(255,255,255,.4)",marginTop:8}}>목표를 연결하고 함께 달성하세요</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="이메일" style={{...authInputStyle,marginBottom:12}}/>
          <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setErr("");}} placeholder="비밀번호" style={{...authInputStyle,marginBottom:8}}/>
          {err&&<p style={{fontSize:12,color:"#FF4D00",marginBottom:12}}>{err}</p>}
          <button type="submit" style={{width:"100%",padding:"14px 0",borderRadius:14,background:"linear-gradient(135deg,#FF4D00,#FF7A00)",border:"none",color:"white",fontSize:15,fontWeight:800,cursor:"pointer",letterSpacing:".04em",marginBottom:20}}>로그인</button>
        </form>
        <p style={{textAlign:"center",fontSize:13,color:"rgba(255,255,255,.45)"}}>
          계정이 없으신가요?{" "}
          <button type="button" onClick={onSwitchSignup} style={{background:"none",border:"none",color:"#FF4D00",fontWeight:700,cursor:"pointer",textDecoration:"underline"}}>회원가입</button>
        </p>
      </div>
    </div>
  );
}

function SignupScreen({ onSignup, onSwitchLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [err, setErr] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password || !nickname.trim()) {
      setErr("모든 필드를 입력하세요.");
      return;
    }
    if (password !== confirm) {
      setErr("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      setErr("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    onSignup({ email: email.trim(), nickname: nickname.trim() });
  };
  return (
    <div style={{minHeight:"100vh",background:"#06060A",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:400,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.1)",borderRadius:24,padding:40,boxShadow:"0 24px 60px rgba(0,0,0,.5)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <span style={{fontSize:28,display:"block",marginBottom:8}}>⛓</span>
          <span style={{fontSize:24,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:".06em"}}>GOAL<span style={{color:"#FF4D00"}}>CHAIN</span></span>
          <p style={{fontSize:13,color:"rgba(255,255,255,.4)",marginTop:8}}>새 계정 만들기</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="이메일" style={{...authInputStyle,marginBottom:12}}/>
          <input type="text" value={nickname} onChange={e=>{setNickname(e.target.value);setErr("");}} placeholder="닉네임" style={{...authInputStyle,marginBottom:12}}/>
          <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setErr("");}} placeholder="비밀번호 (6자 이상)" style={{...authInputStyle,marginBottom:12}}/>
          <input type="password" value={confirm} onChange={e=>{setConfirm(e.target.value);setErr("");}} placeholder="비밀번호 확인" style={{...authInputStyle,marginBottom:8}}/>
          {err&&<p style={{fontSize:12,color:"#FF4D00",marginBottom:12}}>{err}</p>}
          <button type="submit" style={{width:"100%",padding:"14px 0",borderRadius:14,background:"linear-gradient(135deg,#FF4D00,#FF7A00)",border:"none",color:"white",fontSize:15,fontWeight:800,cursor:"pointer",letterSpacing:".04em",marginBottom:20}}>회원가입</button>
        </form>
        <p style={{textAlign:"center",fontSize:13,color:"rgba(255,255,255,.45)"}}>
          이미 계정이 있으신가요?{" "}
          <button type="button" onClick={onSwitchLogin} style={{background:"none",border:"none",color:"#FF4D00",fontWeight:700,cursor:"pointer",textDecoration:"underline"}}>로그인</button>
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TICKER
═══════════════════════════════════════════════════════ */
function Ticker({ items }) {
  const doubled = [...items,...items];
  return (
    <div style={{overflow:"hidden",borderTop:"1px solid rgba(255,77,0,0.3)",borderBottom:"1px solid rgba(255,77,0,0.3)",background:"rgba(255,77,0,0.06)",padding:"10px 0",position:"relative",zIndex:2}}>
      <div style={{display:"flex",gap:0,animation:"ticker 28s linear infinite",whiteSpace:"nowrap",willChange:"transform"}}>
        {doubled.map((item,i)=>(
          <span key={i} style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.5)",letterSpacing:"0.12em",textTransform:"uppercase",padding:"0 32px",fontFamily:"'DM Mono',monospace"}}>
            <span style={{color:"#FF4D00",marginRight:10}}>⛓</span>{item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CONFETTI
═══════════════════════════════════════════════════════ */
function Confetti({active}) {
  const pts = useRef(Array.from({length:80},(_,i)=>({
    id:i, x:45+Math.random()*10, y:45+Math.random()*10,
    tx:(Math.random()-.5)*240, ty:-(Math.random()*320+80),
    color:`hsl(${Math.random()*360},90%,65%)`,
    sz:Math.random()*10+4, d:i*.018, rect:Math.random()>.5, rot:Math.random()*720
  })));
  if(!active) return null;
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
      {pts.current.map(p=>(
        <div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:p.sz,height:p.sz,borderRadius:p.rect?2:"50%",background:p.color,animation:`cfly 1.6s ease-out forwards`,animationDelay:`${p.d}s`,"--tx":`${p.tx}px`,"--ty":`${p.ty}px`,"--rot":`${p.rot}deg`}}/>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════ */
function Toasts({items,onX}) {
  return (
    <div style={{position:"fixed",top:84,right:20,zIndex:700,display:"flex",flexDirection:"column",gap:8,maxWidth:320}}>
      {items.map(n=>(
        <div key={n.id} onClick={()=>onX(n.id)} style={{
          background:"rgba(10,10,14,0.97)",
          borderLeft:`3px solid ${n.color||"#FF4D00"}`,
          border:`1px solid ${(n.color||"#FF4D00")}40`,
          borderRadius:12,padding:"12px 14px",cursor:"pointer",
          animation:"toastIn .4s cubic-bezier(.34,1.56,.64,1)",
          boxShadow:`0 8px 32px rgba(0,0,0,.6),0 0 20px ${(n.color||"#FF4D00")}18`,
          display:"flex",gap:10,alignItems:"flex-start",
        }}>
          <span style={{fontSize:18,flexShrink:0}}>{n.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:"white",marginBottom:2}}>{n.title}</div>
            <div style={{fontSize:11.5,color:"rgba(255,255,255,.55)",lineHeight:1.4}}>{n.body}</div>
          </div>
          <span style={{color:"rgba(255,255,255,.25)",fontSize:14,flexShrink:0}}>×</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTIF CENTER
═══════════════════════════════════════════════════════ */
function NotifBtn({log,unread,onRead,open,setOpen}) {
  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>{setOpen(!open);if(!open)onRead();}} style={{
        width:42,height:42,borderRadius:12,
        background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",
        cursor:"pointer",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",
        transition:"all .2s",position:"relative",
      }}>🔔
        {unread>0&&<span style={{position:"absolute",top:-5,right:-5,background:"#FF4D00",color:"white",fontSize:10,fontWeight:900,minWidth:18,height:18,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #06060A",padding:"0 3px"}}>{unread>9?"9+":unread}</span>}
      </button>
      {open&&(
        <div style={{position:"absolute",top:52,right:0,width:310,background:"#0A0A0E",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,.8)",zIndex:400,animation:"fadeSlide .2s ease"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between"}}>
            <span style={{fontWeight:800,fontSize:14,letterSpacing:"-.01em"}}>알림센터</span>
            <span style={{fontSize:12,color:"rgba(255,255,255,.3)"}}>{log.length}개</span>
          </div>
          <div style={{maxHeight:360,overflowY:"auto"}}>
            {log.length===0
              ? <div style={{padding:32,textAlign:"center",color:"rgba(255,255,255,.25)",fontSize:13}}>알림 없음</div>
              : log.map(n=>(
                <div key={n.id} style={{padding:"11px 18px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",gap:10,background:n.read?"transparent":"rgba(255,77,0,.04)",borderLeft:n.read?"none":`2px solid ${n.color||"#FF4D00"}`}}>
                  <span style={{fontSize:17}}>{n.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:n.read?500:700,color:n.read?"rgba(255,255,255,.5)":"white"}}>{n.title}</div>
                    <div style={{fontSize:11.5,color:"rgba(255,255,255,.35)",marginTop:2,lineHeight:1.4}}>{n.body}</div>
                    <div style={{fontSize:10.5,color:"rgba(255,255,255,.2)",marginTop:4}}>{n.time}</div>
                  </div>
                  {!n.read&&<div style={{width:6,height:6,borderRadius:"50%",background:n.color||"#FF4D00",flexShrink:0,marginTop:5}}/>}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CELEBRATION OVERLAY
═══════════════════════════════════════════════════════ */
function Celebration({goal,ai,onClose,onNext}) {
  const [ph,setPh]=useState(0);
  useEffect(()=>{
    const t1=setTimeout(()=>setPh(1),500);
    const t2=setTimeout(()=>setPh(2),1200);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);
  return (
    <div style={{position:"fixed",inset:0,zIndex:8000,background:"rgba(0,0,0,.95)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:460,width:"100%",textAlign:"center",animation:"celebIn .7s cubic-bezier(.34,1.56,.64,1)"}}>
        {/* Trophy glow */}
        <div style={{position:"relative",marginBottom:12,display:"inline-block"}}>
          <div style={{position:"absolute",inset:-40,borderRadius:"50%",background:`radial-gradient(circle,${goal.glow} 0%,transparent 70%)`,animation:"pulseGlow 2s ease-in-out infinite"}}/>
          <span style={{fontSize:80,display:"block",animation:"trophySpin 3s ease-in-out infinite",position:"relative"}}>🏆</span>
        </div>

        <div style={{fontSize:13,fontWeight:800,letterSpacing:".2em",textTransform:"uppercase",color:goal.color,marginBottom:8,fontFamily:"'DM Mono',monospace"}}>CHAIN COMPLETE</div>
        <h2 style={{fontSize:32,fontWeight:900,color:"white",lineHeight:1.1,marginBottom:6,letterSpacing:"-.03em"}}>{goal.title}</h2>
        <p style={{fontSize:15,color:"rgba(255,255,255,.4)",marginBottom:28}}>{goal.chains}명이 함께 완주했습니다</p>

        {/* Member parade */}
        <div style={{display:"flex",justifyContent:"center",flexWrap:"wrap",gap:6,marginBottom:28,padding:"16px 24px",background:"rgba(255,255,255,.04)",borderRadius:20,border:`1px solid ${goal.color}25`}}>
          {goal.members.map((m,i)=>(
            <span key={i} style={{fontSize:28,animation:"memberBounce .5s cubic-bezier(.34,1.56,.64,1) forwards",animationDelay:`${.4+i*.05}s`,opacity:0,transform:"scale(0) translateY(20px)",display:"inline-block"}}>{m}</span>
          ))}
        </div>

        {/* Stats */}
        {ph>=1&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20,animation:"riseIn .5s ease"}}>
            {[{e:"⛓️",l:"체인 인원",v:goal.chains+"명"},{e:"📈",l:"최종 달성",v:"100%"},{e:"🔥",l:"연속 달성",v:Math.floor(Math.random()*15+8)+"일"}].map(s=>(
              <div key={s.l} style={{background:"rgba(255,255,255,.04)",borderRadius:14,padding:"14px 8px",border:`1px solid ${goal.color}20`}}>
                <div style={{fontSize:22,marginBottom:4}}>{s.e}</div>
                <div style={{fontSize:20,fontWeight:900,color:goal.color,fontFamily:"'DM Mono',monospace"}}>{s.v}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* AI message */}
        {ph>=2&&(
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:18,marginBottom:22,animation:"riseIn .5s ease",textAlign:"left"}}>
            <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
              <span style={{fontSize:15}}>🤖</span>
              <span style={{fontSize:11,fontWeight:700,color:goal.color,letterSpacing:".1em",fontFamily:"'DM Mono',monospace"}}>AI COACH MESSAGE</span>
              {!ai&&<span style={{fontSize:12,color:"rgba(255,255,255,.3)",marginLeft:4,animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>}
            </div>
            {ai
              ? <>
                  <p style={{fontSize:14,color:"rgba(255,255,255,.85)",lineHeight:1.75,marginBottom:10}}>{ai.msg}</p>
                  <p style={{fontSize:13,color:"rgba(255,255,255,.45)",borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:10}}>💡 {ai.tip}</p>
                  {ai.next&&<p style={{fontSize:13,color:goal.color,marginTop:8}}>🚀 {ai.next}</p>}
                </>
              : <p style={{fontSize:13,color:"rgba(255,255,255,.3)"}}>AI 코치 메시지 생성 중...</p>
            }
          </div>
        )}

        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"14px 0",borderRadius:14,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>돌아가기</button>
          <button onClick={onNext} style={{flex:2,padding:"14px 0",borderRadius:14,background:`linear-gradient(135deg,${goal.color},${goal.color}99)`,border:"none",color:"white",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 8px 28px ${goal.glow}`}}>다음 목표 찾기 ⛓</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AI COACH CHAT
═══════════════════════════════════════════════════════ */
function CoachPanel({goal,onClose}) {
  const [msgs,setMsgs]=useState([{role:"a",text:`"${goal.title}" 목표 코치예요 🤖\n현재 ${goal.progress}% 달성 중! 무엇이든 물어보세요.`}]);
  const [inp,setInp]=useState("");
  const [loading,setLoading]=useState(false);
  const btmRef=useRef(null);
  useEffect(()=>btmRef.current?.scrollIntoView({behavior:"smooth"}),[msgs]);

  const send=async(q)=>{
    const text=q||inp.trim(); if(!text||loading) return;
    setInp(""); setMsgs(m=>[...m,{role:"u",text}]); setLoading(true);
    try { const r=await askCoach(goal,text); setMsgs(m=>[...m,{role:"a",text:r}]); }
    catch { setMsgs(m=>[...m,{role:"a",text:"잠시 후 다시 시도해주세요 🙏"}]); }
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:20,pointerEvents:"none"}}>
      <div style={{width:360,height:540,background:"#08080E",border:`1px solid ${goal.color}60`,borderRadius:20,display:"flex",flexDirection:"column",boxShadow:`0 0 60px ${goal.glow},0 24px 80px rgba(0,0,0,.8)`,animation:"slideUp .4s cubic-bezier(.34,1.56,.64,1)",pointerEvents:"all",overflow:"hidden"}}>
        <div style={{padding:"13px 16px",borderBottom:"1px solid rgba(255,255,255,.06)",background:`linear-gradient(135deg,${goal.color}18,transparent)`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:`${goal.color}22`,border:`1px solid ${goal.color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤖</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:14,fontFamily:"'DM Mono',monospace",letterSpacing:"-.01em"}}>AI COACH</div>
            <div style={{fontSize:11,color:goal.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{goal.title}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="u"?"flex-end":"flex-start",alignItems:"flex-end",gap:6}}>
              {m.role==="a"&&<span style={{fontSize:18,flexShrink:0}}>🤖</span>}
              <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:m.role==="u"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="u"?`linear-gradient(135deg,${goal.color},${goal.color}aa)`:"rgba(255,255,255,.07)",fontSize:13,lineHeight:1.65,color:"rgba(255,255,255,.92)",whiteSpace:"pre-wrap",animation:"msgIn .3s ease",boxShadow:m.role==="u"?`0 4px 16px ${goal.glow}`:"none"}}>{m.text}</div>
            </div>
          ))}
          {loading&&(
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:18}}>🤖</span>
              <div style={{background:"rgba(255,255,255,.07)",borderRadius:"16px 16px 16px 4px",padding:"10px 14px",display:"flex",gap:5}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:goal.color,animation:`dot 1s ease-in-out ${i*.2}s infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={btmRef}/>
        </div>

        <div style={{padding:"8px 12px",display:"flex",gap:6,overflowX:"auto",borderTop:"1px solid rgba(255,255,255,.05)"}}>
          {["오늘 동기부여","슬럼프 극복","달성 팁","체인 소감"].map(q=>(
            <button key={q} onClick={()=>send(q)} style={{flexShrink:0,padding:"5px 11px",borderRadius:20,background:`${goal.color}18`,border:`1px solid ${goal.color}40`,color:goal.color,fontSize:11,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",fontWeight:600}}>{q}</button>
          ))}
        </div>

        <div style={{padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,.06)",display:"flex",gap:8}}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="코치에게 물어보세요..." style={{flex:1,padding:"9px 14px",borderRadius:12,background:"rgba(255,255,255,.07)",border:`1px solid ${goal.color}30`,color:"white",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={()=>send()} disabled={loading} style={{width:38,height:38,borderRadius:12,border:"none",background:loading?`${goal.color}40`:goal.color,color:"white",fontSize:16,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:900}}>↑</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROGRESS ARC
═══════════════════════════════════════════════════════ */
function Arc({progress,color,glow,size=70}) {
  const r=(size-10)/2, c=2*Math.PI*r, off=c-(progress/100)*c;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",filter:`drop-shadow(0 0 6px ${glow})`}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={c} strokeDashoffset={off}
        style={{transition:"stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1)",strokeLinecap:"round"}}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={size*.2} fontWeight="900" fontFamily="'DM Mono',monospace"
        style={{transform:`rotate(90deg)`,transformOrigin:`${size/2}px ${size/2}px`}}>{progress}%</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   GOAL CARD — redesigned
═══════════════════════════════════════════════════════ */
function Card({goal,onJoin,onView,onCheck,onCoach}) {
  const [hov,setHov]=useState(false);
  const hot=goal.progress>=80;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background:hov?"rgba(255,255,255,.05)":"rgba(255,255,255,.025)",
        border:`1px solid ${hov?goal.color+"80":"rgba(255,255,255,.07)"}`,
        borderRadius:20,padding:"22px 22px 18px",
        transition:"all .3s cubic-bezier(.4,0,.2,1)",
        transform:hov?"translateY(-6px) scale(1.01)":"none",
        boxShadow:hov?`0 24px 48px rgba(0,0,0,.5),0 0 30px ${goal.glow}`:"0 4px 16px rgba(0,0,0,.3)",
        position:"relative",overflow:"hidden",cursor:"pointer",
      }}>
      {/* Top accent line */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent 0%,${goal.color} 40%,${goal.color} 60%,transparent 100%)`,opacity:hov?1:0.4,transition:"opacity .3s"}}/>
      {/* Background glow */}
      <div style={{position:"absolute",top:-60,right:-40,width:180,height:180,borderRadius:"50%",background:`radial-gradient(circle,${goal.glow} 0%,transparent 65%)`,opacity:hov?.18:.06,transition:"opacity .3s",pointerEvents:"none"}}/>

      {hot&&<div style={{position:"absolute",top:14,right:14,fontSize:10,fontWeight:800,color:goal.color,background:`${goal.color}18`,border:`1px solid ${goal.color}40`,padding:"3px 9px",borderRadius:20,letterSpacing:".08em",fontFamily:"'DM Mono',monospace"}}>ALMOST DONE 🔥</div>}

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div style={{flex:1,paddingRight:16}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontWeight:800,color:goal.color,background:`${goal.color}18`,border:`1px solid ${goal.color}35`,padding:"3px 10px",borderRadius:20,letterSpacing:".1em",fontFamily:"'DM Mono',monospace",textTransform:"uppercase"}}>{goal.category}</span>
            {goal.joined&&<span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.4)",background:"rgba(255,255,255,.06)",padding:"3px 10px",borderRadius:20,letterSpacing:".05em"}}>JOINED ✓</span>}
          </div>
          <h3 style={{fontSize:18,fontWeight:900,color:"white",lineHeight:1.2,marginBottom:6,letterSpacing:"-.02em"}}>{goal.title}</h3>
          <div style={{fontSize:12,color:"rgba(255,255,255,.35)",display:"flex",alignItems:"center",gap:5,fontFamily:"'DM Mono',monospace"}}>
            <span>{goal.avatar}</span><span>{goal.author}</span>
            <span style={{color:"rgba(255,255,255,.15)"}}>·</span>
            <span>{goal.deadline}</span>
          </div>
        </div>
        <Arc progress={goal.progress} color={goal.color} glow={goal.glow} size={68}/>
      </div>

      <p style={{fontSize:13,color:"rgba(255,255,255,.38)",marginBottom:16,lineHeight:1.65}}>{goal.desc}</p>

      {/* Members + chain count */}
      <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
        <div style={{display:"flex",position:"relative"}}>
          {goal.members.slice(0,9).map((m,i)=>(
            <span key={i} style={{fontSize:17,marginLeft:i?-7:0,filter:"drop-shadow(0 0 4px rgba(0,0,0,1))",zIndex:9-i,position:"relative"}}>{m}</span>
          ))}
          {goal.members.length>9&&<span style={{fontSize:11,color:"rgba(255,255,255,.35)",marginLeft:4,alignSelf:"center"}}>+{goal.members.length-9}</span>}
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"baseline",gap:4}}>
          <span style={{fontSize:24,fontWeight:900,color:goal.color,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{goal.chains}</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.35)",fontFamily:"'DM Mono',monospace"}}>CHAINS</span>
        </div>
      </div>

      {/* Thin progress bar */}
      <div style={{height:3,background:"rgba(255,255,255,.07)",borderRadius:2,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${goal.progress}%`,background:`linear-gradient(90deg,${goal.color}88,${goal.color})`,borderRadius:2,transition:"width 1s ease",boxShadow:`0 0 8px ${goal.color}`}}/>
      </div>

      {/* Buttons */}
      <div style={{display:"flex",gap:6}}>
        <button onClick={e=>{e.stopPropagation();onView(goal);}} style={{flex:1,padding:"9px 0",borderRadius:11,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",color:"rgba(255,255,255,.5)",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:".04em",transition:"all .2s"}}>DETAIL</button>
        {goal.joined&&<button onClick={e=>{e.stopPropagation();onCoach(goal);}} style={{flex:1,padding:"9px 0",borderRadius:11,background:`${goal.color}14`,border:`1px solid ${goal.color}35`,color:goal.color,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:".04em"}}>AI 코치</button>}
        {!goal.joined
          ?<button onClick={e=>{e.stopPropagation();onJoin(goal.id);}} style={{flex:2,padding:"9px 0",borderRadius:11,background:`linear-gradient(135deg,${goal.color},${goal.color}cc)`,border:"none",color:"white",fontSize:12,fontWeight:800,cursor:"pointer",boxShadow:`0 4px 20px ${goal.glow}`,letterSpacing:".04em",transition:"all .2s"}}>⛓ 나도 할래!</button>
          :<button onClick={e=>{e.stopPropagation();onCheck(goal);}} style={{flex:2,padding:"9px 0",borderRadius:11,background:hot?`linear-gradient(135deg,${goal.color},${goal.color}cc)`:`${goal.color}12`,border:hot?"none":`1px solid ${goal.color}40`,color:hot?"white":goal.color,fontSize:12,fontWeight:800,cursor:"pointer",boxShadow:hot?`0 4px 20px ${goal.glow}`:"none",letterSpacing:".04em"}}>{hot?"🏁 완료 선언!":"달성 체크 ✓"}</button>
        }
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════ */
export default function App() {
  const [user,setUser]=useState(null);
  const [authView,setAuthView]=useState("login");
  const [goals,setGoals]=useState(GOALS);
  const [cat,setCat]=useState("ALL");
  const [confetti,setConfetti]=useState(false);
  const [modal,setModal]=useState(null);
  const [celeb,setCeleb]=useState(null);
  const [celebAI,setCelebAI]=useState(null);
  const [coach,setCoach]=useState(null);
  const [showCreate,setShowCreate]=useState(false);
  const [form,setForm]=useState({title:"",category:"생활습관",desc:"",deadline:""});
  const [toasts,setToasts]=useState([]);
  const [notifs,setNotifs]=useState([]);
  const [unread,setUnread]=useState(0);
  const [notifOpen,setNotifOpen]=useState(false);
  const [feed,setFeed]=useState([
    {id:1,text:"🦁 하은님이 '주 3회 운동 습관' 달성!",time:"방금"},
    {id:2,text:"🐯 태양님 '하루 물 2L' 7일 연속!",time:"2분 전"},
    {id:3,text:"🦊 민지님 새 목표 개설!",time:"8분 전"},
    {id:4,text:"🦅 준수님 체인 50명 돌파!",time:"15분 전"},
  ]);

  const push=useCallback((n)=>{
    const id=Date.now()+Math.random();
    const item={...n,id,time:"방금",read:false};
    setToasts(t=>[item,...t].slice(0,4));
    setNotifs(l=>[item,...l].slice(0,30));
    setUnread(u=>u+1);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4500);
  },[]);

  useEffect(()=>{
    const msgs=[
      {icon:"🔗",color:"#FF4D00",title:"새 체인 연결!",body:"🐸 준후님이 '하루 물 2L' 목표에 합류했어요!"},
      {icon:"🎯",color:"#39FF14",title:"체인 친구 달성!",body:"🦅 지호님이 '6시 기상' 오늘도 달성!"},
      {icon:"⏰",color:"#00E5FF",title:"오늘 체크 알림",body:"'매일 새벽 6시 기상' 아직 체크 안 하셨어요"},
      {icon:"🏆",color:"#FF00AA",title:"달성 임박!",body:"'하루 물 2L' 91%! 거의 완주예요 💪"},
      {icon:"🔗",color:"#FFD600",title:"신규 체인!",body:"🦄 수아님이 '책 2권' 목표에 합류했어요!"},
    ];
    let i=0;
    const iv=setInterval(()=>{if(i<msgs.length){push(msgs[i]);i++;}},7000);
    return()=>clearInterval(iv);
  },[push]);

  const handleJoin=id=>{
    const g=goals.find(x=>x.id===id);
    setGoals(p=>p.map(x=>x.id===id?{...x,chains:x.chains+1,joined:true,members:["🦊",...x.members]}:x));
    push({icon:"🔗",color:g?.color,title:"체인 연결!",body:`'${g?.title}'에 합류했어요!`});
    setFeed(p=>[{id:Date.now(),text:`🦊 내가 '${g?.title}' 체인에 합류!`,time:"방금"},...p.slice(0,5)]);
    setConfetti(true); setTimeout(()=>setConfetti(false),2000);
  };

  const handleCheck=async goal=>{
    const np=Math.min(100,goal.progress+Math.floor(Math.random()*9+4));
    setGoals(p=>p.map(x=>x.id===goal.id?{...x,progress:np}:x));
    setFeed(p=>[{id:Date.now(),text:`🦊 '${goal.title}' 달성 체크! (${np}%)`,time:"방금"},...p.slice(0,5)]);
    if(np>=100){
      setConfetti(true); setTimeout(()=>setConfetti(false),3500);
      setCeleb({...goal,progress:100}); setCelebAI(null);
      push({icon:"🏆",color:goal.color,title:"체인 완료! 🎉",body:`'${goal.title}' 완전 달성!`});
      genCelebration({...goal,progress:100}).then(d=>setCelebAI(d));
    } else {
      push({icon:"✅",color:goal.color,title:"달성 체크!",body:`'${goal.title}' ${np}% 달성! 💪`});
      if(np>=80) push({icon:"🔥",color:goal.color,title:"완료 임박!",body:`${goal.chains}명 모두 응원 중이에요!`});
    }
  };

  const handleCreate=()=>{
    if(!form.title||!form.deadline) return;
    const palette=[["#FF4D00","rgba(255,77,0,.5)"],["#00E5FF","rgba(0,229,255,.5)"],["#39FF14","rgba(57,255,20,.5)"],["#FF00AA","rgba(255,0,170,.5)"],["#FFD600","rgba(255,214,0,.5)"],["#BF5FFF","rgba(191,95,255,.5)"]];
    const [color,glow]=palette[Math.floor(Math.random()*palette.length)];
    const g={id:Date.now(),author:"나",avatar:"🦊",title:form.title,category:form.category,deadline:form.deadline,chains:1,progress:0,joined:true,color,glow,members:["🦊"],desc:form.desc||"새로운 목표에 함께해요!"};
    setGoals(p=>[g,...p]);
    push({icon:"🎯",color,title:"목표 생성!",body:`'${form.title}' 체인 시작!`});
    setFeed(p=>[{id:Date.now(),text:`🦊 새 목표 '${form.title}' 개설!`,time:"방금"},...p.slice(0,5)]);
    setForm({title:"",category:"생활습관",desc:"",deadline:""});
    setShowCreate(false);
    setConfetti(true); setTimeout(()=>setConfetti(false),2000);
  };

  const filtered=cat==="ALL"?goals:goals.filter(g=>g.category===cat);
  const totalChains=goals.reduce((s,g)=>s+g.chains,0);
  const avgProg=Math.round(goals.reduce((s,g)=>s+g.progress,0)/goals.length);
  const myGoals=goals.filter(g=>g.joined);

  const TICKER_ITEMS=["목표를 연결하라","체인으로 성장하라","함께하면 더 강해진다","오늘의 달성이 내일의 습관","GoalChain — 목표 공유형 인간 네트워크","당신의 목표에 동료가 생깁니다"];

  if (!user) {
    return authView === "login"
      ? <LoginScreen onLogin={setUser} onSwitchSignup={()=>setAuthView("signup")}/>
      : <SignupScreen onSignup={setUser} onSwitchLogin={()=>setAuthView("login")}/>;
  }

  return (
    <div style={{minHeight:"100vh",background:"#06060A",fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif",color:"white",position:"relative",overflowX:"hidden"}}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:rgba(255,77,0,.3);border-radius:2px;}
        @keyframes cfly{0%{transform:translate(0,0) rotate(0);opacity:1;}100%{transform:translate(var(--tx),var(--ty)) rotate(var(--rot));opacity:0;}}
        @keyframes toastIn{from{transform:translateX(120%);opacity:0;}to{transform:translateX(0);opacity:1;}}
        @keyframes fadeSlide{from{transform:translateY(-10px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes riseIn{from{transform:translateY(20px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes celebIn{from{transform:scale(.68) translateY(40px);opacity:0;}to{transform:scale(1) translateY(0);opacity:1;}}
        @keyframes trophySpin{0%,100%{transform:translateY(0) rotate(-6deg);}50%{transform:translateY(-16px) rotate(6deg);}}
        @keyframes pulseGlow{0%,100%{opacity:.7;transform:scale(1);}50%{opacity:1;transform:scale(1.15);}}
        @keyframes memberBounce{to{opacity:1;transform:scale(1) translateY(0);}}
        @keyframes slideUp{from{transform:translateY(50px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes msgIn{from{transform:translateY(6px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes dot{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-7px);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes ticker{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        @keyframes chainPulse{0%,100%{opacity:.5;transform:scale(1);}50%{opacity:1;transform:scale(1.08);}}
        @keyframes heroFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
        @keyframes feedIn{from{transform:translateX(-10px);opacity:0;}to{transform:translateX(0);opacity:1;}}
        @keyframes statCount{from{opacity:0;transform:scale(.8);}to{opacity:1;transform:scale(1);}}
        input,textarea,select{background:rgba(255,255,255,.05)!important;border:1px solid rgba(255,255,255,.1)!important;color:white!important;border-radius:12px!important;padding:12px 16px!important;font-size:14px!important;outline:none!important;width:100%!important;font-family:inherit!important;}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,.25)!important;}
        input:focus,textarea:focus,select:focus{border-color:rgba(255,77,0,.6)!important;box-shadow:0 0 0 3px rgba(255,77,0,.1)!important;}
        select option{background:#0A0A0E;}
        button{font-family:inherit;}
        .card-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
        @media(max-width:900px){.card-grid{grid-template-columns:1fr;}}
      `}</style>

      <Confetti active={confetti}/>
      <Toasts items={toasts} onX={id=>setToasts(t=>t.filter(x=>x.id!==id))}/>
      {celeb&&<Celebration goal={celeb} ai={celebAI} onClose={()=>{setCeleb(null);setCelebAI(null);}} onNext={()=>{setCeleb(null);setCelebAI(null);setCat("ALL");}}/>}
      {coach&&<CoachPanel goal={coach} onClose={()=>setCoach(null)}/>}

      {/* ── HEADER ── */}
      <header style={{position:"sticky",top:0,zIndex:200,background:"rgba(6,6,10,.9)",backdropFilter:"blur(24px)",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:62}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22,animation:"chainPulse 2.5s infinite"}}>⛓</span>
            <span style={{fontSize:22,fontWeight:900,letterSpacing:"-.04em",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:".04em"}}>
              GOAL<span style={{color:"#FF4D00"}}>CHAIN</span>
            </span>
            <span style={{fontSize:11,color:"rgba(255,77,0,.7)",background:"rgba(255,77,0,.1)",border:"1px solid rgba(255,77,0,.25)",padding:"2px 8px",borderRadius:20,fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>BETA</span>
          </div>
          <nav style={{display:"flex",gap:8,alignItems:"center"}}>
            <NotifBtn log={notifs} unread={unread} onRead={()=>{setUnread(0);setNotifs(l=>l.map(n=>({...n,read:true})));}} open={notifOpen} setOpen={setNotifOpen}/>
            <span style={{fontSize:13,color:"rgba(255,255,255,.5)",marginRight:4}}>{user.nickname}님</span>
            <button onClick={()=>setUser(null)} style={{padding:"8px 14px",borderRadius:10,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",color:"rgba(255,255,255,.6)",fontSize:12,fontWeight:600,cursor:"pointer"}}>로그아웃</button>
            <button onClick={()=>setShowCreate(!showCreate)} style={{background:"linear-gradient(135deg,#FF4D00,#FF7A00)",border:"none",color:"white",padding:"10px 20px",borderRadius:12,fontWeight:800,fontSize:13,cursor:"pointer",boxShadow:"0 4px 24px rgba(255,77,0,.5)",letterSpacing:".06em",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:15}}>+</span> 목표 만들기
            </button>
          </nav>
        </div>
      </header>

      {/* ── TICKER ── */}
      <Ticker items={TICKER_ITEMS}/>

      {/* ── HERO ── */}
      <section style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"80px 28px 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center"}}>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:"#FF4D00",letterSpacing:".25em",marginBottom:20,fontFamily:"'DM Mono',monospace",display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:28,height:1,background:"#FF4D00",display:"inline-block"}}/>
              목표 공유형 인간 네트워크
            </div>
            <h1 style={{fontSize:74,fontWeight:900,lineHeight:.95,letterSpacing:"-.04em",marginBottom:28,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:".02em"}}>
              <span style={{display:"block",color:"white"}}>CONNECT</span>
              <span style={{display:"block",color:"#FF4D00",textShadow:"0 0 60px rgba(255,77,0,.6)"}}>YOUR GOALS</span>
              <span style={{display:"block",color:"white"}}>ACHIEVE</span>
            </h1>
            <p style={{fontSize:16,color:"rgba(255,255,255,.45)",lineHeight:1.75,maxWidth:420,marginBottom:36}}>
              각자의 목표를 올리고, 같은 목표를 가진 사람들과 <strong style={{color:"rgba(255,255,255,.75)"}}>체인으로 연결</strong>되세요. 혼자보다 함께가 훨씬 강합니다.
            </p>
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>setShowCreate(true)} style={{padding:"14px 28px",borderRadius:14,background:"linear-gradient(135deg,#FF4D00,#FF7A00)",border:"none",color:"white",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 8px 32px rgba(255,77,0,.5)",letterSpacing:".04em"}}>
                ⛓ 지금 시작하기
              </button>
              <button onClick={()=>document.getElementById("goals-section").scrollIntoView({behavior:"smooth"})} style={{padding:"14px 28px",borderRadius:14,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",color:"rgba(255,255,255,.7)",fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:".04em"}}>
                목표 탐색 →
              </button>
            </div>
          </div>

          {/* Hero Stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,animation:"heroFloat 4s ease-in-out infinite"}}>
            {[
              {label:"총 체인",val:totalChains,icon:"⛓",color:"#FF4D00",sub:"명이 연결됨"},
              {label:"평균 달성률",val:avgProg+"%",icon:"📈",color:"#00E5FF",sub:"이번 주"},
              {label:"활성 목표",val:goals.length,icon:"🎯",color:"#39FF14",sub:"개 진행 중"},
              {label:"내 참여",val:myGoals.length,icon:"🔗",color:"#FF00AA",sub:"개 체인"},
            ].map((s,i)=>(
              <div key={s.label} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${s.color}25`,borderRadius:18,padding:"22px 20px",position:"relative",overflow:"hidden",animation:`statCount .6s ease ${i*.1}s both`}}>
                <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:`radial-gradient(circle,${s.color}20 0%,transparent 70%)`}}/>
                <div style={{fontSize:28,marginBottom:10}}>{s.icon}</div>
                <div style={{fontSize:32,fontWeight:900,color:s.color,fontFamily:"'DM Mono',monospace",lineHeight:1,marginBottom:4}}>{s.val}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.4)",fontFamily:"'DM Mono',monospace"}}>{s.sub}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.25)",marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(255,77,0,.3),rgba(0,229,255,.3),transparent)",margin:"0 28px",position:"relative",zIndex:1}}/>

      {/* ── GOALS SECTION ── */}
      <section id="goals-section" style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"56px 28px 80px"}}>

        {/* Create Form */}
        {showCreate&&(
          <div style={{background:"rgba(255,77,0,.06)",border:"1px solid rgba(255,77,0,.25)",borderRadius:20,padding:28,marginBottom:32,animation:"riseIn .35s ease",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#FF4D00,transparent)"}}/>
            <div style={{fontSize:13,fontWeight:800,letterSpacing:".12em",color:"#FF4D00",marginBottom:18,fontFamily:"'DM Mono',monospace"}}>NEW GOAL CHAIN</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div style={{gridColumn:"1/-1"}}><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="목표 제목을 입력하세요"/></div>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATS.slice(1).map(c=><option key={c}>{c}</option>)}</select>
              <input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/>
              <div style={{gridColumn:"1/-1"}}><textarea rows={2} value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="목표 설명 (선택)" style={{resize:"none"}}/></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowCreate(false)} style={{padding:"12px 22px",borderRadius:12,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.55)",fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:".04em"}}>CANCEL</button>
              <button onClick={handleCreate} style={{flex:1,padding:"12px 0",borderRadius:12,background:"linear-gradient(135deg,#FF4D00,#FF7A00)",border:"none",color:"white",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 20px rgba(255,77,0,.4)",letterSpacing:".06em"}}>⛓ LAUNCH CHAIN</button>
            </div>
          </div>
        )}

        {/* Section Header + Filter */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28,flexWrap:"wrap",gap:16}}>
          <div>
            <h2 style={{fontSize:13,fontWeight:800,letterSpacing:".18em",color:"rgba(255,255,255,.4)",fontFamily:"'DM Mono',monospace",marginBottom:8}}>ACTIVE CHAINS</h2>
            <div style={{fontSize:36,fontWeight:900,letterSpacing:"-.03em",color:"white",lineHeight:1}}>목표 탐색</div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{padding:"8px 16px",borderRadius:20,background:cat===c?"#FF4D00":"rgba(255,255,255,.05)",border:cat===c?"none":"1px solid rgba(255,255,255,.08)",color:cat===c?"white":"rgba(255,255,255,.45)",fontSize:12,fontWeight:cat===c?800:600,cursor:"pointer",transition:"all .2s",letterSpacing:".05em",fontFamily:"'DM Mono',monospace"}}>{c}</button>
            ))}
          </div>
        </div>

        {/* Main layout: cards + sidebar */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20}}>
          <div className="card-grid">
            {filtered.map((g,i)=>(
              <div key={g.id} style={{animation:`riseIn .4s ease ${i*.06}s both`}}>
                <Card goal={g} onJoin={handleJoin} onView={setModal} onCheck={handleCheck} onCoach={setCoach}/>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div style={{display:"flex",flexDirection:"column",gap:14,position:"sticky",top:80,alignSelf:"start"}}>

            {/* Live feed */}
            <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:18,padding:16,overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:"#39FF14",boxShadow:"0 0 10px #39FF14",display:"inline-block",animation:"chainPulse 2s infinite",flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:800,letterSpacing:".12em",color:"rgba(255,255,255,.5)",fontFamily:"'DM Mono',monospace"}}>LIVE FEED</span>
              </div>
              {feed.slice(0,5).map((item,i)=>(
                <div key={item.id} style={{padding:"9px 12px",borderRadius:10,background:"rgba(255,255,255,.03)",fontSize:12,color:"rgba(255,255,255,.6)",lineHeight:1.5,marginBottom:7,animation:i===0?"feedIn .35s ease":"none",borderLeft:i===0?"2px solid #FF4D00":"2px solid transparent"}}>
                  <div>{item.text}</div>
                  <div style={{fontSize:10.5,color:"rgba(255,255,255,.25)",marginTop:3,fontFamily:"'DM Mono',monospace"}}>{item.time}</div>
                </div>
              ))}
            </div>

            {/* AI Coach */}
            <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:18,padding:16}}>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:".12em",color:"rgba(255,255,255,.4)",fontFamily:"'DM Mono',monospace",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                AI COACH <span style={{color:"#BF5FFF",background:"rgba(191,95,255,.15)",border:"1px solid rgba(191,95,255,.3)",padding:"2px 7px",borderRadius:10}}>BETA</span>
              </div>
              {myGoals.length===0
                ? <div style={{fontSize:13,color:"rgba(255,255,255,.3)",textAlign:"center",padding:"12px 0"}}>목표에 참여하면<br/>AI 코치가 활성화됩니다</div>
                : myGoals.slice(0,3).map(g=>(
                  <button key={g.id} onClick={()=>setCoach(g)} style={{width:"100%",marginBottom:8,padding:"10px 12px",borderRadius:11,textAlign:"left",background:"rgba(255,255,255,.04)",border:`1px solid ${g.color}25`,color:"rgba(255,255,255,.7)",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .2s"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:g.color,boxShadow:`0 0 6px ${g.glow}`,flexShrink:0}}/>
                    <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.title}</span>
                    <span style={{color:g.color,fontWeight:800,fontFamily:"'DM Mono',monospace",fontSize:11}}>{g.progress}%</span>
                  </button>
                ))
              }
            </div>

            {/* Leaderboard */}
            <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:18,padding:16}}>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:".12em",color:"rgba(255,255,255,.4)",fontFamily:"'DM Mono',monospace",marginBottom:12}}>TOP CHAINS</div>
              {[...goals].sort((a,b)=>b.chains-a.chains).slice(0,4).map((g,i)=>(
                <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"9px 10px",borderRadius:10,background:"rgba(255,255,255,.03)"}}>
                  <span style={{fontSize:14,fontWeight:900,color:["#FFD700","#C0C0C0","#CD7F32","rgba(255,255,255,.3)"][i],minWidth:18,fontFamily:"'DM Mono',monospace"}}>{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.75)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.title}</div>
                    <div style={{height:2,background:"rgba(255,255,255,.07)",borderRadius:1,marginTop:5,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${g.progress}%`,background:g.color,transition:"width 1s ease"}}/>
                    </div>
                  </div>
                  <span style={{fontSize:13,fontWeight:800,color:g.color,fontFamily:"'DM Mono',monospace",flexShrink:0}}>{g.chains}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DETAIL MODAL ── */}
      {modal&&(
        <div onClick={()=>setModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",backdropFilter:"blur(12px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#0A0A0E",border:`1px solid ${modal.color}40`,borderRadius:24,padding:30,maxWidth:440,width:"100%",boxShadow:`0 0 80px ${modal.glow},0 40px 80px rgba(0,0,0,.7)`,animation:"riseIn .35s ease",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${modal.color},transparent)`}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
              <span style={{fontSize:10,fontWeight:800,color:modal.color,background:`${modal.color}18`,border:`1px solid ${modal.color}35`,padding:"3px 11px",borderRadius:20,letterSpacing:".12em",fontFamily:"'DM Mono',monospace"}}>{modal.category}</span>
              <button onClick={()=>setModal(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
            </div>
            <h2 style={{fontSize:22,fontWeight:900,color:"white",marginBottom:8,letterSpacing:"-.02em"}}>{modal.title}</h2>
            <p style={{color:"rgba(255,255,255,.42)",marginBottom:20,lineHeight:1.7,fontSize:13.5}}>{modal.desc}</p>
            <div style={{display:"flex",justifyContent:"center",marginBottom:20}}><Arc progress={modal.progress} color={modal.color} glow={modal.glow} size={110}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:18}}>
              {[["총 체인",modal.chains+"명"],["달성률",modal.progress+"%"],["마감일",modal.deadline],["개설자",modal.avatar+" "+modal.author]].map(([l,v])=>(
                <div key={l} style={{background:"rgba(255,255,255,.04)",borderRadius:12,padding:"10px 14px",border:"1px solid rgba(255,255,255,.05)"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:4,letterSpacing:".08em",fontFamily:"'DM Mono',monospace"}}>{l.toUpperCase()}</div>
                  <div style={{fontWeight:700,color:"white",fontSize:14,fontFamily:"'DM Mono',monospace"}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,.35)",letterSpacing:".1em",fontFamily:"'DM Mono',monospace",marginBottom:10}}>CHAIN MEMBERS ({modal.members.length})</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{modal.members.map((m,i)=><span key={i} style={{fontSize:22}}>{m}</span>)}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {modal.joined&&<button onClick={()=>{setCoach(modal);setModal(null);}} style={{flex:1,padding:"12px 0",borderRadius:12,background:"rgba(191,95,255,.15)",border:"1px solid rgba(191,95,255,.4)",color:"#BF5FFF",fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:".04em"}}>🤖 AI 코치</button>}
              {!modal.joined
                ?<button onClick={()=>{handleJoin(modal.id);setModal(null);}} style={{flex:2,padding:"12px 0",borderRadius:12,background:`linear-gradient(135deg,${modal.color},${modal.color}cc)`,border:"none",color:"white",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:`0 8px 28px ${modal.glow}`,letterSpacing:".06em"}}>⛓ 나도 할래!</button>
                :<button onClick={()=>{handleCheck(modal);setModal(null);}} style={{flex:2,padding:"12px 0",borderRadius:12,background:`linear-gradient(135deg,${modal.color},${modal.color}cc)`,border:"none",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:".04em"}}>달성 체크 ✓</button>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
