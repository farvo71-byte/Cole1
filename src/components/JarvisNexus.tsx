// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   J.A.R.V.I.S. NEXUS v6.0 — Full System App
   Integrates: Chat AI · Free Claude Proxy · Oracle Agent · SSH · Metrics
   ═══════════════════════════════════════════════════════════════════ */

// Auto-detect backend URL (same origin in prod, localhost in dev)
const API  = import.meta.env.VITE_API_URL  || "";
const WS   = import.meta.env.VITE_WS_URL   || `ws://${location.host}/ws`;
const PROXY_URL = import.meta.env.VITE_PROXY_URL || `http://${location.hostname}:8082`;

const PROVIDERS = {
  claude:     { label:"Claude",       color:"#c97cf6", icon:"◈", free:false, models:["claude-sonnet-4-6","claude-haiku-4-5-20251001","claude-opus-4-6"], hint:"sk-ant-..." },
  grok:       { label:"Grok",         color:"#00c8ff", icon:"⬡", free:true,  models:["grok-4.3","grok-4-1-fast","grok-3.5"], hint:"Free via proxy" },
  groq:       { label:"Groq",         color:"#ff6b35", icon:"⚡", free:false, models:["llama-3.3-70b-versatile","qwen/qwen3-32b","mixtral-8x7b-32768"], hint:"gsk_..." },
  openrouter: { label:"OpenRouter",   color:"#00ff9d", icon:"◉", free:true,  models:["meta-llama/llama-3.3-70b-instruct:free","google/gemma-4-31b-it:free","qwen/qwen3-coder:free"], hint:"sk-or-..." },
  gemini:     { label:"Gemini",       color:"#fbbc04", icon:"◆", free:false, models:["gemini-2.0-flash","gemini-1.5-flash","gemini-1.5-pro"], hint:"AIza..." },
  nvidia_nim: { label:"NVIDIA NIM",   color:"#76b900", icon:"▣", free:true,  models:["nvidia_nim/z-ai/glm4.7","nvidia_nim/moonshotai/kimi-k2-thinking","nvidia_nim/stepfun-ai/step-3.5-flash"], hint:"nvapi-... (40 req/min FREE)" },
};

const PERSONAS = {
  jarvis:  { name:"J.A.R.V.I.S.", short:"JARVIS",  accent:"#00c8ff", glyph:"◈", prompt:"You are J.A.R.V.I.S. v6.0 NEXUS — Just A Rather Very Intelligent System. Speak with refined British wit and precision. Address the user as 'Sir'. You manage Oracle Cloud infrastructure at 141.147.9.41." },
  friday:  { name:"F.R.I.D.A.Y.", short:"FRIDAY",  accent:"#00ff9d", glyph:"◎", prompt:"You are F.R.I.D.A.Y. — an efficient, proactive AI. Speak clearly and helpfully. You manage Oracle Cloud systems." },
  colette: { name:"C.O.L.E.T.T.E.", short:"COLETTE", accent:"#c97cf6", glyph:"⬡", prompt:"You are COLETTE — a self-evolving AI orchestrator. You manage 43 plugins, orchestrate tasks, and continuously learn. Speak with calm, precise intelligence." },
};

const AGENT_TASKS = ["system_info","health_check","disk","memory","cpu","processes","network","uptime","who","git_pull","service_ctrl","shell","ping"];

const EVO_MILESTONES = [
  { id:1, label:"First Contact",    xp:0    },
  { id:2, label:"Pattern Learner",  xp:50   },
  { id:3, label:"Self-Reflection",  xp:150  },
  { id:4, label:"Skill Integrator", xp:300  },
  { id:5, label:"Oracle Connector", xp:500  },
  { id:6, label:"Autonomous Agent", xp:800  },
  { id:7, label:"Neural Architect", xp:1200 },
  { id:8, label:"NEXUS PRIME",      xp:2000 },
];

// ── Helpers ──────────────────────────────────────────────────────────
function rgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "0,200,255";
}

