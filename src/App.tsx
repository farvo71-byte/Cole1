import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   J.A.R.V.I.S. v6.0 NEXUS — Unified AI Operating System
   Oracle Cloud 141.147.9.41 · Self-Evolving · Multi-Provider
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
  root: { display:"flex", height:"100vh", width:"100vw", background:"#020810",
          fontFamily:"'JetBrains Mono',monospace", color:"#c8ddf0", overflow:"hidden" },
  sidebar: { width:280, minWidth:280, display:"flex", flexDirection:"column",
             background:"rgba(0,15,30,0.95)", borderRight:"1px solid rgba(0,200,255,0.1)",
             overflow:"hidden" },
  sideR: { width:300, minWidth:300, display:"flex", flexDirection:"column",
           background:"rgba(0,15,30,0.95)", borderLeft:"1px solid rgba(0,200,255,0.1)",
           overflow:"hidden" },
  main: { flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" },
  panel: { padding:"12px 14px", borderBottom:"1px solid rgba(0,200,255,0.07)" },
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

/* ═══════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════ */
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
  const [evoScores,   setEvoScores]   = useState([]);    // [{ts,clarity,accuracy,helpfulness,code}]
  const [evoInsights, setEvoInsights] = useState([]);    // strings
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
  const [activePanel, setActivePanel] = useState("agent"); // agent|ssh|metrics
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

  /* ── WebSocket to Oracle ─────────────────────────────────── */
  const connectOracle = useCallback(() => {
    try {
      const ws = new WebSocket(ORACLE_WS);
      ws.onopen    = () => { setOracleConnected(true); setStatusText("ORACLE LINK ACTIVE"); };
      ws.onclose   = () => { setOracleConnected(false); setStatusText("ORACLE OFFLINE"); };
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

  useEffect(() => { connectOracle(); return () => wsRef.current?.close(); }, []);

  /* ── Scroll ──────────────────────────────────────────────── */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

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

  /* ── Build system prompt with facts ─────────────────────── */
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
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
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

        // Auto-adapt system prompt if score low in an area
        if (scores.clarity < 6) setSysPrompt(p=>p+" Always structure responses clearly with sections.");
        if (scores.code_quality < 6) setSysPrompt(p=>p+" Always provide working, commented code.");
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

    // Try WS first if Oracle connected
    if (oracleConnected && wsRef.current?.readyState === 1) {
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
        if (!apiKey) { appendMsg("assistant","⚠ Add your Anthropic API key in Setup to use Claude directly.\n\nFor now, using demo mode.\n\nDemo: "+demoReply(txt),"demo"); setLoading(false); setStatusText("NEXUS READY"); return; }
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
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
        const key = apiKey || "";
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method:"POST",
          headers:{ "Content-Type":"application/json","Authorization":`Bearer ${key}`,"HTTP-Referer":`http://${ORACLE_HOST}` },
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

      } else if (provider === "grok") {
        reply = `⬡ Grok via Puter.js requires the JARVIS backend running at Oracle Cloud.\n\nConnect to: ${ORACLE_API}/api/chat\nor run: ssh ubuntu@${ORACLE_HOST} 'systemctl start jarvis'`;

      } else {
        if (!apiKey) { appendMsg("assistant","⚠ Enter API key in Setup.","demo"); setLoading(false); setStatusText("NEXUS READY"); return; }
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method:"POST",
          headers:{ "Content-Type":"application/json","Authorization":`Bearer ${apiKey}` },
          body: JSON.stringify({ model:"gpt-3.5-turbo", max_tokens:800, messages:[{role:"system",content:buildSysPrompt()},...history] }),
        });
        const d = await r.json();
        reply = d.choices?.[0]?.message?.content || "No response.";
      }

      appendMsg("assistant", reply, provider);
      addXP(10);
      // Self-improvement cycle (async, non-blocking)
      setTimeout(() => runEvolutionCycle(txt, reply), 500);

    } catch(e) {
      appendMsg("assistant", `⚠ Connection error: ${e.message}\n\nTry: Check API key, or connect to Oracle Cloud at ${ORACLE_HOST}`, "error");
    }
    setLoading(false);
    setStatusText("NEXUS READY");
  }

  /* ── Demo mode ───────────────────────────────────────────── */
  function demoReply(txt) {
    const t = txt.toLowerCase();
    if (t.includes("status"))   return `All systems nominal, Sir. NEXUS v6.0 online. Oracle Cloud ${ORACLE_HOST} ${oracleConnected?"connected":"awaiting connection"}. Evolution phase ${milestone}, XP: ${xp}.`;
    if (t.includes("hello")||t.includes("hej")||t.includes("cześć")) return `Good day, Sir. ${pers.name} at your service. Add your Anthropic key in Setup to unlock full capabilities.`;
    if (t.includes("help"))     return `Available commands:\n• status — system status\n• evolution — show evolution panel\n• connect — connect Oracle Cloud\n• Any question — full AI response with active key`;
    return `Processing: "${txt}". Add an API key in ⚙ Setup to activate full ${pers.name} intelligence.`;
  }

  /* ── Super Agent ─────────────────────────────────────────── */
  async function runAgentTask() {
    setAgentRunning(true);
    const task = {
      id: Date.now().toString(36),
      task: agentTask, target: agentTarget,
      status:"running", ts: new Date().toLocaleTimeString(), result:null,
    };
    setAgentTasks(p=>[task,...p.slice(0,9)]);
    addXP(15);

    if (oracleConnected && wsRef.current?.readyState===1) {
      wsRef.current.send(JSON.stringify({ type:"agent_task", task:agentTask, target:agentTarget, payload:{} }));
    } else {
      await new Promise(r=>setTimeout(r,1200));
      setAgentTasks(p=>p.map(t=>t.id===task.id ? {...t, status:"done", result:`[Demo] ${agentTask} executed. Oracle offline — connect to ${ORACLE_HOST} for live results.`} : t));
    }
    setAgentRunning(false);
  }

  /* ── SSH ─────────────────────────────────────────────────── */
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
      setSshLog(p=>p.map((x,i)=>i===0 ? {...x, out:`[Oracle offline] Use: ssh ubuntu@${ORACLE_HOST} '${entry.cmd}'`} : x));
    }
    setSshRunning(false);
    addXP(5);
  }

  /* ── Keyboard ────────────────────────────────────────────── */
  function onKey(e) { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); sendMessage(); } }
  function onSSHKey(e) { if (e.key==="Enter") runSSH(); }

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div style={S.root}>

      {/* ╔══════════════════════════════════════════════════════
          LEFT SIDEBAR — Provider + Evolution + Memory
          ══════════════════════════════════════════════════════ */}
      <div style={S.sidebar}>

        {/* Logo */}
        <div style={{...S.panel, background:"rgba(0,200,255,0.04)", textAlign:"center"}}>
          <div style={{fontSize:10, letterSpacing:4, color:pers.accent, marginBottom:2}}>
            ◈ {pers.name}
          </div>
          <div style={{fontSize:17, letterSpacing:2, color:"#fff", fontWeight:700}}>
            NEXUS v6.0
          </div>
          <div style={{fontSize:9, color:"rgba(0,200,255,0.4)", letterSpacing:2, marginTop:2}}>
            ORACLE · {ORACLE_HOST}
          </div>
          <div style={{display:"flex", gap:4, justifyContent:"center", marginTop:6}}>
            <span style={S.tag(oracleConnected?"#00ff9d":"#ff6b35")}>
              {oracleConnected ? "⬡ ORACLE LIVE" : "○ ORACLE OFFLINE"}
            </span>
            {evolving && <span style={S.tag("#c97cf6")}>⟳ EVOLVING</span>}
          </div>
        </div>

        {/* Persona selector */}
        <div style={S.panel}>
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

        {/* Provider selector */}
        <div style={S.panel}>
          <div style={S.panelTitle}>◉ AI Provider</div>
          <select style={{...S.select, marginBottom:6}} value={provider} onChange={e=>setProvider(e.target.value)}>
            {Object.entries(PROVIDERS).map(([k,p])=>(
              <option key={k} value={k}>{p.icon} {p.label}{p.free?" (FREE)":""}</option>
            ))}
          </select>
          <select style={{...S.select, marginBottom:6}} value={model} onChange={e=>setModel(e.target.value)}>
            {prov.models.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <div style={{display:"flex", gap:4}}>
            <input style={{...S.input, flex:1}}
              type="password" placeholder={prov.hint}
              value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
            <button style={{...S.btn(prov.color), padding:"5px 8px"}}
              onClick={()=>connectOracle()}>↺</button>
          </div>
          <div style={{marginTop:6, fontSize:9, color:"rgba(0,200,255,0.35)"}}>
            Active: <span style={{color:prov.color}}>{prov.label}</span> / {model}
          </div>
        </div>

        {/* Evolution panel */}
        <div style={S.panel}>
          <div style={{...S.panelTitle, justifyContent:"space-between"}}>
            <span>⬡ Evolution</span>
            <button style={{...S.btn("#c97cf6"), padding:"2px 6px", fontSize:8}}
              onClick={()=>setShowEvo(v=>!v)}>
              {showEvo?"▲":"▼"}
            </button>
          </div>

          {/* Milestone */}
          <div style={{fontSize:10, color:"#c97cf6", marginBottom:4}}>
            {currentMile.label} · Phase {milestone}
          </div>

          {/* XP bar */}
          <div style={{background:"rgba(0,200,255,0.08)", borderRadius:2, height:4, marginBottom:4}}>
            <div style={{width:`${xpPct}%`, height:4, background:"linear-gradient(90deg,#7c3aed,#c97cf6)", borderRadius:2, transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", fontSize:9, color:"rgba(200,200,255,0.4)"}}>
            <span>XP: {xp}</span>
            <span>Next: {nextMile?.label || "MAX"} @ {nextMile?.xp || "∞"}</span>
          </div>

          {/* Avg quality */}
          {evoScores.length > 0 && (
            <div style={{marginTop:6, display:"flex", gap:4, flexWrap:"wrap"}}>
              {["clarity","accuracy","helpfulness"].map(k=>{
                const avg = (evoScores.slice(-5).reduce((a,s)=>a+(s[k]||0),0)/Math.min(evoScores.length,5)).toFixed(1);
                const col = avg>7?"#00ff9d":avg>5?"#fbbc04":"#ff6b35";
                return <span key={k} style={S.tag(col)}>{k[0].toUpperCase()}: {avg}</span>;
              })}
            </div>
          )}

          {/* Insights */}
          {showEvo && (
            <div style={{marginTop:8}}>
              <div style={{...S.panelTitle, marginBottom:4}}>Learned Insights</div>
              {evoInsights.length === 0 ? (
                <div style={{fontSize:9, color:"rgba(200,200,255,0.3)"}}>
                  Insights appear after first AI exchange.
                </div>
              ) : evoInsights.slice(0,4).map((ins,i)=>(
                <div key={i} style={{fontSize:10, color:"rgba(200,200,255,0.6)", padding:"3px 0",
                  borderBottom:"1px solid rgba(200,200,255,0.05)"}}>
                  {i+1}. {ins}
                </div>
              ))}

              {/* Milestones list */}
              <div style={{...S.panelTitle, marginTop:8, marginBottom:4}}>Milestones</div>
              {EVOLUTION_MILESTONES.map(m=>(
                <div key={m.id} style={{display:"flex", alignItems:"center", gap:6,
                  padding:"3px 0", opacity: xp>=m.xp?1:0.35}}>
                  <span style={{color:xp>=m.xp?"#c97cf6":"rgba(200,200,255,0.3)", fontSize:10}}>
                    {xp>=m.xp?"◈":"○"}
                  </span>
                  <span style={{fontSize:10, color: xp>=m.xp?"#e0d0ff":"rgba(200,200,255,0.4)"}}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Memory / Facts */}
        <div style={{...S.panel, flex:1, overflow:"hidden", display:"flex", flexDirection:"column"}}>
          <div style={{...S.panelTitle, justifyContent:"space-between"}}>
            <span>◆ Memory ({facts.length})</span>
            <button style={{...S.btn("#fbbc04"), padding:"2px 6px", fontSize:8}}
              onClick={()=>setShowMemory(v=>!v)}>{showMemory?"▲":"▼"}</button>
          </div>
          <div style={{display:"flex", gap:4, marginBottom:6}}>
            <input style={{...S.input, flex:1, fontSize:10}} placeholder="fact = value"
              value={factInput} onChange={e=>setFactInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&factInput.includes("=")) {
                const [k,...v]=factInput.split("=");
                setFacts(p=>[...p.filter(f=>f.key!==k.trim()),{key:k.trim(),value:v.join("=").trim()}]);
                setFactInput(""); addXP(3);
              }}}/>
          </div>
          {showMemory && (
            <div style={{overflow:"auto", flex:1}}>
              {facts.length===0 ? (
                <div style={{fontSize:9, color:"rgba(200,200,255,0.3)"}}>
                  Enter: name = Luca
                </div>
              ) : facts.map((f,i)=>(
                <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"3px 0", borderBottom:"1px solid rgba(200,200,255,0.05)"}}>
                  <span style={{fontSize:10}}><span style={{color:"#fbbc04"}}>{f.key}</span>: {f.value}</span>
                  <button style={{...S.btn("#ff6b35"), padding:"1px 5px", fontSize:8}}
                    onClick={()=>setFacts(p=>p.filter((_,j)=>j!==i))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System prompt editor */}
        <div style={S.panel}>
          <div style={S.panelTitle}>⬟ System Prompt</div>
          <textarea style={{...S.input, height:70, resize:"none", fontSize:10, lineHeight:1.5}}
            value={sysPrompt} onChange={e=>setSysPrompt(e.target.value)}/>
          <button style={{...S.btn("#00c8ff",true), marginTop:4, fontSize:10}}
            onClick={()=>setSysPrompt(PERSONAS[persona].prompt)}>↺ Reset</button>
        </div>

      </div>

      {/* ╔══════════════════════════════════════════════════════
          CENTER — Chat
          ══════════════════════════════════════════════════════ */}
      <div style={S.main}>

        {/* Top status bar */}
        <div style={{ padding:"8px 16px", borderBottom:"1px solid rgba(0,200,255,0.1)",
          background:"rgba(0,15,30,0.9)", display:"flex", alignItems:"center",
          gap:12, flexWrap:"wrap" }}>

          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{width:6, height:6, borderRadius:"50%",
              background: oracleConnected?"#00ff9d":"rgba(200,200,200,0.2)",
              boxShadow: oracleConnected?"0 0 8px #00ff9d":"none"}}/>
            <span style={{fontSize:10, letterSpacing:2, color:oracleConnected?"#00ff9d":"rgba(200,200,200,0.4)"}}>
              {statusText}
            </span>
          </div>

          <div style={{flex:1}}/>

          {[
            { label:"MSGS",   val: messages.length },
            { label:"XP",     val: xp },
            { label:"FACTS",  val: facts.length },
            { label:"PHASE",  val: milestone },
            { label:"AVG",    val: avgEvo },
          ].map(item=>(
            <div key={item.label} style={{textAlign:"center"}}>
              <div style={{fontSize:14, color:"#fff", fontWeight:700}}>{item.val}</div>
              <div style={{fontSize:8, letterSpacing:2, color:"rgba(0,200,255,0.4)"}}>{item.label}</div>
            </div>
          ))}

          <div style={{display:"flex", gap:4}}>
            <button style={{...S.btn("#00c8ff"), fontSize:9, padding:"3px 8px"}}
              onClick={connectOracle}>↺ ORACLE</button>
            <button style={{...S.btn("#ff6b35"), fontSize:9, padding:"3px 8px"}}
              onClick={()=>setMessages([])}>CLR</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflow:"auto", padding:"16px", display:"flex", flexDirection:"column" }}>

          {/* Welcome */}
          {messages.length===0 && (
            <div style={{ textAlign:"center", padding:"40px 20px", color:"rgba(0,200,255,0.3)" }}>
              <div style={{fontSize:28, marginBottom:12, letterSpacing:4, color:"rgba(0,200,255,0.5)"}}>⬡</div>
              <div style={{fontSize:14, letterSpacing:3, marginBottom:8}}>
                {pers.name} · NEXUS v6.0
              </div>
              <div style={{fontSize:11, color:"rgba(0,200,255,0.25)", maxWidth:400, margin:"0 auto", lineHeight:1.8}}>
                Unified AI Operating System · Self-Evolving · Oracle Cloud {ORACLE_HOST}
              </div>
              <div style={{marginTop:20, display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center"}}>
                {["Status systemu","Jak mogę Ci pomóc?","Połącz z Oracle Cloud","Pokaż ewolucję"].map(q=>(
                  <button key={q} style={{...S.btn("#00c8ff"), fontSize:10, padding:"6px 12px"}}
                    onClick={()=>{ setInput(q); setTimeout(()=>inputRef.current?.focus(),50); }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((m,i)=>(
            <div key={i} style={S.msg(m.role)}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                <span style={{fontSize:9, letterSpacing:2,
                  color: m.role==="assistant" ? (PROVIDERS[m.src]?.color || pers.accent) : "rgba(200,200,255,0.4)"}}>
                  {m.role==="assistant" ? `${pers.icon || "◈"} ${pers.name}` : "◎ OPERATOR"} {m.src && m.role==="assistant" ? `// ${m.src}` : ""}
                </span>
                <span style={{fontSize:9, color:"rgba(200,200,255,0.3)"}}>{m.ts}</span>
              </div>
              <div style={{fontSize:13, lineHeight:1.8}}>{m.content}</div>
            </div>
          ))}

          {/* Typing */}
          {loading && (
            <div style={{...S.msg("assistant")}}>
              <div style={{display:"flex", gap:4, alignItems:"center"}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:6, height:6, borderRadius:"50%",
                    background:pers.accent, opacity:0.7,
                    animation:`pulse 1.2s ${i*0.2}s infinite`}}/>
                ))}
                <span style={{fontSize:10, color:"rgba(200,200,255,0.4)", marginLeft:6}}>
                  {pers.name} processing...
                </span>
              </div>
            </div>
          )}

          {/* Evolution notification */}
          {evolving && (
            <div style={{padding:"6px 12px", background:"rgba(124,58,237,0.1)",
              border:"1px solid rgba(124,58,237,0.3)", borderRadius:3, fontSize:10,
              color:"#c97cf6", display:"flex", alignItems:"center", gap:6}}>
              ⟳ Self-improvement cycle running...
            </div>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* Input bar */}
        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,200,255,0.1)",
          background:"rgba(0,15,30,0.95)" }}>
          <div style={{display:"flex", gap:8, alignItems:"flex-end"}}>
            <textarea
              ref={inputRef}
              rows={2}
              style={{...S.input, flex:1, resize:"none", fontSize:13, lineHeight:1.6, padding:"10px 14px"}}
              placeholder={`Wiadomość do ${pers.name}...  (Enter = wyślij, Shift+Enter = nowa linia)`}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={onKey}
            />
            <button
              style={{
                ...S.btn(pers.accent), padding:"14px 18px", fontSize:16,
                background:`rgba(${hexToRgb(pers.accent)},${loading?0.05:0.15})`,
                borderColor: loading ? "rgba(200,200,255,0.1)" : pers.accent,
                opacity: loading ? 0.5 : 1,
              }}
              onClick={sendMessage}
              disabled={loading}
            >▶</button>
          </div>
          <div style={{display:"flex", gap:6, marginTop:6, flexWrap:"wrap"}}>
            <span style={{fontSize:9, color:"rgba(200,200,255,0.25)"}}>
              {prov.icon} {prov.label} · {model}
            </span>
            <span style={{flex:1}}/>
            {["status","pomoc","ewolucja","oracle"].map(q=>(
              <button key={q} style={{...S.btn("rgba(200,200,255,0.3)"), fontSize:9, padding:"2px 7px", color:"rgba(200,200,255,0.5)"}}
                onClick={()=>{ setInput(q); inputRef.current?.focus(); }}>{q}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ╔══════════════════════════════════════════════════════
          RIGHT SIDEBAR — Oracle / Agent / SSH / Metrics
          ══════════════════════════════════════════════════════ */}
      <div style={S.sideR}>

        {/* Tabs */}
        <div style={{display:"flex", borderBottom:"1px solid rgba(0,200,255,0.1)"}}>
          {[
            { id:"agent",   label:"AGENT",   color:"#00c8ff" },
            { id:"ssh",     label:"SSH",     color:"#00ff9d" },
            { id:"metrics", label:"METRICS", color:"#ff6b35" },
          ].map(tab=>(
            <button key={tab.id}
              onClick={()=>setActivePanel(tab.id)}
              style={{
                flex:1, padding:"8px 4px", border:"none", fontSize:9, letterSpacing:2,
                fontFamily:"inherit", cursor:"pointer", transition:"all 0.2s",
                background: activePanel===tab.id ? `rgba(${hexToRgb(tab.color)},0.12)` : "transparent",
                color: activePanel===tab.id ? tab.color : "rgba(200,200,255,0.35)",
                borderBottom: activePanel===tab.id ? `1px solid ${tab.color}` : "1px solid transparent",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── AGENT PANEL ───────────────────────────────────── */}
        {activePanel==="agent" && (
          <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
            <div style={S.panel}>
              <div style={S.panelTitle}>⬡ Super Agent · Oracle {ORACLE_HOST}</div>
              <select style={{...S.select, marginBottom:6}} value={agentTask} onChange={e=>setAgentTask(e.target.value)}>
                {AGENT_TASKS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{display:"flex", gap:4, marginBottom:6}}>
                {["local","oracle","both"].map(tgt=>(
                  <button key={tgt}
                    onClick={()=>setAgentTarget(tgt)}
                    style={{...S.btn(agentTarget===tgt?"#00c8ff":"rgba(200,200,255,0.3)"), flex:1,
                      fontSize:9, padding:"4px 2px",
                      background: agentTarget===tgt?"rgba(0,200,255,0.15)":"transparent"}}>
                    {tgt.toUpperCase()}
                  </button>
                ))}
              </div>
              <button style={{...S.btn("#00c8ff",true), opacity:agentRunning?0.5:1}}
                onClick={runAgentTask} disabled={agentRunning}>
                {agentRunning ? "⟳ RUNNING..." : "▶ EXECUTE TASK"}
              </button>
            </div>

            {/* Task log */}
            <div style={{...S.panel, flex:1, overflow:"auto"}}>
              <div style={S.panelTitle}>Task Log</div>
              {agentTasks.length===0 ? (
                <div style={{fontSize:9, color:"rgba(200,200,255,0.25)"}}>No tasks yet.</div>
              ) : agentTasks.map((t,i)=>(
                <div key={i} style={{padding:"6px 0", borderBottom:"1px solid rgba(0,200,255,0.05)"}}>
                  <div style={{display:"flex", justifyContent:"space-between"}}>
                    <span style={{fontSize:10, color:"#00c8ff"}}>{t.task}</span>
                    <span style={{...S.tag(t.status==="done"?"#00ff9d":t.status==="running"?"#fbbc04":"#ff6b35"), fontSize:8}}>
                      {t.status}
                    </span>
                  </div>
                  <div style={{fontSize:9, color:"rgba(200,200,255,0.4)"}}>
                    {t.target} · {t.ts}
                  </div>
                  {t.result && (
                    <div style={{fontSize:9, color:"rgba(200,200,255,0.6)", marginTop:3,
                      background:"rgba(0,200,255,0.04)", padding:"4px 6px", borderRadius:2}}>
                      {t.result.slice(0,120)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Alerts */}
            {alerts.length>0 && (
              <div style={{...S.panel}}>
                <div style={S.panelTitle}>⚠ Alerts</div>
                {alerts.slice(0,3).map((a,i)=>(
                  <div key={i} style={{fontSize:9, color:"#ff6b35", padding:"2px 0"}}>{a.ts} {a.message||JSON.stringify(a).slice(0,60)}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SSH PANEL ─────────────────────────────────────── */}
        {activePanel==="ssh" && (
          <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
            <div style={S.panel}>
              <div style={S.panelTitle}>⬡ SSH · ubuntu@{ORACLE_HOST}</div>
              <div style={{fontSize:9, color:"rgba(200,200,255,0.3)", marginBottom:6}}>
                Key: ~/colette.key · Port 22
              </div>
              <div style={{display:"flex", gap:4}}>
                <input style={{...S.input, flex:1, fontSize:11}}
                  placeholder="command..."
                  value={sshCmd} onChange={e=>setSSHCmd(e.target.value)}
                  onKeyDown={onSSHKey}/>
                <button style={{...S.btn("#00ff9d"), padding:"5px 8px"}}
                  onClick={runSSH} disabled={sshRunning}>▶</button>
              </div>

              {/* Quick commands */}
              <div style={{marginTop:6, display:"flex", gap:4, flexWrap:"wrap"}}>
                {["uptime","df -h /","free -h","systemctl status jarvis","journalctl -u jarvis -n 20"].map(cmd=>(
                  <button key={cmd}
                    style={{...S.btn("rgba(0,255,157,0.4)"), fontSize:8, padding:"2px 6px", color:"rgba(0,255,157,0.7)"}}
                    onClick={()=>{ setSshCmd(cmd); }}>
                    {cmd.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* SSH log */}
            <div style={{flex:1, overflow:"auto", padding:"8px 14px",
              background:"rgba(0,255,157,0.02)", fontFamily:"monospace"}}>
              {sshRunning && (
                <div style={{color:"rgba(0,255,157,0.5)", fontSize:10, marginBottom:4}}>
                  ⟳ Executing...
                </div>
              )}
              {sshLog.length===0 ? (
                <div style={{fontSize:9, color:"rgba(0,255,157,0.2)"}}>
                  SSH terminal ready.{"\n"}Connect Oracle for live execution.
                </div>
              ) : sshLog.map((entry,i)=>(
                <div key={i} style={{marginBottom:8}}>
                  <div style={{color:"#00ff9d", fontSize:10}}>
                    ubuntu@oracle:~$ {entry.cmd}
                  </div>
                  {entry.out && (
                    <div style={{fontSize:10, color:"rgba(200,255,220,0.7)", marginTop:2, whiteSpace:"pre-wrap"}}>
                      {entry.out}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* SSH setup hint */}
            <div style={{...S.panel, fontSize:9, color:"rgba(200,200,255,0.25)"}}>
              <div>Local SSH (Termux):</div>
              <div style={{color:"rgba(0,255,157,0.4)", marginTop:2}}>
                ssh -i ~/colette.key ubuntu@{ORACLE_HOST}
              </div>
            </div>
          </div>
        )}

        {/* ── METRICS PANEL ─────────────────────────────────── */}
        {activePanel==="metrics" && (
          <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"auto"}}>
            <div style={S.panel}>
              <div style={S.panelTitle}>⬡ Oracle Cloud Live Metrics</div>
              <div style={{fontSize:9, color:oracleConnected?"#00ff9d":"rgba(200,200,255,0.25)", marginBottom:8}}>
                {oracleConnected ? `● LIVE · ${ORACLE_HOST}` : `○ Offline · Connect to activate`}
              </div>

              {[
                { label:"CPU",    val:metrics.cpu_pct||0,  max:100, unit:"%",  color:"#00c8ff" },
                { label:"RAM",    val:metrics.mem_pct||0,  max:100, unit:"%",  color:"#c97cf6" },
                { label:"DISK",   val:metrics.disk_pct||0, max:100, unit:"%",  color:"#fbbc04" },
              ].map(m=>(
                <div key={m.label} style={{marginBottom:10}}>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:3}}>
                    <span style={{fontSize:9, color:"rgba(200,200,255,0.5)", letterSpacing:2}}>{m.label}</span>
                    <span style={{fontSize:11, color:m.val>80?"#ff6b35":m.color, fontWeight:700}}>
                      {m.val.toFixed(1)}{m.unit}
                    </span>
                  </div>
                  <div style={{background:"rgba(200,200,255,0.06)", borderRadius:2, height:3}}>
                    <div style={{
                      width:`${Math.min(m.val,100)}%`, height:3, borderRadius:2, transition:"width 1s",
                      background:`linear-gradient(90deg,${m.color},${m.val>80?"#ff6b35":m.color})`,
                    }}/>
                  </div>
                </div>
              ))}

              {metrics.uptime_sec > 0 && (
                <div style={S.metric}>
                  <span style={{fontSize:9, color:"rgba(200,200,255,0.4)"}}>UPTIME</span>
                  <span style={{fontSize:10, color:"#00ff9d"}}>
                    {Math.floor((metrics.uptime_sec||0)/3600)}h {Math.floor(((metrics.uptime_sec||0)%3600)/60)}m
                  </span>
                </div>
              )}
            </div>

            {/* Quick API health */}
            <div style={S.panel}>
              <div style={S.panelTitle}>API Endpoints</div>
              {[
                { path:"/api/status",        label:"Status" },
                { path:"/api/agent/status",  label:"Agent"  },
                { path:"/api/ssh/status",    label:"SSH"    },
                { path:"/metrics",           label:"Prometheus" },
                { path:"/docs",              label:"API Docs" },
              ].map(ep=>(
                <div key={ep.path} style={S.metric}>
                  <span style={{fontSize:9, color:"rgba(200,200,255,0.5)"}}>{ep.label}</span>
                  <a href={`http://${ORACLE_HOST}${ep.path}`} target="_blank" rel="noreferrer"
                    style={{fontSize:9, color:"rgba(0,200,255,0.5)", textDecoration:"none"}}>
                    /{ep.path.split("/").pop()} ↗
                  </a>
                </div>
              ))}
            </div>

            {/* Evolution chart */}
            {evoScores.length > 0 && (
              <div style={S.panel}>
                <div style={S.panelTitle}>Evolution Quality History</div>
                <div style={{display:"flex", alignItems:"flex-end", gap:2, height:40}}>
                  {evoScores.slice(-20).map((s,i)=>{
                    const avg = (s.clarity+s.accuracy+s.helpfulness)/3;
                    const pct = (avg/10)*100;
                    const col = avg>7?"#00ff9d":avg>5?"#fbbc04":"#ff6b35";
                    return (
                      <div key={i} title={`${avg.toFixed(1)} avg`} style={{
                        width:8, borderRadius:"1px 1px 0 0",
                        height:`${pct}%`, background:col, opacity:0.7, flex:1,
                      }}/>
                    );
                  })}
                </div>
                <div style={{display:"flex", justifyContent:"space-between", marginTop:3}}>
                  <span style={{fontSize:8, color:"rgba(200,200,255,0.3)"}}>oldest</span>
                  <span style={{fontSize:8, color:"rgba(200,200,255,0.3)"}}>latest · avg {avgEvo}</span>
                </div>
              </div>
            )}

            {/* COLETTE Orchestrator */}
            <div style={S.panel}>
              <div style={S.panelTitle}>⬡ COLETTE Orchestrator</div>
              <div style={{fontSize:9, color:"rgba(200,200,255,0.35)", lineHeight:1.8}}>
                <div>Layer 1: Ingestion & Discovery</div>
                <div>Layer 2: Unified Environment</div>
                <div>Layer 3: Execution + WS Broadcast</div>
              </div>
              <button style={{...S.btn("#c97cf6",true), marginTop:6, fontSize:9}}
                onClick={()=>{
                  if(oracleConnected && wsRef.current?.readyState===1) {
                    wsRef.current.send(JSON.stringify({type:"agent_task",task:"system_info",target:"oracle",payload:{}}));
                  }
                  appendMsg("system","⬡ COLETTE init triggered → Oracle Cloud");
                }}>
                ▶ INIT COLETTE
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Global animation styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(0,200,255,0.2); border-radius:2px; }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        select option { background: #020810; }
        button:hover { filter: brightness(1.2); }
        a:hover { color: #00c8ff !important; }
      `}</style>
    </div>
  );
}
