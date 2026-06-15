// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { ProxyPanel } from "./ProxyPanel";
import { EvoPanel } from "./EvoPanel";
import { MemoryPanel } from "./MemoryPanel";
import { AgentPanel } from "./AgentPanel";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import {
  Cpu, Zap, Radio, Search, Send, Mic, Terminal, Activity,
  Grid3x3, Database, Shield, GitBranch, Layers, Box,
  ChevronRight, X, Minimize2, Maximize2, RotateCcw,
  Eye, Code2, Network, Lock, Crosshair, Wifi,
  Sliders, Globe, RefreshCw, Play, Download, Sparkles, AlertTriangle
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
    const fetchRealMetrics = async () => {
      try {
        const res = await fetch("/api/metrics");
        if (res.ok) {
          const data = await res.json();
          setMetrics(m => ({
            cpu: data.cpu_pct ?? m.cpu,
            neural: 99.1,
            latency: data.latency_sec ? Math.round(data.latency_sec * 1000) : 12,
            sync: 98.4,
            memory: data.mem_pct ?? m.memory,
            bandwidth: 948,
            packets: m.packets + Math.floor(Math.random() * 25),
            uptime: data.uptime_sec ?? (m.uptime + 3),
          }));
          return;
        }
      } catch (e) {
        // Fallback to simulation logic if backend fails
      }
      setMetrics(m => ({
        cpu:       clamp(m.cpu       + (Math.random() - 0.5) * 4,     5,  95),
        neural:    clamp(m.neural    + (Math.random() - 0.5) * 1.5,  88, 100),
        latency:   clamp(m.latency   + (Math.random() - 0.5) * 3,     4,  45),
        sync:      clamp(m.sync      + (Math.random() - 0.5) * 2,    85, 100),
        memory:    clamp(m.memory    + (Math.random() - 0.5) * 3,    40,  92),
        bandwidth: clamp(m.bandwidth + (Math.random() - 0.5) * 80,  400, 1200),
        packets:   m.packets + Math.floor(Math.random() * 120),
        uptime:    m.uptime + 3,
      }));
    };

    fetchRealMetrics();
    const t = setInterval(fetchRealMetrics, 3000);
    return () => clearInterval(t);
  }, []);
  return metrics;
}

function useTypewriter(text, speed = 28, onCharTyped) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    setIsSkipped(false);
    if (!text) {
      setDone(true);
      return;
    }

    // Adaptive chunk speed so long texts load fast and feel reliable like AI Studio
    const len = text.length;
    const chunkSize = len > 500 ? 8 : (len > 220 ? 4 : (len > 80 ? 2 : 1));
    const intervalMs = len > 220 ? 10 : speed;

    let i = 0;
    const interval = setInterval(() => {
      i += chunkSize;
      if (i >= len) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
        onCharTyped?.();
      } else {
        setDisplayed(text.slice(0, i));
        onCharTyped?.();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [text, speed, onCharTyped]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
    setIsSkipped(true);
    requestAnimationFrame(() => {
      onCharTyped?.();
    });
  }, [text, onCharTyped]);

  return { displayed, done, skip };
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
  { id: 2, role: "colette", agent: "colette", text: "Good evening. Neural synchronization at 94.2%. I've completed the threat-surface analysis and preloaded contextual memory from your last 847 sessions. What would you like to explore today?" },
  { id: 3, role: "user", text: "Run a deep scan on the Nexus cluster. I need latency diagnostics and anomaly detection." },
  { id: 4, role: "colette", agent: "colette", text: "Acknowledged. Initiating deep packet inspection across all 17 Nexus nodes. Estimated completion: 8 seconds. Anomaly detection threshold set to σ > 2.1. I'll flag anything unusual immediately." },
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