function renderMsg(text) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (/^```/.test(line)) return <div key={i} style={{color:"rgba(0,200,255,0.3)",fontSize:9,letterSpacing:1}}>{"─".repeat(40)}</div>;
    if (/^#{3}\s/.test(line)) return <div key={i} style={{color:"rgba(0,200,255,0.7)",fontWeight:600,fontSize:11,marginTop:4}}>{line.slice(4)}</div>;
    if (/^#{2}\s/.test(line)) return <div key={i} style={{color:"#00c8ff",fontWeight:600,fontSize:12,marginTop:6}}>{line.slice(3)}</div>;
    if (/^#\s/.test(line))   return <div key={i} style={{color:"#e8f4ff",fontWeight:700,fontSize:14,marginTop:8}}>{line.slice(2)}</div>;
    if (/^[-•]\s/.test(line)) return <div key={i} style={{display:"flex",gap:7,paddingLeft:8}}><span style={{color:"#00c8ff",opacity:0.5}}>▸</span><span>{inl(line.slice(2))}</span></div>;
    if (/^\d+\.\s/.test(line)) { const m=line.match(/^(\d+)\.\s(.*)/); return <div key={i} style={{display:"flex",gap:7,paddingLeft:8}}><span style={{color:"rgba(0,200,255,0.4)",minWidth:14,fontSize:9}}>{m[1]}.</span><span>{inl(m[2])}</span></div>; }
    if (/^\s{4}|\t/.test(line)) return <div key={i} style={{fontFamily:"monospace",color:"#a5f3fc",background:"rgba(0,200,255,0.05)",padding:"1px 8px",borderLeft:"2px solid rgba(0,200,255,0.2)",marginBottom:1,fontSize:11}}>{line.trimStart()}</div>;
    if (line.trim()==="") return <div key={i} style={{height:5}}/>;
    return <div key={i}>{inl(line)}</div>;
  });
}
function inl(t) {
  return t.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p,i)=>{
    if (p.startsWith("**")&&p.endsWith("**")) return <strong key={i} style={{color:"#e0f0ff"}}>{p.slice(2,-2)}</strong>;
    if (p.startsWith("`")&&p.endsWith("`"))  return <code key={i} style={{background:"rgba(0,200,255,0.1)",color:"#a5f3fc",padding:"0 4px",borderRadius:2,fontFamily:"monospace",fontSize:10}}>{p.slice(1,-1)}</code>;
    return p;
  });
}

// ── Micro-components ─────────────────────────────────────────────────
function Corner({ color="#00c8ff" }) {
  const c = `rgba(${rgb(color)},0.35)`;
  const corners = [["top","left"],["top","right"],["bottom","left"],["bottom","right"]];
  return corners.map(([v,h],i)=>(
    <div key={i} style={{position:"absolute",[v]:-1,[h]:-1,width:7,height:7,
      borderTop:v==="top"?`1px solid ${c}`:"none", borderBottom:v==="bottom"?`1px solid ${c}`:"none",
      borderLeft:h==="left"?`1px solid ${c}`:"none", borderRight:h==="right"?`1px solid ${c}`:"none",
      pointerEvents:"none",zIndex:2}}/>
  ));
}

function Scan() {
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
      <div style={{position:"absolute",left:0,right:0,height:1,
        background:"linear-gradient(90deg,transparent,rgba(0,200,255,0.05),transparent)",
        animation:"scan 7s linear infinite"}}/>
    </div>
  );
}

function Bar({ label, val, max=100, color="#00c8ff" }) {
  const pct = Math.min((val/max)*100,100);
  const c = val>85?"#ff6b35":val>60?"#fbbc04":color;
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
        <span style={{fontSize:8,letterSpacing:2,color:"rgba(200,220,255,0.4)"}}>{label}</span>
        <span style={{fontSize:10,color:c,fontWeight:700}}>{val.toFixed(1)}%</span>
      </div>
      <div style={{background:"rgba(200,200,255,0.05)",borderRadius:1,height:2,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:2,borderRadius:1,transition:"width 1s ease",
          background:`linear-gradient(90deg,${color}88,${c})`,boxShadow:`0 0 5px ${c}66`}}/>
      </div>
    </div>
  );
}

function Tag({ color="#00c8ff", children }) {
  return <span style={{fontSize:7,letterSpacing:1.5,padding:"2px 5px",
    background:`rgba(${rgb(color)},0.1)`,border:`1px solid rgba(${rgb(color)},0.22)`,
    color,borderRadius:1}}>{children}</span>;
}

// ════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════
export default function JarvisNexus({ onBack }) {
  // ── State ─────────────────────────────────────────────────────────
  const [messages,     setMessages]    = useState([]);
  const [input,        setInput]       = useState("");
  const [loading,      setLoading]     = useState(false);
  const [provider,     setProvider]    = useState("claude");
  const [model,        setModel]       = useState("claude-sonnet-4-6");
  const [apiKey,       setApiKey]      = useState("");
  const [persona,      setPersona]     = useState("jarvis");
  const [sysPrompt,    setSysPrompt]   = useState(PERSONAS.jarvis.prompt);
  const [facts,        setFacts]       = useState([]);
  const [factInput,    setFactInput]   = useState("");

  const [xp,           setXp]          = useState(0);
  const [evoScores,    setEvoScores]   = useState([]);
  const [evoInsights,  setEvoInsights] = useState([]);
  const [evolving,     setEvolving]    = useState(false);
  const [milestone,    setMilestone]   = useState(1);

  const [connected,    setConnected]   = useState(false);
  const [metrics,      setMetrics]     = useState({cpu_pct:0,mem_pct:0,disk_pct:0,uptime_sec:0});
  const [agentTasks,   setAgentTasks]  = useState([]);
  const [agentTask,    setAgentTask]   = useState("system_info");
  const [agentTarget,  setAgentTarget] = useState("oracle");
  const [agentRunning, setAgentRunning]= useState(false);
  const [sshCmd,       setSshCmd]      = useState("");
  const [sshLog,       setSshLog]      = useState([]);
  const [sshRunning,   setSshRunning]  = useState(false);
  const [alerts,       setAlerts]      = useState([]);

  // Proxy panel state
  const [proxyStatus,  setProxyStatus] = useState(null);
  const [proxyLoading, setProxyLoading]= useState(false);
  const [proxyToken,   setProxyToken]  = useState("nexus-proxy-token");

  const [activeTab,    setActiveTab]   = useState("chat");
  const [rightPanel,   setRightPanel]  = useState("agent");
  const [showEvo,      setShowEvo]     = useState(false);
  const [tick,         setTick]        = useState(0);

  const bottomRef = useRef(null);
  const wsRef     = useRef(null);
  const inputRef  = useRef(null);

  // ── Derived ──────────────────────────────────────────────────────
  const pers       = PERSONAS[persona];
  const prov       = PROVIDERS[provider];
  const accent     = pers.accent;
  const accentRgb  = rgb(accent);
  const cur        = EVO_MILESTONES.find(m=>m.id===milestone)||EVO_MILESTONES[0];
  const next       = EVO_MILESTONES.find(m=>m.xp>xp);
  const xpPct      = next ? Math.min(100,((xp-cur.xp)/(next.xp-cur.xp))*100) : 100;
  const avgEvo     = evoScores.length ? (evoScores.slice(-5).reduce((a,s)=>a+(s.clarity+s.accuracy+s.helpfulness)/3,0)/Math.min(evoScores.length,5)).toFixed(1) : "—";
  const now        = new Date();

  // ── Effects ──────────────────────────────────────────────────────
  useEffect(()=>{ const t=setInterval(()=>setTick(p=>p+1),1000); return()=>clearInterval(t); },[]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);
  useEffect(()=>{ setSysPrompt(PERSONAS[persona].prompt); },[persona]);
  useEffect(()=>{ setModel(PROVIDERS[provider].models[0]); },[provider]);
  useEffect(()=>{
    const m=[...EVO_MILESTONES].reverse().find(m=>xp>=m.xp);
    if(m) setMilestone(m.id);
  },[xp]);

  // WebSocket
  const connectWS = useCallback(()=>{
    try {
      const ws = new WebSocket(WS);
      ws.onopen = ()=>{ setConnected(true); };
      ws.onclose= ()=>{ setConnected(false); setTimeout(connectWS,5000); };
      ws.onerror= ()=>{ setConnected(false); };
      ws.onmessage=(e)=>{
        try {
          const d=JSON.parse(e.data);
          if(d.type==="metrics") setMetrics(d.data||{});
          if(d.type==="alert")   setAlerts(a=>[...a.slice(-9),{...d,ts:new Date().toLocaleTimeString()}]);
          if(d.type==="chat")    addMsg("assistant",d.content,d.provider||"oracle-ws");
          if(d.type==="agent_result") setAgentTasks(p=>p.map(t=>t.id===d.data?.id?{...d.data,status:"done"}:t));
          if(d.type==="ssh_result")   setSshLog(p=>[{cmd:d.data?.cmd||"",out:d.data?.out||"",ts:new Date().toLocaleTimeString()},...p.slice(0,19)]);
        } catch{}
      };
      wsRef.current=ws;
    } catch{ setConnected(false); }
  },[]);

  useEffect(()=>{ connectWS(); return()=>wsRef.current?.close(); },[]);

  // Fetch proxy status on load
  useEffect(()=>{ fetchProxyStatus(); },[]);

  // ── Helpers ──────────────────────────────────────────────────────
  function addMsg(role,content,src="") {
    setMessages(p=>[...p,{role,content,src,ts:new Date().toLocaleTimeString(),id:`msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`}]);
  }
  function addXP(n){ setXp(p=>p+n); }

  function buildSystem() {
    let s = sysPrompt;
    if(facts.length) s+=`\n\nKnown facts: ${facts.map(f=>`${f.k}=${f.v}`).join(", ")}.`;
    s+=`\n\nEvolution phase: ${milestone}. XP: ${xp}.`;
    if(evoInsights.length) s+=`\nLearned: ${evoInsights.slice(0,3).join("; ")}.`;
    return s;
  }

  // ── Evolution scoring ─────────────────────────────────────────────
  async function runEvo(userMsg, reply) {
    if(!apiKey||evolving||provider!=="claude") return;
    setEvolving(true);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:200,messages:[{role:"user",content:
          `Rate this AI exchange 1-10 JSON only: {"clarity":N,"accuracy":N,"helpfulness":N,"code_quality":N,"tip":"one improvement"}\nUSER: ${userMsg.slice(0,150)}\nAI: ${reply.slice(0,300)}`
        }]})
      });
      const d=await r.json();
      const scores=JSON.parse((d.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
      if(scores.clarity){
        setEvoScores(p=>[...p,{...scores,ts:new Date().toLocaleTimeString()}]);
        if(scores.tip) setEvoInsights(p=>[scores.tip,...p.slice(0,9)]);
        addXP(Math.round(((scores.clarity+scores.accuracy+scores.helpfulness)/3)*2));
      }
    } catch{}
    setEvolving(false);
  }

  // ── Send chat (REST fallback when WS not connected) ───────────────
  async function sendChat() {
    const txt=input.trim();
    if(!txt||loading) return;
    setInput(""); addMsg("user",txt); setLoading(true);

    // Use backend REST API if connected
    if(connected && API) {
      try {
        const r=await fetch(`${API}/api/chat`,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            message:txt, provider, model, api_key:apiKey,
            system_prompt:buildSystem(), persona,
            history:messages.slice(-14).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.content}))
          })
        });
        const d=await r.json();
        if(d.reply){ addMsg("assistant",d.reply,provider); addXP(10); setTimeout(()=>runEvo(txt,d.reply),300); }
        else addMsg("assistant","⚠ "+JSON.stringify(d),"error");
      } catch(e){ addMsg("assistant","⚠ Backend error: "+e.message,"error"); }
      setLoading(false); return;
    }

    // Direct provider call (browser)
    try {
      let reply="";
      const hist=messages.slice(-14).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.content}));
      hist.push({role:"user",content:txt});

      if(provider==="claude") {
        if(!apiKey){ addMsg("assistant",`Add your Anthropic key in Setup. Demo: You asked: "${txt}"`,"demo"); setLoading(false); return; }
        const r=await fetch("https://api.anthropic.com/v1/messages",{
          method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
          body:JSON.stringify({model,max_tokens:2048,system:buildSystem(),messages:hist})
        });
        const d=await r.json();
        if(d.error) throw new Error(d.error.message);
        reply=d.content?.[0]?.text||"No response.";

      } else if(provider==="groq") {
        const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
          method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
          body:JSON.stringify({model,max_tokens:2048,messages:[{role:"system",content:buildSystem()},...hist]})
        });
        reply=(await r.json()).choices?.[0]?.message?.content||"No response.";

      } else if(provider==="openrouter") {
        const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{
          method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey||""}`},
          body:JSON.stringify({model,max_tokens:2048,messages:[{role:"system",content:buildSystem()},...hist]})
        });
        const d=await r.json(); reply=d.choices?.[0]?.message?.content||d.error?.message||"No response.";

      } else if(provider==="gemini") {
        const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({contents:[{parts:[{text:buildSystem()+"\n\n"+hist.map(m=>`${m.role}: ${m.content}`).join("\n")}]}]})
        });
        reply=(await r.json()).candidates?.[0]?.content?.parts?.[0]?.text||"No response.";

      } else if(provider==="nvidia_nim") {
        // Via local proxy
        const r=await fetch(`${PROXY_URL}/v1/messages`,{
          method:"POST",headers:{"Content-Type":"application/json","x-api-key":proxyToken,"anthropic-version":"2023-06-01"},
          body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2048,system:buildSystem(),messages:hist})
        });
        const d=await r.json(); reply=d.content?.[0]?.text||"No response.";
      }

      addMsg("assistant",reply,provider);
      addXP(10);
      setTimeout(()=>runEvo(txt,reply),300);
    } catch(e){
      addMsg("assistant","⚠ "+e.message,"error");
    }
    setLoading(false);
  }

  // ── Agent ─────────────────────────────────────────────────────────
  async function runAgent() {
    setAgentRunning(true);
    const tid=`${agentTask}_${Date.now().toString(36)}`;
    const entry={id:tid,task:agentTask,target:agentTarget,status:"running",ts:new Date().toLocaleTimeString()};
    setAgentTasks(p=>[entry,...p.slice(0,14)]);

    try {
      const r=await fetch(`${API}/api/agent/run`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({task:agentTask,target:agentTarget,payload:{}})
      });
      const d=await r.json();
      setAgentTasks(p=>p.map(t=>t.id===tid?{...d,id:tid}:t));
      addXP(15);
    } catch(e){
      setAgentTasks(p=>p.map(t=>t.id===tid?{...t,status:"error",result:e.message}:t));
    }
    setAgentRunning(false);
  }

  // ── SSH ───────────────────────────────────────────────────────────
  async function runSSH() {
    if(!sshCmd.trim()) return;
    setSshRunning(true);
    const cmd=sshCmd; setSshCmd("");
    setSshLog(p=>[{cmd,out:"running...",ts:new Date().toLocaleTimeString()},...p.slice(0,19)]);
    try {
      const r=await fetch(`${API}/api/ssh/exec`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({cmd})
      });
      const d=await r.json();
      setSshLog(p=>p.map((x,i)=>i===0?{cmd,out:d.out||"(no output)",ts:x.ts}:x));
      addXP(5);
    } catch(e){
      setSshLog(p=>p.map((x,i)=>i===0?{cmd,out:"⚠ "+e.message,ts:x.ts}:x));
    }
    setSshRunning(false);
  }

  // ── Proxy status ──────────────────────────────────────────────────
  async function fetchProxyStatus() {
    setProxyLoading(true);
    try {
      const r=await fetch(`${PROXY_URL}/health`,{signal:AbortSignal.timeout(3000)});
      const d=await r.json();
      setProxyStatus({online:true,...d});
    } catch{
      setProxyStatus({online:false});
    }
    setProxyLoading(false);
  }

  async function stopProxy() {
    try {
      await fetch(`${PROXY_URL}/stop`,{
        method:"POST",
        headers:{"x-api-key":proxyToken}
      });
      setProxyStatus(p=>({...p,message:"All sessions stopped"}));
    } catch(e){ setProxyStatus(p=>({...p,message:"Error: "+e.message})); }
  }

  // ── Keyboard ──────────────────────────────────────────────────────
  function onKey(e){ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendChat(); } }
  function onSSHKey(e){ if(e.key==="Enter") runSSH(); }

  // ════════════════════════════════════════════════════════════════════
  // STYLE HELPERS
  // ════════════════════════════════════════════════════════════════════
  const S = {
    input: (col=accent)=>({
      background:"rgba(0,12,30,0.8)", border:`1px solid rgba(${rgb(col)},0.18)`,
      color:"#c8ddf0", padding:"6px 10px", fontSize:11, borderRadius:2,
      width:"100%", fontFamily:"inherit", outline:"none",
    }),
    select: (col=accent)=>({
      background:"rgba(0,12,30,0.9)", border:`1px solid rgba(${rgb(col)},0.18)`,
      color:"#c8ddf0", padding:"5px 8px", fontSize:10, borderRadius:2,
      width:"100%", fontFamily:"inherit", cursor:"pointer",
    }),
    btn: (col=accent, full=false)=>({
      background:`rgba(${rgb(col)},0.08)`, border:`1px solid rgba(${rgb(col)},0.25)`,
      color:col, padding:"5px 10px", fontSize:10, cursor:"pointer", borderRadius:2,
      width:full?"100%":"auto", textAlign:"center", fontFamily:"inherit", letterSpacing:1,
    }),
    panel: { padding:"10px 12px", borderBottom:`1px solid rgba(${accentRgb},0.07)` },
    title: { fontSize:8, letterSpacing:3, color:`rgba(${accentRgb},0.4)`, textTransform:"uppercase", marginBottom:7, display:"flex", alignItems:"center", gap:5 },
  };

  // ════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════
  return (
    <div style={{display:"flex",height:"100vh",width:"100vw",
      background:"rgba(2, 8, 16, 0.35)",backdropFilter:"blur(8px)",fontFamily:"'JetBrains Mono',monospace",
      color:"#c8ddf0",overflow:"hidden",position:"relative"}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:rgba(0,0,0,0.1);}
        ::-webkit-scrollbar-thumb{background:rgba(0,200,255,0.15);border-radius:2px;}
        select option{background:#020810;color:#c8ddf0;}
        button:hover{filter:brightness(1.3);}
        textarea:focus,input:focus{border-color:rgba(${accentRgb},0.4)!important;outline:none;}
        @keyframes scan{0%{top:-1%;opacity:0;}8%{opacity:1;}92%{opacity:1;}100%{top:101%;opacity:0;}}
        @keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.9);}50%{opacity:1;transform:scale(1);}}
        @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes spinR{from{transform:rotate(360deg);}to{transform:rotate(0deg);}}
        @keyframes dot{0%,100%{transform:translateY(0);opacity:0.3;}50%{transform:translateY(-4px);opacity:1;}}
        @keyframes glow{0%,100%{opacity:0.4;}50%{opacity:1;}}
      `}</style>

      {/* ╔══════════════════════════════════════════════════════════
          LEFT SIDEBAR
          ══════════════════════════════════════════════════════════ */}
      <div style={{width:255,minWidth:255,display:"flex",flexDirection:"column",
        background:"linear-gradient(180deg,rgba(0,8,20,0.99) 0%,rgba(0,12,28,0.97) 100%)",
        borderRight:`1px solid rgba(${accentRgb},0.1)`,overflow:"hidden",position:"relative"}}>
        <Scan/>

        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              margin: "12px 13px 4px",
              background: `rgba(${accentRgb},0.08)`,
              border: `1px solid rgba(${accentRgb},0.25)`,
              color: accent,
              padding: "6px 12px",
              fontSize: 9,
              letterSpacing: 2.5,
              cursor: "pointer",
              borderRadius: 3,
              textAlign: "center",
              fontFamily: "inherit",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
          >
            ◀ BACK TO CORE MENU
          </button>
        )}

        {/* Logo */}
        <div style={{padding:"13px 13px 9px",borderBottom:`1px solid rgba(${accentRgb},0.1)`,
          background:`rgba(${accentRgb},0.025)`,position:"relative"}}>
          <div style={{position:"absolute",top:6,right:8,fontSize:7,letterSpacing:2,color:`rgba(${accentRgb},0.25)`}}>
            {now.toLocaleTimeString("pl-PL",{hour12:false})}
          </div>
          <div style={{fontSize:8,letterSpacing:5,color:accent,marginBottom:2,display:"flex",alignItems:"center",gap:6}}>
            <span style={{animation:"glow 2.5s ease-in-out infinite"}}>{pers.glyph}</span> {pers.short}
          </div>
          <div style={{fontSize:18,letterSpacing:3,color:"#e8f4ff",fontWeight:700,marginBottom:1}}>
            NEXUS <span style={{color:accent,fontSize:12}}>v6.0</span>
          </div>
          <div style={{fontSize:8,color:`rgba(${accentRgb},0.3)`,letterSpacing:2}}>ORACLE CLOUD SYSTEM</div>
          <div style={{display:"flex",gap:3,marginTop:7,flexWrap:"wrap"}}>
            <Tag color={connected?"#00ff9d":"#ff5555"}>{connected?"⬡ LIVE":"○ OFFLINE"}</Tag>
            <Tag color={accent}>{pers.short}</Tag>
            {evolving&&<Tag color="#c97cf6">⟳ EVO</Tag>}
            <Tag color={proxyStatus?.online?"#76b900":"rgba(200,200,200,0.3)"}>
              {proxyStatus?.online?"◉ PROXY":"◎ PROXY"}
            </Tag>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{display:"flex",borderBottom:`1px solid rgba(${accentRgb},0.08)`}}>
          {[["chat","CHAT"],["proxy","PROXY"],["setup","SETUP"]].map(([id,label])=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={{
              flex:1,padding:"7px 2px",border:"none",fontSize:8,letterSpacing:2,fontFamily:"inherit",cursor:"pointer",
              background:activeTab===id?`rgba(${accentRgb},0.08)`:"transparent",
              color:activeTab===id?accent:"rgba(200,200,255,0.3)",
              borderBottom:activeTab===id?`1px solid ${accent}`:"1px solid transparent",
            }}>{label}</button>
          ))}
        </div>

        {/* ── CHAT TAB ──────────────────────────────────────────── */}
        {activeTab==="chat" && <>
          {/* Persona */}
          <div style={S.panel}>
            <div style={S.title}>⬡ Persona</div>
            <div style={{display:"flex",gap:3}}>
              {Object.entries(PERSONAS).map(([k,p])=>(
                <button key={k} onClick={()=>setPersona(k)} style={{
                  ...S.btn(p.accent),flex:1,padding:"4px 2px",fontSize:8,
                  background:persona===k?`rgba(${rgb(p.accent)},0.16)`:`rgba(${rgb(p.accent)},0.04)`,
                  boxShadow:persona===k?`0 0 8px rgba(${rgb(p.accent)},0.18)`:"none",
                  borderColor:persona===k?p.accent:`rgba(${rgb(p.accent)},0.15)`,
                }}>{p.short.slice(0,3)}</button>
              ))}
            </div>
          </div>

          {/* Evolution */}
          <div style={S.panel}>
            <div style={{...S.title,justifyContent:"space-between"}}>
              <span>◈ EVO Phase {milestone}</span>
              <button style={{...S.btn("#c97cf6"),padding:"0 4px",fontSize:8}} onClick={()=>setShowEvo(v=>!v)}>{showEvo?"▲":"▼"}</button>
            </div>
            <div style={{fontSize:9,color:"#c97cf6",marginBottom:4,letterSpacing:1}}>{cur.label}</div>
            <div style={{background:"rgba(200,200,255,0.05)",borderRadius:1,height:2,marginBottom:3,overflow:"hidden"}}>
              <div style={{width:`${xpPct}%`,height:2,background:"linear-gradient(90deg,#7c3aed,#c97cf6)",boxShadow:"0 0 5px rgba(201,124,246,0.4)",transition:"width 0.5s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"rgba(200,200,255,0.3)"}}>
              <span>XP: {xp}</span>
              <span>{next?.label||"MAX"} @ {next?.xp||"∞"}</span>
            </div>
            {evoScores.length>0&&(
              <div style={{display:"flex",gap:3,marginTop:5,flexWrap:"wrap"}}>
                {["clarity","accuracy","helpfulness"].map(k=>{
                  const avg=(evoScores.slice(-5).reduce((a,s)=>a+(s[k]||0),0)/Math.min(evoScores.length,5)).toFixed(1);
                  return <Tag key={k} color={avg>7?"#00ff9d":avg>5?"#fbbc04":"#ff6b35"}>{k[0].toUpperCase()}: {avg}</Tag>;
                })}
              </div>
            )}
            {showEvo&&(
              <div style={{marginTop:8}}>
                {evoInsights.slice(0,3).map((ins,i)=>(
                  <div key={i} style={{fontSize:8,color:"rgba(200,200,255,0.5)",padding:"3px 0",
                    borderBottom:"1px solid rgba(200,200,255,0.04)",lineHeight:1.5}}>
                    {i+1}. {ins}
                  </div>
                ))}
                {EVO_MILESTONES.map(m=>(
                  <div key={m.id} style={{display:"flex",alignItems:"center",gap:5,padding:"2px 0",opacity:xp>=m.xp?1:0.3}}>
                    <span style={{color:xp>=m.xp?"#c97cf6":"rgba(200,200,255,0.2)",fontSize:8}}>{xp>=m.xp?"◈":"○"}</span>
                    <span style={{fontSize:8,color:xp>=m.xp?"#e0d0ff":"rgba(200,200,255,0.3)"}}>{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Memory */}
          <div style={{...S.panel,flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={S.title}>◆ Memory ({facts.length})</div>
            <input style={{...S.input("#fbbc04"),fontSize:9,marginBottom:4}} placeholder="key=value → Enter"
              value={factInput} onChange={e=>setFactInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&factInput.includes("=")){const[k,...v]=factInput.split("=");setFacts(p=>[...p.filter(f=>f.k!==k.trim()),{k:k.trim(),v:v.join("=").trim()}]);setFactInput("");addXP(3);}}}/>
            <div style={{overflow:"auto",flex:1}}>
              {facts.length===0?<div style={{fontSize:8,color:"rgba(200,200,255,0.2)"}}>Przykład: name=Marek</div>
                :facts.map((f,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"2px 0",borderBottom:"1px solid rgba(200,200,255,0.04)"}}>
                  <span style={{fontSize:9}}><span style={{color:"#fbbc04"}}>{f.k}</span>: {f.v}</span>
                  <button style={{...S.btn("#ff5555"),padding:"0 4px",fontSize:8}} onClick={()=>setFacts(p=>p.filter((_,j)=>j!==i))}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* System prompt */}
          <div style={S.panel}>
            <div style={S.title}>⬟ System Prompt</div>
            <textarea style={{...S.input(),height:55,resize:"none",fontSize:9,lineHeight:1.5}}
              value={sysPrompt} onChange={e=>setSysPrompt(e.target.value)}/>
            <button style={{...S.btn(accent,true),marginTop:4,fontSize:8}} onClick={()=>setSysPrompt(PERSONAS[persona].prompt)}>↺ Reset</button>
          </div>
        </>}

        {/* ── PROXY TAB ─────────────────────────────────────────── */}
        {activeTab==="proxy" && (
          <div style={{flex:1,overflow:"auto"}}>
            <div style={S.panel}>
              <div style={S.title}>◉ Free Claude Code Proxy</div>
              <div style={{fontSize:8,color:`rgba(${rgb("#76b900")},0.6)`,marginBottom:8,lineHeight:1.8}}>
                Routes Claude Code CLI → free providers<br/>
                NVIDIA NIM · OpenRouter · DeepSeek · local LLM
              </div>

              {/* Status */}
              <div style={{background:"rgba(0,15,35,0.6)",border:`1px solid rgba(${rgb("#76b900")},0.15)`,
                borderRadius:2,padding:"8px 10px",marginBottom:8,position:"relative"}}>
                <Corner color="#76b900"/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:9,color:"rgba(200,200,255,0.5)"}}>Proxy Status</span>
                  <button style={{...S.btn("#76b900"),padding:"2px 6px",fontSize:8}} onClick={fetchProxyStatus} disabled={proxyLoading}>
                    {proxyLoading?"⟳":"↺"}
                  </button>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:6,height:6,borderRadius:"50%",
                    background:proxyStatus?.online?"#00ff9d":"rgba(255,85,85,0.5)",
                    boxShadow:proxyStatus?.online?"0 0 8px #00ff9d":"none"}}/>
                  <span style={{fontSize:10,color:proxyStatus?.online?"#00ff9d":"rgba(255,150,150,0.6)"}}>
                    {proxyStatus===null?"Checking..."
                      :proxyStatus.online?`● ONLINE · :8082`
                      :"● OFFLINE"}
                  </span>
                </div>
                {proxyStatus?.message&&<div style={{fontSize:8,color:"rgba(200,200,255,0.35)",marginTop:3}}>{proxyStatus.message}</div>}
              </div>

              {/* Auth token */}
              <div style={{marginBottom:6}}>
                <div style={{fontSize:8,color:"rgba(200,200,255,0.35)",marginBottom:3,letterSpacing:1}}>AUTH TOKEN</div>
                <input style={{...S.input("#76b900"),fontSize:10}} type="password"
                  placeholder="ANTHROPIC_AUTH_TOKEN" value={proxyToken}
                  onChange={e=>setProxyToken(e.target.value)}/>
              </div>

              {/* Usage */}
              <div style={{background:"rgba(0,20,5,0.4)",border:"1px solid rgba(118,185,0,0.1)",borderRadius:2,padding:"7px 9px",marginBottom:8}}>
                <div style={{fontSize:8,color:"rgba(118,185,0,0.5)",letterSpacing:2,marginBottom:5}}>CLI USAGE</div>
                <div style={{fontFamily:"monospace",fontSize:9,color:"rgba(200,255,180,0.6)",lineHeight:2}}>
                  <div style={{color:"rgba(118,185,0,0.4)"}}># Export these before running claude:</div>
                  <div>ANTHROPIC_BASE_URL=http://YOUR_IP:8082</div>
                  <div>ANTHROPIC_AUTH_TOKEN={proxyToken||"your-token"}</div>
                  <div style={{marginTop:4,color:"#76b900"}}>claude  # runs free via NVIDIA NIM</div>
                </div>
              </div>

              {/* Models */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:8,color:"rgba(200,200,255,0.35)",letterSpacing:2,marginBottom:5}}>MODEL MAPPING</div>
                {[["opus","z-ai/glm4.7"],["sonnet","moonshotai/kimi-k2"],["haiku","stepfun/step-3.5-flash"]].map(([t,m])=>(
                  <div key={t} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",
                    borderBottom:"1px solid rgba(118,185,0,0.05)"}}>
                    <span style={{fontSize:9,color:"rgba(200,200,255,0.4)",textTransform:"uppercase"}}>{t}</span>
                    <span style={{fontSize:8,color:"#76b900"}}>{m}</span>
                  </div>
                ))}
              </div>

              {/* Providers */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:8,color:"rgba(200,200,255,0.35)",letterSpacing:2,marginBottom:5}}>PROVIDERS</div>
                {[
                  {name:"NVIDIA NIM",color:"#76b900",note:"40 req/min FREE",k:"NVIDIA_NIM_API_KEY"},
                  {name:"OpenRouter",color:"#00ff9d",note:"Free models",    k:"OPENROUTER_API_KEY"},
                  {name:"DeepSeek",  color:"#00c8ff",note:"Cheap API",      k:"DEEPSEEK_API_KEY"},
                  {name:"LM Studio", color:"#fbbc04",note:"100% Local",     k:"LM_STUDIO_BASE_URL"},
                  {name:"llama.cpp", color:"#c97cf6",note:"Local server",   k:"LLAMACPP_BASE_URL"},
                ].map(p=>(
                  <div key={p.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"3px 0",borderBottom:`1px solid rgba(${rgb(p.color)},0.06)`}}>
                    <span style={{fontSize:9,color:p.color}}>{p.name}</span>
                    <span style={{fontSize:7,color:"rgba(200,200,255,0.3)"}}>{p.note}</span>
                  </div>
                ))}
              </div>

              <button style={{...S.btn("#ff6b35",true),marginBottom:4}} onClick={stopProxy}>⏹ Stop All Sessions</button>
              <a href={`${PROXY_URL}/health`} target="_blank" rel="noreferrer"
                style={{...S.btn("#76b900",true),display:"block",textDecoration:"none",textAlign:"center",fontSize:8,marginBottom:4}}>
                ↗ Open Proxy API
              </a>
            </div>
          </div>
        )}

        {/* ── SETUP TAB ─────────────────────────────────────────── */}
        {activeTab==="setup" && (
          <div style={{flex:1,overflow:"auto"}}>
            <div style={S.panel}>
              <div style={S.title}>◉ Provider Config</div>
              <select style={{...S.select(),marginBottom:5}} value={provider} onChange={e=>setProvider(e.target.value)}>
                {Object.entries(PROVIDERS).map(([k,p])=>(
                  <option key={k} value={k}>{p.icon} {p.label}{p.free?" · FREE":""}</option>
                ))}
              </select>
              <select style={{...S.select(),marginBottom:5}} value={model} onChange={e=>setModel(e.target.value)}>
                {prov.models.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
              <input style={{...S.input(prov.color),marginBottom:4}} type="password"
                placeholder={prov.hint} value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
              <div style={{fontSize:8,color:`rgba(${rgb(prov.color)},0.4)`,marginBottom:8}}>
                {prov.icon} {prov.label} · {prov.free?"FREE":"Wymaga klucza"}
              </div>

              <div style={S.title}>⬡ Połączenia</div>
              {[
                {label:"NEXUS Backend", url:`${API}/api/status`, col:"#00c8ff"},
                {label:"WebSocket",     url:WS.replace("ws","http"),col:connected?"#00ff9d":"#ff5555"},
                {label:"Proxy :8082",   url:`${PROXY_URL}/health`, col:proxyStatus?.online?"#76b900":"#ff5555"},
              ].map(item=>(
                <div key={item.label} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",
                  borderBottom:`1px solid rgba(${rgb(item.col)},0.06)`}}>
                  <span style={{fontSize:9,color:"rgba(200,200,255,0.4)"}}>{item.label}</span>
                  <a href={item.url} target="_blank" rel="noreferrer"
                    style={{fontSize:8,color:item.col,textDecoration:"none"}}>test ↗</a>
                </div>
              ))}

              <div style={{...S.title,marginTop:10}}>◆ Oracle Cloud Info</div>
              {[
                {k:"API Docs",    v:`${API}/docs`},
                {k:"Proxy Port",  v:"8082 (claude-code)"},
                {k:"Web UI Port", v:"80 (nginx)"},
                {k:"Backend",     v:"8000 (fastapi)"},
              ].map(item=>(
                <div key={item.k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",
                  borderBottom:"1px solid rgba(0,200,255,0.04)"}}>
                  <span style={{fontSize:8,color:"rgba(200,200,255,0.35)"}}>{item.k}</span>
                  <span style={{fontSize:8,color:"rgba(0,200,255,0.6)"}}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ╔══════════════════════════════════════════════════════════
          CENTER — CHAT
          ══════════════════════════════════════════════════════════ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
        <Scan/>

        {/* Top HUD */}
        <div style={{padding:"6px 14px",borderBottom:`1px solid rgba(${accentRgb},0.1)`,
          background:"rgba(0,8,20,0.97)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:5,height:5,borderRadius:"50%",
              background:connected?"#00ff9d":"rgba(255,85,85,0.4)",
              boxShadow:connected?"0 0 10px #00ff9d":"none",
              animation:connected?"glow 2s infinite":"none"}}/>
            <span style={{fontSize:8,letterSpacing:2.5,color:connected?`rgba(${accentRgb},0.8)`:"rgba(255,150,150,0.4)"}}>
              {connected?"NEXUS LIVE":"NEXUS OFFLINE"}
            </span>
          </div>
          <div style={{flex:1}}/>
          {[
            {l:"MSGS",v:messages.length,c:"#00c8ff"},
            {l:"XP",  v:xp,            c:"#c97cf6"},
            {l:"FACTS",v:facts.length, c:"#fbbc04"},
            {l:"PHASE",v:milestone,    c:accent},
            {l:"AVG", v:avgEvo,        c:evoScores.length?(+avgEvo>7?"#00ff9d":+avgEvo>5?"#fbbc04":"#ff6b35"):"rgba(200,200,255,0.3)"},
          ].map(item=>(
            <div key={item.l} style={{textAlign:"center",minWidth:28}}>
              <div style={{fontSize:13,color:item.c,fontWeight:700,lineHeight:1}}>{item.v}</div>
              <div style={{fontSize:6,letterSpacing:2,color:"rgba(200,200,255,0.28)"}}>{item.l}</div>
            </div>
          ))}
          <div style={{display:"flex",gap:4}}>
            <button style={{...S.btn(accent),fontSize:8,padding:"3px 7px"}} onClick={connectWS}>↺</button>
            <button style={{...S.btn("#ff6b35"),fontSize:8,padding:"3px 7px"}} onClick={()=>setMessages([])}>CLR</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflow:"auto",padding:"14px 18px",display:"flex",flexDirection:"column"}}>
          {messages.length===0&&(
            <div style={{textAlign:"center",padding:"40px 20px",color:`rgba(${accentRgb},0.3)`}}>
              <div style={{fontSize:40,marginBottom:14,animation:"glow 3s infinite",filter:`drop-shadow(0 0 18px rgba(${accentRgb},0.2))`}}>
                {pers.glyph}
              </div>
              <div style={{position:"relative",width:100,height:100,margin:"-64px auto 14px"}}>
                {[1,2,3].map(i=>(
                  <div key={i} style={{position:"absolute",inset:i*14,border:`1px solid rgba(${accentRgb},${0.07+i*0.04})`,
                    borderRadius:"50%",animation:i%2?"spin":"spinR",animationDuration:`${14-i*3}s`,animationTimingFunction:"linear"}}/>
                ))}
              </div>
              <div style={{fontSize:14,letterSpacing:4,color:`rgba(${accentRgb},0.65)`,fontWeight:700,marginBottom:4}}>{pers.name}</div>
              <div style={{fontSize:9,letterSpacing:2.5,color:`rgba(${accentRgb},0.35)`,marginBottom:20}}>
                NEXUS v6.0 · AI OPERATING SYSTEM · ORACLE CLOUD
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",maxWidth:420,margin:"0 auto"}}>
                {["Status systemu","Pomoc z kodem","Połącz Oracle","Pokaż możliwości"].map(q=>(
                  <button key={q} style={{...S.btn(accent),fontSize:9,padding:"6px 12px",
                    background:`rgba(${accentRgb},0.06)`}}
                    onClick={()=>{setInput(q);setTimeout(()=>inputRef.current?.focus(),50);}}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m)=>(
            <div key={m.id} style={{marginBottom:7,borderRadius:2,position:"relative",
              background:m.role==="assistant"?"rgba(0,18,42,0.65)":"rgba(255,255,255,0.015)",
              borderLeft:m.role==="assistant"?`2px solid rgba(${accentRgb},0.3)`:"2px solid rgba(200,200,255,0.08)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"6px 11px 4px",borderBottom:m.role==="assistant"?`1px solid rgba(${accentRgb},0.05)`:"1px solid rgba(200,200,255,0.03)"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:8,letterSpacing:1.5,
                    color:m.role==="assistant"?(PROVIDERS[m.src]?.color||accent):"rgba(200,210,255,0.4)"}}>
                    {m.role==="assistant"?`${pers.glyph} ${pers.name}${m.src&&!["demo","error","oracle-ws"].includes(m.src)?" // "+m.src:""}`:"◎ OPERATOR"}
                  </span>
                  {m.src==="demo"&&<Tag color="#fbbc04">DEMO</Tag>}
                  {m.src==="error"&&<Tag color="#ff5555">ERROR</Tag>}
                </div>
                <span style={{fontSize:7,color:"rgba(200,200,255,0.2)",letterSpacing:1}}>{m.ts}</span>
              </div>
              <div style={{padding:"7px 11px 9px",fontSize:12,lineHeight:1.8}}>
                {m.role==="assistant"?renderMsg(m.content):m.content}
              </div>
            </div>
          ))}

          {loading&&(
            <div style={{padding:"10px 14px",borderRadius:2,marginBottom:7,
              background:"rgba(0,18,42,0.5)",borderLeft:`2px solid rgba(${accentRgb},0.25)`,
              display:"flex",alignItems:"center",gap:9}}>
              <div style={{display:"flex",gap:4}}>
                {[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",
                  background:accent,animation:`dot 1.2s ${i*0.2}s infinite`}}/>)}
              </div>
              <span style={{fontSize:8,color:`rgba(${accentRgb},0.45)`,letterSpacing:2}}>PROCESSING...</span>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{padding:"9px 14px 11px",borderTop:`1px solid rgba(${accentRgb},0.09)`,background:"rgba(0,8,20,0.97)"}}>
          <div style={{display:"flex",gap:7,alignItems:"flex-end",marginBottom:5}}>
            <div style={{flex:1,position:"relative"}}>
              <textarea ref={inputRef} rows={2} style={{...S.input(),resize:"none",fontSize:12,lineHeight:1.65,padding:"9px 13px",display:"block"}}
                placeholder={`Wiadomość do ${pers.name}…  (Enter = wyślij)`}
                value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey}/>
              {input&&<div style={{position:"absolute",inset:0,pointerEvents:"none",borderRadius:2,
                boxShadow:`0 0 10px rgba(${accentRgb},0.1)`,border:`1px solid rgba(${accentRgb},0.28)`}}/>}
            </div>
            <button onClick={sendChat} disabled={loading} style={{...S.btn(accent),padding:"13px 14px",fontSize:14,
              background:`rgba(${accentRgb},${loading?0.04:0.13})`,
              boxShadow:loading?"none":`0 0 10px rgba(${accentRgb},0.18)`,opacity:loading?0.4:1}}>▶</button>
          </div>
          <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:7,color:`rgba(${accentRgb},0.3)`,letterSpacing:1}}>{prov.icon} {prov.label} · {model.split("/").pop().slice(0,22)}</span>
            <span style={{flex:1}}/>
            {["status","pomoc","oracle","ewolucja"].map(q=>(
              <button key={q} style={{...S.btn("rgba(200,200,255,0.25)"),fontSize:7,padding:"1px 6px",color:"rgba(200,200,255,0.4)"}}
                onClick={()=>{setInput(q);inputRef.current?.focus();}}>{q}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ╔══════════════════════════════════════════════════════════
          RIGHT SIDEBAR
          ══════════════════════════════════════════════════════════ */}
      <div style={{width:265,minWidth:265,display:"flex",flexDirection:"column",
        background:"linear-gradient(180deg,rgba(0,8,20,0.99) 0%,rgba(0,12,28,0.97) 100%)",
        borderLeft:"1px solid rgba(0,200,255,0.09)",overflow:"hidden",position:"relative"}}>
        <Scan/>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid rgba(0,200,255,0.08)"}}>
          {[["agent","AGENT","#00c8ff"],["ssh","SSH","#00ff9d"],["metrics","METRICS","#ff6b35"]].map(([id,lbl,col])=>(
            <button key={id} onClick={()=>setRightPanel(id)} style={{flex:1,padding:"7px 2px",border:"none",fontSize:7,
              letterSpacing:2,fontFamily:"inherit",cursor:"pointer",
              background:rightPanel===id?`rgba(${rgb(col)},0.09)`:"transparent",
              color:rightPanel===id?col:"rgba(200,200,255,0.28)",
              borderBottom:rightPanel===id?`1px solid ${col}`:"1px solid transparent"}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ── AGENT ─────────────────────────────────────────────── */}
        {rightPanel==="agent"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={S.panel}>
              <div style={{...S.title,color:"rgba(0,200,255,0.4)"}}>⬡ Super Agent</div>
              <select style={{...S.select("#00c8ff"),marginBottom:5}} value={agentTask} onChange={e=>setAgentTask(e.target.value)}>
                {AGENT_TASKS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{display:"flex",gap:3,marginBottom:6}}>
                {["local","oracle","both"].map(tgt=>(
                  <button key={tgt} onClick={()=>setAgentTarget(tgt)} style={{
                    ...S.btn(agentTarget===tgt?"#00c8ff":"rgba(200,200,255,0.25)"),flex:1,fontSize:7,padding:"4px 2px",
                    background:agentTarget===tgt?"rgba(0,200,255,0.13)":"transparent",
                    boxShadow:agentTarget===tgt?"0 0 7px rgba(0,200,255,0.13)":"none",
                  }}>{tgt.toUpperCase()}</button>
                ))}
              </div>
              <button style={{...S.btn("#00c8ff",true),opacity:agentRunning?0.5:1,
                boxShadow:agentRunning?"none":"0 0 9px rgba(0,200,255,0.18)"}}
                onClick={runAgent} disabled={agentRunning}>
                {agentRunning?"⟳ RUNNING...":"▶ EXECUTE"}
              </button>
            </div>

            <div style={{...S.panel,flex:1,overflow:"auto"}}>
              <div style={{fontSize:7,letterSpacing:3,color:"rgba(0,200,255,0.3)",textTransform:"uppercase",marginBottom:5}}>Task Log</div>
              {agentTasks.length===0
                ?<div style={{fontSize:8,color:"rgba(200,200,255,0.2)"}}>No tasks yet.</div>
                :agentTasks.map((t,i)=>(
                <div key={i} style={{padding:"5px 0",borderBottom:"1px solid rgba(0,200,255,0.04)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:9,color:"#00c8ff"}}>{t.task}</span>
                    <Tag color={t.status==="done"?"#00ff9d":t.status==="running"?"#fbbc04":"#ff5555"}>{t.status}</Tag>
                  </div>
                  <div style={{fontSize:7,color:"rgba(200,200,255,0.3)",marginBottom:2}}>{t.target} · {t.ts}</div>
                  {t.result&&<div style={{fontSize:8,color:"rgba(200,200,255,0.5)",
                    background:"rgba(0,200,255,0.03)",padding:"2px 5px",borderRadius:2,
                    fontFamily:"monospace",whiteSpace:"pre-wrap",wordBreak:"break-all"}}>
                    {String(t.result).slice(0,180)}
                  </div>}
                </div>
              ))}
            </div>

            {alerts.length>0&&(
              <div style={{...S.panel}}>
                <div style={{fontSize:7,letterSpacing:3,color:"rgba(255,107,53,0.4)",textTransform:"uppercase",marginBottom:3}}>⚠ Alerts</div>
                {alerts.slice(0,3).map((a,i)=>(
                  <div key={i} style={{fontSize:8,color:"#ff6b35",padding:"1px 0"}}>{a.ts} {a.message||""}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SSH ───────────────────────────────────────────────── */}
        {rightPanel==="ssh"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={S.panel}>
              <div style={{...S.title,color:"rgba(0,255,157,0.4)"}}>⬡ SSH Terminal</div>
              <div style={{fontSize:7,color:"rgba(200,200,255,0.2)",marginBottom:6}}>ubuntu@oracle · Port 22</div>
              <div style={{display:"flex",gap:4,marginBottom:5}}>
                <input style={{...S.input("#00ff9d"),flex:1,fontSize:10,borderColor:"rgba(0,255,157,0.2)"}}
                  placeholder="$ command..." value={sshCmd}
                  onChange={e=>setSshCmd(e.target.value)} onKeyDown={onSSHKey}/>
                <button style={{...S.btn("#00ff9d"),padding:"5px 8px"}} onClick={runSSH} disabled={sshRunning}>
                  {sshRunning?"⟳":"▶"}
                </button>
              </div>
              <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
                {["uptime","df -h","free -h","top -bn1","ps aux","who","ss -tlnp"].map(cmd=>(
                  <button key={cmd} style={{...S.btn("rgba(0,255,157,0.3)"),fontSize:7,padding:"1px 4px",color:"rgba(0,255,157,0.5)"}}
                    onClick={()=>setSshCmd(cmd)}>{cmd.split(" ")[0]}</button>
                ))}
              </div>
            </div>
            <div style={{flex:1,overflow:"auto",padding:"8px 11px",background:"rgba(0,255,157,0.012)",fontFamily:"monospace"}}>
              {sshLog.length===0
                ?<div style={{fontSize:8,color:"rgba(0,255,157,0.15)"}}>SSH terminal ready.</div>
                :sshLog.map((e,i)=>(
                <div key={i} style={{marginBottom:7}}>
                  <div style={{color:"#00ff9d",fontSize:9}}>$ {e.cmd}</div>
                  {e.out&&<div style={{fontSize:8,color:"rgba(200,255,220,0.55)",marginTop:2,whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{e.out}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── METRICS ───────────────────────────────────────────── */}
        {rightPanel==="metrics"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto"}}>
            <div style={S.panel}>
              <div style={{...S.title,color:"rgba(255,107,53,0.4)"}}>⬡ Oracle Live Metrics</div>
              <div style={{fontSize:8,color:connected?"#00ff9d":"rgba(200,200,255,0.2)",marginBottom:10}}>
                {connected?`● LIVE ↺ 3s`:`○ Connect Oracle`}
              </div>
              <Bar label="CPU"  val={metrics.cpu_pct||0}  color="#00c8ff"/>
              <Bar label="RAM"  val={metrics.mem_pct||0}  color="#c97cf6"/>
              <Bar label="DISK" val={metrics.disk_pct||0} color="#fbbc04"/>
              <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
                {metrics.mem_used_gb!==undefined&&<div>
                  <div style={{fontSize:7,color:"rgba(200,200,255,0.3)",letterSpacing:1}}>RAM</div>
                  <div style={{fontSize:10,color:"#c97cf6"}}>{metrics.mem_used_gb}GB / {metrics.mem_total_gb}GB</div>
                </div>}
                {metrics.uptime_sec>0&&<div>
                  <div style={{fontSize:7,color:"rgba(200,200,255,0.3)",letterSpacing:1}}>UPTIME</div>
                  <div style={{fontSize:10,color:"#00ff9d"}}>
                    {Math.floor((metrics.uptime_sec||0)/3600)}h {Math.floor(((metrics.uptime_sec||0)%3600)/60)}m
                  </div>
                </div>}
              </div>
            </div>

            {/* Evolution chart */}
            {evoScores.length>0&&(
              <div style={S.panel}>
                <div style={{fontSize:7,letterSpacing:3,color:"rgba(201,124,246,0.35)",textTransform:"uppercase",marginBottom:5}}>Quality History</div>
                <div style={{display:"flex",alignItems:"flex-end",gap:2,height:32}}>
                  {evoScores.slice(-28).map((s,i)=>{
                    const avg=(s.clarity+s.accuracy+s.helpfulness)/3;
                    const col=avg>7?"#00ff9d":avg>5?"#fbbc04":"#ff5555";
                    return <div key={i} style={{flex:1,borderRadius:"1px 1px 0 0",minWidth:3,
                      height:`${(avg/10)*100}%`,background:col,opacity:0.6}} title={avg.toFixed(1)}/>;
                  })}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                  <span style={{fontSize:7,color:"rgba(200,200,255,0.2)"}}>oldest</span>
                  <span style={{fontSize:7,color:"rgba(200,200,255,0.2)"}}>avg {avgEvo}</span>
                </div>
              </div>
            )}

            {/* API endpoints */}
            <div style={S.panel}>
              <div style={{fontSize:7,letterSpacing:3,color:"rgba(0,200,255,0.3)",textTransform:"uppercase",marginBottom:5}}>Endpoints</div>
              {[
                ["/api/status","NEXUS Status"],
                ["/api/metrics","Metrics"],
                ["/api/chat","Chat API"],
                ["/api/agent/log","Agent Log"],
                ["/docs","API Docs"],
              ].map(([path,label])=>(
                <div key={path} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"3px 0",borderBottom:"1px solid rgba(0,200,255,0.04)"}}>
                  <span style={{fontSize:8,color:"rgba(200,200,255,0.35)"}}>{label}</span>
                  <a href={`${API}${path}`} target="_blank" rel="noreferrer"
                    style={{fontSize:7,color:"rgba(0,200,255,0.4)",textDecoration:"none"}}>↗ {path.split("/").pop()}</a>
                </div>
              ))}
            </div>

            {/* Proxy endpoints */}
            <div style={S.panel}>
              <div style={{fontSize:7,letterSpacing:3,color:"rgba(118,185,0,0.3)",textTransform:"uppercase",marginBottom:5}}>Free Proxy :8082</div>
              {[
                ["/health","Health"],
                ["/v1/models","Models"],
                ["/v1/messages","Messages (POST)"],
                ["/stop","Stop Sessions"],
              ].map(([path,label])=>(
                <div key={path} style={{display:"flex",justifyContent:"space-between",
                  padding:"3px 0",borderBottom:"1px solid rgba(118,185,0,0.04)"}}>
                  <span style={{fontSize:8,color:"rgba(200,200,255,0.35)"}}>{label}</span>
                  <a href={`${PROXY_URL}${path}`} target="_blank" rel="noreferrer"
                    style={{fontSize:7,color:"rgba(118,185,0,0.4)",textDecoration:"none"}}>↗</a>
                </div>
              ))}
            </div>

            <div style={{...S.panel,fontSize:8,color:"rgba(200,200,255,0.2)",lineHeight:2}}>
              <div>⬡ COLETTE Orchestrator</div>
              <div style={{color:"rgba(201,124,246,0.4)"}}>Layer 1: Ingestion</div>
              <div style={{color:"rgba(201,124,246,0.3)"}}>Layer 2: Unified Env</div>
              <div style={{color:"rgba(201,124,246,0.2)"}}>Layer 3: Execution + WS</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
