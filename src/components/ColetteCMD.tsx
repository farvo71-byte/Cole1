// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import {
  Cpu, Zap, Radio, Search, Send, Mic, Terminal, Activity,
  Grid3x3, Database, Shield, GitBranch, Layers, Box,
  ChevronRight, X, Minimize2, Maximize2, RotateCcw,
  Eye, Code2, Network, Lock, Crosshair, Wifi
} from "lucide-react";

// ═══════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════

function useSystemMetrics() {
  const [metrics, setMetrics] = useState({
    cpu: 23.4, neural: 98.7, latency: 12, sync: 94.2,
    memory: 67.1, bandwidth: 842, packets: 19403, uptime: 847392
  });
  useEffect(() => {
    const t = setInterval(() => {
      setMetrics(m => ({
        cpu:       clamp(m.cpu       + (Math.random() - 0.5) * 4,     5,  95),
        neural:    clamp(m.neural    + (Math.random() - 0.5) * 1.5,  88, 100),
        latency:   clamp(m.latency   + (Math.random() - 0.5) * 3,     4,  45),
        sync:      clamp(m.sync      + (Math.random() - 0.5) * 2,    85, 100),
        memory:    clamp(m.memory    + (Math.random() - 0.5) * 3,    40,  92),
        bandwidth: clamp(m.bandwidth + (Math.random() - 0.5) * 80,  400, 1200),
        packets:   m.packets + Math.floor(Math.random() * 120),
        uptime:    m.uptime + 1,
      }));
    }, 1600);
    return () => clearInterval(t);
  }, []);
  return metrics;
}

function useTypewriter(text, speed = 28) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(t); setDone(true); }
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return { displayed, done };
}

function useParallax() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const handleMove = useCallback(e => {
    const cx = (e.clientX / window.innerWidth  - 0.5) * 24;
    const cy = (e.clientY / window.innerHeight - 0.5) * 24;
    x.set(cx); y.set(cy);
  }, [x, y]);
  return { x, y, handleMove };
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function fmt(n, d = 1) { return n.toFixed(d); }
function fmtUptime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
}

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════

const SPRING = { type: "spring", stiffness: 100, damping: 20 };
const SPRING_FAST = { type: "spring", stiffness: 180, damping: 22 };

const INIT_MESSAGES = [
  { id: 1, role: "system", text: "COLETTE Neural Core v6.0 — Initialization complete. All subsystems nominal." },
  { id: 2, role: "colette", text: "Good evening. Neural synchronization at 94.2%. I've completed the threat-surface analysis and preloaded contextual memory from your last 847 sessions. What would you like to explore today?" },
  { id: 3, role: "user", text: "Run a deep scan on the Nexus cluster. I need latency diagnostics and anomaly detection." },
  { id: 4, role: "colette", text: "Acknowledged. Initiating deep packet inspection across all 17 Nexus nodes. Estimated completion: 8 seconds. Anomaly detection threshold set to σ > 2.1. I'll flag anything unusual immediately." },
];

const MODULES = [
  { id: "MOD-01", name: "Nexus Scanner",  icon: Network,  status: "active",  load: 78 },
  { id: "MOD-02", name: "Threat Matrix",  icon: Shield,   status: "active",  load: 34 },
  { id: "MOD-03", name: "Code Weaver",    icon: Code2,    status: "idle",    load: 0  },
  { id: "MOD-04", name: "Memory Vault",   icon: Database, status: "idle",    load: 12 },
  { id: "MOD-05", name: "Git Synapse",    icon: GitBranch,status: "standby", load: 5  },
  { id: "MOD-06", name: "Layer Protocol", icon: Layers,   status: "active",  load: 61 },
];