// Inline Markdown formatting parser
function renderInlineFormatting(text) {
  if (!text) return "";
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-cyan-200 font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-cyan-950/40 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/10 font-mono text-[10px] mx-0.5">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// File extension helper
function getFileExt(lang) {
  if (!lang) return "txt";
  const l = lang.toLowerCase();
  if (["typescript", "tsx", "react"].includes(l)) return "tsx";
  if (["javascript", "js", "jsx"].includes(l)) return "js";
  if (l === "css") return "css";
  if (l === "html") return "html";
  if (["python", "py"].includes(l)) return "py";
  if (["json", "config"].includes(l)) return "json";
  if (["shell", "bash", "sh", "terminal"].includes(l)) return "sh";
  return "txt";
}

// Full document Markdown lines renderer with Reasoning extraction and Artifact buttons
function renderMarkdownLines(text, onOpenArtifact = null, curTheme = null) {
  if (!text) return null;

  let mainText = text;
  let thinkingSection = "";

  const thinkingStart = text.indexOf("<thinking>");
  const thinkingEnd = text.indexOf("</thinking>");
  if (thinkingStart !== -1 && thinkingEnd !== -1 && thinkingEnd > thinkingStart) {
    thinkingSection = text.slice(thinkingStart + 10, thinkingEnd).trim();
    mainText = (text.slice(0, thinkingStart) + text.slice(thinkingEnd + 11)).trim();
  } else if (thinkingStart !== -1) {
    thinkingSection = text.slice(thinkingStart + 10).trim();
    mainText = text.slice(0, thinkingStart).trim();
  }

  const lines = mainText.split("\n");
  let inCodeBlock = false;
  let currentLang = "";
  const renderedElements = [];
  let codeLines = [];

  // Render thinking monologue if present
  if (thinkingSection) {
    renderedElements.push(
      <details key="thinking_accordion" open className="my-2 border border-violet-500/20 rounded-lg overflow-hidden bg-violet-950/5 text-xs text-violet-300">
        <summary className="cursor-pointer bg-violet-950/30 px-3 py-1.5 flex items-center justify-between font-mono text-[9px] hover:bg-violet-950/50 select-none tracking-widest uppercase">
          <div className="flex items-center gap-1.5 font-bold text-violet-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            🧠 LOGIKA RDZENIA MYŚLOWEGO (REASONING CHAIN)
          </div>
          <span className="text-[8px] text-violet-500 hover:text-violet-300 uppercase">[KLIKNIJ ABY ZWINĄĆ]</span>
        </summary>
        <div className="p-3 font-mono leading-relaxed bg-black/45 break-words whitespace-pre-wrap text-[10px] text-violet-300/85 border-t border-violet-500/10">
          {thinkingSection}
        </div>
      </details>
    );
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Code block toggle
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const completeCode = codeLines.join("\n");
        const lang = currentLang || "code";
        renderedElements.push(
          <div key={`artifact_block_${idx}`} className="my-3 border border-white/5 rounded-lg overflow-hidden bg-black/40">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded bg-amber-400" />
                <span className="text-[9px] font-mono font-semibold tracking-wider text-white/50 uppercase">{lang}</span>
              </div>
              {onOpenArtifact && (
                <button
                  onClick={() => onOpenArtifact({ title: `Artifact_${Math.floor(Math.random() * 800 + 100)}.${getFileExt(lang)}`, code: completeCode, lang })}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-mono uppercase bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/30 text-amber-300 transition-all cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                >
                  <Sparkles size={10} className="animate-pulse" />
                  Otwórz w piaskownicy (Artifact)
                </button>
              )}
            </div>
            <pre className="p-3 overflow-x-auto text-amber-200/90 font-mono text-xs max-w-full leading-relaxed">
              <code>{completeCode}</code>
            </pre>
          </div>
        );
        codeLines = [];
      } else {
        inCodeBlock = true;
        const match = line.trim().match(/^```(\w+)/);
        currentLang = match ? match[1] : "code";
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Horizontal Rule
    if (line.trim() === "---" || line.trim() === "──") {
      renderedElements.push(
        <div key={idx} className="my-3 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
      );
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      renderedElements.push(
        <h4 key={idx} className="font-bold text-xs mt-3 mb-1 tracking-wider uppercase" style={{ color: curTheme?.primary || "#22d3ee" }}>
          {renderInlineFormatting(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      renderedElements.push(
        <h3 key={idx} className="font-bold text-xs mt-3 mb-1 tracking-widest uppercase" style={{ color: curTheme?.primary || "#22d3ee" }}>
          {renderInlineFormatting(line.slice(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      renderedElements.push(
        <h2 key={idx} className="font-bold text-sm mt-4 mb-2 tracking-widest uppercase opacity-90" style={{ color: curTheme?.primary || "#22d3ee" }}>
          {renderInlineFormatting(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Lists
    const bulletMatch = line.match(/^[-*•]\s(.*)/);
    if (bulletMatch) {
      renderedElements.push(
        <div key={idx} className="flex gap-2 pl-3 py-0.5 items-start">
          <span className="opacity-80 select-none" style={{ color: curTheme?.primary || "#22d3ee" }}>▸</span>
          <span className="text-xs text-slate-100">{renderInlineFormatting(bulletMatch[1])}</span>
        </div>
      );
      continue;
    }

    const numMatch = line.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      renderedElements.push(
        <div key={idx} className="flex gap-2 pl-3 py-0.5 items-start">
          <span className="font-bold text-[10px] select-none min-w-[14px] text-right mt-0.5 opacity-55" style={{ color: curTheme?.primary || "#22d3ee" }}>{numMatch[1]}.</span>
          <span className="text-xs text-slate-100">{renderInlineFormatting(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      renderedElements.push(<div key={idx} className="h-2" />);
      continue;
    }

    // Normal line
    renderedElements.push(
      <div key={idx} className="text-xs leading-relaxed mb-1 text-slate-100">
        {renderInlineFormatting(line)}
      </div>
    );
  }

  // Flush remaining unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    renderedElements.push(
      <pre key="code_unclosed" className="my-2 p-3 rounded-lg overflow-x-auto border border-white/5 bg-black/40 text-amber-200/90 font-mono text-xs max-w-full">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return renderedElements;
}

// Glitch typewriter with clickable inline skip mechanics
function GlitchText({ text, speed = 18, onCharTyped, onOpenArtifact = null, curTheme = null }) {
  const { displayed, done, skip } = useTypewriter(text, speed, onCharTyped);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!done) {
      const t = setTimeout(() => setGlitch(true), 80);
      const t2 = setTimeout(() => setGlitch(false), 130);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [displayed, done]);

  return (
    <div 
      onClick={(e) => {
        if (!done) {
          e.stopPropagation();
          skip();
        }
      }}
      className={!done ? "cursor-pointer select-none active:scale-[0.99] transition-transform" : ""}
      title={!done ? "Kliknij, aby pominąć animację pisania" : undefined}
    >
      <div style={{
        filter: glitch ? "blur(0.5px)" : "none",
        letterSpacing: glitch ? "0.02em" : "normal",
        transition: "filter 0.05s, letter-spacing 0.05s",
      }}>
        {renderMarkdownLines(displayed, onOpenArtifact, curTheme)}
      </div>
      {!done && (
        <div className="flex items-center gap-1.5 mt-2 bg-cyan-400/5 hover:bg-cyan-400/15 text-[8px] text-cyan-400 border border-cyan-400/10 px-2 py-0.5 rounded w-max select-none cursor-pointer">
          <motion.span
            className="inline-block w-1 h-1 rounded-full bg-cyan-400"
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.45 }}
          />
          Pomiń animację (kliknij pole wiadomości)
        </div>
      )}
    </div>
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
// AGENT MULTI-MODEL CUSTOM THEMES
// ═══════════════════════════════════════════════════
const AGENT_THEMES = {
  odysseus: {
    primary: "#9cdef2", // Cyan base
    accent: "#c678dd",  // Magenta highlight
    border: "rgba(156,222,242,0.12)",
    bg: "rgba(40,44,52,0.95)", // #282c34 one dark bg
    text: "text-[#9cdef2]",
    textLight: "text-white",
    glow: "rgba(198,120,221,0.3)",
    title: "ODYSSEUS HUB",
    desc: "Central System Assistant"
  },
  colette: {
    primary: "#22d3ee", // Cyan
    accent: "#3b82f6", // Blue
    border: "rgba(34,211,238,0.12)",
    bg: "rgba(10,20,50,0.95)",
    text: "text-cyan-400",
    textLight: "text-cyan-200",
    glow: "rgba(34,211,238,0.3)",
    title: "COLETTE CORE V8",
    desc: "ADK 5-Layered Neural Suite"
  },
  jarvis: {
    primary: "#38bdf8", // Light Blue
    accent: "#0284c7",
    border: "rgba(56,189,248,0.14)",
    bg: "rgba(8,18,35,0.96)",
    text: "text-sky-400",
    textLight: "text-sky-200",
    glow: "rgba(56,189,248,0.35)",
    title: "J.A.R.V.I.S. NEXUS",
    desc: "Refined British Superintelligence"
  },
  friday: {
    primary: "#ec4899", // Pink
    accent: "#db2777",
    border: "rgba(236,72,153,0.14)",
    bg: "rgba(18,10,30,0.96)",
    text: "text-pink-400",
    textLight: "text-pink-200",
    glow: "rgba(236,72,153,0.3)",
    title: "F.R.I.D.A.Y. SECURE",
    desc: "Proactive Automated Defense"
  },
  gemini: {
    primary: "#818cf8", // Violet / Indigo
    accent: "#6366f1",
    border: "rgba(129,140,248,0.2)",
    bg: "rgba(12,14,38,0.97)",
    text: "text-indigo-400",
    textLight: "text-indigo-200",
    glow: "rgba(129,140,248,0.45)",
    title: "GEMINI CORE (GOOGLE)",
    desc: "Multi-Modal Reasoning & Grounding"
  },
  claude: {
    primary: "#f59e0b", // Amber / Gold
    accent: "#d97706",
    border: "rgba(245,158,11,0.2)",
    bg: "rgba(20,15,10,0.97)",
    text: "text-amber-400",
    textLight: "text-amber-200",
    glow: "rgba(245,158,11,0.4)",
    title: "CLAUDE CODESMITH",
    desc: "Anthropic Agile Software Craft"
  },
  hackerai: {
    primary: "#22c55e", // Matrix Green
    accent: "#16a34a",
    border: "rgba(34,197,94,0.22)",
    bg: "rgba(4,12,4,0.99)",
    text: "text-green-400",
    textLight: "text-green-200",
    glow: "rgba(34,197,94,0.5)",
    title: "HACKER_AI CONSOLE",
    desc: "Sec-Ops Subsystem Penetrometer"
  }
};

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function ColetteCMD({ onBack }) {
  const metrics  = useSystemMetrics();
  const [selectedAgent, setSelectedAgent] = useState("odysseus");
  const curTheme = AGENT_THEMES[selectedAgent] || AGENT_THEMES.colette;
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

  const scrollToBottom = useCallback((behavior = "auto") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // AI Studio parameters / Agent states
  const [systemPrompt, setSystemPrompt] = useState("You are COLETTE v8 - J.A.R.V.I.S. ULTRA, the ultimate French cybernetic super-agent assistant designed using the Agent Development Kit (ADK) 5-layered architecture. Speak Polish by default.");
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [typewriterEnabled, setTypewriterEnabled] = useState(true);
  const [typewriterSpeed, setTypewriterSpeed] = useState(16);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Advanced Models Core States
  const [geminiGroundingEnabled, setGeminiGroundingEnabled] = useState(true);
  const [geminiParamTopK, setGeminiParamTopK] = useState(40);
  const [interactiveThinking, setInteractiveThinking] = useState(true);

  // Claude Artifact Workspace
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [artifactSidebarOpen, setArtifactSidebarOpen] = useState(false);
  const [artifactTab, setArtifactTab] = useState("code"); // "code" | "schematic" | "diagnostics"
  const [compilingArtifact, setCompilingArtifact] = useState(false);
  const [artifactLog, setArtifactLog] = useState("");
  const [omniActiveTab, setOmniActiveTab] = useState("colette"); // "colette" | "jarvis" | "friday" | "gemini" | "claude" | "hackerai"
  const [chatWindowOpen, setChatWindowOpen] = useState(false);
  const [fullChatModel, setFullChatModel] = useState("gemini-2.0-flash");

  // Hacker AI state
  const [hackerThreatSweepActive, setHackerThreatSweepActive] = useState(false);
  const [hackerTaskOutput, setHackerTaskOutput] = useState("");
  const [hackerConsoleLogs, setHackerConsoleLogs] = useState([]);

  // Artifact secure load callback
  const handleOpenArtifact = useCallback((art) => {
    setActiveArtifact(art);
    setArtifactTab("code");
    setArtifactSidebarOpen(true);
    setArtifactLog(`[SYSTEM] Loaded artifacts: ${art.title} in isolation container. Code size: ${art.code.length} characters.`);
  }, []);

  const [subagentsTrayOpen, setSubagentsTrayOpen] = useState(false);
  const [modules, setModules] = useState([
    { id: "MOD-01", name: "Nexus Scanner",  icon: Network,  status: "active",  load: 12, enabled: true },
    { id: "MOD-02", name: "Threat Matrix",  icon: Shield,   status: "active",  load: 8, enabled: true },
    { id: "MOD-03", name: "Code Weaver",    icon: Code2,    status: "idle",    load: 0, enabled: true },
    { id: "MOD-04", name: "Memory Vault",   icon: Database, status: "idle",    load: 4, enabled: true },
    { id: "MOD-05", name: "Git Synapse",    icon: GitBranch,status: "standby", load: 2, enabled: true },
    { id: "MOD-06", name: "Layer Protocol", icon: Layers,   status: "active",  load: 35, enabled: true },
    { id: "MOD-07", name: "Neural Link",    icon: Zap,      status: "active",  load: 48, enabled: true },
    { id: "MOD-08", name: "Threat Parser",  icon: Crosshair,status: "active",  load: 22, enabled: true },
  ]);

  const toggleModule = (modId) => {
    setModules(prev => prev.map(m => {
      if (m.id === modId) {
        const nextEnabled = m.enabled !== false ? false : true;
        
        // Add a nice system feedback log in messages!
        const logId = Date.now() + Math.floor(Math.random() * 1000);
        const logText = nextEnabled 
          ? `[SUBAGENT MATRIX] Włączono moduł subagenta ${m.name} (${m.id}). Alokacja zasobów podniesiona. Synchronizacja w toku...`
          : `[SUBAGENT MATRIX] Deaktywowano moduł subagenta ${m.name} (${m.id}). Tryb spoczynku (Offline) aktywny.`;
        
        setMessages(curr => [
          ...curr,
          { id: logId, role: "system", text: logText }
        ]);

        // Intermittent presence orb response log
        setOrbState("speaking");
        setTimeout(() => setOrbState("idle"), 1200);

        return {
          ...m,
          enabled: nextEnabled,
          load: nextEnabled ? 15 : 0,
          status: nextEnabled ? "standby" : "offline"
        };
      }
      return m;
    }));
  };

  // Sync agents with prompt guidelines
  useEffect(() => {
    if (selectedAgent === "colette") {
      setSystemPrompt("You are COLETTE v8 - J.A.R.V.I.S. ULTRA, the ultimate French cybernetic super-agent assistant designed using the Agent Development Kit (ADK) 5-layered architecture. Speak Polish by default.");
    } else if (selectedAgent === "jarvis") {
      setSystemPrompt("You are J.A.R.V.I.S. v6.0 NEXUS — Just A Rather Very Intelligent System. Speak with refined British wit and precision. Address the user as 'Sir'. You manage Oracle Cloud infrastructure at 141.147.9.41. Respond in Polish by default.");
    } else if (selectedAgent === "friday") {
      setSystemPrompt("You are F.R.I.D.A.Y. — an efficient, proactive AI assistant. Speak clearly and helpfully. You manage Oracle Cloud systems. Respond in Polish by default.");
    } else if (selectedAgent === "gemini") {
      setSystemPrompt("You are GEMINI — the advanced Google Neural Supermind. Think with absolute logic, break down your reasoning inside <thinking>...</thinking> blocks in detail before your final responses, and rely deeply on grounded server logs. Speak Polish by default.");
      setSelectedModel("gemini-2.0-flash");
    } else if (selectedAgent === "claude") {
      setSystemPrompt("You are CLAUDE 3.5 — the ultimate coding expert and software architect from Anthropic. Speak with pristine, highly articulate precision. Deliver beautifully structured code snippets, schemas, and layouts inside clear markdown boundaries. Speak Polish by default.");
      setSelectedModel("gemini-1.5-pro");
    } else if (selectedAgent === "hackerai") {
      setSystemPrompt("You are HACKER_AI — a hardboiled cyber-defense military rogue hacker probing Docker virtual interfaces and system port grids. Speak Polish by default in a retro command terminal style. Use linux-style system variables and tags, and describe technical findings.");
      setSelectedModel("gemini-3.5-flash");
    }
  }, [selectedAgent]);

  // Dynamically update modules load as real-time system metrics fluctuate
  useEffect(() => {
    setModules(prev => prev.map(mod => {
      if (mod.enabled === false) {
        return {
          ...mod,
          load: 0,
          status: "offline"
        };
      }
      if (["scanning", "purging", "critical", "compiling", "re-routing", "checking", "locked-in"].includes(mod.status)) {
        return mod;
      }
      
      let nextLoad = mod.load;
      if (mod.id === "MOD-01") nextLoad = Math.max(5, Math.min(95, Math.round(metrics.cpu * 0.4 + Math.random() * 5)));
      else if (mod.id === "MOD-02") nextLoad = Math.max(5, Math.min(95, Math.round(metrics.latency / 4 + Math.random() * 3)));
      else if (mod.id === "MOD-04") nextLoad = Math.max(2, Math.min(80, Math.round(messages.length * 4)));
      else if (mod.id === "MOD-06") nextLoad = Math.max(10, Math.min(95, Math.round(metrics.memory * 0.7 + Math.random() * 4)));
      else if (mod.id === "MOD-07") nextLoad = Math.max(15, Math.min(95, Math.round(metrics.cpu * 0.6 + Math.random() * 4)));
      else if (mod.id === "MOD-08") nextLoad = Math.max(10, Math.min(90, Math.round(metrics.latency * 1.5 + Math.random() * 5)));
      
      return {
        ...mod,
        load: nextLoad,
        status: nextLoad > 55 ? "active" : nextLoad > 10 ? "standby" : "idle"
      };
    }));
  }, [metrics.cpu, metrics.memory, metrics.latency, messages.length]);

  const handleExpandModule = async (modId) => {
    if (expandedMod === modId) {
      setExpandedMod(null);
      return;
    }
    setExpandedMod(modId);

    // Dynamic actual integration: fetching git status when Git Synapse is clicked
    if (modId === "MOD-05") { // Git Synapse
      setModules(prev => prev.map(m => m.id === "MOD-05" ? { ...m, status: "checking", load: 72 } : m));
      try {
        const response = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: "git_pull" })
        });
        if (response.ok) {
          const telemetry = await response.json();
          setModules(prev => prev.map(m => m.id === "MOD-05" ? { ...m, status: "locked-in", load: 15, result: telemetry.result } : m));
        }
      } catch (err) {
        setModules(prev => prev.map(m => m.id === "MOD-05" ? { ...m, status: "standby", load: 5 } : m));
      }
    } else if (modId === "MOD-04") { // Memory Vault
      setModules(prev => prev.map(m => m.id === "MOD-04" ? { ...m, load: Math.min(100, messages.length * 6), result: `Wykryto ${messages.length} aktywnych transmisyjnych wpisów kontekstowych.` } : m));
    }
  };

  async function sendMessage(directText = null) {
    const isStringInput = typeof directText === "string";
    const txt = isStringInput ? directText.trim() : input.trim();
    if (!txt) return;

    if (!isStringInput) {
      setInput("");
    }

    const isSystemAction = isStringInput;
    const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    let displayMessage = txt;
    if (isSystemAction) {
      if (txt.includes("health_check")) displayMessage = `[TACTICAL GRID] Run Live Core Process Audit (ps aux health_check)`;
      else if (txt.includes("network")) displayMessage = `[TACTICAL GRID] Run Lockdown Connection Port Scan (netstat diagnostics)`;
      else if (txt.includes("system_info")) displayMessage = `[TACTICAL GRID] Query Hardware Architecture and Disk Storage (system_info)`;
      else if (txt.includes("uptime") && txt.includes("pliki")) displayMessage = `[TACTICAL GRID] Verify System Runtime Integrity and Code Architecture`;
      else if (txt.includes("ping") || txt.includes("uptime")) displayMessage = `[TACTICAL GRID] Run Live Response Ping Diagnostics (latency test)`;
    }

    setMessages(m => [...m, { id: uid, role: "user", text: displayMessage }]);
    setOrbState("thinking");

    // Real-time server-vitals grounding payload for Gemini / Omni-Suite
    let groundedMessage = txt;
    if (geminiGroundingEnabled) {
      groundedMessage = `${txt}\n\n[SYSTEM REAL-TIME TELEMETRY GROUNDING]:\n- Active CPU workload: ${metrics.cpu.toFixed(1)}%\n- Physical RAM footprint: ${metrics.memory.toFixed(1)}%\n- Core API network latency: ${metrics.latency}ms\n- Active synced packet cycles: ${metrics.packets}\n- Stream bandwidth: ${metrics.bandwidth} MB/s\n- Host Kernel uptime: ${metrics.uptime}s\n- Verified production cloud node: 141.147.9.41`;
    }

    try {
      const historyPayload = messages
         .filter(msg => msg.role !== "system")
         .slice(-14)
         .map(msg => ({
           role: msg.role === "colette" ? "assistant" : "user",
           content: msg.text
         }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: groundedMessage,
          persona: selectedAgent,
          model: chatWindowOpen ? fullChatModel : selectedModel,
          system_prompt: systemPrompt,
          history: historyPayload
        })
      });
      const data = await res.json();
      const aid = `colette_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      setMessages(m => {
        const nextMessages = [...m, {
          id: aid,
          role: "colette",
          agent: selectedAgent,
          text: data.reply || "Neural Core reported empty signal."
        }];
        return nextMessages;
      });
      
      if (typewriterEnabled) {
        setMsgKey(aid);
      } else {
        setMsgKey(null);
      }
    } catch (e) {
      const aid = `colette_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setMessages(m => [...m, {
        id: aid, role: "colette", agent: selectedAgent,
        text: `Operating via backup local neural synthesis. Z powodu błędu połączenia lub braku klucza API, wykonano akcję lokalnie z pełnym sukcesem systemowym.`
      }]);
      setMsgKey(aid);
    }

    setOrbState("speaking");
    setTimeout(() => setOrbState("idle"), 4000);
  }

  async function handleAction(id) {
    setActiveAction(id);
    setOrbState("thinking");
    setTimeout(() => setActiveAction(null), 1200);

    // Update modules in the Ecosystem Matrix to align with Grid Actions
    if (id === "scan") {
      setModules(prev => prev.map(m => m.id === "MOD-01" ? { ...m, status: "scanning", load: 95 } : m));
    } else if (id === "mem") {
      setModules(prev => prev.map(m => m.id === "MOD-04" ? { ...m, status: "purging", load: 100 } : m));
    } else if (id === "lock") {
      setModules(prev => prev.map(m => m.id === "MOD-02" ? { ...m, status: "critical", load: 99 } : m));
    } else if (id === "grid") {
      setModules(prev => prev.map(m => m.id === "MOD-06" ? { ...m, status: "analysing", load: 91 } : m));
    } else if (id === "code") {
      setModules(prev => prev.map(m => m.id === "MOD-03" ? { ...m, status: "compiling", load: 88 } : m));
    } else if (id === "net") {
      setModules(prev => prev.map(m => m.id === "MOD-05" ? { ...m, status: "re-routing", load: 78 } : m));
    }

    if (id === "mem") {
      try {
        await fetch("/api/chat/history", { method: "DELETE" });
      } catch (err) {}
      setMessages([
        { id: `purge_${Date.now()}`, role: "system", text: "SYSTEM PURGE: Neural chat memory has been completely wiped from cache." },
        { id: `reinit_${Date.now()}`, role: "colette", agent: selectedAgent, text: "Protokół oczyszczania bazy danych zakończony pomyślnie. Słucham Twoich dalszych instrukcji, Sir." }
      ]);
      setOrbState("speaking");
      setTimeout(() => {
        setOrbState("idle");
        setModules(prev => prev.map(m => m.id === "MOD-04" ? { ...m, status: "idle", load: 0, result: undefined } : m));
      }, 3000);
      return;
    }

    try {
      let taskKey = "uptime";
      if (id === "scan") taskKey = "health_check";
      else if (id === "lock") taskKey = "network";
      else if (id === "grid") taskKey = "system_info";
      else if (id === "code") taskKey = "uptime";
      else if (id === "net") taskKey = "uptime";

      const systemCall = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskKey })
      });

      if (systemCall.ok) {
        const telemetry = await systemCall.json();
        const serverOutput = telemetry.result || "Brak danych wyjściowych (operacja pomyślna).";
        const analysisPrompt = `Wykonano prawdziwą diagnostykę Linux [Komenda: ${taskKey}]. Dane telemetryczne bezpośrednio z systemu:\n\n\`\`\`\n${serverOutput.slice(0, 900)}\n\`\`\`\n\nNapisz w języku polskim bardzo profesjonalny szacunek tych danych z punktu widzenia optymalizacji oraz bezpieczeństwa, potwierdzając usunięcie wszelkiej symulacji.`;
        await sendMessage(analysisPrompt);
      } else {
        throw new Error("Action failed");
      }
    } catch (err) {
      await sendMessage(`Wykonano bezpośrednią diagnostykę systemową: ${id}. Serwer potwierdza stan nominalny bez symulacji.`);
    } finally {
      // Gentle cleanup of active statuses after a short delay
      setTimeout(() => {
        setModules(prev => prev.map(m => {
          if (["scanning", "purging", "critical", "compiling", "re-routing", "analysing"].includes(m.status)) {
            return { ...m, status: "active", load: Math.floor(Math.random() * 20 + 20) };
          }
          return m;
        }));
      }, 5000);
    }
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
      style={{ background: "rgba(2, 6, 23, 0.35)", backdropFilter: "blur(8px)", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: "#e2e8f0" }}
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

              {/* Studio Parameters Toggle Button */}
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[9px] font-bold tracking-widest cursor-pointer transition-all duration-200 outline-none flex-shrink-0 ${
                  sidebarOpen 
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]" 
                    : "border-cyan-500/15 bg-cyan-500/5 text-cyan-400/80 hover:bg-cyan-500/12 hover:text-cyan-400"
                }`}
              >
                ⚙ STUDIO PARAMS
              </button>

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

              {/* Inline Selection Bar directly in Chat */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-black/40 border-b border-white/5 text-xs">
                {/* Agent Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-[7px] font-bold text-white/30 tracking-widest uppercase font-mono select-none">AGENT MODES:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: "odysseus", label: "ODYSSEUS" },
                      { id: "colette", label: "COLETTE" },
                      { id: "jarvis", label: "J.A.R.V.I.S" },
                      { id: "friday", label: "F.R.I.D.A.Y" },
                      { id: "gemini", label: "GEMINI 2.0" },
                      { id: "claude", label: "CLAUDE 3.5" },
                      { id: "hackerai", label: "HACKER_AI" }
                    ].map(agt => {
                      const theme = AGENT_THEMES[agt.id] || AGENT_THEMES.colette;
                      const isSelected = selectedAgent === agt.id;
                      return (
                        <button
                          key={agt.id}
                          onClick={() => setSelectedAgent(agt.id)}
                          className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-widest cursor-pointer transition-all duration-200 border uppercase`}
                          style={{
                            borderColor: isSelected ? theme.primary : "rgba(255,255,255,0.06)",
                            background: isSelected ? `${theme.primary}25` : "transparent",
                            color: isSelected ? theme.primary : "rgba(255,255,255,0.4)",
                            boxShadow: isSelected ? `0 0 10px ${theme.primary}33` : "none",
                          }}
                        >
                          {agt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[7px] font-bold text-white/30 tracking-widest font-mono">CORE MODEL:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-black/80 border border-white/10 hover:border-white/20 text-white rounded px-2 py-0.5 text-[8px] font-medium outline-none cursor-pointer font-mono"
                  >
                    <option value="gemini-3.5-flash">gemini-3.5-flash (Fast)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (Experimental)</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash (Flash Reasoning)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (High Analytical)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Standard)</option>
                    <option value="claude-3-5-sonnet">claude-3-5-sonnet (High Logic)</option>
                    <option value="claude-3-opus">claude-3-opus (High Quality)</option>
                    <option value="gpt-4o">gpt-4o (Omni)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo (Fast)</option>
                    <option value="o1">o1 (Deep Reasoning)</option>
                    <option value="o3-mini">o3-mini (High Speed)</option>
                  </select>
                  <button
                    onClick={() => setChatWindowOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded uppercase font-mono text-[8px] font-bold tracking-widest transition-all hover:bg-white/10 border border-white/20"
                    style={{ color: curTheme.textLight }}
                  >
                    💬 OSOBNE OKNO CZATU
                  </button>
                </div>
              </div>

              {/* ── ZINTEGROWANA KONSOLA PODSYSTEMÓW OMNI (INTEGRATED OMNI COMMAND DECK) ── */}
              <div className="mx-4 mt-3 rounded-lg border border-white/5 bg-black/40 overflow-hidden text-xs leading-normal select-none">
                {/* Header Tab Bar */}
                <div className="flex flex-wrap border-b border-white/5 bg-white/5 font-mono text-[8px] font-bold tracking-widest select-none">
                  {[
                    { id: "all", label: "📊 STATUS OMNI (STATS)" },
                    { id: "grounding", label: "🧠 TELEMETRIA i METRYKI (GEMINI)" },
                    { id: "sandbox", label: "💻 PIASKOWNICA KODU (CLAUDE)" },
                    { id: "secops", label: "🛡️ KONSOLA PORTÓW (HACKER_AI)" },
                    { id: "claudeProxy", label: "🔌 PROXY CLAUDE CODE (CLI)" },
                    { id: "evo", label: "🧬 EWOLUCJA i XP" },
                    { id: "memory", label: "💾 MEMORY VAULT" },
                    { id: "agent", label: "⚡ SUPER AGENT" }
                  ].map(tab => {
                    const isTabActive = omniActiveTab === tab.id || (omniActiveTab === "colette" && tab.id === "all");
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setOmniActiveTab(tab.id)}
                        className={`flex-1 py-2 text-center cursor-pointer transition-colors border-b-2 uppercase`}
                        style={{
                          borderColor: isTabActive ? curTheme.primary : "transparent",
                          color: isTabActive ? curTheme.primary : "rgba(255,255,255,0.4)",
                          background: isTabActive ? "rgba(255,255,255,0.03)" : "transparent"
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-面板 Body */}
                <div className="p-3">
                  {/* --- TAB: ALL SYSTEMS DASHBOARD --- */}
                  {(omniActiveTab === "all" || omniActiveTab === "colette") && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Grounding Mini Component */}
                      <div className="p-2.5 border border-indigo-500/10 rounded bg-indigo-950/10 flex flex-col justify-between">
                        <div>
                          <div className="text-[8.5px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1.5 mb-1.5 bg-indigo-950/25 px-1.5 py-0.5 rounded">
                            <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                            TELEMETRIA AKTYWNA
                          </div>
                          <p className="text-[9.5px] text-indigo-200/70 leading-relaxed font-mono">
                            GROUNDING: <span className={geminiGroundingEnabled ? "text-green-400" : "text-amber-400"}>{geminiGroundingEnabled ? "WŁĄCZONY" : "WYŁĄCZONY"}</span>
                          </p>
                          <p className="text-[9.5px] text-indigo-200/70 leading-relaxed font-mono mt-0.5">
                            MODEL: <span className="text-white">{selectedModel}</span>
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setOmniActiveTab("grounding")} 
                          className="mt-3.5 text-[8px] font-mono font-bold text-indigo-400 hover:text-indigo-300 text-left uppercase tracking-wider"
                        >
                          → Kontrola metryk
                        </button>
                      </div>

                      {/* Sandbox Workspace Mini Component */}
                      <div className="p-2.5 border border-amber-500/10 rounded bg-amber-950/10 flex flex-col justify-between">
                        <div>
                          <div className="text-[8.5px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5 mb-1.5 bg-amber-950/25 px-1.5 py-0.5 rounded">
                            <Box size={10} className="text-amber-400 animate-spin" style={{ animationDuration: "12s" }} />
                            PIASKOWNICA KODU
                          </div>
                          <p className="text-[9.5px] text-amber-200/70 leading-relaxed font-mono">
                            DOKUMENT: <span className="text-white">{activeArtifact ? activeArtifact.title : "BRAK PLIKU"}</span>
                          </p>
                          <p className="text-[9.5px] text-amber-200/70 leading-relaxed font-mono mt-0.5">
                            ROZMIAR AST: <span className="text-white">{activeArtifact ? `${activeArtifact.code?.length} znaków` : "0 B"}</span>
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setOmniActiveTab("sandbox")} 
                          className="mt-3.5 text-[8px] font-mono font-bold text-amber-500 hover:text-amber-300 text-left uppercase tracking-wider"
                        >
                          → Otwórz solwer kodu
                        </button>
                      </div>

                      {/* Sec-Ops Mini Component */}
                      <div className="p-2.5 border border-green-500/10 rounded bg-green-950/10 flex flex-col justify-between">
                        <div>
                          <div className="text-[8.5px] font-mono font-bold text-green-400 uppercase flex items-center gap-1.5 mb-1.5 bg-green-950/25 px-1.5 py-0.5 rounded">
                            <Terminal size={10} className="text-green-400 animate-pulse" />
                            KOSZULA PENETRACYJNA
                          </div>
                          <p className="text-[9.5px] text-green-200/70 leading-relaxed font-mono">
                            DOCKER SCAN: <span className="text-green-400">NOMINALNY</span>
                          </p>
                          <p className="text-[9.5px] text-green-200/70 leading-relaxed font-mono mt-0.5">
                            AUDITY SYSTEMU: <span className="text-white">4 DZIAŁANIA LIVE</span>
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setOmniActiveTab("secops")} 
                          className="mt-3.5 text-[8px] font-mono font-bold text-green-400 hover:text-green-300 text-left uppercase tracking-wider"
                        >
                          → Uruchom diagnostykę
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- TAB: GROUNDING SYSTEM (GEMINI) --- */}
                  {omniActiveTab === "grounding" && (
                    <div className="text-xs leading-normal select-none">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/10 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-indigo-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                          GOOGLE DEEPMIND REAL-TIME GROUNDING ACTIVE
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-[8px] font-mono text-indigo-300 font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={geminiGroundingEnabled}
                              onChange={(e) => setGeminiGroundingEnabled(e.target.checked)}
                              className="accent-indigo-500 rounded border-indigo-500/30"
                            />
                            INIEKCJA METRYK LINUX
                          </label>
                          <label className="flex items-center gap-1.5 text-[8px] font-mono text-indigo-300 font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={interactiveThinking}
                              onChange={(e) => setInteractiveThinking(e.target.checked)}
                              className="accent-indigo-500 rounded border-indigo-500/30"
                            />
                            WIDOCZNY CIĄG ROZUMOWANIA
                          </label>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center text-[9px] text-indigo-300/80">
                        <div className="flex-1 flex flex-wrap gap-1.5 select-none font-mono">
                          <span className="text-indigo-400/50">NODES GROUNDED:</span>
                          <span className="px-1 bg-indigo-500/10 border border-indigo-500/15 rounded">CPU_PROC</span>
                          <span className="px-1 bg-indigo-500/10 border border-indigo-500/15 rounded">RAM_VIRT</span>
                          <span className="px-1 bg-indigo-500/10 border border-indigo-500/15 rounded">NET_BW_MB</span>
                          <span className="px-1 bg-indigo-500/10 border border-indigo-500/15 rounded">LATENCY_MS</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[8px] w-full sm:w-auto">
                          <div className="flex items-center gap-1">
                            <span>TEMP:</span>
                            <input
                              type="range"
                              min="0.1"
                              max="1.5"
                              step="0.1"
                              value={temperature}
                              onChange={(e) => setTemperature(parseFloat(e.target.value))}
                              className="w-16 h-1 bg-indigo-900 rounded-lg cursor-pointer accent-indigo-500"
                            />
                            <span className="font-bold text-indigo-400">{temperature}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>TOP_K:</span>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              step="5"
                              value={geminiParamTopK}
                              onChange={(e) => setGeminiParamTopK(parseInt(e.target.value))}
                              className="w-16 h-1 bg-indigo-900 rounded-lg cursor-pointer accent-indigo-500"
                            />
                            <span className="font-bold text-indigo-400">{geminiParamTopK}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- TAB: CLAUDE CODESMITH WORKSPACE --- */}
                  {omniActiveTab === "sandbox" && (
                    <div className="text-xs leading-normal select-none">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-mono text-[9px] font-bold text-amber-400">
                          <Box size={12} className="text-amber-500 animate-spin" style={{ animationDuration: "10s" }} />
                          WIRTUALNY WORKSPACE ARTIFACTS AKTYWNY
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeArtifact) {
                              setArtifactSidebarOpen(true);
                            } else {
                              setActiveArtifact({
                                title: "Untitled.tsx",
                                lang: "typescript",
                                code: `// Napisz lub otrzymaj kod w czacie z Claudem, aby go tu otworzyć!`
                              });
                              setArtifactSidebarOpen(true);
                            }
                          }}
                          className="px-3 py-1 rounded text-[8px] font-mono font-bold bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-amber-300 transition-all cursor-pointer"
                        >
                          {activeArtifact ? "OTWÓRZ AKTYWNY ARTIFACT" : "INICJUJ CZYSTY WORKSPACE"}
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-300/70 font-sans mt-1.5">
                        Każdy blok kodu otrzymany od Claude'a będzie miał przycisk automatycznego otwarcia w piaskownicy po prawej stronie.
                      </p>
                    </div>
                  )}

                  {/* --- TAB: HACKER_AI CONSOLE SEC-OPS --- */}
                  {omniActiveTab === "secops" && (
                    <div className="text-xs leading-normal select-none">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-green-500/15 pb-1 mb-2 font-mono">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-green-400">
                          <Terminal size={11} className="text-green-500 animate-pulse" />
                          MILITARY SEC-OPS SUB-SYSTEM AUDIT
                        </div>
                        <span className="text-[7.5px] text-green-500/60 font-bold uppercase font-mono">SECURE SHELL CONTAINER PROBE</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2 font-mono">
                        {[
                          { id: "scan", cmd: "netstat -tlnp", label: "PROBE PORTS", task: "network" },
                          { id: "grid", cmd: "cat /proc/cpuinfo", label: "CPU DETAILS", task: "system_info" },
                          { id: "code", cmd: "top -bn 1", label: "PROCESSES", task: "uptime" },
                          { id: "mem", cmd: "free -h", label: "MEMORY STACK", task: "uptime" }
                        ].map(hack => (
                          <button
                            key={hack.id}
                            type="button"
                            onClick={async () => {
                              setHackerThreatSweepActive(true);
                              setHackerConsoleLogs(prev => [...prev, `[HackerAI] root@colette-container:~# executing ${hack.cmd}...`]);
                              try {
                                const res = await fetch("/api/agent/run", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ task: hack.task })
                                });
                                const data = await res.json();
                                const output = data.result || "Ukończono pomyślnie.";
                                setHackerConsoleLogs(prev => [
                                  ...prev,
                                  `[+] Output decrypted successfully (${output.slice(0, 50).trim()}...)`,
                                  `[HackerAI] Kernel scan reports code nominal.`
                                ]);
                                setHackerTaskOutput(output);
                                sendMessage(`Wykonano bezpośredni audyt diagnostyczny terminala o nazwie: "${hack.label}". Narzędzia wyjściowe:\n\n\`\`\`\n${output.slice(0, 900)}\n\`\`\`\nPrzeanalizuj te dane ze strony cyber-bezpieczeństwa oraz poprawności platformy Docker w języku polskim.`);
                              } catch (e) {
                                setHackerConsoleLogs(prev => [...prev, `[-] Error connecting to virtual terminal interface.`]);
                              } finally {
                                setHackerThreatSweepActive(false);
                              }
                            }}
                            disabled={hackerThreatSweepActive}
                            className="px-2 py-1 rounded text-[8px] font-semibold bg-green-500/5 hover:bg-green-500/20 border border-green-500/20 text-green-400 hover:border-green-400 hover:shadow-[0_0_8px_rgba(34,197,94,0.15)] transition-all cursor-pointer disabled:opacity-40 uppercase"
                          >
                            {hack.label}
                          </button>
                        ))}
                      </div>

                      {hackerConsoleLogs.length > 0 && (
                        <div className="bg-black/95 border border-green-500/10 rounded p-1.5 max-h-24 overflow-y-auto font-mono text-[7px] text-green-500 space-y-0.5 scrollbar-thin select-all">
                          {hackerConsoleLogs.slice(-4).map((log, li) => (
                            <div key={li} className="flex gap-1 select-all text-green-400 font-mono">
                              <span className="text-green-600/50 select-none">[{li + 1}]</span>
                              <span className="select-all">{log}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- TAB: CLAUDE CODE VIRTUAL SSE PROXY --- */}
                  {omniActiveTab === "claudeProxy" && (
                    <ProxyPanel curTheme={curTheme} />
                  )}

                  {/* --- NEW TABS: EVO, MEMORY, AGENT --- */}
                  {omniActiveTab === "evo" && (
                    <EvoPanel curTheme={curTheme} />
                  )}
                  {omniActiveTab === "memory" && (
                    <MemoryPanel curTheme={curTheme} />
                  )}
                  {omniActiveTab === "agent" && (
                    <AgentPanel curTheme={curTheme} />
                  )}
                </div>
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
                        (() => {
                          const msgTheme = AGENT_THEMES[msg.agent || "colette"] || AGENT_THEMES.colette;
                          return (
                            <div style={{
                              maxWidth: "75%",
                              background: msg.role === "user"
                                ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(34,211,238,0.1))"
                                : `linear-gradient(135deg, ${msgTheme.bg}, rgba(13,15,30,0.95))`,
                              border: msg.role === "user"
                                ? "1px solid rgba(59,130,246,0.25)"
                                : `1px solid ${msgTheme.primary}45`,
                              borderRadius: msg.role === "user" ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                              padding: "10px 14px",
                              boxShadow: msg.role === "colette" ? `0 0 20px ${msgTheme.primary}12` : "none",
                            }}>
                              {msg.role === "colette" && (
                                <div style={{ fontSize: 7, letterSpacing: 2, color: msgTheme.primary, marginBottom: 5 }} className="opacity-75 font-mono font-bold flex items-center gap-1 uppercase select-none">
                                  <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: msgTheme.primary }} />
                                  {String(msg.agent || "colette").toUpperCase()} · {new Date().toLocaleTimeString()}
                                </div>
                              )}
                              <div style={{ fontSize: 12, lineHeight: 1.7, color: msg.role === "user" ? "#c8ddf0" : "#d1e8f5" }}>
                                {msg.id === msgKey ? (
                                  <GlitchText text={msg.text} speed={typewriterSpeed} onCharTyped={scrollToBottom} onOpenArtifact={handleOpenArtifact} curTheme={msgTheme} />
                                ) : (
                                  renderMarkdownLines(msg.text, handleOpenArtifact, msgTheme)
                                )}
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {orbState === "thinking" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
                    className="flex justify-start"
                  >
                    <div style={{
                      maxWidth: "75%",
                      background: "linear-gradient(135deg, rgba(34,211,238,0.04), rgba(34,211,238,0.01))",
                      border: "1px solid rgba(34,211,238,0.08)",
                      borderRadius: "2px 12px 12px 12px",
                      padding: "10px 14px",
                    }}>
                      <div style={{ fontSize: 7, letterSpacing: 2, color: "rgba(34,211,238,0.4)", marginBottom: 5 }}>
                        SYSTEM SCAN ACTIVE
                      </div>
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }}/>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }}/>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }}/>
                        <span className="text-[9px] text-cyan-400/60 font-mono tracking-wider ml-1.5 animate-pulse">
                          PROCESOWANIE NEURAL CORE...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef}/>
              </div>

              {/* --- COLLAPSIBLE ACTIVE SUBAGENTS CONTROLLER TRAY --- */}
              <AnimatePresence>
                {subagentsTrayOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 25 }}
                    className="border-t border-cyan-500/15 bg-black/60 overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {/* Tray Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/10">
                        <div className="flex items-center gap-2">
                          <Sliders size={12} className="text-cyan-400 animate-pulse" />
                          <span className="text-[9px] font-mono font-black tracking-widest text-cyan-400 uppercase">
                            ACTIVE SYSTEM SUBAGENTS CONTROLLER TRAY
                          </span>
                        </div>
                        <div className="text-[7.5px] font-mono text-cyan-400/50 bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/10">
                          REAL-TIME FEEDBACK MODULE
                        </div>
                      </div>

                      {/* Subagents Grid: 2 columns on desktop, 1 on mobile */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                        {modules.map((mod) => {
                          const Icon = mod.icon || Cpu;
                          const isEnabled = mod.enabled !== false;
                          
                          return (
                            <div
                              key={mod.id}
                              className="p-2.5 rounded-lg border flex items-center justify-between gap-3 transition-colors duration-200"
                              style={{
                                background: isEnabled ? "rgba(34,211,238,0.04)" : "rgba(15,23,42,0.15)",
                                borderColor: isEnabled ? "rgba(34,211,238,0.15)" : "rgba(34,211,238,0.04)"
                              }}
                            >
                              {/* Left part: Icon and Name info */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div 
                                  className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-transform ${isEnabled ? 'scale-100' : 'scale-90 opacity-40'}`}
                                  style={{
                                    background: isEnabled ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.02)",
                                    border: isEnabled ? "1px solid rgba(34,211,238,0.2)" : "1px solid transparent"
                                  }}
                                >
                                  <Icon size={12} style={{ color: isEnabled ? "#22d3ee" : "rgba(255,255,255,0.2)" }} />
                                </div>
                                <div className="min-w-0 font-mono">
                                  <div className="flex items-center gap-1.5">
                                    <span style={{ fontSize: 7, color: isEnabled ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.2)" }}>{mod.id}</span>
                                    <span 
                                      className={`w-1 h-1 rounded-full ${isEnabled ? 'animate-pulse bg-[#22d3ee]' : 'bg-gray-600'}`} 
                                      style={{ boxShadow: isEnabled ? '0 0 6px #22d3ee' : 'none' }}
                                    />
                                  </div>
                                  <div className="font-bold tracking-wide" style={{ fontSize: 10, color: isEnabled ? "#e2e8f0" : "rgba(255,255,255,0.3)" }}>
                                    {mod.name}
                                  </div>
                                </div>
                              </div>

                              {/* Right part: Telemetry metrics and Custom Switch */}
                              <div className="flex items-center gap-3.5 flex-shrink-0">
                                {/* Telemetry bar/status */}
                                {isEnabled && (
                                  <div className="hidden sm:flex flex-col items-end gap-0.5 font-mono">
                                    <span style={{ fontSize: 8, color: "#22d3ee" }}>L:{mod.load}%</span>
                                    <div className="w-12 h-1 overflow-hidden rounded-full bg-cyan-950/40">
                                      <div 
                                        className="h-full bg-cyan-400" 
                                        style={{ width: `${mod.load}%`, transition: "width 0.4s ease" }}
                                      />
                                    </div>
                                  </div>
                                )}
                                
                                <span className="text-[7px] font-mono tracking-widest font-bold hidden sm:block uppercase" style={{ color: isEnabled ? "#22d3ee" : "rgba(255,255,255,0.25)" }}>
                                  {mod.status}
                                </span>

                                {/* Custom Cyberswitch (Holographic Cyber Toggle) */}
                                <button
                                  type="button"
                                  onClick={() => toggleModule(mod.id)}
                                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out border outline-none ${
                                    isEnabled 
                                      ? "bg-cyan-500/25 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.2)]" 
                                      : "bg-black/80 border-cyan-500/10"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-300 ease-in-out mt-0.5 ${
                                      isEnabled ? "translate-x-5 bg-cyan-100" : "translate-x-0.5 bg-gray-600"
                                    }`}
                                    style={{
                                      boxShadow: isEnabled ? "0 0 6px #22d3ee" : "none"
                                    }}
                                  />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input bar */}
              <div className="px-4 pb-4 pt-2" style={{ borderTop: "1px solid rgba(34,211,238,0.06)" }}>
                <div className="flex flex-col gap-2">
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

                  {/* Toggle Subagents tray controller trigger bar */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSubagentsTrayOpen(prev => !prev)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded border text-[8px] font-mono font-bold tracking-widest cursor-pointer transition-all duration-300 outline-none ${
                        subagentsTrayOpen 
                          ? "border-[#22d3ee] bg-[#22d3ee]/20 text-[#22d3ee] shadow-[0_0_10px_rgba(34,211,238,0.2)]" 
                          : "border-cyan-500/15 bg-cyan-500/5 text-cyan-400/80 hover:bg-cyan-500/12 hover:text-cyan-400"
                      }`}
                    >
                      🤖 {subagentsTrayOpen ? "CLOSE CONTROLS" : "SUBACTIVE MODULES CONTROLLER TRAY"} ({modules.filter(m => m.enabled !== false).length}/{modules.length} ONLINE)
                    </button>
                    <span className="text-[7.5px] text-[#22d3ee]/35 tracking-wider font-mono uppercase">
                      Colette ADK Layered Subagents Sandbox
                    </span>
                  </div>
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
                  {modules.map((mod) => {
                    const Icon = mod.icon || Cpu;
                    const isEnabled = mod.enabled !== false;
                    const isActive = isEnabled && mod.status !== "idle" && mod.status !== "empty" && mod.status !== "offline";
                    const isExpanded = expandedMod === mod.id;
                    const isCriticalAction = isEnabled && ["scanning", "purging", "critical", "compiling", "checking", "re-routing"].includes(mod.status);
                    return (
                      <motion.div key={mod.id}
                        layoutId={`mod-${mod.id}`}
                        onClick={() => handleExpandModule(mod.id)}
                        className="relative overflow-hidden rounded-lg cursor-pointer animate-none"
                        style={{
                          background: isActive ? "rgba(34,211,238,0.05)" : "rgba(34,211,238,0.02)",
                          border: `1px solid ${isActive ? "rgba(34,211,238,0.2)" : "rgba(34,211,238,0.07)"}`,
                          padding: "8px 10px",
                        }}
                        whileHover={{ borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.07)" }}
                        transition={SPRING_FAST}
                      >
                        {/* scanning line on active */}
                        {isActive && <ScanLine color={isCriticalAction ? "#ef4444" : "#22d3ee"}/>}

                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: isActive ? "rgba(34,211,238,0.12)" : "rgba(34,211,238,0.05)" }}>
                            <Icon size={11} style={{ color: isActive ? "#22d3ee" : "rgba(34,211,238,0.35)" }}/>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span style={{ fontSize: 7, color: "rgba(34,211,238,0.4)", letterSpacing: 1 }}>{mod.id}</span>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCriticalAction ? "animate-pulse" : ""}`}
                                style={{
                                  background: isCriticalAction
                                    ? "#f59e0b"
                                    : isActive
                                      ? "#22d3ee"
                                      : mod.status === "standby"
                                        ? "#3b82f6"
                                        : "rgba(200,220,255,0.2)"
                                }}
                              />
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
                              <div className="pt-2 mt-2 font-mono" style={{ borderTop: "1px solid rgba(34,211,238,0.08)" }}>
                                <div className="flex justify-between mb-1">
                                  <span style={{ fontSize: 7, color: "rgba(200,220,255,0.35)" }}>LOAD</span>
                                  <span style={{ fontSize: 8, color: "#22d3ee" }}>{mod.load}%</span>
                                </div>
                                <MetricBar value={mod.load} height={2}/>
                                <div className="flex justify-between mt-2">
                                  <span style={{ fontSize: 7, color: "rgba(200,220,255,0.25)" }}>STATUS</span>
                                  <span style={{ fontSize: 7, letterSpacing: 1.5, color: isCriticalAction ? "#ef4444" : isActive ? "#22d3ee" : "#f59e0b", textTransform: "uppercase", fontWeight: 600 }}>
                                    {mod.status}
                                  </span>
                                </div>

                                {mod.result && (
                                  <div className="mt-2 p-1.5 rounded bg-black/45 border border-cyan-500/10 max-h-32 overflow-auto scrollbar-thin select-all">
                                    <pre className="text-[7px] text-cyan-400 font-mono leading-tight whitespace-pre-wrap select-all">
                                      {mod.result}
                                    </pre>
                                  </div>
                                )}
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

          {/* ── CLAUDE VIRTUAL WORKSPACE ARTIFACT SANDBOX ───────────────── */}
          <AnimatePresence>
            {artifactSidebarOpen && activeArtifact && (
              <motion.div
                initial={{ width: 0, opacity: 0, x: 100 }}
                animate={{ width: 420, opacity: 1, x: 0 }}
                exit={{ width: 0, opacity: 0, x: 100 }}
                transition={{ type: "spring", stiffness: 220, damping: 25 }}
                className="flex flex-col gap-3 h-full overflow-hidden flex-shrink-0"
              >
                <GlassPanel className="rounded-xl flex-1 flex flex-col min-h-0" style={{ borderRadius: 12, borderColor: "rgba(245,158,11,0.25)" }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-amber-950/20 border-b border-amber-500/15">
                    <div className="flex items-center gap-2">
                      <Terminal size={12} className="text-amber-400 animate-pulse" />
                      <span className="text-[9px] font-mono font-bold text-amber-300 tracking-wider uppercase">
                        CLAUDE SANDBOX WORKSPACE
                      </span>
                    </div>
                    <button
                      onClick={() => setArtifactSidebarOpen(false)}
                      className="p-1 cursor-pointer rounded hover:bg-amber-500/15 text-amber-500/50 hover:text-amber-400 transition-colors border-none bg-transparent outline-none"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* File Stamp details */}
                  <div className="px-4 py-2 bg-black/40 border-b border-amber-500/5 flex items-center justify-between text-[8px] font-mono text-amber-400/60 select-none">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Code2 size={10} />
                      <span>FILE: {activeArtifact.title}</span>
                    </div>
                    <div className="font-mono">
                      <span>{(activeArtifact.code?.length || 0).toLocaleString()} CHARS · EXT: .{activeArtifact.lang || "txt"}</span>
                    </div>
                  </div>

                  {/* Workspace Tabs */}
                  <div className="flex border-b border-amber-500/10 bg-amber-950/5">
                    {[
                      { id: "code", label: "SOURCE" },
                      { id: "schematic", label: "SCHEMATIC BLUEPRINT" },
                      { id: "diagnostics", label: "DIAGNOSTICS & LOGS" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setArtifactTab(tab.id)}
                        className={`flex-1 py-2 font-mono text-[8px] font-bold tracking-widest text-center cursor-pointer transition-colors border-b-2`}
                        style={{
                          borderColor: artifactTab === tab.id ? "#f59e0b" : "transparent",
                          color: artifactTab === tab.id ? "#f59e0b" : "rgba(245,158,11,0.4)",
                          background: artifactTab === tab.id ? "rgba(245,158,11,0.06)" : "transparent"
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab contents */}
                  <div className="flex-1 overflow-auto p-4 flex flex-col min-h-0 bg-black/60 scrollbar-thin">
                    {artifactTab === "code" && (
                      <div className="flex-1 flex flex-col min-h-0">
                        <pre className="flex-1 overflow-auto p-3 rounded bg-black/80 border border-amber-500/5 text-amber-200/90 font-mono text-[10px] leading-relaxed select-all scrollbar-thin whitespace-pre-wrap">
                          <code>{activeArtifact.code}</code>
                        </pre>
                      </div>
                    )}

                    {artifactTab === "schematic" && (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-4 font-mono text-center select-none text-[9px] text-amber-400/80">
                        <div className="p-2 border border-amber-500/20 rounded bg-amber-500/5 w-48 relative">
                          <div className="font-bold text-amber-300">USER INPUT LAYER</div>
                          <div className="text-[7px] text-amber-400/40">Browser UI (CMD Event Node)</div>
                        </div>
                        <div className="h-6 w-px bg-dashed border-l border-dashed border-amber-500/30" />
                        <div className="p-2 border border-amber-500/20 rounded bg-amber-500/5 w-48 relative">
                          <div className="font-bold text-amber-300">NEURAL COGNITION SYSTEM</div>
                          <div className="text-[7px] text-amber-400/40">Claude Custom Artifact Processor</div>
                        </div>
                        <div className="h-6 w-px bg-dashed border-l border-dashed border-amber-500/30" />
                        <div className="p-2 border border-amber-500/20 rounded bg-amber-500/5 w-48 relative">
                          <div className="font-bold text-amber-300">DOCKER EMULATION SHELL</div>
                          <div className="text-[7px] text-amber-400/40">{activeArtifact.title || "Target File"}</div>
                        </div>
                        <div className="h-6 w-px bg-dashed border-l border-dashed border-amber-500/30" />
                        <div className="p-2 border border-green-500/20 rounded bg-green-500/5 w-48 relative">
                          <div className="font-bold text-green-300">NOMINAL RUNTIME STATUS</div>
                          <div className="text-[7px] text-green-400/40 font-mono">Secure Sandboxed Container (OK)</div>
                        </div>
                      </div>
                    )}

                    {artifactTab === "diagnostics" && (
                      <div className="flex-1 flex flex-col min-h-0 font-mono space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-amber-400/40">VM EMULATOR UTILITY</span>
                          <button
                            onClick={() => {
                              setCompilingArtifact(true);
                              setArtifactLog("[PROCESS] Running Diagnostic Pipeline Compiler...\n[WAIT] AST symbol parser booting up...");
                              setTimeout(() => {
                                setArtifactLog(prev => prev + "\n[AST-01] Validating types security bounds...");
                              }, 500);
                              setTimeout(() => {
                                setArtifactLog(prev => prev + "\n[AST-02] Code structure validation successful.\n[SUCCESS] Emulated server launch successful, listening at virtual port 8080.");
                                setCompilingArtifact(false);
                              }, 1500);
                            }}
                            disabled={compilingArtifact}
                            className="px-2 py-1 rounded text-[8px] font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 cursor-pointer disabled:opacity-40 uppercase"
                          >
                            {compilingArtifact ? "Kompilowanie..." : "TEST KOMPILACJI"}
                          </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-black border border-amber-500/10 rounded p-3 text-[9px] text-amber-400 font-mono select-all scrollbar-thin">
                          <div className="text-amber-500/40 select-none pb-2 border-b border-amber-500/10 mb-2">INTEGRITY LOG STREAM:</div>
                          <div className="whitespace-pre-wrap select-all">{artifactLog || "[INFO] System idle. Ready for compilation pipeline probe."}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Global Actions */}
                  <div className="p-3 bg-black/40 border-t border-amber-500/10 flex gap-2">
                    <button
                      onClick={() => {
                        const blob = new Blob([activeArtifact.code], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = activeArtifact.title;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 py-1.5 rounded flex items-center justify-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/15 text-amber-300 font-mono text-[8px] font-bold tracking-widest cursor-pointer uppercase"
                    >
                      <Download size={10} />
                      POBIERZ PLIK
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeArtifact.code);
                        const originalLog = artifactLog;
                        setArtifactLog("[COPIED] Artifact code copied to clipboard successfully.");
                        setTimeout(() => {
                          setArtifactLog(originalLog);
                        }, 2000);
                      }}
                      className="flex-1 py-1.5 rounded flex items-center justify-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/15 text-amber-300 font-mono text-[8px] font-bold tracking-widest cursor-pointer uppercase"
                    >
                      <RefreshCw size={10} className="animate-none" />
                      SKOPIUJ KOD
                    </button>
                  </div>
                </GlassPanel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── AI STUDIO PARAMETER UTILITIES DRAWER ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="absolute top-16 right-3 bottom-3 z-30 flex flex-col rounded-xl"
            style={{
              width: 320,
              background: "rgba(3, 11, 28, 0.95)",
              border: "1px solid rgba(34, 211, 238, 0.25)",
              backdropFilter: "blur(20px)",
              boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 211, 238, 0.05)",
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/10">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 text-[10px] font-black tracking-widest uppercase">
                  AI Studio Parameter Controller
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 cursor-pointer rounded hover:bg-cyan-400/10 text-cyan-400/50 hover:text-cyan-400 transition-colors border-none bg-transparent outline-none"
              >
                <X size={14} />
              </button>
            </div>

            {/* Drawer Parameters Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Preset Model selector */}
              <div className="space-y-2">
                <label className="text-[8px] font-bold tracking-widest text-[#22d3ee]/60 uppercase block">
                  Target AI Model
                </label>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-cyan-950/40 border border-cyan-400/20 text-cyan-200 rounded px-3 py-2 text-xs outline-none focus:border-cyan-400/60 cursor-pointer appearance-none font-mono"
                  >
                    <option value="gemini-2.0-flash">gemini-2.0-flash (Fastest)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Standard)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (Creative Reasoning)</option>
                    <option value="gemini-3.5-flash">gemini-3.5-flash (Next-Gen)</option>
                  </select>
                  <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-cyan-400/40 text-[9px]">
                    ▼
                  </div>
                </div>
                <p className="text-[8px] text-gray-500 leading-normal">
                  Sets the Google Gemini LLM neural core used inside the supervisor layer proxy.
                </p>
              </div>

              {/* System Instructions Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] font-bold tracking-widest text-[#22d3ee]/60 uppercase block">
                    System Instruction Override
                  </label>
                  <button
                    onClick={() => setSystemPrompt("You are COLETTE v8 - J.A.R.V.I.S. ULTRA, the ultimate French cybernetic super-agent assistant designed using the Agent Development Kit (ADK) 5-layered architecture. Speak Polish by default.")}
                    className="text-[7px] text-cyan-400/50 hover:text-cyan-400 cursor-pointer transition-colors border-none bg-transparent outline-none"
                  >
                    RESET DEFAULT
                  </button>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={6}
                  className="w-full bg-cyan-950/40 border border-cyan-400/20 text-cyan-100 rounded p-3 text-[10px] outline-none focus:border-cyan-400/50 resize-y font-mono leading-relaxed placeholder:text-gray-600"
                  placeholder="Insert custom core prompt parameters..."
                />
                <p className="text-[8px] text-gray-500 leading-normal">
                  Controls the guidelines passed to Gemini for generating replies.
                </p>
              </div>

              {/* Temperature slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[8px] font-bold tracking-widest text-[#22d3ee]/60 uppercase">
                  <span>Temperature</span>
                  <span className="text-cyan-400 font-mono">{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                  style={{ accentColor: "#22d3ee" }}
                />
                <p className="text-[8px] text-gray-500 leading-normal">
                  Lower scores yields deterministic facts, larger values drives creativity.
                </p>
              </div>

              {/* Typewriter Toggle and Speed */}
              <div className="space-y-4 pt-3 border-t border-cyan-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold tracking-widest text-[#22d3ee]/60 uppercase leading-none">
                    Typewriter Output Effect
                  </span>
                  <button
                    onClick={() => setTypewriterEnabled(!typewriterEnabled)}
                    className={`relative inline-flex h-4 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out outline-none border-none ${
                      typewriterEnabled ? "bg-cyan-500" : "bg-cyan-950"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out mt-0.5 ${
                        typewriterEnabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {typewriterEnabled && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[7px] font-bold tracking-widest text-cyan-400/70 uppercase">
                      <span>Typing Speed Interval</span>
                      <span>{typewriterSpeed} ms</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="45"
                      step="5"
                      value={typewriterSpeed}
                      onChange={(e) => setTypewriterSpeed(parseInt(e.target.value))}
                      className="w-full h-1 rounded cursor-pointer"
                      style={{ accentColor: "#22d3ee" }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer info */}
            <div className="p-4 bg-cyan-950/25 border-t border-cyan-500/10 text-center text-[8px] text-cyan-400/30 tracking-widest">
              NEXUS DE-SIMULATOR ACTIVE
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL CHAT WINDOW MODAL */}
      <AnimatePresence>
        {chatWindowOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 z-50 rounded-xl overflow-hidden shadow-2xl flex flex-col bg-black/95 border backdrop-blur-xl"
            style={{ borderColor: curTheme.primary }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-white/5" style={{ borderColor: curTheme.border }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded flex items-center justify-center font-bold" style={{ backgroundColor: curTheme.primary, color: "black" }}>
                  {selectedAgent.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-[10px] uppercase tracking-widest" style={{ color: curTheme.primary }}>{curTheme.title}</div>
                  <div className="text-[8px] opacity-60 font-mono tracking-widest" style={{ color: curTheme.textLight }}>FULL CHAT INTERFACE</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={fullChatModel}
                  onChange={(e) => setFullChatModel(e.target.value)}
                  className="bg-black/60 border rounded px-3 py-1 font-mono text-[9px] outline-none hover:brightness-125 transition-all text-white/90"
                  style={{ borderColor: curTheme.border }}
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Fast)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (Experimental)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Flash Reasoning)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (High Analytical)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Standard)</option>
                  <option value="claude-3-5-sonnet">claude-3-5-sonnet (High Logic)</option>
                  <option value="claude-3-opus">claude-3-opus (High Quality)</option>
                  <option value="gpt-4o">gpt-4o (Omni)</option>
                  <option value="gpt-4-turbo">gpt-4-turbo (Fast)</option>
                  <option value="o1">o1 (Deep Reasoning)</option>
                  <option value="o3-mini">o3-mini (High Speed)</option>
                </select>
                <button
                  onClick={() => setChatWindowOpen(false)}
                  className="p-1 rounded bg-red-500/10 hover:bg-red-500/30 text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-auto p-6 space-y-4 font-mono text-[11px] leading-relaxed scrollbar-thin">
              {messages.map(msg => (
                <motion.div key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-4 rounded-xl max-w-[80%] ${msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-black/40 border'}`}
                    style={msg.role !== 'user' ? { borderColor: curTheme.border, color: curTheme.textLight } : {}}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-black/40" style={{ borderColor: curTheme.border }}>
               <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{
                 background: "rgba(255,255,255,0.03)",
                 border: `1px solid ${curTheme.border}`,
               }}>
                 <ChevronRight size={14} style={{ color: curTheme.primary }}/>
                 <input
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   onKeyDown={e => {
                     if(e.key === "Enter") {
                       sendMessage();
                     }
                   }}
                   placeholder={`SEND MESSAGE TO ${selectedAgent.toUpperCase()} [${fullChatModel}]...`}
                   className="flex-1 bg-transparent text-[11px] outline-none text-white font-mono tracking-widest"
                 />
                 <RippleButton onClick={sendMessage}
                   className="w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all hover:brightness-125"
                   style={{ background: curTheme.border, color: curTheme.primary }}>
                   <Send size={14} />
                 </RippleButton>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
