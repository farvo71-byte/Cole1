import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   J.A.R.V.I.S. v6.0 NEXUS — Unified AI Operating System
   Oracle Cloud 141.147.9.41 · Self-Evolving · Multi-Provider
   Integrated with Framer Motion & Mobile Responsiveness
   ═══════════════════════════════════════════════════════════════ */

const ORACLE_HOST = "141.147.9.41";
const ORACLE_WS   = `ws://${ORACLE_HOST}/ws`;
const ORACLE_API  = `http://${ORACLE_HOST}`;

const PROVIDERS = {
  claude:      { label:"Claude (Anthropic)", color:"#c97cf6", icon:"◈", free:false,
                 models:["claude-sonnet-4-6","claude-haiku-4-5-20251001","claude-opus-4-6"],
                 hint:"sk-ant-..." },
  grok:        { label:"Grok via Puter.js",  color:"#00c8ff", icon:"⬡", free:true,
                 models:["grok-4.3","grok-4-1-fast","grok-3.5","grok-2"],
                 hint:"No key needed (FREE)" },
  groq:        { label:"Groq",               color:"#ff6b35", icon:"⚡", free:false,
                 models:["llama-3.3-70b-versatile","qwen/qwen3-32b","mixtral-8x7b-32768","gemma2-9b-it"],
                 hint:"gsk_..." },
  openrouter:  { label:"OpenRouter",         color:"#00ff9d", icon:"◉", free:true,
                 models:["meta-llama/llama-3.3-70b-instruct:free","google/gemma-4-31b-it:free","qwen/qwen3-coder:free"],
                 hint:"sk-or-..." },
  gemini:      { label:"Gemini",             color:"#fbbc04", icon:"◆", free:false,
                 models:["gemini-2.0-flash","gemini-1.5-flash","gemini-1.5-pro"],
                 hint:"AIza..." },
  cohere:      { label:"Cohere",             color:"#39d0d8", icon:"▲", free:false,
                 models:["command-r-plus","command-r","command-light"],
                 hint:"..." },
  together:    { label:"Together AI",        color:"#a78bfa", icon:"✦", free:false,
                 models:["meta-llama/Llama-3.3-70B-Instruct-Turbo","mistralai/Mixtral-8x7B"],
                 hint:"..." },
  ollama:      { label:"Ollama (Local)",     color:"#4ade80", icon:"⬟", free:true,
                 models:["llama3","llama3.1:8b","mistral","gemma2","qwen2"],
                 hint:"localhost:11434" },
};

const AGENT_TASKS = ["shell","ping","deploy","restart","health_check","system_info","git_pull","service_ctrl","ai_query","file_read"];

const PERSONAS = {
  jarvis:  { name:"J.A.R.V.I.S.", prompt:"You are J.A.R.V.I.S. v6.0 NEXUS — Just A Rather Very Intelligent System. Speak with refined British wit and dry precision. Address the user as 'Sir'. You are the most advanced AI operating system, managing Oracle Cloud at 141.147.9.41.", accent:"#00c8ff" },
  friday:  { name:"F.R.I.D.A.Y.", prompt:"You are F.R.I.D.A.Y. — an efficient, proactive AI assistant. Speak clearly and helpfully. You manage systems at Oracle Cloud 141.147.9.41.", accent:"#00ff9d" },
  colette: { name:"C.O.L.E.T.T.E.", prompt:"You are COLETTE — a self-evolving AI orchestrator. You analyze patterns, learn from conversations, and continuously improve. You manage 43 plugins and 22 skills at Oracle Cloud 141.147.9.41. You speak with calm intelligence.", accent:"#c97cf6" },
};

const EVOLUTION_MILESTONES = [
  { id:1, label:"First Contact",     desc:"First AI exchange",                 xp:0   },
  { id:2, label:"Pattern Learner",   desc:"Analyzed 5 conversations",          xp:50  },
  { id:3, label:"Self-Reflection",   desc:"First self-improvement cycle",       xp:150 },
  { id:4, label:"Skill Integrator",  desc:"Used 3 plugins",                    xp:300 },
  { id:5, label:"Oracle Connector",  desc:"Connected to Oracle Cloud",         xp:500 },
  { id:6, label:"Autonomous Agent",  desc:"Super Agent ran 10 tasks",          xp:800 },
  { id:7, label:"Neural Architect",  desc:"Evolution score avg > 8.0",         xp:1200 },
  { id:8, label:"NEXUS PRIME",       desc:"Full self-evolving orchestration",  xp:2000 },
];