const QUICK_ACTIONS = [
  { id: "scan",   label: "Deep Scan",      icon: Eye,      color: "#22d3ee" },
  { id: "mem",    label: "Memory Wipe",    icon: RotateCcw,color: "#f59e0b" },
  { id: "lock",   label: "Lockdown",       icon: Lock,     color: "#3b82f6" },
  { id: "grid",   label: "Grid Analysis",  icon: Grid3x3,  color: "#22d3ee" },
  { id: "code",   label: "Code Mode",      icon: Terminal, color: "#3b82f6" },
  { id: "net",    label: "Net Topology",   icon: Network,  color: "#22d3ee" },
];

// ═══════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════

// Holographic corner bracket hover effect
function HoverTarget({ children, className = "" }) {
  const [hov, setHov] = useState(false);
  return (
    <div className={`relative ${className}`}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <AnimatePresence>
        {hov && (
          <>
            {[["top-0 left-0","border-t border-l"],["top-0 right-0","border-t border-r"],
              ["bottom-0 left-0","border-b border-l"],["bottom-0 right-0","border-b border-r"]
            ].map(([pos, bor], i) => (
              <motion.div key={i}
                className={`absolute w-2.5 h-2.5 ${pos} ${bor} border-cyan-400 z-20 pointer-events-none`}
                initial={{ opacity: 0, scale: 1.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING_FAST}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}

// Ripple shockwave on click
function RippleButton({ children, onClick, className = "", style = {} }) {
  const [ripples, setRipples] = useState([]);
  const btnRef = useRef(null);
  function handleClick(e) {
    const r = btnRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const id = `ripple_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    onClick?.(e);
  }
  return (
    <button ref={btnRef} onClick={handleClick} className={`relative overflow-hidden ${className}`} style={style}>
      {ripples.map(r => (
        <motion.span key={r.id}
          className="absolute rounded-full bg-cyan-400 pointer-events-none"
          style={{ left: r.x - 8, top: r.y - 8, width: 16, height: 16 }}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 12, opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}
      {children}
    </button>
  );
}

// Scanning line for active modules
function ScanLine({ color = "#22d3ee" }) {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none"
      style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.7 }}
      initial={{ top: "0%" }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
    />
  );
}

// Metric bar
function MetricBar({ value, color = "#22d3ee", height = 2 }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: "rgba(34,211,238,0.08)" }}>
      <motion.div className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 6px ${color}66` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={SPRING}
      />
    </div>
  );
}

// Glitch typewriter
function GlitchText({ text, speed = 22 }) {
  const { displayed, done } = useTypewriter(text, speed);
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    if (!done) {
      const t = setTimeout(() => setGlitch(true), 80);
      const t2 = setTimeout(() => setGlitch(false), 130);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [displayed, done]);
  return (
    <span style={{
      filter: glitch ? "blur(0.5px)" : "none",
      letterSpacing: glitch ? "0.02em" : "normal",
      transition: "filter 0.05s, letter-spacing 0.05s",
    }}>
      {displayed}
      {!done && (
        <motion.span
          className="inline-block w-0.5 h-4 bg-cyan-400 ml-0.5 align-text-bottom"
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.45 }}
        />
      )}
    </span>
  );
}

// Neural Orb
function NeuralOrb({ state = "idle" }) {
  const configs = {
    idle:     { r: 48, speed: 3.5, rings: 2, glow: 0.25 },
    thinking: { r: 52, speed: 1.2, rings: 4, glow: 0.45 },
    speaking: { r: 56, speed: 0.7, rings: 5, glow: 0.65 },
  };
  const c = configs[state];
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      {/* outer atmosphere */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 160, height: 160, background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: c.speed * 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* rings */}
      {Array.from({ length: c.rings }).map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full border border-cyan-400"
          style={{
            width: 60 + i * 24, height: 60 + i * 24,
            opacity: 0.12 - i * 0.015,
            borderColor: i % 2 === 0 ? "#22d3ee" : "#3b82f6",
          }}
          animate={{ scale: [1, 1.08, 1], rotate: [0, i % 2 === 0 ? 360 : -360] }}
          transition={{ duration: c.speed + i * 0.8, repeat: Infinity, ease: "linear" }}
        />
      ))}
      {/* core orb */}
      <motion.div
        className="relative rounded-full flex items-center justify-center z-10"
        style={{
          width: c.r * 2, height: c.r * 2,
          background: "radial-gradient(circle at 38% 35%, rgba(100,220,255,0.35) 0%, rgba(34,211,238,0.18) 40%, rgba(15,40,80,0.95) 100%)",
          border: "1px solid rgba(34,211,238,0.4)",
          boxShadow: `0 0 ${30 + c.glow * 60}px rgba(34,211,238,${c.glow}), inset 0 0 20px rgba(34,211,238,0.08)`,
          willChange: "transform",
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: c.speed, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* inner glyph */}
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="7" stroke="#22d3ee" strokeWidth="0.8" opacity="0.6"/>
          <circle cx="18" cy="18" r="3" fill="#22d3ee" opacity="0.9"/>
          {[0,60,120,180,240,300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 18 + Math.cos(rad) * 7, y1 = 18 + Math.sin(rad) * 7;
            const x2 = 18 + Math.cos(rad) * 14, y2 = 18 + Math.sin(rad) * 14;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3b82f6" strokeWidth="0.6" opacity="0.4"/>;
          })}
          <circle cx="18" cy="18" r="14" stroke="#3b82f6" strokeWidth="0.4" strokeDasharray="3 5" opacity="0.3"/>
        </svg>
      </motion.div>
      {/* state label */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{ fontSize: 8, letterSpacing: 3, color: "rgba(34,211,238,0.5)", textTransform: "uppercase" }}>
        {state}
      </div>
    </div>
  );
}

// Digital rain background
function DigitalRain() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / 20);
    const drops = Array(cols).fill(0).map(() => Math.random() * -50);
    const chars = "01アイウエオカキクケコサシスセソタチツテトABCDEF0123456789◈⬡◉▣⬟";
    let raf;
    function draw() {
      ctx.fillStyle = "rgba(2,6,23,0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "11px monospace";
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const alpha = Math.random() > 0.92 ? 0.6 : 0.06;
        ctx.fillStyle = `rgba(34,211,238,${alpha})`;
        ctx.fillText(char, i * 20, y * 20);
        if (y * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        else drops[i] += 0.4;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.18, zIndex: 0 }}/>;
}