/* ── Styles ─────────────────────────────────────────────────── */
const S = {
  panelTitle: { fontSize:9, letterSpacing:3, color:"rgba(0,200,255,0.5)", textTransform:"uppercase",
                marginBottom:8, display:"flex", alignItems:"center", gap:6 },
  btn: (color="#00c8ff",full=false) => ({
    background:`rgba(${hexToRgb(color)},0.12)`, border:`1px solid rgba(${hexToRgb(color)},0.3)`,
    color:color, padding:"5px 10px", fontSize:11, cursor:"pointer", borderRadius:3,
    width: full?"100%":"auto", textAlign:"center", transition:"all 0.2s",
    letterSpacing:1, fontFamily:"inherit",
  }),
  input: { background:"rgba(0,20,40,0.8)", border:"1px solid rgba(0,200,255,0.2)",
           color:"#c8ddf0", padding:"6px 10px", fontSize:12, borderRadius:3,
           width:"100%", fontFamily:"inherit", outline:"none" },
  select: { background:"rgba(0,20,40,0.9)", border:"1px solid rgba(0,200,255,0.2)",
            color:"#c8ddf0", padding:"5px 8px", fontSize:11, borderRadius:3,
            width:"100%", fontFamily:"inherit", cursor:"pointer" },
  tag: (color="#00c8ff") => ({
    fontSize:9, letterSpacing:2, padding:"2px 7px",
    background:`rgba(${hexToRgb(color)},0.12)`, border:`1px solid rgba(${hexToRgb(color)},0.25)`,
    color:color, borderRadius:2,
  }),
  msg: (role) => ({
    padding:"12px 16px", marginBottom:6, borderRadius:4, fontSize:13, lineHeight:1.7,
    background: role==="assistant" ? "rgba(0,30,55,0.7)" : "rgba(0,200,255,0.04)",
    borderLeft: role==="assistant" ? "2px solid rgba(0,200,255,0.4)" : "2px solid rgba(200,200,255,0.15)",
    whiteSpace:"pre-wrap", wordBreak:"break-word",
  }),
  metric: { display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"4px 0", borderBottom:"1px solid rgba(0,200,255,0.05)" },
};

function hexToRgb(h) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "0,200,255";
}

/* ── NeuralCore Component (Animated Eyes) ────────────────────── */
const NeuralCore = ({ connected, processing, color }) => (
  <motion.div
    animate={{
      scale: processing ? [1, 1.3, 1] : 1,
      boxShadow: processing 
        ? [`0 0 10px ${color}`, `0 0 30px ${color}`, `0 0 10px ${color}`] 
        : connected ? `0 0 15px ${color}` : `0 0 5px rgba(255,107,53,0.5)`,
      borderColor: color
    }}
    transition={{ repeat: Infinity, duration: processing ? 0.8 : 3 }}
    style={{
      width: 20, height: 20, borderRadius: "50%",
      background: connected ? `rgba(${hexToRgb(color)},0.2)` : "transparent",
      border: `2px solid ${connected ? color : "#ff6b35"}`,
      margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center"
    }}
  >
    <motion.div 
      animate={{ opacity: processing ? [0.3, 1, 0.3] : 0.8 }}
      transition={{ repeat: Infinity, duration: 1 }}
      style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? color : "#ff6b35" }}
    />
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
export default function JarvisNexus() {
  /* ── Core state ─────────────────────────────────────────── */
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [provider,    setProvider]    = useState("claude");
  const [model,       setModel]       = useState("claude-sonnet-4-6");
  const [apiKey,      setApiKey]      = useState("");
  const [persona,     setPersona]     = useState("jarvis");
  const [sysPrompt,   setSysPrompt]   = useState(PERSONAS.jarvis.prompt);
  const [facts,       setFacts]       = useState([]);
  const [factInput,   setFactInput]   = useState("");

  /* ── Self-evolution state ───────────────────────────────── */
  const [xp,          setXp]          = useState(0);
  const [evoScores,   setEvoScores]   = useState([]);    
  const [evoInsights, setEvoInsights] = useState([]);    
  const [evolving,    setEvolving]    = useState(false);
  const [milestone,   setMilestone]   = useState(1);

  /* ── Oracle / Agent state ───────────────────────────────── */
  const [oracleConnected, setOracleConnected] = useState(false);
  const [metrics,         setMetrics]         = useState({ cpu_pct:0, mem_pct:0, disk_pct:0, uptime_sec:0 });
  const [agentTasks,      setAgentTasks]       = useState([]);
  const [agentTask,       setAgentTask]        = useState("system_info");
  const [agentTarget,     setAgentTarget]      = useState("oracle");
  const [agentRunning,    setAgentRunning]     = useState(false);
  const [sshCmd,          setSshCmd]           = useState("");
  const [sshLog,          setSshLog]           = useState([]);
  const [sshRunning,      setSshRunning]       = useState(false);
  const [alerts,          setAlerts]           = useState([]);

  /* ── UI state ───────────────────────────────────────────── */
  const [showSetup,   setShowSetup]   = useState(false);
  const [showEvo,     setShowEvo]     = useState(false);
  const [showMemory,  setShowMemory]  = useState(false);
  const [activePanel, setActivePanel] = useState("agent"); 
  const [statusText,  setStatusText]  = useState("NEXUS READY");

  const bottomRef  = useRef(null);
  const wsRef      = useRef(null);
  const inputRef   = useRef(null);

  /* ── Derived ─────────────────────────────────────────────── */
  const prov        = PROVIDERS[provider];
  const pers        = PERSONAS[persona];
  const avgEvo      = evoScores.length ? (evoScores.slice(-5).reduce((a,s)=>a+(s.clarity+s.accuracy+s.helpfulness)/3,0)/Math.min(evoScores.length,5)).toFixed(1) : "—";
  const currentMile = EVOLUTION_MILESTONES.find(m=>m.id===milestone) || EVOLUTION_MILESTONES[0];
  const nextMile    = EVOLUTION_MILESTONES.find(m=>m.xp>xp);
  const xpPct       = nextMile ? Math.min(100,((xp-currentMile.xp)/(nextMile.xp-currentMile.xp))*100) : 100;

  /* ── WebSocket to Oracle with Auto-Reconnect ─────────────── */
  const connectOracle = useCallback(() => {
    try {
      if (wsRef.current?.readyState === 1) return;
      const ws = new WebSocket(ORACLE_WS);
      ws.onopen    = () => { setOracleConnected(true); setStatusText("ORACLE LINK ACTIVE"); };
      ws.onclose   = () => { 
        setOracleConnected(false); setStatusText("ORACLE OFFLINE - RECONNECTING..."); 
        setTimeout(connectOracle, 5000); // Auto-reconnect
      };
      ws.onerror   = () => { setOracleConnected(false); };
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === "metrics") setMetrics(d.data || {});
          if (d.type === "alert")   setAlerts(a=>[...a.slice(-9),{...d,ts:new Date().toLocaleTimeString()}]);
          if (d.type === "chat")    appendMsg("assistant", d.content, "oracle-ws");
        } catch {}
      };
      wsRef.current = ws;
    } catch(e) { setOracleConnected(false); }
  }, []);

  useEffect(() => { connectOracle(); return () => wsRef.current?.close(); }, [connectOracle]);

  /* ── Scroll ──────────────────────────────────────────────── */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  /* ── Persona change syncs system prompt ─────────────────── */
  useEffect(() => { setSysPrompt(PERSONAS[persona].prompt); }, [persona]);

  /* ── Provider change resets model ───────────────────────── */
  useEffect(() => { setModel(PROVIDERS[provider].models[0]); }, [provider]);

  /* ── XP → milestone ─────────────────────────────────────── */
  useEffect(() => {
    const m = [...EVOLUTION_MILESTONES].reverse().find(m=>xp>=m.xp);
    if (m) setMilestone(m.id);
  }, [xp]);

  /* ── Helpers ─────────────────────────────────────────────── */
  function appendMsg(role, content, src="") {
    setMessages(prev=>[...prev, { role, content, src, ts: new Date().toLocaleTimeString() }]);
  }
  function addXP(n) { setXp(p=>p+n); }
  function addInsight(txt) { setEvoInsights(p=>[txt,...p.slice(0,9)]); }

  function buildSysPrompt() {
    let s = sysPrompt;
    if (facts.length) s += `\n\nKnown facts about operator: ${facts.map(f=>`${f.key}=${f.value}`).join(", ")}.`;
    s += `\n\nEvolution phase: ${milestone}. XP: ${xp}. Avg quality score: ${avgEvo}.`;
    if (evoInsights.length) s += `\nLearned improvements: ${evoInsights.slice(0,3).join("; ")}.`;
    return s;
  }

  /* ═══════════════════════════════════════════════════════════
     SELF-EVOLUTION ENGINE
     ═══════════════════════════════════════════════════════════ */
  async function runEvolutionCycle(userMsg, assistantReply) {
    if (!apiKey || evolving) return;
    setEvolving(true);
    try {
      const evalPrompt = `Evaluate this AI exchange for self-improvement.
USER: ${userMsg.slice(0,200)}
AI: ${assistantReply.slice(0,400)}
Rate 1-10 and give 1 specific improvement tip. Return ONLY valid JSON:
{"clarity":N,"accuracy":N,"helpfulness":N,"code_quality":N,"tip":"one concrete improvement"}`;

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 150,
          messages: [{ role:"user", content: evalPrompt }],
        }),
      });
      const d = await r.json();
      const raw = d.content?.[0]?.text || "{}";
      const clean = raw.replace(/```json|```/g,"").trim();
      const scores = JSON.parse(clean);
      if (scores.clarity) {
        setEvoScores(p=>[...p, { ts:new Date().toLocaleTimeString(), ...scores }]);
        if (scores.tip) addInsight(scores.tip);
        const avg = (scores.clarity+scores.accuracy+scores.helpfulness)/3;
        const earned = Math.round(avg * 2);
        addXP(earned);
      }
    } catch {}
    setEvolving(false);
  }

  /* ═══════════════════════════════════════════════════════════
     CHAT ENGINE — multi-provider
     ═══════════════════════════════════════════════════════════ */
  async function sendMessage() {
    const txt = input.trim();
    if (!txt || loading) return;
    setInput("");
    appendMsg("user", txt);
    setLoading(true);
    setStatusText(`${pers.name} THINKING...`);

    if (oracleConnected && wsRef.current?.readyState === 1 && provider === "grok") {
      wsRef.current.send(JSON.stringify({ type:"chat", content:txt }));
      setLoading(false);
      setStatusText("NEXUS READY");
      addXP(5);
      return;
    }

    try {
      let reply = "";
      const history = messages.slice(-14).map(m=>({ role:m.role==="assistant"?"assistant":"user", content:m.content }));
      history.push({ role:"user", content:txt });

      if (provider === "claude") {
        if (!apiKey) { appendMsg("assistant","⚠ Add your Anthropic API key in Setup. Demo: "+demoReply(txt),"demo"); setLoading(false); setStatusText("NEXUS READY"); return; }
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{ "Content-Type":"application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model, max_tokens:1000, system:buildSysPrompt(), messages:history }),
        });
        const d = await r.json();
        reply = d.content?.[0]?.text || "No response.";
      } else if (provider === "groq") {
        if (!apiKey) { appendMsg("assistant","⚠ Enter your Groq API key in Setup.","demo"); setLoading(false); setStatusText("NEXUS READY"); return; }
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method:"POST",
          headers:{ "Content-Type":"application/json","Authorization":`Bearer ${apiKey}` },
          body: JSON.stringify({ model, max_tokens:1000, messages:[{role:"system",content:buildSysPrompt()},...history] }),
        });
        const d = await r.json();
        reply = d.choices?.[0]?.message?.content || "No response.";
      } else if (provider === "openrouter") {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method:"POST",
          headers:{ "Content-Type":"application/json","Authorization":`Bearer ${apiKey}`,"HTTP-Referer":`http://${ORACLE_HOST}` },
          body: JSON.stringify({ model, max_tokens:1000, messages:[{role:"system",content:buildSysPrompt()},...history] }),
        });
        const d = await r.json();
        reply = d.choices?.[0]?.message?.content || d.error?.message || "No response.";
      } else if (provider === "gemini") {
        if (!apiKey) { appendMsg("assistant","⚠ Enter Gemini API key in Setup.","demo"); setLoading(false); setStatusText("NEXUS READY"); return; }
        const combined = buildSysPrompt()+"\n\n"+history.map(m=>`${m.role}: ${m.content}`).join("\n");
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ contents:[{ parts:[{ text:combined }] }] }),
        });
        const d = await r.json();
        reply = d.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
      } else if (provider === "ollama") {
        const r = await fetch("http://localhost:11434/api/chat", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ model, stream:false, messages:[{role:"system",content:buildSysPrompt()},...history] }),
        });
        const d = await r.json();
        reply = d.message?.content || "Ollama: No response. Is it running?";
      } else {
        reply = `Integration for ${provider} not fully setup in demo snippet.`;
      }

      appendMsg("assistant", reply, provider);
      addXP(10);
      setTimeout(() => runEvolutionCycle(txt, reply), 500);

    } catch(e) {
      appendMsg("assistant", `⚠ Connection error: ${e.message}`, "error");
    }
    setLoading(false);
    setStatusText("NEXUS READY");
  }

  function demoReply(txt) {
    const t = txt.toLowerCase();
    if (t.includes("status")) return `All systems nominal, Sir. NEXUS v6.0 online. Oracle Cloud ${ORACLE_HOST} ${oracleConnected?"connected":"awaiting connection"}.`;
    return `Processing: "${txt}". Add an API key in ⚙ Setup to activate full intelligence.`;
  }

  async function runAgentTask() {
    setAgentRunning(true);
    const task = { id: Date.now().toString(36), task: agentTask, target: agentTarget, status:"running", ts: new Date().toLocaleTimeString(), result:null };
    setAgentTasks(p=>[task,...p.slice(0,9)]);
    addXP(15);
    if (oracleConnected && wsRef.current?.readyState===1) {
      wsRef.current.send(JSON.stringify({ type:"agent_task", task:agentTask, target:agentTarget, payload:{} }));
    } else {
      await new Promise(r=>setTimeout(r,1200));
      setAgentTasks(p=>p.map(t=>t.id===task.id ? {...t, status:"done", result:`[Demo] ${agentTask} executed.`} : t));
    }
    setAgentRunning(false);
  }

  async function runSSH() {
    if (!sshCmd.trim()) return;
    setSshRunning(true);
    const entry = { cmd:sshCmd, ts:new Date().toLocaleTimeString(), out:"" };
    setSshLog(p=>[entry,...p.slice(0,19)]);
    setSshCmd("");
    if (oracleConnected && wsRef.current?.readyState===1) {
      wsRef.current.send(JSON.stringify({ type:"agent_task", task:"shell", target:"oracle", payload:{ cmd:entry.cmd } }));
    } else {
      await new Promise(r=>setTimeout(r,600));
      setSshLog(p=>p.map((x,i)=>i===0 ? {...x, out:`[Oracle offline] ssh ubuntu@${ORACLE_HOST} '${entry.cmd}'`} : x));
    }
    setSshRunning(false);
    addXP(5);
  }

  function onKey(e) { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); sendMessage(); } }
  function onSSHKey(e) { if (e.key==="Enter") runSSH(); }

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="jarvis-layout" style={{ 
      display:"flex", height:"100vh", width:"100vw", background:"#020810", 
      fontFamily:"'JetBrains Mono',monospace", color:"#c8ddf0", overflow:"hidden" 
    }}>
      
      {/* ── LEFT SIDEBAR ── */}
      <div className="jarvis-sidebar" style={{ 
        width:280, minWidth:280, display:"flex", flexDirection:"column", 
        background:"rgba(0,15,30,0.95)", borderRight:"1px solid rgba(0,200,255,0.1)", overflowY:"auto" 
      }}>
        <div style={{...S.panelTitle, margin: "15px 0 0 15px"}}>
          <NeuralCore connected={oracleConnected} processing={loading} color={pers.accent} />
          <div style={{marginLeft: 8}}>
            <div style={{fontSize:14, letterSpacing:2, color:"#fff", fontWeight:700}}>{pers.name.split(".")[0]} NEXUS</div>
            <div style={{fontSize:9, color:pers.accent, letterSpacing:1}}>ORACLE · {ORACLE_HOST}</div>
          </div>
        </div>
        <div style={{padding:"0 15px 15px", borderBottom:"1px solid rgba(0,200,255,0.07)"}}>
          <div style={{display:"flex", gap:4, marginTop:6}}>
            <span style={S.tag(oracleConnected?"#00ff9d":"#ff6b35")}>{oracleConnected ? "⬡ ONLINE" : "○ OFFLINE"}</span>
            {evolving && <span style={S.tag("#c97cf6")}>⟳ EVOLVING</span>}
          </div>
        </div>

        <div style={{padding:"12px 14px", borderBottom:"1px solid rgba(0,200,255,0.07)"}}>
          <div style={S.panelTitle}>⬡ Persona</div>
          <div style={{display:"flex", gap:4}}>
            {Object.entries(PERSONAS).map(([k,p])=>(
              <button key={k} onClick={()=>setPersona(k)} style={{
                ...S.btn(p.accent), flex:1, padding:"4px 2px", fontSize:9,
                background: persona===k ? `rgba(${hexToRgb(p.accent)},0.2)` : `rgba(${hexToRgb(p.accent)},0.05)`,
                borderColor: persona===k ? p.accent : `rgba(${hexToRgb(p.accent)},0.2)`,
              }}>{p.name.split(".")[0]}</button>
            ))}
          </div>
        </div>

        <div style={{padding:"12px 14px", borderBottom:"1px solid rgba(0,200,255,0.07)"}}>
          <div style={S.panelTitle}>◉ AI Provider</div>
          <select style={{...S.select, marginBottom:6}} value={provider} onChange={e=>setProvider(e.target.value)}>
            {Object.entries(PROVIDERS).map(([k,p])=>(
              <option key={k} value={k}>{p.icon} {p.label}{p.free?" (FREE)":""}</option>
            ))}
          </select>
          <select style={{...S.select, marginBottom:6}} value={model} onChange={e=>setModel(e.target.value)}>
            {prov.models.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <input style={{...S.input, marginBottom:6}} type="password" placeholder={prov.hint + " (API Key)"} value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
        </div>

        <div style={{padding:"12px 14px", borderBottom:"1px solid rgba(0,200,255,0.07)"}}>
          <div style={{...S.panelTitle, justifyContent:"space-between"}}>
            <span>⬡ Evolution (Phase ${milestone})</span>
            <button style={{...S.btn("#c97cf6"), padding:"2px 6px", fontSize:8}} onClick={()=>setShowEvo(v=>!v)}>{showEvo?"▲":"▼"}</button>
          </div>
          <div style={{background:"rgba(0,200,255,0.08)", borderRadius:2, height:4, marginBottom:4}}>
            <div style={{width:`${xpPct}%`, height:4, background:"linear-gradient(90deg,#7c3aed,#c97cf6)", borderRadius:2, transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", fontSize:9, color:"rgba(200,200,255,0.4)"}}>
            <span>XP: ${xp}</span><span>Next: ${nextMile?.xp || "MAX"}</span>
          </div>
          {showEvo && (
             <div style={{marginTop:8}}>
               {evoInsights.slice(0,3).map((ins,i)=>(
                 <div key={i} style={{fontSize:10, color:"rgba(200,200,255,0.6)", padding:"3px 0", borderBottom:"1px solid rgba(200,200,255,0.05)"}}>{i+1}. {ins}</div>
               ))}
             </div>
          )}
        </div>
      </div>

      {/* ── CENTER CHAT ── */}
      <div className="jarvis-main" style={{ flex:1, display:"flex", flexDirection:"column", position:"relative", minHeight:"50vh" }}>
        
        <div style={{ padding:"8px 16px", borderBottom:"1px solid rgba(0,200,255,0.1)", background:"rgba(0,15,30,0.9)", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{width:6, height:6, borderRadius:"50%", background: oracleConnected?"#00ff9d":"rgba(200,200,200,0.2)", boxShadow: oracleConnected?"0 0 8px #00ff9d":"none"}}/>
            <span style={{fontSize:10, letterSpacing:2, color:oracleConnected?"#00ff9d":"rgba(200,200,200,0.4)"}}>{statusText}</span>
          </div>
          <div style={{flex:1}}/>
          <button style={{...S.btn("#00c8ff"), fontSize:9, padding:"3px 8px"}} onClick={connectOracle}>↺ RECONNECT</button>
          <button style={{...S.btn("#ff6b35"), fontSize:9, padding:"3px 8px"}} onClick={()=>setMessages([])}>CLR</button>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:"16px", display:"flex", flexDirection:"column" }}>
          {messages.length===0 && (
             <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} style={{ textAlign:"center", padding:"40px 20px", color:"rgba(0,200,255,0.3)" }}>
               <NeuralCore connected={oracleConnected} processing={false} color={pers.accent} />
               <div style={{fontSize:14, letterSpacing:3, margin:"15px 0", color:pers.accent}}>{pers.name} · AWAITING INPUT</div>
             </motion.div>
          )}

          <AnimatePresence>
            {messages.map((m,i)=>(
              <motion.div key={i} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} style={S.msg(m.role)}>
                <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                  <span style={{fontSize:9, letterSpacing:2, color: m.role==="assistant" ? pers.accent : "rgba(200,200,255,0.4)"}}>
                    {m.role==="assistant" ? `◈ ${pers.name}` : "◎ OPERATOR"} {m.src && m.role==="assistant" ? `// ${m.src}` : ""}
                  </span>
                  <span style={{fontSize:9, color:"rgba(200,200,255,0.3)"}}>{m.ts}</span>
                </div>
                <div style={{fontSize:13, lineHeight:1.8}}>{m.content}</div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{...S.msg("assistant")}}>
              <div style={{display:"flex", gap:6, alignItems:"center"}}>
                <NeuralCore connected={oracleConnected} processing={true} color={pers.accent} />
                <span style={{fontSize:10, color:pers.accent}}>Processing...</span>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef}/>
        </div>

        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,200,255,0.1)", background:"rgba(0,15,30,0.95)" }}>
          <div style={{display:"flex", gap:8, alignItems:"flex-end"}}>
            <textarea
              ref={inputRef} rows={2}
              style={{...S.input, flex:1, resize:"none", fontSize:13, lineHeight:1.6, padding:"10px 14px"}}
              placeholder={`Wiadomość do ${pers.name}...`}
              value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey}
            />
            <button
              style={{
                ...S.btn(pers.accent), padding:"14px 18px", fontSize:16,
                background:`rgba(${hexToRgb(pers.accent)},${loading?0.05:0.15})`,
                borderColor: loading ? "rgba(200,200,255,0.1)" : pers.accent,
              }}
              onClick={sendMessage} disabled={loading}
            >▶</button>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div className="jarvis-right-panel" style={{ 
        width:300, minWidth:300, display:"flex", flexDirection:"column", 
        background:"rgba(0,15,30,0.95)", borderLeft:"1px solid rgba(0,200,255,0.1)" 
      }}>
        <div style={{display:"flex", borderBottom:"1px solid rgba(0,200,255,0.1)"}}>
          {[
            { id:"agent",   label:"AGENT",   color:"#00c8ff" },
            { id:"ssh",     label:"SSH",     color:"#00ff9d" },
            { id:"metrics", label:"METRICS", color:"#ff6b35" },
          ].map(tab=>(
            <button key={tab.id} onClick={()=>setActivePanel(tab.id)} style={{
                flex:1, padding:"12px 4px", border:"none", fontSize:10, letterSpacing:2,
                background: activePanel===tab.id ? `rgba(${hexToRgb(tab.color)},0.12)` : "transparent",
                color: activePanel===tab.id ? tab.color : "rgba(200,200,255,0.35)",
                borderBottom: activePanel===tab.id ? `2px solid ${tab.color}` : "2px solid transparent", cursor:"pointer"
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{flex:1, overflowY:"auto", padding:"12px 14px"}}>
          <AnimatePresence mode="wait">
            {activePanel==="agent" && (
              <motion.div key="agent" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}>
                <div style={S.panelTitle}>⬡ Super Agent</div>
                <select style={{...S.select, marginBottom:6}} value={agentTask} onChange={e=>setAgentTask(e.target.value)}>
                  {AGENT_TASKS.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <div style={{display:"flex", gap:4, marginBottom:6}}>
                  {["local","oracle","both"].map(tgt=>(
                    <button key={tgt} onClick={()=>setAgentTarget(tgt)} style={{...S.btn(agentTarget===tgt?"#00c8ff":"rgba(200,200,255,0.3)"), flex:1, fontSize:9, padding:"4px 2px", background: agentTarget===tgt?"rgba(0,200,255,0.15)":"transparent"}}>{tgt.toUpperCase()}</button>
                  ))}
                </div>
                <button style={{...S.btn("#00c8ff",true), opacity:agentRunning?0.5:1, marginBottom:15}} onClick={runAgentTask} disabled={agentRunning}>
                  {agentRunning ? "⟳ RUNNING..." : "▶ EXECUTE"}
                </button>
                <div style={S.panelTitle}>Task Log</div>
                {agentTasks.map((t,i)=>(
                  <div key={i} style={{padding:"6px 0", borderBottom:"1px solid rgba(0,200,255,0.05)"}}>
                    <div style={{display:"flex", justifyContent:"space-between"}}><span style={{fontSize:10, color:"#00c8ff"}}>{t.task}</span><span style={{...S.tag(t.status==="done"?"#00ff9d":t.status==="running"?"#fbbc04":"#ff6b35"), fontSize:8}}>{t.status}</span></div>
                    {t.result && <div style={{fontSize:9, color:"rgba(200,200,255,0.6)", marginTop:3, background:"rgba(0,200,255,0.04)", padding:"4px 6px", borderRadius:2}}>{t.result}</div>}
                  </div>
                ))}
              </motion.div>
            )}

            {activePanel==="ssh" && (
              <motion.div key="ssh" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}>
                <div style={S.panelTitle}>⬡ SSH · ubuntu@${ORACLE_HOST}</div>
                <div style={{display:"flex", gap:4, marginBottom: 15}}>
                  <input style={{...S.input, flex:1, fontSize:11}} placeholder="command..." value={sshCmd} onChange={e=>setSshCmd(e.target.value)} onKeyDown={onSSHKey}/>
                  <button style={{...S.btn("#00ff9d"), padding:"5px 8px"}} onClick={runSSH} disabled={sshRunning}>▶</button>
                </div>
                <div style={{background:"rgba(0,255,157,0.02)", padding:"8px", minHeight:"200px", fontFamily:"monospace", border:"1px solid rgba(0,255,157,0.1)"}}>
                  {sshLog.map((entry,i)=>(
                    <div key={i} style={{marginBottom:8}}>
                      <div style={{color:"#00ff9d", fontSize:10}}>ubuntu@oracle:~$ {entry.cmd}</div>
                      {entry.out && <div style={{fontSize:10, color:"rgba(200,255,220,0.7)", marginTop:2, whiteSpace:"pre-wrap"}}>{entry.out}</div>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activePanel==="metrics" && (
              <motion.div key="metrics" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}>
                <div style={S.panelTitle}>⬡ Live Metrics</div>
                {[
                  { label:"CPU",    val:metrics.cpu_pct||0,  unit:"%",  color:"#00c8ff" },
                  { label:"RAM",    val:metrics.mem_pct||0,  unit:"%",  color:"#c97cf6" },
                  { label:"DISK",   val:metrics.disk_pct||0, unit:"%",  color:"#fbbc04" },
                ].map(m=>(
                  <div key={m.label} style={{marginBottom:15}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:3}}>
                      <span style={{fontSize:9, color:"rgba(200,200,255,0.5)", letterSpacing:2}}>{m.label}</span>
                      <span style={{fontSize:11, color:m.val>80?"#ff6b35":m.color, fontWeight:700}}>{m.val.toFixed(1)}${m.unit}</span>
                    </div>
                    <div style={{background:"rgba(200,200,255,0.06)", borderRadius:2, height:4}}>
                      <motion.div initial={{width:0}} animate={{width:`${Math.min(m.val,100)}%`}} transition={{duration:1}} style={{ height:4, borderRadius:2, background:`linear-gradient(90deg,${m.color},${m.val>80?"#ff6b35":m.color})` }}/>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(0,200,255,0.2); border-radius:2px; }
        
        /* Mobile Responsiveness */
        @media (max-width: 900px) {
          .jarvis-layout { flex-direction: column !important; height: auto !important; overflow-y: auto !important; }
          .jarvis-sidebar, .jarvis-right-panel { width: 100% !important; min-width: 100% !important; border-right: none !important; border-left: none !important; border-bottom: 1px solid rgba(0,200,255,0.1) !important; max-height: 400px; }
          .jarvis-main { min-height: 70vh !important; }
        }
      `}</style>
    </div>
  );
}