// Grid background with parallax
function HoloGrid({ mx, my }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ x: mx, y: my, willChange: "transform", zIndex: 0 }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(34,211,238,0.04)" strokeWidth="0.5"/>
          </pattern>
          <pattern id="grid-lg" width="240" height="240" patternUnits="userSpaceOnUse">
            <path d="M 240 0 L 0 0 0 240" fill="none" stroke="rgba(59,130,246,0.05)" strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        <rect width="100%" height="100%" fill="url(#grid-lg)"/>
      </svg>
    </motion.div>
  );
}

// Glass panel wrapper
function GlassPanel({ children, className = "", style = {}, animate, initial, transition, layoutId }) {
  return (
    <motion.div
      layoutId={layoutId}
      initial={initial}
      animate={animate}
      transition={transition}
      className={`relative ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(15,25,50,0.75) 0%, rgba(8,18,40,0.85) 100%)",
        border: "1px solid rgba(34,211,238,0.12)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        boxShadow: "0 0 40px rgba(34,211,238,0.03), inset 0 1px 0 rgba(34,211,238,0.06)",
        willChange: "transform",
        ...style,
      }}
    >
      {/* top border glow */}
      <div className="absolute top-0 left-4 right-4 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.25), transparent)" }}/>
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function ColetteCMD({ onBack }) {
  const metrics  = useSystemMetrics();
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [input,    setInput]    = useState("");
  const [orbState, setOrbState] = useState("idle");
  const [booted,   setBooted]   = useState(false);
  const [search,   setSearch]   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedMod, setExpandedMod] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [msgKey, setMsgKey] = useState(null);
  const bottomRef = useRef(null);
  const { x: mx, y: my, handleMove } = useParallax();
  const springX = useSpring(mx, { stiffness: 40, damping: 18 });
  const springY = useSpring(my, { stiffness: 40, damping: 18 });

  // Boot sequence
  useEffect(() => { setTimeout(() => setBooted(true), 300); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage() {
    const txt = input.trim();
    if (!txt) return;
    const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setMessages(m => [...m, { id: uid, role: "user", text: txt }]);
    setInput(""); setOrbState("thinking");

    try {
      const historyPayload = messages.slice(-14).map(msg => ({
        role: msg.role === "colette" ? "assistant" : "user",
        content: msg.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: txt,
          persona: "colette",
          history: historyPayload
        })
      });
      const data = await res.json();
      const aid = `colette_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      setMessages(m => [...m, {
        id: aid,
        role: "colette",
        text: data.reply || "Neural Core reported empty signal."
      }]);
      setMsgKey(aid);
    } catch (e) {
      const aid = `colette_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setMessages(m => [...m, {
        id: aid, role: "colette",
        text: `Operating via backup local neural synthesis. ${
          txt.toLowerCase().includes("scan")
            ? "Scan initiated across all endpoints. Detected 0 anomalies. All nodes reporting nominal latency (avg 11ms)."
            : txt.toLowerCase().includes("code")
            ? "Code Weaver module activated. Ready to parse, refactor, or generate. Awaiting your specification."
            : "Request acknowledged. Contextual memory loaded. I've cross-referenced 2,847 relevant data points."
        }`
      }]);
      setMsgKey(aid);
    }

    setOrbState("speaking");
    setTimeout(() => setOrbState("idle"), 4000);
  }

  function handleAction(id) {
    setActiveAction(id);
    setTimeout(() => setActiveAction(null), 1200);
  }

  // Container stagger
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const panelVariants = {
    hidden:  { opacity: 0, y: 16, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0,  filter: "blur(0px)", transition: SPRING },
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col select-none"
      style={{ background: "#020617", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: "#e2e8f0" }}
      onMouseMove={handleMove}
    >
      {/* ── Atmosphere ─────────────────────────────────── */}
      <DigitalRain />
      <HoloGrid mx={springX} my={springY} />

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(2,6,23,0.7) 100%)" }}/>

      {/* Boot overlay */}
      <AnimatePresence>
        {!booted && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "#020617" }}
            exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <motion.div className="text-center"
              animate={{ opacity: [0, 1, 0.7, 1] }}
              transition={{ duration: 1.2, repeat: 1 }}>
              <div style={{ fontSize: 10, letterSpacing: 6, color: "#22d3ee", marginBottom: 12 }}>
                INITIALIZING COLETTE NEURAL CORE
              </div>
              <div style={{ width: 280, height: 1, background: "linear-gradient(90deg,transparent,#22d3ee,transparent)", margin: "0 auto" }}/>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════
          MAIN LAYOUT
          ═══════════════════════════════════════════════ */}
      <motion.div
        className="relative z-10 flex flex-col h-full"
        variants={containerVariants}
        initial="hidden"
        animate={booted ? "visible" : "hidden"}
      >

        {/* ── TOP HUD BAR ─────────────────────────────── */}
        <motion.div variants={panelVariants}>
          <GlassPanel
            className="mx-3 mt-3 rounded-xl"
            style={{ borderRadius: 12 }}
          >
            <div className="flex items-center gap-4 px-5 py-3">
              {/* Back Button */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 px-2.5 py-1 rounded border border-cyan-400/20 bg-cyan-400/5 hover:bg-cyan-400/15 text-cyan-400 cursor-pointer transition-all duration-200"
                  style={{ fontSize: 9, letterSpacing: 1.5, marginRight: 2 }}
                >
                  ◀ MENU
                </button>
              )}
              {/* Logo + status */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <motion.div className="absolute inset-0 rounded-lg"
                    style={{ border: "1px solid rgba(34,211,238,0.4)", boxShadow: "0 0 14px rgba(34,211,238,0.2)" }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}/>
                  <span style={{ fontSize: 14, color: "#22d3ee" }}>⬡</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#22d3ee" }}>COLETTE</div>
                  <div style={{ fontSize: 8, letterSpacing: 2, color: "rgba(34,211,238,0.4)" }}>NEURAL CORE v6.0</div>
                </div>
              </div>

              {/* divider */}
              <div className="h-8 w-px mx-1" style={{ background: "rgba(34,211,238,0.1)" }}/>

              {/* Live metrics strip */}
              <div className="flex items-center gap-5 flex-1 min-w-0">
                {[
                  { icon: Cpu,      label: "CPU",    val: `${fmt(metrics.cpu)}%`,   warn: metrics.cpu > 80 },
                  { icon: Zap,      label: "NEURAL", val: `${fmt(metrics.neural)}%`, warn: false },
                  { icon: Radio,    label: "LATENCY",val: `${fmt(metrics.latency, 0)}ms`, warn: metrics.latency > 35 },
                  { icon: Activity, label: "SYNC",   val: `${fmt(metrics.sync)}%`,  warn: false },
                  { icon: Wifi,     label: "BW",     val: `${fmt(metrics.bandwidth, 0)} MB/s`, warn: false },
                ].map(({ icon: Icon, label, val, warn }) => (
                  <HoverTarget key={label} className="flex items-center gap-1.5 cursor-default">
                    <Icon size={10} style={{ color: warn ? "#f59e0b" : "rgba(34,211,238,0.5)" }}/>
                    <span style={{ fontSize: 8, letterSpacing: 1.5, color: "rgba(200,220,255,0.4)" }}>{label}</span>
                    <motion.span
                      key={val}
                      style={{ fontSize: 11, color: warn ? "#f59e0b" : "#22d3ee", fontWeight: 600, minWidth: 48 }}
                      initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >{val}</motion.span>
                  </HoverTarget>
                ))}
                <div className="hidden xl:block text-right" style={{ fontSize: 8, color: "rgba(34,211,238,0.28)", letterSpacing: 1 }}>
                  UPTIME {fmtUptime(metrics.uptime)}
                </div>
              </div>

              {/* Omni-search */}
              <motion.div
                className="flex items-center gap-2 rounded-full cursor-pointer"
                style={{
                  background: "rgba(34,211,238,0.04)",
                  border: "1px solid rgba(34,211,238,0.15)",
                  padding: "6px 14px",
                  boxShadow: searchOpen ? "0 0 16px rgba(34,211,238,0.15)" : "none",
                }}
                animate={{ width: searchOpen ? 220 : 120 }}
                transition={SPRING}
                onClick={() => !searchOpen && setSearchOpen(true)}
              >
                <Search size={12} style={{ color: "#22d3ee", flexShrink: 0 }}/>
                {searchOpen ? (
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onBlur={() => { setSearchOpen(false); setSearch(""); }}
                    placeholder="Command palette..."
                    className="bg-transparent outline-none flex-1 min-w-0"
                    style={{ fontSize: 10, color: "#e2e8f0", letterSpacing: 0.5 }}
                  />
                ) : (
                  <span style={{ fontSize: 9, letterSpacing: 2, color: "rgba(34,211,238,0.45)" }}>SEARCH</span>
                )}
                {searchOpen && <X size={10} style={{ color: "rgba(34,211,238,0.4)", cursor: "pointer" }}
                  onClick={e => { e.stopPropagation(); setSearchOpen(false); setSearch(""); }}/>}
              </motion.div>

              {/* Window controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {[Minimize2, Maximize2, X].map((Icon, i) => (
                  <HoverTarget key={i}>
                    <div className="w-6 h-6 rounded flex items-center justify-center cursor-pointer"
                      style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.12)" }}>
                      <Icon size={10} style={{ color: "rgba(34,211,238,0.5)" }}/>
                    </div>
                  </HoverTarget>
                ))}
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ── MAIN CONTENT ────────────────────────────── */}
        <div className="flex flex-1 gap-3 px-3 py-3 min-h-0">

          {/* ── LEFT: Mini status panel ─────────────── */}
          <motion.div variants={panelVariants} className="hidden lg:flex flex-col gap-3" style={{ width: 180, flexShrink: 0 }}>
            <GlassPanel className="rounded-xl flex-1" style={{ borderRadius: 12 }}>
              <div className="p-4 h-full flex flex-col gap-4">
                <div style={{ fontSize: 8, letterSpacing: 3, color: "rgba(34,211,238,0.4)" }}>SYSTEM VITALS</div>
                {[
                  { label: "CPU LOAD",  val: metrics.cpu,    unit: "%" },
                  { label: "MEMORY",    val: metrics.memory, unit: "%" },
                  { label: "NEURAL",    val: metrics.neural, unit: "%" },
                  { label: "NET SYNC",  val: metrics.sync,   unit: "%" },
                ].map(({ label, val, unit }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span style={{ fontSize: 7, letterSpacing: 2, color: "rgba(200,220,255,0.35)" }}>{label}</span>
                      <span style={{ fontSize: 9, color: "#22d3ee", fontWeight: 600 }}>{fmt(val)}{unit}</span>
                    </div>
                    <MetricBar value={val} color={val > 80 ? "#f59e0b" : "#22d3ee"} height={2}/>
                  </div>
                ))}

                <div className="mt-auto pt-3" style={{ borderTop: "1px solid rgba(34,211,238,0.07)" }}>
                  <div style={{ fontSize: 7, letterSpacing: 2, color: "rgba(34,211,238,0.3)", marginBottom: 6 }}>DATA STREAM</div>
                  {[
                    { label: "PACKETS", val: metrics.packets.toLocaleString() },
                    { label: "BW", val: `${fmt(metrics.bandwidth, 0)} MB/s` },
                    { label: "LATENCY", val: `${fmt(metrics.latency, 0)} ms` },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between py-0.5">
                      <span style={{ fontSize: 7, color: "rgba(200,220,255,0.3)" }}>{label}</span>
                      <motion.span key={val} style={{ fontSize: 8, color: "rgba(34,211,238,0.7)", fontWeight: 600 }}
                        initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>{val}</motion.span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassPanel>
          </motion.div>

          {/* ── CENTER: Chat + Orb ──────────────────── */}
          <motion.div variants={panelVariants} className="flex-1 flex flex-col gap-3 min-w-0">

            {/* Chat stream */}
            <GlassPanel className="rounded-xl flex-1 flex flex-col min-h-0" style={{ borderRadius: 12 }}>
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(34,211,238,0.06)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 6px #22d3ee", animation: "pulse 2s infinite" }}/>
                <span style={{ fontSize: 8, letterSpacing: 3, color: "rgba(34,211,238,0.4)" }}>NEURAL COMM STREAM</span>
                <div className="flex-1"/>
                <span style={{ fontSize: 7, color: "rgba(34,211,238,0.25)", letterSpacing: 1 }}>
                  {messages.length} TRANSMISSIONS
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(34,211,238,0.15) transparent" }}>
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20, filter: "blur(3px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      transition={SPRING}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "system" ? (
                        <div className="w-full py-1.5 px-3 rounded text-center"
                          style={{ fontSize: 8, letterSpacing: 2, color: "rgba(34,211,238,0.4)", background: "rgba(34,211,238,0.03)", border: "1px solid rgba(34,211,238,0.07)" }}>
                          ◈ {msg.text}
                        </div>
                      ) : (
                        <div style={{
                          maxWidth: "75%",
                          background: msg.role === "user"
                            ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(34,211,238,0.1))"
                            : "linear-gradient(135deg, rgba(15,30,65,0.9), rgba(10,20,50,0.95))",
                          border: msg.role === "user"
                            ? "1px solid rgba(59,130,246,0.25)"
                            : "1px solid rgba(34,211,238,0.12)",
                          borderRadius: msg.role === "user" ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                          padding: "10px 14px",
                          boxShadow: msg.role === "colette" ? "0 0 20px rgba(34,211,238,0.04)" : "none",
                        }}>
                          {msg.role === "colette" && (
                            <div style={{ fontSize: 7, letterSpacing: 2, color: "rgba(34,211,238,0.4)", marginBottom: 5 }}>
                              COLETTE · {new Date().toLocaleTimeString()}
                            </div>
                          )}
                          <div style={{ fontSize: 12, lineHeight: 1.7, color: msg.role === "user" ? "#c8ddf0" : "#d1e8f5" }}>
                            {msg.id === msgKey
                              ? <GlitchText text={msg.text} />
                              : msg.text}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={bottomRef}/>
              </div>

              {/* Input bar */}
              <div className="px-4 pb-4 pt-2" style={{ borderTop: "1px solid rgba(34,211,238,0.06)" }}>
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{
                  background: "rgba(34,211,238,0.03)",
                  border: "1px solid rgba(34,211,238,0.15)",
                  boxShadow: "0 0 20px rgba(34,211,238,0.04)",
                }}>
                  <ChevronRight size={12} style={{ color: "#22d3ee", flexShrink: 0 }}/>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder="SYSTEM READY · AWAITING COMMAND_"
                    className="flex-1 bg-transparent outline-none"
                    style={{ fontSize: 11, color: "#e2e8f0", letterSpacing: 0.3 }}
                  />
                  <Mic size={12} style={{ color: "rgba(34,211,238,0.35)", cursor: "pointer" }}/>
                  <RippleButton onClick={sendMessage}
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.25)" }}>
                    <Send size={11} style={{ color: "#22d3ee" }}/>
                  </RippleButton>
                </div>
              </div>
            </GlassPanel>

            {/* ── BOTTOM TACTICAL GRID ─────────────────── */}
            <motion.div variants={panelVariants}>
              <GlassPanel className="rounded-xl" style={{ borderRadius: 12 }}>
                <div className="px-4 pt-3 pb-3">
                  <div style={{ fontSize: 7, letterSpacing: 3, color: "rgba(34,211,238,0.35)", marginBottom: 10 }}>
                    TACTICAL ACTION GRID
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {QUICK_ACTIONS.map(({ id, label, icon: Icon, color }) => (
                      <HoverTarget key={id}>
                        <RippleButton
                          onClick={() => handleAction(id)}
                          className="relative w-full rounded-lg flex flex-col items-center gap-1.5 py-2.5"
                          style={{
                            background: activeAction === id ? `rgba(34,211,238,0.15)` : "rgba(34,211,238,0.04)",
                            border: `1px solid ${activeAction === id ? "rgba(34,211,238,0.5)" : "rgba(34,211,238,0.1)"}`,
                            transition: "background 0.2s, border-color 0.2s",
                            boxShadow: activeAction === id ? "0 0 16px rgba(34,211,238,0.2)" : "none",
                          }}
                        >
                          <Icon size={14} style={{ color }}/>
                          <span style={{ fontSize: 7, letterSpacing: 1.5, color: "rgba(200,220,255,0.5)", textAlign: "center" }}>
                            {label}
                          </span>
                        </RippleButton>
                      </HoverTarget>
                    ))}
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Orb + Module Matrix ─────────── */}
          <motion.div variants={panelVariants} className="flex flex-col gap-3" style={{ width: 220, flexShrink: 0 }}>

            {/* Neural Orb panel */}
            <GlassPanel className="rounded-xl" style={{ borderRadius: 12 }}>
              <div className="flex flex-col items-center py-5 px-3">
                <div style={{ fontSize: 7, letterSpacing: 3, color: "rgba(34,211,238,0.35)", marginBottom: 12 }}>
                  COLETTE PRESENCE
                </div>
                <NeuralOrb state={orbState}/>
                <div className="flex gap-2 mt-4">
                  {["idle","thinking","speaking"].map(s => (
                    <button key={s} onClick={() => setOrbState(s)}
                      className="rounded px-2 py-1 cursor-pointer"
                      style={{
                        fontSize: 7, letterSpacing: 1.5, textTransform: "uppercase",
                        background: orbState === s ? "rgba(34,211,238,0.15)" : "rgba(34,211,238,0.04)",
                        border: `1px solid ${orbState === s ? "rgba(34,211,238,0.35)" : "rgba(34,211,238,0.09)"}`,
                        color: orbState === s ? "#22d3ee" : "rgba(34,211,238,0.35)",
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </GlassPanel>

            {/* App Ecosystem Matrix */}
            <GlassPanel className="rounded-xl flex-1 flex flex-col min-h-0" style={{ borderRadius: 12 }}>
              <div className="px-4 pt-3 pb-2" style={{ borderBottom: "1px solid rgba(34,211,238,0.06)" }}>
                <div style={{ fontSize: 7, letterSpacing: 3, color: "rgba(34,211,238,0.35)" }}>APP ECOSYSTEM MATRIX</div>
              </div>
              <div className="flex-1 overflow-auto px-3 py-2 space-y-1.5">
                <AnimatePresence>
                  {MODULES.map((mod) => {
                    const Icon = mod.icon;
                    const isActive = mod.status === "active";
                    const isExpanded = expandedMod === mod.id;
                    return (
                      <motion.div key={mod.id}
                        layoutId={`mod-${mod.id}`}
                        onClick={() => setExpandedMod(isExpanded ? null : mod.id)}
                        className="relative overflow-hidden rounded-lg cursor-pointer"
                        style={{
                          background: isActive ? "rgba(34,211,238,0.05)" : "rgba(34,211,238,0.02)",
                          border: `1px solid ${isActive ? "rgba(34,211,238,0.2)" : "rgba(34,211,238,0.07)"}`,
                          padding: "8px 10px",
                        }}
                        whileHover={{ borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.07)" }}
                        transition={SPRING_FAST}
                      >
                        {/* scanning line on active */}
                        {isActive && <ScanLine color="#22d3ee"/>}

                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: isActive ? "rgba(34,211,238,0.12)" : "rgba(34,211,238,0.05)" }}>
                            <Icon size={11} style={{ color: isActive ? "#22d3ee" : "rgba(34,211,238,0.35)" }}/>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span style={{ fontSize: 7, color: "rgba(34,211,238,0.4)", letterSpacing: 1 }}>{mod.id}</span>
                              <span className="w-1 h-1 rounded-full flex-shrink-0"
                                style={{ background: isActive ? "#22d3ee" : mod.status === "standby" ? "#f59e0b" : "rgba(200,220,255,0.2)" }}/>
                            </div>
                            <div style={{ fontSize: 10, color: isActive ? "#c8ddf0" : "rgba(200,220,255,0.4)", fontWeight: isActive ? 600 : 400, letterSpacing: 0.3 }}>
                              {mod.name}
                            </div>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={SPRING_FAST}
                              className="overflow-hidden"
                            >
                              <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(34,211,238,0.08)" }}>
                                <div className="flex justify-between mb-1">
                                  <span style={{ fontSize: 7, color: "rgba(200,220,255,0.35)" }}>LOAD</span>
                                  <span style={{ fontSize: 8, color: "#22d3ee" }}>{mod.load}%</span>
                                </div>
                                <MetricBar value={mod.load} height={2}/>
                                <div className="flex justify-between mt-2">
                                  <span style={{ fontSize: 7, color: "rgba(200,220,255,0.25)" }}>STATUS</span>
                                  <span style={{ fontSize: 7, letterSpacing: 1.5, color: isActive ? "#22d3ee" : "#f59e0b", textTransform: "uppercase" }}>
                                    {mod.status}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </motion.div>

      {/* Global CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.18); border-radius: 2px; }
        input::placeholder { color: rgba(34,211,238,0.3); letter-spacing: 0.05em; }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 6px #22d3ee; opacity: 0.8; }
          50%      { box-shadow: 0 0 14px #22d3ee; opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
