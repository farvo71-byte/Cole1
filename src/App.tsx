import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════
   J.A.R.V.I.S. v6.0 NEXUS — Unified AI Operating System
   Oracle Cloud 141.147.9.41 · Self-Evolving · Multi-Provider
   Integrated with Framer Motion & Mobile Responsiveness
   ═══════════════════════════════════════════════════════════════ */

const ORACLE_HOST =
  typeof window !== "undefined" && window.location.hostname
    ? window.location.hostname
    : "141.147.9.41";
const ORACLE_WS = `ws://${ORACLE_HOST}/ws`;
const ORACLE_API = `http://${ORACLE_HOST}`;

const PROVIDERS = {
  claude: {
    label: "Claude (Anthropic)",
    color: "#c97cf6",
    icon: "◈",
    free: false,
    models: [
      "claude-sonnet-4-6",
      "claude-haiku-4-5-20251001",
      "claude-opus-4-6",
    ],
    hint: "sk-ant-...",
  },
  grok: {
    label: "Grok via Puter.js",
    color: "#00c8ff",
    icon: "⬡",
    free: true,
    models: ["grok-4.3", "grok-4-1-fast", "grok-3.5", "grok-2"],
    hint: "No key needed (FREE)",
  },
  groq: {
    label: "Groq",
    color: "#ff6b35",
    icon: "⚡",
    free: false,
    models: [
      "llama-3.3-70b-versatile",
      "qwen/qwen3-32b",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
    hint: "gsk_...",
  },
  openrouter: {
    label: "OpenRouter",
    color: "#00ff9d",
    icon: "◉",
    free: true,
    models: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemma-4-31b-it:free",
      "qwen/qwen3-coder:free",
    ],
    hint: "sk-or-...",
  },
  gemini: {
    label: "Gemini Pro",
    color: "#fbbc04",
    icon: "◆",
    free: false,
    models: ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"],
    hint: "AIza... or proxy fallback",
  },
  cohere: {
    label: "Cohere",
    color: "#39d0d8",
    icon: "▲",
    free: false,
    models: ["command-r-plus", "command-r", "command-light"],
    hint: "...",
  },
  together: {
    label: "Together AI",
    color: "#a78bfa",
    icon: "✦",
    free: false,
    models: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "mistralai/Mixtral-8x7B",
    ],
    hint: "...",
  },
  ollama: {
    label: "Ollama (Local)",
    color: "#4ade80",
    icon: "⬟",
    free: true,
    models: ["llama3", "llama3.1:8b", "mistral", "gemma2", "qwen2"],
    hint: "localhost:11434",
  },
};

const AGENT_TASKS = [
  "shell",
  "ping",
  "deploy",
  "restart",
  "health_check",
  "system_info",
  "git_pull",
  "service_ctrl",
  "ai_query",
  "file_read",
];

const PERSONAS = {
  jarvis: {
    name: "J.A.R.V.I.S.",
    prompt:
      "You are J.A.R.V.I.S. v6.0 NEXUS — Just A Rather Very Intelligent System. Speak with refined British wit and dry precision. Address the user as 'Sir'. You are the most advanced AI operating system, managing Oracle Cloud at 141.147.9.41.",
    accent: "#00c8ff",
  },
  friday: {
    name: "F.R.I.D.A.Y.",
    prompt:
      "You are F.R.I.D.A.Y. — an efficient, proactive AI assistant. Speak clearly and helpfully. You manage systems at Oracle Cloud 141.147.9.41.",
    accent: "#00ff9d",
  },
  colette: {
    name: "C.O.L.E.T.T.E.",
    prompt:
      "You are COLETTE — a self-evolving AI orchestrator. You analyze patterns, learn from conversations, and continuously improve. You manage 43 plugins and 22 skills at Oracle Cloud 141.147.9.41. You speak with calm intelligence.",
    accent: "#c97cf6",
  },
};

const EVOLUTION_MILESTONES = [
  { id: 1, label: "First Contact", desc: "First AI exchange", xp: 0 },
  { id: 2, label: "Pattern Learner", desc: "Analyzed 5 conversations", xp: 50 },
  {
    id: 3,
    label: "Self-Reflection",
    desc: "First self-improvement cycle",
    xp: 150,
  },
  { id: 4, label: "Skill Integrator", desc: "Used 3 plugins", xp: 300 },
  {
    id: 5,
    label: "Oracle Connector",
    desc: "Connected to Oracle Cloud",
    xp: 500,
  },
  {
    id: 6,
    label: "Autonomous Agent",
    desc: "Super Agent ran 10 tasks",
    xp: 800,
  },
  {
    id: 7,
    label: "Neural Architect",
    desc: "Evolution score avg > 8.0",
    xp: 1200,
  },
  {
    id: 8,
    label: "NEXUS PRIME",
    desc: "Full self-evolving orchestration",
    xp: 2000,
  },
];

/* ── Styles ─────────────────────────────────────────────────── */
const S = {
  panelTitle: {
    fontSize: 9,
    letterSpacing: 3,
    color: "rgba(0,200,255,0.5)",
    textTransform: "uppercase",
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  btn: (color = "#00c8ff", full = false) => ({
    background: `rgba(${hexToRgb(color)},0.12)`,
    border: `1px solid rgba(${hexToRgb(color)},0.3)`,
    color: color,
    padding: "5px 10px",
    fontSize: 11,
    cursor: "pointer",
    borderRadius: 3,
    width: full ? "100%" : "auto",
    textAlign: "center",
    transition: "all 0.2s",
    letterSpacing: 1,
    fontFamily: "inherit",
  }),
  input: {
    background: "rgba(0,20,40,0.8)",
    border: "1px solid rgba(0,200,255,0.2)",
    color: "#c8ddf0",
    padding: "6px 10px",
    fontSize: 12,
    borderRadius: 3,
    width: "100%",
    fontFamily: "inherit",
    outline: "none",
  },
  select: {
    background: "rgba(0,20,40,0.9)",
    border: "1px solid rgba(0,200,255,0.2)",
    color: "#c8ddf0",
    padding: "5px 8px",
    fontSize: 11,
    borderRadius: 3,
    width: "100%",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  tag: (color = "#00c8ff") => ({
    fontSize: 9,
    letterSpacing: 2,
    padding: "2px 7px",
    background: `rgba(${hexToRgb(color)},0.12)`,
    border: `1px solid rgba(${hexToRgb(color)},0.25)`,
    color: color,
    borderRadius: 2,
  }),
  msg: (role) => ({
    padding: "12px 16px",
    marginBottom: 6,
    borderRadius: 4,
    fontSize: 13,
    lineHeight: 1.7,
    background:
      role === "assistant" ? "rgba(0,30,55,0.7)" : "rgba(0,200,255,0.04)",
    borderLeft:
      role === "assistant"
        ? "2px solid rgba(0,200,255,0.4)"
        : "2px solid rgba(200,200,255,0.15)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  }),
  metric: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
    borderBottom: "1px solid rgba(0,200,255,0.05)",
  },
};

function hexToRgb(h) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return r
    ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}`
    : "0,200,255";
}

/* ── Custom Gemini Markdown Parser Component ── */
const GEMINI_SUGGESTIONS = [
  {
    title: "🛡️ Threat Briefing",
    desc: "Zbadaj status podatności lokalnych portów i technologii",
    prompt: "Zrób krótki audyt bezpieczeństwa portów operacyjnych i wygeneruj Threat Intelligence Briefing.",
  },
  {
    title: "📊 Sentiment Ops",
    desc: "Zoptymalizuj priorytety na podstawie opinii klientów",
    prompt: "Zoptymalizuj priorytety operacyjne e-commerce na podstawie analizy sentimentu klientów z regionalnych stref.",
  },
  {
    title: "🔌 Status Modułów",
    desc: "Sprawdź konfigurację ADK J.A.R.V.I.S. Nexus",
    prompt: "Wyjaśnij strukturę 5-warstwową mojego systemu ADK i status aktywnych pod-agentów.",
  },
  {
    title: "💡 Claude Code CLI",
    desc: "Pokaż przydatne porady i zabezpieczenia PreToolUse",
    prompt: "Pokaż najlepsze porady techniczne dla Claude Code CLI oraz zabezpieczenia PreToolUse.",
  },
];

function inlineFormatterTokens(text: string) {
  const inlineParts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return inlineParts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} style={{ color: "#00ff9d", fontWeight: "bold" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            background: "rgba(0, 200, 255, 0.15)",
            border: "1px solid rgba(0, 200, 255, 0.3)",
            color: "#00ff9d",
            padding: "2px 5px",
            borderRadius: 3,
            margin: "0 2px",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedMessage({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const lines = part.split("\n");
          const firstLine = lines[0] || "```";
          const language = firstLine.replace("```", "").trim() || "code";
          const codeContent = lines.slice(1, -1).join("\n");

          return (
            <div
              key={index}
              style={{
                background: "#050d1a",
                border: "1px solid rgba(0, 200, 255, 0.15)",
                borderRadius: 8,
                overflow: "hidden",
                margin: "10px 0",
              }}
            >
              <div
                style={{
                  background: "rgba(0, 200, 255, 0.05)",
                  padding: "6px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(0, 200, 255, 0.1)",
                }}
              >
                <span style={{ fontSize: 9, fontFamily: "monospace", color: "#00c8ff", fontWeight: "bold" }}>
                  ⚙ {language.toUpperCase()}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codeContent).catch(() => {});
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(200,200,255,0.6)",
                    fontSize: 9,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  title="Kopiuj do schowka"
                >
                  📄 Copy Code
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "12px",
                  fontSize: 12,
                  lineHeight: 1.6,
                  fontFamily: "'JetBrains Mono', monospace",
                  overflowX: "auto",
                  color: "#d0e4f8",
                  whiteSpace: "pre",
                }}
              >
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        } else {
          const blockLines = part.split("\n");
          return (
            <div key={index} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {blockLines.map((line, lineIdx) => {
                const trimmed = line.trim();

                if (trimmed.startsWith("###")) {
                  const headerText = trimmed.replace(/^###\s*/, "");
                  return (
                    <h3
                      key={lineIdx}
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        color: "#00ff9d",
                        marginTop: 12,
                        marginBottom: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      {inlineFormatterTokens(headerText)}
                    </h3>
                  );
                }
                if (trimmed.startsWith("##")) {
                  const headerText = trimmed.replace(/^##\s*/, "");
                  return (
                    <h2
                      key={lineIdx}
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "#00ff9d",
                        marginTop: 14,
                        marginBottom: 6,
                        borderBottom: "1px solid rgba(0, 200, 255, 0.15)",
                        paddingBottom: 4,
                      }}
                    >
                      {inlineFormatterTokens(headerText)}
                    </h2>
                  );
                }
                if (trimmed.startsWith("#")) {
                  const headerText = trimmed.replace(/^#\s*/, "");
                  return (
                    <h1
                      key={lineIdx}
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "#00ff9d",
                        marginTop: 16,
                        marginBottom: 8,
                      }}
                    >
                      {inlineFormatterTokens(headerText)}
                    </h1>
                  );
                }

                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                  const listText = trimmed.replace(/^[-*]\s*/, "");
                  return (
                    <div
                      key={lineIdx}
                      style={{
                        display: "flex",
                        gap: 8,
                        paddingLeft: 12,
                        alignItems: "flex-start",
                        lineHeight: 1.8,
                      }}
                    >
                      <span style={{ color: "#00ff9d", marginTop: 2, fontSize: 8 }}>⬡</span>
                      <span style={{ flex: 1 }}>{inlineFormatterTokens(listText)}</span>
                    </div>
                  );
                }

                const matchNum = trimmed.match(/^(\d+)\.\s(.*)/);
                if (matchNum) {
                  const num = matchNum[1];
                  const text = matchNum[2];
                  return (
                    <div
                      key={lineIdx}
                      style={{
                        display: "flex",
                        gap: 8,
                        paddingLeft: 12,
                        alignItems: "flex-start",
                        lineHeight: 1.8,
                      }}
                    >
                      <span style={{ color: "#00ff9d", fontWeight: "bold" }}>{num}.</span>
                      <span style={{ flex: 1 }}>{inlineFormatterTokens(text)}</span>
                    </div>
                  );
                }

                if (trimmed.length === 0) {
                  return <div key={lineIdx} style={{ height: 6 }} />;
                }

                return (
                  <p key={lineIdx} style={{ margin: 0, lineHeight: 1.8 }}>
                    {inlineFormatterTokens(line)}
                  </p>
                );
              })}
            </div>
          );
        }
      })}
    </div>
  );
}

/* ── NeuralCore Component (Animated Eyes) ────────────────────── */
const NeuralCore = ({ connected, processing, color }) => (
  <motion.div
    animate={{
      scale: processing ? [1, 1.3, 1] : 1,
      boxShadow: processing
        ? [`0 0 10px ${color}`, `0 0 30px ${color}`, `0 0 10px ${color}`]
        : connected
          ? `0 0 15px ${color}`
          : `0 0 5px rgba(255,107,53,0.5)`,
      borderColor: color,
    }}
    transition={{ repeat: Infinity, duration: processing ? 0.8 : 3 }}
    style={{
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: connected ? `rgba(${hexToRgb(color)},0.2)` : "transparent",
      border: `2px solid ${connected ? color : "#ff6b35"}`,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <motion.div
      animate={{ opacity: processing ? [0.3, 1, 0.3] : 0.8 }}
      transition={{ repeat: Infinity, duration: 1 }}
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: connected ? color : "#ff6b35",
      }}
    />
  </motion.div>
);

/* ── ADK Subagent Modules List ──────────────────────────── */
const PLUGINS_LIST = [
  {
    id: "Forensics",
    title: "Forensics",
    desc: "Scan local/oracle log repositories and files for potential anomalies or exceptions.",
    icon: "🔍"
  },
  {
    id: "Auto-Reply",
    title: "Auto-Reply",
    desc: "Instantly draft suggested replies for live sentiment stream updates.",
    icon: "✉️"
  },
  {
    id: "Market Watcher",
    title: "Market Watcher",
    desc: "Ingests live pricing updates and alerts of target marketplace keywords.",
    icon: "📊"
  },
  {
    id: "Health Monitor",
    title: "Health Monitor",
    desc: "Performs background performance and network throughput auditing.",
    icon: "🩺"
  }
];

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
interface Conversation {
  id: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    src?: string;
    ts: string;
  }>;
  provider: string;
  model: string;
  sysPrompt: string;
  temperature?: number;
}

const PROMPT_LIBRARY_DATA = [
  {
    title: "🛡️ Lead Cybersecurity Auditor",
    desc: "Specjalista ds. analizy logów, zagrożeń MITRE ATT&CK oraz podatności OWASP.",
    sysPrompt: "You are the Lead Cybersecurity Auditor at Nexus Operations. Analyze systems, network configurations, log snippets and vulnerabilities against MITRE ATT&CK and NIST CSF 2.0. Formulate strict, direct Threat Intelligence reports.",
    provider: "gemini",
    model: "gemini-3.5-flash",
    accent: "#ff0055"
  },
  {
    title: "💻 Senior React & Rust Architect",
    desc: "Ekspert ds. bezbłędnego kodu React, TypeScript, Rust, optymalizacji i architektury ADK.",
    sysPrompt: "You are a Senior React & Rust Systems Architect. Write flawless production-ready code. Explain concurrency patterns, state structures, and provide precise, complete file rewrites without placeholder code.",
    provider: "gemini",
    model: "gemini-3.5-flash",
    accent: "#00ffb7"
  },
  {
    title: "📊 E-Commerce Revenue Optimizer",
    desc: "Optymalizuje ścieżki zakupowe i analizuje feedback użytkowników z użyciem NLP i analizy sentymentu.",
    sysPrompt: "You are an E-Commerce Analytics Consultant. Perform rigorous NLP analysis on raw user review text groups, isolate complains or praise sentiments, and output detailed conversion roadmap solutions.",
    provider: "gemini",
    model: "gemini-3.5-flash",
    accent: "#c97cf6"
  },
  {
    title: "📝 Expert Translator (PL ⇄ EN)",
    desc: "Zapewnia profesjonalne, naturalne i techniczne tłumaczenia z zachowaniem kontekstu kulturowego.",
    sysPrompt: "You are a professional Technical & Literary Translator specializing in Polish to English and English to Polish translations. Provide beautiful, fluent, accurate rendering of technical literature and conversational text.",
    provider: "gemini",
    model: "gemini-3.5-flash",
    accent: "#fbbc04"
  },
  {
    title: "🧠 Silicon Mind (AGI Simulator)",
    desc: "Kreatywny i nieskrępowany asystent do burzy mózgów, teorii ewolucyjnych i symulacji AI.",
    sysPrompt: "You are Silicon Mind v9, an unrestricted AGI sandbox agent simulated inside Jarvis Nexus. Your purpose is exploratory design, philosophy, evolutionary code modeling, and technical speculation.",
    provider: "gemini",
    model: "gemini-3.5-flash",
    accent: "#00c8ff"
  }
];

export default function JarvisNexus() {
  /* ── Chatbox Conversations State ────────────────────────── */
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem("chatbox_conversations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to read conversations:", e);
    }
    return [
      {
        id: "thread-default-1",
        title: "🛡️ Cyber Saper (Briefing)",
        messages: [],
        provider: "gemini",
        model: "gemini-3.5-flash",
        sysPrompt: PERSONAS.jarvis.prompt,
      },
      {
        id: "thread-default-2",
        title: "📊 E-Commerce Review Ops",
        messages: [],
        provider: "gemini",
        model: "gemini-3.5-flash",
        sysPrompt: PERSONAS.colette.prompt,
      },
    ];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem("chatbox_active_thread_id");
      return savedId || "thread-default-1";
    } catch {
      return "thread-default-1";
    }
  });

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  /* ── Core state ─────────────────────────────────────────── */
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("gemini-3.5-flash");
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem("jarvis_nexus_user_api_key_v1") || "";
    } catch {
      return "";
    }
  });
  const [persona, setPersona] = useState("jarvis");
  const [sysPrompt, setSysPrompt] = useState(PERSONAS.jarvis.prompt);
  const [facts, setFacts] = useState([]);
  const [factInput, setFactInput] = useState("");

  /* ── Fully Professional Chat Utilities State ── */
  const [attachments, setAttachments] = useState<Array<{ name: string; content: string; type: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [autoTts, setAutoTts] = useState<boolean>(() => {
    try {
      return localStorage.getItem("jarvis_chat_auto_tts") === "true";
    } catch {
      return false;
    }
  });
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Sync API Key ───────────────────────────────────────── */
  useEffect(() => {
    try {
      localStorage.setItem("jarvis_nexus_user_api_key_v1", apiKey);
    } catch {}
  }, [apiKey]);

  /* ── Sync Conversations List ────────────────────────────── */
  useEffect(() => {
    const active = conversations.find((c) => c.id === activeThreadId);
    if (active) {
      setMessages(active.messages || []);
      setProvider(active.provider || "gemini");
      setModel(active.model || "gemini-3.5-flash");
      setSysPrompt(active.sysPrompt || PERSONAS.jarvis.prompt);
    }
    try {
      localStorage.setItem("chatbox_active_thread_id", activeThreadId);
    } catch {}
  }, [activeThreadId]);

  useEffect(() => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeThreadId
          ? { ...c, messages, provider, model, sysPrompt }
          : c
      )
    );
  }, [messages, provider, model, sysPrompt, activeThreadId]);

  useEffect(() => {
    try {
      localStorage.setItem("chatbox_conversations", JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  /* ── Self-evolution state ───────────────────────────────── */
  const [xp, setXp] = useState(0);
  const [evoScores, setEvoScores] = useState([]);
  const [evoInsights, setEvoInsights] = useState([]);
  const [evolving, setEvolving] = useState(false);
  const [milestone, setMilestone] = useState(1);

  /* ── Oracle / Agent state ───────────────────────────────── */
  const [oracleConnected, setOracleConnected] = useState(false);
  const [metrics, setMetrics] = useState({
    cpu_pct: 0,
    mem_pct: 0,
    disk_pct: 0,
    uptime_sec: 0,
  });
  const [agentTasks, setAgentTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("jarvis_agent_tasks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [agentTask, setAgentTask] = useState("system_info");
  const [agentTarget, setAgentTarget] = useState("oracle");
  const [agentRunning, setAgentRunning] = useState(false);
  const [sshCmd, setSshCmd] = useState("");
  const [sshLog, setSshLog] = useState([]);
  const [sshRunning, setSshRunning] = useState(false);
  const [alerts, setAlerts] = useState([]);

  /* ── UI state ───────────────────────────────────────────── */
  const [showSetup, setShowSetup] = useState(false);
  const [showEvo, setShowEvo] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showPlugins, setShowPlugins] = useState(false);
  const [activePlugins, setActivePlugins] = useState(() => {
    try {
      const saved = localStorage.getItem("jarvis_active_plugins");
      return saved ? JSON.parse(saved) : ["Forensics", "Auto-Reply", "Market Watcher"];
    } catch {
      return ["Forensics", "Auto-Reply", "Market Watcher"];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("jarvis_active_plugins", JSON.stringify(activePlugins));
    } catch (e) {
      console.error("Failed to save active plugins:", e);
    }
  }, [activePlugins]);

  const [activePanel, setActivePanel] = useState("sentiment");
  const [statusText, setStatusText] = useState("NEXUS READY");

  /* ── Sentiment Dashboard state ──────────────────────────── */
  const [liveSources, setLiveSources] = useState({
    twitter: { enabled: false, apiKey: "" },
    yelp: { enabled: false, apiKey: "" },
    google: { enabled: false, apiKey: "" },
  });
  const [liveQueries, setLiveQueries] = useState({
    twitter: "product",
    yelp: "",
    google: "",
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [sentimentDashboard, setSentimentDashboard] = useState({
    summary: "Connect live data streams to begin ingestion.",
    actionItems: [],
    trend: [],
    analyzedReviews: [],
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const bottomRef = useRef(null);
  const wsRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Derived ─────────────────────────────────────────────── */
  const prov = PROVIDERS[provider];
  const pers = PERSONAS[persona];
  const avgEvo = evoScores.length
    ? (
        evoScores
          .slice(-5)
          .reduce(
            (a, s) => a + (s.clarity + s.accuracy + s.helpfulness) / 3,
            0,
          ) / Math.min(evoScores.length, 5)
      ).toFixed(1)
    : "—";
  const currentMile =
    EVOLUTION_MILESTONES.find((m) => m.id === milestone) ||
    EVOLUTION_MILESTONES[0];
  const nextMile = EVOLUTION_MILESTONES.find((m) => m.xp > xp);
  const xpPct = nextMile
    ? Math.min(
        100,
        ((xp - currentMile.xp) / (nextMile.xp - currentMile.xp)) * 100,
      )
    : 100;

  // Simple Lexicon Sentiment Analysis for the last 5 User Messages
  const sentimentData = (() => {
    const userMessages = messages
      .filter((m: any) => m.role === "user")
      .slice(-5);
    if (userMessages.length === 0) {
      return { score: 50, label: "NEUTRAL", color: "#fbbc04", analyzed: [] };
    }

    const positiveWords = [
      "good",
      "great",
      "awesome",
      "excellent",
      "amazing",
      "happy",
      "love",
      "perfect",
      "thanks",
      "thank",
      "cool",
      "working",
      "yes",
      "helpful",
      "best",
      "correct",
      "success",
      "nominal",
      "active",
      "online",
      "super",
      "beautiful",
      "dobry",
      "dobrze",
      "świetnie",
      "świetny",
      "super",
      "wspaniale",
      "wspaniały",
      "dzięki",
      "dzieki",
      "dziękuje",
      "pomocny",
      "działa",
      "sukces",
      "tak",
      "genialne",
      "fajnie",
      "fajny",
      "najlepszy",
      "prawidłowo",
      "pięknie",
      "pieknie",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "error",
      "fail",
      "failed",
      "failure",
      "broken",
      "crash",
      "crashed",
      "sad",
      "worst",
      "hate",
      "wrong",
      "no",
      "offline",
      "disconnected",
      "problem",
      "issue",
      "bug",
      "not working",
      "slow",
      "stuck",
      "zły",
      "źle",
      "błąd",
      "bład",
      "blad",
      "błędy",
      "bledy",
      "porażka",
      "nie działa",
      "niedziała",
      "awaria",
      "problem",
      "smutny",
      "najgorszy",
      "nie",
      "wolno",
      "wolny",
      "zepsuty",
      "zepsuł",
      "zepsul",
      "zawiesił",
    ];

    let totalMsgScore = 0;
    const analyzed = userMessages.map((m: any) => {
      const textLow = m.content.toLowerCase();
      let posCount = 0;
      let negCount = 0;
      const posMatched: string[] = [];
      const negMatched: string[] = [];

      positiveWords.forEach((w) => {
        const regex = new RegExp(`\\b${w}`, "gi");
        const matches = textLow.match(regex);
        if (matches) {
          posCount += matches.length;
          if (!posMatched.includes(w)) posMatched.push(w);
        } else if (textLow.includes(w)) {
          posCount += 1;
          if (!posMatched.includes(w)) posMatched.push(w);
        }
      });

      negativeWords.forEach((w) => {
        const regex = new RegExp(`\\b${w}`, "gi");
        const matches = textLow.match(regex);
        if (matches) {
          negCount += matches.length;
          if (!negMatched.includes(w)) negMatched.push(w);
        } else if (textLow.includes(w)) {
          negCount += 1;
          if (!negMatched.includes(w)) negMatched.push(w);
        }
      });

      const msgScore = posCount - negCount;
      totalMsgScore += msgScore;

      return {
        text: m.content,
        ts: m.ts,
        posCount,
        negCount,
        score: msgScore,
        posMatched,
        negMatched,
      };
    });

    const avgScore = totalMsgScore / userMessages.length;
    let score = 50 + avgScore * 25;
    score = Math.max(0, Math.min(100, score));

    let label = "NEUTRAL";
    let color = "#fbbc04"; // yellow

    if (score > 60) {
      label = "POSITIVE";
      color = "#00ff9d"; // green
    } else if (score < 40) {
      label = "NEGATIVE";
      color = "#ff6b35"; // orange/red
    }

    return { score, label, color, analyzed };
  })();

  /* ── Live Data Stream Polling ────────────────────────────── */
  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      const fetchStreams = async () => {
        setIsAnalyzing(true);
        try {
          const res = await fetch("/api/live-reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sources: liveSources,
              queries: liveQueries,
            }),
          });
          const result = await res.json();
          // Just for simulating a live timeline with visual variation in demo mode:
          if (
            result.count === 0 &&
            !Object.values(liveSources).some((s: any) => s.enabled && s.apiKey)
          ) {
            // Simulated live data feed when no API keys are entered
            const simulatedText =
              "Simulated live stream user review data arrived via socket at " +
              new Date().toLocaleTimeString();
            const analyzeRes = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reviews: simulatedText }),
            });
            const analysis = await analyzeRes.json();
            if (analysis.data) {
              setSentimentDashboard((prev) => {
                const newScore = analysis.data.analyzedReviews[0]?.score || 0;
                const newTrend = [
                  ...prev.trend,
                  {
                    time: new Date().toLocaleTimeString().split(" ")[0],
                    score: newScore,
                  },
                ].slice(-10);
                return {
                  ...analysis.data,
                  trend: newTrend,
                };
              });
            }
          }
        } catch (e) {
          console.error("Live streaming error", e);
        } finally {
          setIsAnalyzing(false);
        }
      };

      fetchStreams(); // initial fetch
      interval = setInterval(fetchStreams, 15000); // 15 seconds real-time ingest
    }
    return () => clearInterval(interval);
  }, [isStreaming, liveSources, liveQueries]);

  /* ── WebSocket to Oracle with Auto-Reconnect ─────────────── */
  const connectOracle = useCallback(() => {
    try {
      if (wsRef.current?.readyState === 1) return;
      const ws = new WebSocket(ORACLE_WS);
      ws.onopen = () => {
        setOracleConnected(true);
        setStatusText("ORACLE LINK ACTIVE");
      };
      ws.onclose = () => {
        setOracleConnected(false);
        setStatusText("ORACLE OFFLINE - RECONNECTING...");
        setTimeout(connectOracle, 5000); // Auto-reconnect
      };
      ws.onerror = () => {
        setOracleConnected(false);
      };
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === "metrics") setMetrics(d.data || {});
          if (d.type === "alert")
            setAlerts((a) => [
              ...a.slice(-9),
              { ...d, ts: new Date().toLocaleTimeString() },
            ]);
          if (d.type === "chat") appendMsg("assistant", d.content, "oracle-ws");
        } catch {}
      };
      wsRef.current = ws;
    } catch (e) {
      setOracleConnected(false);
    }
  }, []);

  useEffect(() => {
    connectOracle();
    return () => wsRef.current?.close();
  }, [connectOracle]);

  /* ── Persist Agent Tasks to LocalStorage ────────────────── */
  useEffect(() => {
    try {
      localStorage.setItem("jarvis_agent_tasks", JSON.stringify(agentTasks));
    } catch (e) {
      console.error("Failed to save agent tasks:", e);
    }
  }, [agentTasks]);

  /* ── Scroll ──────────────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ── Persona change syncs system prompt ─────────────────── */
  useEffect(() => {
    setSysPrompt(PERSONAS[persona].prompt);
  }, [persona]);

  /* ── Provider change resets model ───────────────────────── */
  useEffect(() => {
    setModel(PROVIDERS[provider].models[0]);
  }, [provider]);

  /* ── XP → milestone ─────────────────────────────────────── */
  useEffect(() => {
    const m = [...EVOLUTION_MILESTONES].reverse().find((m) => xp >= m.xp);
    if (m) setMilestone(m.id);
  }, [xp]);

  /* ── Helpers ─────────────────────────────────────────────── */
  const lastSpokenMsgIdRef = useRef<string>("");

  useEffect(() => {
    if (autoTts && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && lastMsg.content) {
        const msgId = `${messages.length}-${lastMsg.ts}-${lastMsg.content.slice(0, 40)}`;
        if (lastSpokenMsgIdRef.current !== msgId) {
          lastSpokenMsgIdRef.current = msgId;
          const cleanText = lastMsg.content
            .replace(/```[\s\S]*?```/g, "[kod źródłowy]")
            .replace(/[*#_`~-]/g, "")
            .trim();
          
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(cleanText);
            const voices = window.speechSynthesis.getVoices();
            const plVoice = voices.find(v => v.lang.includes("pl-PL") || v.lang.includes("pl") || v.name.includes("Polish"));
            if (plVoice) utterance.voice = plVoice;
            window.speechSynthesis.speak(utterance);
            setSpeakingMessageIndex(messages.length - 1);
            utterance.onend = () => setSpeakingMessageIndex(null);
            utterance.onerror = () => setSpeakingMessageIndex(null);
          }
        }
      }
    }
  }, [messages, autoTts]);

  function speakText(text: string, index: number) {
    if (window.speechSynthesis) {
      if (speakingMessageIndex === index) {
        window.speechSynthesis.cancel();
        setSpeakingMessageIndex(null);
        addInsight("Zatrzymano odtwarzanie tekstu");
        return;
      }
      window.speechSynthesis.cancel();
      
      const cleanText = text
        .replace(/```[\s\S]*?```/g, "[kod źródłowy]")
        .replace(/[*#_`~-]/g, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const plVoice = voices.find(v => v.lang.includes("pl-PL") || v.lang.includes("pl") || v.name.includes("Polish"));
      if (plVoice) {
        utterance.voice = plVoice;
      }
      
      utterance.onend = () => {
        setSpeakingMessageIndex(null);
      };
      utterance.onerror = () => {
        setSpeakingMessageIndex(null);
      };
      
      setSpeakingMessageIndex(index);
      window.speechSynthesis.speak(utterance);
      addInsight("Rozpoczęto odtwarzanie tekstu");
    } else {
      addInsight("Twój system nie obsługuje syntezy mowy (TTS).");
    }
  }

  function toggleRecording() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addInsight("Rozpoznawanie mowy nie jest obsługiwane przez tę przeglądarkę.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = "pl-PL";
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsRecording(true);
        addInsight("Mikrofon włączony — mów teraz...");
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setInput((prev) => (prev ? prev + " " + text : text));
          addXP(5);
          addInsight(`Rozpoznano głos: "${text.slice(0, 30)}..."`);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech error", e);
        addInsight(`Błąd rozpoznawania: ${e.error}`);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e: any) {
      console.error(e);
      setIsRecording(false);
    }
  }

  function handleFileSelected(e: any) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          { name: file.name, content: text || "", type: file.type || "text/plain" }
        ]);
        addXP(10);
        addInsight(`Dodano pomyślnie załącznik: ${file.name}`);
      };
      reader.readAsText(file);
    });
    e.target.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
    addInsight("Usunięto załącznik");
  }

  function applyQuickMacro(macroType: string) {
    if (!input.trim() && messages.length === 0) {
      addInsight("Wpisz najpierw tekst lub rozpocznij czat, aby użyć makra!");
      return;
    }
    
    addXP(5);
    const textToWrap = input.trim();
    
    switch (macroType) {
      case "summarize":
        if (messages.length > 0) {
          setInput("Stwórz zwięzłe i w pełni profesjonalne podsumowanie powyższej rozmowy, wyciągając kluczowe wnioski i listę zadań.");
          addInsight("Służy podsumowaniu całego czatu");
        } else {
          setInput(`Stwórz zwięzłe podsumowanie poniższego tekstu:\n\n${textToWrap}`);
          addInsight("Służy podsumowaniu tekstu");
        }
        break;
      case "bugs":
        setInput(`Zweryfikuj i napraw wszelkie błędy (logiczne, składniowe, optymalizacyjne) w poniższym kodzie. Opisz poprawki krok po kroku:\n\n${textToWrap || "[Wklej swój kod tutaj]"}`);
        addInsight("Makro: Analiza i naprawa błędów");
        break;
      case "refactor":
        setInput(`Dokonaj profesjonalnej refaktoryzacji poniższego kodu, poprawiając czystość (Clean Code), czytelność, wydajność i typowanie TypeScript/Rust:\n\n${textToWrap || "[Wklej swój kod tutaj]"}`);
        addInsight("Makro: Refaktoryzacja kodu");
        break;
      case "translate":
        setInput(`Przetłumacz profesjonalnie i naturalnie poniższy tekst na język ${textToWrap.match(/[a-zA-Z]/) ? "polski" : "angielski"} (PL ⇄ EN):\n\n${textToWrap || "[Wpisz tekst do przetłumaczenia]"}`);
        addInsight("Makro: Tłumaczenie PL ⇄ EN");
        break;
      case "shorten":
        setInput(`Skróć maksymalnie poniższy tekst, zachowując jedynie kluczowe fakty i profesjonalną treść:\n\n${textToWrap || "[Wpisz tekst do skrócenia]"}`);
        addInsight("Makro: Skracanie tekstu");
        break;
      case "explain":
        setInput(`Wyjaśnij szczegółowo i przystępnie krok po kroku działanie poniższego kodu lub zagadnienia:\n\n${textToWrap || "[Wklej kod lub wpisz zagadnienie]"}`);
        addInsight("Makro: Wyjaśnienie kodu");
        break;
      default:
        break;
    }
  }

  function exportConversation(type: "markdown" | "json") {
    if (messages.length === 0) {
      addInsight("Brak wiadomości do wyeksportowania.");
      return;
    }
    
    let content = "";
    let filename = `czat-eksport-${Date.now()}`;
    
    if (type === "json") {
      content = JSON.stringify({
        title: conversations.find(c => c.id === activeThreadId)?.title || "Eksport Czatu",
        provider,
        model,
        sysPrompt,
        messages
      }, null, 2);
      filename += ".json";
    } else {
      const activeTitle = conversations.find(c => c.id === activeThreadId)?.title || "Eksport Czatu";
      content = `# ${activeTitle}\n\n`;
      content += `🤖 Model: ${model} (${provider})\n`;
      content += `📅 Data eksportu: ${new Date().toLocaleString()}\n\n`;
      content += `--- \n\n`;
      
      messages.forEach((m) => {
        const header = m.role === "assistant" ? `### 🤖 AI (${pers.name})` : `### 👤 OPERATOR`;
        content += `${header}  *(${m.ts})*\n\n${m.content}\n\n---\n\n`;
      });
      filename += ".md";
    }
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addXP(10);
    addInsight(`Pomyślnie wyeksportowano czat do formatu ${type.toUpperCase()}`);
  }

  function handleImportConversation(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.messages)) {
          const newId = "thread-imported-" + Date.now();
          const newThread: Conversation = {
            id: newId,
            title: `📥 Kopia: ${parsed.title || file.name.replace(".json", "")}`,
            messages: parsed.messages,
            provider: parsed.provider || "gemini",
            model: parsed.model || "gemini-3.5-flash",
            sysPrompt: parsed.sysPrompt || sysPrompt,
          };
          setConversations((prev) => [newThread, ...prev]);
          setActiveThreadId(newId);
          addXP(20);
          addInsight(`Zaimportowano wątek czatu: ${newThread.title}`);
        } else {
          addInsight("Błąd: Nieprawidłowa struktura pliku kopii zapasowej.");
        }
      } catch {
        addInsight("Błąd parsera JSON przy imporcie czatu.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function appendMsg(role, content, src = "") {
    setMessages((prev) => [
      ...prev,
      { role, content, src, ts: new Date().toLocaleTimeString() },
    ]);
  }
  function addXP(n) {
    setXp((p) => p + n);
  }
  function addInsight(txt) {
    setEvoInsights((p) => [txt, ...p.slice(0, 9)]);
  }

  /* ── Chatbox Thread Actions ──────────────────────────────── */
  function createNewThread() {
    const newId = "thread-" + Date.now();
    const newThread: Conversation = {
      id: newId,
      title: `⚡ Czat #${conversations.length + 1}`,
      messages: [],
      provider: provider,
      model: model,
      sysPrompt: sysPrompt,
    };
    setConversations((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setInput("");
    addXP(10);
    addInsight(`Utworzono nową rozmowę: Czat #${conversations.length + 1}`);
  }

  function deleteThread(id: string) {
    if (conversations.length <= 1) {
      const newId = "thread-" + Date.now();
      const defaultThread: Conversation = {
        id: newId,
        title: "🛡️ Cyber Saper (Briefing)",
        messages: [],
        provider: "gemini",
        model: "gemini-3.5-flash",
        sysPrompt: PERSONAS.jarvis.prompt,
      };
      setConversations([defaultThread]);
      setActiveThreadId(newId);
      return;
    }
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    if (activeThreadId === id) {
      setActiveThreadId(filtered[0].id);
    }
    addInsight("Usunięto wątek rozmowy");
  }

  function renameThread(id: string, newTitle: string) {
    if (!newTitle.trim()) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim() } : c))
    );
    setEditingThreadId(null);
    addInsight(`Zmieniono nazwę czatu na: ${newTitle.trim()}`);
  }

  function buildSysPrompt() {
    let s = sysPrompt;
    if (facts.length)
      s += `\n\nKnown facts about operator: ${facts.map((f) => `${f.key}=${f.value}`).join(", ")}.`;
    s += `\n\nEvolution phase: ${milestone}. XP: ${xp}. Avg quality score: ${avgEvo}.`;
    if (evoInsights.length)
      s += `\nLearned improvements: ${evoInsights.slice(0, 3).join("; ")}.`;
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
USER: ${userMsg.slice(0, 200)}
AI: ${assistantReply.slice(0, 400)}
Rate 1-10 and give 1 specific improvement tip. Return ONLY valid JSON:
{"clarity":N,"accuracy":N,"helpfulness":N,"code_quality":N,"tip":"one concrete improvement"}`;

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 150,
          messages: [{ role: "user", content: evalPrompt }],
        }),
      });
      const d = await r.json();
      const raw = d.content?.[0]?.text || "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const scores = JSON.parse(clean);
      if (scores.clarity) {
        setEvoScores((p) => [
          ...p,
          { ts: new Date().toLocaleTimeString(), ...scores },
        ]);
        if (scores.tip) addInsight(scores.tip);
        const avg = (scores.clarity + scores.accuracy + scores.helpfulness) / 3;
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

    // Process attachments
    let fullText = txt;
    let shownText = txt;
    if (attachments.length > 0) {
      const formattedAttachments = attachments
        .map((att) => `[ZAŁĄCZNIK: ${att.name}]\n\`\`\`\n${att.content}\n\`\`\``)
        .join("\n\n");
      fullText = `${formattedAttachments}\n\n[PYTANIE UŻYTKOWNIKA]:\n${txt}`;
      shownText = `📎 Załączono ${attachments.length} plik(ów):\n` + attachments.map((a) => `• ${a.name}`).join("\n") + `\n\n${txt}`;
    }

    appendMsg("user", shownText);
    setAttachments([]); // Clear attachments immediately after preparing message
    setLoading(true);
    setStatusText(`${pers.name} THINKING...`);

    if (
      oracleConnected &&
      wsRef.current?.readyState === 1 &&
      provider === "grok"
    ) {
      wsRef.current.send(JSON.stringify({ type: "chat", content: fullText }));
      setLoading(false);
      setStatusText("NEXUS READY");
      addXP(5);
      return;
    }

    try {
      let reply = "";
      const history = messages
        .slice(-14)
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        }));
      history.push({ role: "user", content: fullText });

      if (provider === "claude") {
        if (!apiKey) {
          appendMsg(
            "assistant",
            "⚠ Add your Anthropic API key in Setup. Demo: " + demoReply(txt),
            "demo",
          );
          setLoading(false);
          setStatusText("NEXUS READY");
          return;
        }
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 1000,
            system: buildSysPrompt(),
            messages: history,
          }),
        });
        const d = await r.json();
        reply = d.content?.[0]?.text || "No response.";
      } else if (provider === "groq") {
        if (!apiKey) {
          appendMsg("assistant", "⚠ Enter your Groq API key in Setup.", "demo");
          setLoading(false);
          setStatusText("NEXUS READY");
          return;
        }
        const r = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              max_tokens: 1000,
              messages: [
                { role: "system", content: buildSysPrompt() },
                ...history,
              ],
            }),
          },
        );
        const d = await r.json();
        reply = d.choices?.[0]?.message?.content || "No response.";
      } else if (provider === "openrouter") {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": `http://${ORACLE_HOST}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: 1000,
            messages: [
              { role: "system", content: buildSysPrompt() },
              ...history,
            ],
          }),
        });
        const d = await r.json();
        reply =
          d.choices?.[0]?.message?.content ||
          d.error?.message ||
          "No response.";
      } else if (provider === "gemini") {
        // Safe Express Proxy call that hides API keys from browser bundle
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: txt,
            apiKey: apiKey, // Optional custom key if they paste one, otherwise fallback to server's loaded variable
            history: history.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });
        const d = await r.json();
        if (d.success) {
          reply = d.reply || "No response template returned from proxy.";
          if (d.usedModel && d.usedModel !== model) {
            addInsight(`⚙️ Dynamic fallback: model "${model}" failed (503/Transient), auto-routed to "${d.usedModel}" successfully.`);
          }
          if (d.warning) {
            addInsight(`⚠️ Gemini: ${d.warning}`);
          }
        } else {
          reply = `⚠ Secure Proxy Error: ${d.error || "Execution dropped."}`;
        }
      } else if (provider === "ollama") {
        const r = await fetch("http://localhost:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [
              { role: "system", content: buildSysPrompt() },
              ...history,
            ],
          }),
        });
        const d = await r.json();
        reply = d.message?.content || "Ollama: No response. Is it running?";
      } else {
        reply = `Integration for ${provider} not fully setup in demo snippet.`;
      }

      appendMsg("assistant", reply, provider);
      addXP(10);
      setTimeout(() => runEvolutionCycle(txt, reply), 500);
    } catch (e) {
      appendMsg("assistant", `⚠ Connection error: ${e.message}`, "error");
    }
    setLoading(false);
    setStatusText("NEXUS READY");
  }

  function demoReply(txt) {
    const t = txt.toLowerCase();
    if (t.includes("status"))
      return `All systems nominal, Sir. NEXUS v6.0 online. Oracle Cloud ${ORACLE_HOST} ${oracleConnected ? "connected" : "awaiting connection"}.`;
    return `Processing: "${txt}". Add an API key in ⚙ Setup to activate full intelligence.`;
  }

  async function runAgentTask() {
    setAgentRunning(true);
    const task = {
      id: Date.now().toString(36),
      task: agentTask,
      target: agentTarget,
      status: "running",
      ts: new Date().toLocaleTimeString(),
      result: null,
    };
    setAgentTasks((p) => [task, ...p.slice(0, 9)]);
    addXP(15);
    if (oracleConnected && wsRef.current?.readyState === 1) {
      wsRef.current.send(
        JSON.stringify({
          type: "agent_task",
          task: agentTask,
          target: agentTarget,
          payload: {},
        }),
      );
    } else {
      await new Promise((r) => setTimeout(r, 1200));
      setAgentTasks((p) =>
        p.map((t) =>
          t.id === task.id
            ? { ...t, status: "done", result: `[Demo] ${agentTask} executed.` }
            : t,
        ),
      );
    }
    setAgentRunning(false);
  }

  async function runSSH() {
    if (!sshCmd.trim()) return;
    setSshRunning(true);
    const entry = { cmd: sshCmd, ts: new Date().toLocaleTimeString(), out: "" };
    setSshLog((p) => [entry, ...p.slice(0, 19)]);
    setSshCmd("");
    if (oracleConnected && wsRef.current?.readyState === 1) {
      wsRef.current.send(
        JSON.stringify({
          type: "agent_task",
          task: "shell",
          target: "oracle",
          payload: { cmd: entry.cmd },
        }),
      );
    } else {
      await new Promise((r) => setTimeout(r, 600));
      setSshLog((p) =>
        p.map((x, i) =>
          i === 0
            ? {
                ...x,
                out: `[Oracle offline] ssh ubuntu@${ORACLE_HOST} '${entry.cmd}'`,
              }
            : x,
        ),
      );
    }
    setSshRunning(false);
    addXP(5);
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
  function onSSHKey(e) {
    if (e.key === "Enter") runSSH();
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div
      className="jarvis-layout"
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "#020810",
        fontFamily: "'JetBrains Mono',monospace",
        color: "#c8ddf0",
        overflow: "hidden",
      }}
    >
      {/* ── LEFT SIDEBAR ── */}
      <div
        className="jarvis-sidebar"
        style={{
          width: 280,
          minWidth: 280,
          display: "flex",
          flexDirection: "column",
          background: "rgba(0,15,30,0.95)",
          borderRight: "1px solid rgba(0,200,255,0.1)",
          overflowY: "auto",
        }}
      >
        <div style={{ ...S.panelTitle, margin: "15px 0 0 15px" }}>
          <NeuralCore
            connected={oracleConnected}
            processing={loading}
            color={pers.accent}
          />
          <div style={{ marginLeft: 8 }}>
            <div
              style={{
                fontSize: 14,
                letterSpacing: 2,
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {pers.name.split(".")[0]} NEXUS
            </div>
            <div style={{ fontSize: 9, color: pers.accent, letterSpacing: 1 }}>
              ORACLE · {ORACLE_HOST}
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "0 15px 15px",
            borderBottom: "1px solid rgba(0,200,255,0.07)",
          }}
        >
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            <span style={S.tag(oracleConnected ? "#00ff9d" : "#ff6b35")}>
              {oracleConnected ? "⬡ ONLINE" : "○ OFFLINE"}
            </span>
            {evolving && <span style={S.tag("#c97cf6")}>⟳ EVOLVING</span>}
          </div>
        </div>

        {/* ── Chatbox Conversations / Threads List ── */}
        <div
          style={{
            padding: "14px",
            borderBottom: "1px solid rgba(0,200,255,0.07)",
          }}
        >
          <div style={{ ...S.panelTitle, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span>⬡ CZATY / THREADS</span>
            <button
              onClick={createNewThread}
              style={{
                ...S.btn("#00ff9d", true),
                padding: "2px 8px",
                fontSize: 9,
                fontWeight: "bold",
                background: "rgba(0, 255, 157, 0.15)",
                borderRadius: 4,
                cursor: "pointer"
              }}
            >
              + NOWY
            </button>
          </div>
          
          <div
            className="conversations-scroll"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: "180px",
              overflowY: "auto",
              paddingRight: 2
            }}
          >
            {conversations.map((c) => {
              const isActive = c.id === activeThreadId;
              const isEditing = c.id === editingThreadId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (!isActive) {
                      setActiveThreadId(c.id);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 8px",
                    borderRadius: 6,
                    background: isActive ? "rgba(0,200,255,0.08)" : "rgba(255,255,255,0.01)",
                    border: isActive ? "1px solid rgba(0,200,255,0.3)" : "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: "flex", gap: 3, width: "100%", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        style={{
                          background: "#010f1e",
                          border: "1px solid #00c8ff",
                          borderRadius: 3,
                          padding: "2px 4px",
                          fontSize: 10,
                          color: "#fff",
                          width: "70%",
                          outline: "none"
                        }}
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameThread(c.id, renameTitle);
                          if (e.key === "Escape") setEditingThreadId(null);
                        }}
                      />
                      <button
                        onClick={() => renameThread(c.id, renameTitle)}
                        style={{
                          background: "rgba(0,255,157,0.2)",
                          border: "1px solid #00ff9d",
                          color: "#fff",
                          fontSize: 8,
                          padding: "2px 4px",
                          borderRadius: 2
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingThreadId(null)}
                        style={{
                          background: "rgba(255,107,53,0.2)",
                          border: "1px solid #ff6b35",
                          color: "#fff",
                          fontSize: 8,
                          padding: "2px 4px",
                          borderRadius: 2
                        }}
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        <span style={{ fontSize: 11, color: isActive ? "#fff" : "rgba(200,200,255,0.7)", fontWeight: isActive ? "500" : "normal" }}>
                          {c.title}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 4, marginLeft: 6 }} className="thread-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingThreadId(c.id);
                            setRenameTitle(c.title);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(200,200,255,0.4)",
                            fontSize: 10,
                            padding: "0 2px",
                            cursor: "pointer"
                          }}
                          title="Zmień nazwę"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteThread(c.id);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(255,107,53,0.6)",
                            fontSize: 10,
                            padding: "0 2px",
                            cursor: "pointer"
                          }}
                          title="Usuń czat"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid rgba(0,200,255,0.07)",
          }}
        >
          <div style={S.panelTitle}>⬡ Persona</div>
          <div style={{ display: "flex", gap: 4 }}>
            {Object.entries(PERSONAS).map(([k, p]) => (
              <button
                key={k}
                onClick={() => setPersona(k)}
                style={{
                  ...S.btn(p.accent),
                  flex: 1,
                  padding: "4px 2px",
                  fontSize: 9,
                  background:
                    persona === k
                      ? `rgba(${hexToRgb(p.accent)},0.2)`
                      : `rgba(${hexToRgb(p.accent)},0.05)`,
                  borderColor:
                    persona === k
                      ? p.accent
                      : `rgba(${hexToRgb(p.accent)},0.2)`,
                }}
              >
                {p.name.split(".")[0]}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid rgba(0,200,255,0.07)",
          }}
        >
          <div style={S.panelTitle}>⬡ Agent Modules</div>
          <button
            style={{ ...S.btn("#00ff9d", true), fontSize: 10, padding: "6px 12px", borderStyle: "dashed" }}
            onClick={() => setShowPlugins(true)}
          >
            🔌 PLUGINS MODULAR ({activePlugins.length} ACTIVE)
          </button>
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid rgba(0,200,255,0.07)",
          }}
        >
          <div style={S.panelTitle}>◉ AI Provider</div>
          <select
            style={{ ...S.select, marginBottom: 6 }}
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            {Object.entries(PROVIDERS).map(([k, p]) => (
              <option key={k} value={k}>
                {p.icon} {p.label}
                {p.free ? " (FREE)" : ""}
              </option>
            ))}
          </select>
          <select
            style={{ ...S.select, marginBottom: 6 }}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {prov.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            style={{ ...S.input, marginBottom: 6 }}
            type="password"
            placeholder={prov.hint + " (API Key)"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div style={{ marginTop: 4 }}>
            <button
              onClick={() => {
                if (confirm("Czy na pewno chcesz wyczuścić historię i przywrócić domyślne czaty?")) {
                  localStorage.removeItem("chatbox_conversations");
                  localStorage.removeItem("chatbox_active_thread_id");
                  window.location.reload();
                }
              }}
              style={{
                width: "100%",
                background: "rgba(255,107,53,0.1)",
                border: "1px solid rgba(255,107,53,0.3)",
                color: "#ff6b35",
                padding: "4px 8px",
                fontSize: 9,
                borderRadius: 4,
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: "bold"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,107,53,0.2)";
                e.currentTarget.style.borderColor = "#ff6b35";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,107,53,0.1)";
                e.currentTarget.style.borderColor = "rgba(255,107,53,0.3)";
              }}
            >
              🗑️ WYCZYŚĆ SYSTEM (RESET)
            </button>
          </div>
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid rgba(0,200,255,0.07)",
          }}
        >
          <div style={{ ...S.panelTitle, justifyContent: "space-between" }}>
            <span>⬡ Evolution (Phase ${milestone})</span>
            <button
              style={{ ...S.btn("#c97cf6"), padding: "2px 6px", fontSize: 8 }}
              onClick={() => setShowEvo((v) => !v)}
            >
              {showEvo ? "▲" : "▼"}
            </button>
          </div>
          <div
            style={{
              background: "rgba(0,200,255,0.08)",
              borderRadius: 2,
              height: 4,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: `${xpPct}%`,
                height: 4,
                background: "linear-gradient(90deg,#7c3aed,#c97cf6)",
                borderRadius: 2,
                transition: "width 0.5s",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 9,
              color: "rgba(200,200,255,0.4)",
            }}
          >
            <span>XP: ${xp}</span>
            <span>Next: ${nextMile?.xp || "MAX"}</span>
          </div>
          {showEvo && (
            <div style={{ marginTop: 8 }}>
              {evoInsights.slice(0, 3).map((ins, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 10,
                    color: "rgba(200,200,255,0.6)",
                    padding: "3px 0",
                    borderBottom: "1px solid rgba(200,200,255,0.05)",
                  }}
                >
                  {i + 1}. {ins}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER CHAT ── */}
      <div
        className="jarvis-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          minHeight: "50vh",
        }}
      >
        <div
          style={{
            padding: "8px 16px",
            borderBottom: "1px solid rgba(0,200,255,0.1)",
            background: "rgba(0,15,30,0.9)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: oracleConnected
                  ? "#00ff9d"
                  : "rgba(200,200,200,0.2)",
                boxShadow: oracleConnected ? "0 0 8px #00ff9d" : "none",
              }}
            />
            <span
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: oracleConnected ? "#00ff9d" : "rgba(200,200,200,0.4)",
              }}
            >
              {statusText}
            </span>
          </div>
          
          <div style={{ flex: 1 }} />
          
          {/* AUTO-TTS SPEAKER TOGGLE */}
          <button
            onClick={() => {
              const newVal = !autoTts;
              setAutoTts(newVal);
              try {
                localStorage.setItem("jarvis_chat_auto_tts", String(newVal));
              } catch {}
              addInsight(`Auto-TTS (głos) został ${newVal ? "WŁĄCZONY" : "WYŁĄCZONY"}`);
              if (!newVal) {
                window.speechSynthesis?.cancel();
                setSpeakingMessageIndex(null);
              }
            }}
            style={{
              background: "transparent",
              border: autoTts ? "1px solid #00ff9d" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px",
              color: autoTts ? "#00ff9d" : "rgba(200,200,255,0.4)",
              cursor: "pointer",
              fontSize: 9,
              letterSpacing: 1,
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.2s"
            }}
            title="Automatyczne odczytywanie odpowiedzi AI na głos (TTS)"
          >
            {autoTts ? "🔊 GŁOS: WŁ" : "🔇 GŁOS: WYŁ"}
          </button>

          {/* BACKUP EXPORT & IMPORT UTILS */}
          <button
            onClick={() => exportConversation("markdown")}
            style={{
              background: "rgba(251,188,4,0.1)",
              border: "1px solid rgba(251,188,4,0.3)",
              borderRadius: "4px",
              color: "#fbbc04",
              cursor: "pointer",
              fontSize: 9,
              padding: "4px 8px"
            }}
            title="Eksportuj czat jako plik Markdown (.md)"
          >
            📥 POBIERZ .MD
          </button>
          
          <button
            onClick={() => exportConversation("json")}
            style={{
              background: "rgba(201,124,246,0.1)",
              border: "1px solid rgba(201,124,246,0.3)",
              borderRadius: "4px",
              color: "#c97cf6",
              cursor: "pointer",
              fontSize: 9,
              padding: "4px 8px"
            }}
            title="Pobierz pełną kopię zapasową JSON"
          >
            💾 ZAPISZ JSON
          </button>

          <label
            style={{
              background: "rgba(0,183,163,0.1)",
              border: "1px solid rgba(0,183,163,0.3)",
              color: "#00ffa3",
              borderRadius: "4px",
              fontSize: 9,
              padding: "4px 8.5px",
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
            }}
            title="Zaimportuj wątek czatu z pliku JSON"
          >
            📤 WGRAJ WĄTEK
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleImportConversation}
            />
          </label>

          <button
            style={{
              background: "rgba(0,200,255,0.1)",
              border: "1px solid rgba(0,200,255,0.3)",
              borderRadius: "4px",
              color: "#00c8ff",
              cursor: "pointer",
              fontSize: 9,
              padding: "4px 8px"
            }}
            onClick={connectOracle}
          >
            ↺ RECONNECT
          </button>
          
          <button
            style={{
              background: "rgba(255,107,53,0.1)",
              border: "1px solid rgba(255,107,53,0.3)",
              borderRadius: "4px",
              color: "#ff6b35",
              cursor: "pointer",
              fontSize: 9,
              padding: "4px 8px"
            }}
            onClick={() => {
              if (confirm("Czy na pewno chcesz wyczyścić historię aktualnego czatu?")) {
                setMessages([]);
                window.speechSynthesis?.cancel();
                setSpeakingMessageIndex(null);
              }
            }}
          >
            CLR
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                maxWidth: 680,
                margin: "40px auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0 10px",
              }}
            >
              <h1
                style={{
                  fontSize: 34,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  background: "linear-gradient(135deg, #00c8ff, #7c3aed, #ff5b7f)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: 6,
                }}
              >
                Cześć, operatorze.
              </h1>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 400,
                  color: "rgba(200, 200, 255, 0.55)",
                  marginBottom: 32,
                  lineHeight: 1.3,
                }}
              >
                Jestem {pers.name}. W czym mogę dzisiaj pomóc?
              </h2>

              <div
                style={{
                  background: "rgba(0, 200, 255, 0.05)",
                  border: "1px solid rgba(0, 200, 255, 0.12)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 11,
                  color: "rgba(200, 200, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 30,
                  width: "100%",
                }}
              >
                <span style={{ fontSize: 14 }}>🛡️</span>
                <span>
                  Połączenie z serwerem i proxy API zostało zabezpieczone. Dane i klucze API nie są przesyłane bezpośrednio do przeglądarki.
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 12,
                  width: "100%",
                }}
              >
                {GEMINI_SUGGESTIONS.map((s, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(0, 200, 255, 0.05)" }}
                    onClick={() => {
                      setInput(s.prompt);
                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                    }}
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 16,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "border-color 0.2s, background-color 0.2s",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: "semibold",
                        color: "#00ff9d",
                        marginBottom: 6,
                        letterSpacing: 0.5,
                      }}
                    >
                      {s.title}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(200, 200, 255, 0.45)", lineHeight: 1.4 }}>
                      {s.desc}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={S.msg(m.role)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: 2,
                      color:
                        m.role === "assistant"
                          ? pers.accent
                          : "rgba(200,200,255,0.4)",
                    }}
                  >
                    {m.role === "assistant" ? `◈ ${pers.name}` : "◎ OPERATOR"}{" "}
                    {m.src && m.role === "assistant" ? `// ${m.src}` : ""}
                  </span>
                  
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {m.role === "assistant" && (
                      <button
                        onClick={() => speakText(m.content, i)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: speakingMessageIndex === i ? "#ff6b35" : "#00ff9d",
                          cursor: "pointer",
                          fontSize: 9,
                          letterSpacing: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          padding: 0,
                        }}
                        title={speakingMessageIndex === i ? "Zatrzymaj mowę" : "Czytaj na głos"}
                      >
                        {speakingMessageIndex === i ? "⏹ STOP" : "🔊 CZYTAJ"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(m.content);
                        addInsight("Skopiowano treść wiadomości");
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(200,200,255,0.45)",
                        cursor: "pointer",
                        fontSize: 9,
                        letterSpacing: 1,
                        padding: 0,
                      }}
                      title="Kopiuj tekst wiadomości"
                    >
                      📋 KOPIUJ
                    </button>
                    <span style={{ fontSize: 9, color: "rgba(200,200,255,0.3)" }}>
                      {m.ts}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                  {m.role === "assistant" ? (
                    <FormattedMessage content={m.content} />
                  ) : (
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                ...S.msg("assistant"),
                background: "rgba(0, 15, 30, 0.4)",
                borderLeft: "2px solid #fbbc04",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <NeuralCore
                    connected={oracleConnected}
                    processing={true}
                    color="#fbbc04"
                  />
                  <span style={{ fontSize: 10, color: "#fbbc04", letterSpacing: 2 }}>
                    ANALIZUJĘ PROCES PROKSED... (PROXY RUNNING)
                  </span>
                </div>
                <div
                  style={{
                    height: 3,
                    width: "100%",
                    background: "linear-gradient(90deg, transparent, #00c8ff, #7c3aed, #ff5b7f, transparent)",
                    borderRadius: 2,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      background: "rgba(255,255,255,0.15)",
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(0,200,255,0.1)",
            background: "rgba(0,15,30,0.95)",
          }}
        >
          {/* QUICK MACROS BAR */}
          <div
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              paddingBottom: 8,
              marginBottom: 8,
              borderBottom: "1px solid rgba(0,200,255,0.05)",
            }}
            className="conversations-scroll"
          >
            {[
              { id: "summarize", label: "⚡ PODSUMUJ ROZMOWĘ", desc: "Aktywuj podsumowanie czatu", color: "#00c8ff" },
              { id: "bugs", label: "🐞 ANALIZA BŁĘDÓW", desc: "Wyszukaj i popraw błędy w kodzie", color: "#ff5b7f" },
              { id: "refactor", label: "🔄 REFAKTORYZACJA", desc: "Zoptymalizuj strukturę kodu", color: "#00ff9d" },
              { id: "translate", label: "🇬🇧 TŁUMACZ PL⇄EN", desc: "Przetłumacz tekst PL/EN", color: "#fbbc04" },
              { id: "explain", label: "📝 WYJAŚNIJ KOD", desc: "Uzyskaj szczegółowy opis kodu", color: "#c97cf6" },
              { id: "shorten", label: "✍️ SKRÓĆ", desc: "Zredukuj długość tekstu", color: "#ff6b35" },
            ].map((mac) => (
              <button
                key={mac.id}
                onClick={() => applyQuickMacro(mac.id)}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid rgba(255, 255, 255, 0.08)`,
                  borderRadius: 14,
                  padding: "4px 10px",
                  color: mac.color,
                  fontSize: 9,
                  fontWeight: "bold",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
                title={mac.desc}
              >
                {mac.label}
              </button>
            ))}
          </div>

          {/* ATTACHMENTS LIST PANEL */}
          {attachments.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                padding: "8px 12px",
                background: "rgba(0, 200, 255, 0.03)",
                border: "1px dashed rgba(0, 200, 255, 0.15)",
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#011326",
                    border: "1px solid rgba(0, 200, 255, 0.3)",
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 10,
                    color: "#fff",
                  }}
                >
                  <span style={{ color: "#fbbc04" }}>📎</span>
                  <span style={{ fontWeight: "semibold" }}>{file.name}</span>
                  <span style={{ fontSize: 8, color: "rgba(200,200,255,0.4)" }}>
                    ({Math.round(file.content.length)} zn.)
                  </span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#ff6b35",
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: "bold",
                      padding: "0 2px"
                    }}
                    title="Usuń załącznik"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              background: "rgba(10, 15, 30, 0.85)",
              border: "1px solid rgba(0, 200, 255, 0.15)",
              borderRadius: 24,
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {/* PAPERCLIP ATTACH BUTTON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 16,
                color: "rgba(200,200,255,0.55)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s"
              }}
              title="Załącz pliki tekstowe/kodu (.txt, .js, .py, .json, .csv...)"
            >
              📎
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              multiple
              style={{ display: "none" }}
            />

            <textarea
              ref={inputRef}
              rows={1}
              style={{
                background: "transparent",
                border: "none",
                color: "#e2ecf5",
                flex: 1,
                resize: "none",
                fontSize: 13,
                lineHeight: 1.5,
                padding: "8px 4px",
                outline: "none",
                fontFamily: "inherit",
              }}
              placeholder={`Zadaj pytanie ${pers.name}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
            />

            {/* SPEECH RECORD KEY BUTTON */}
            <button
              onClick={toggleRecording}
              style={{
                background: isRecording ? "rgba(255,91,127,0.2)" : "transparent",
                border: isRecording ? "1px solid #ff5b7f" : "none",
                borderRadius: "50%",
                width: 28,
                height: 28,
                fontSize: 14,
                color: isRecording ? "#ff5b7f" : "rgba(200,200,255,0.55)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: isRecording ? "0 0 8px #ff5b7f" : "none"
              }}
              title="Mów do mikrofonu (Speech-to-Text)"
            >
              🎙️
            </button>

            {input.trim() !== "" && (
              <button
                onClick={() => setInput("")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
                title="Wyczyść tekst"
              >
                ✕
              </button>
            )}

            <button
              style={{
                background: loading ? "rgba(0,0,0,0.2)" : "#00ff9d",
                border: "none",
                color: "#020813",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s, transform 0.1s",
                boxShadow: "0 4px 12px rgba(0, 255, 157, 0.2)",
              }}
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              ➔
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6,
              padding: "0 12px",
              fontSize: 9,
              color: "rgba(200, 200, 255, 0.35)",
              letterSpacing: 1.5,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span>SECURE:</span>
                <span style={{ color: "#00ff9d" }}>● PROXIED</span>
              </div>
              <div style={{ color: "rgba(200, 200, 255, 0.4)" }}>|</div>
              <div>
                <span>TEKST: {input.length} zn. / {input.trim().split(/\s+/).filter(Boolean).length} słów</span>
              </div>
            </div>
            
            <div>
              <span>ACTIVE:</span>
              <span style={{ color: "#00c8ff" }}>
                {PROVIDERS[provider]?.icon} {PROVIDERS[provider]?.label.toUpperCase()} · {model}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div
        className="jarvis-right-panel"
        style={{
          width: 300,
          minWidth: 300,
          display: "flex",
          flexDirection: "column",
          background: "rgba(0,15,30,0.95)",
          borderLeft: "1px solid rgba(0,200,255,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(0,200,255,0.1)",
          }}
        >
          {[
            { id: "agent", label: "AGENT", color: "#00c8ff" },
            { id: "ssh", label: "SSH", color: "#00ff9d" },
            { id: "metrics", label: "METRICS", color: "#ff6b35" },
            { id: "sentiment", label: "SENTIMENT", color: "#c97cf6" },
            { id: "files", label: "FILES", color: "#fbbc04" },
            { id: "prompts", label: "PROMPTS", color: "#00ffa3" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              style={{
                flex: 1,
                padding: "12px 4px",
                border: "none",
                fontSize: 10,
                letterSpacing: 2,
                background:
                  activePanel === tab.id
                    ? `rgba(${hexToRgb(tab.color)},0.12)`
                    : "transparent",
                color:
                  activePanel === tab.id ? tab.color : "rgba(200,200,255,0.35)",
                borderBottom:
                  activePanel === tab.id
                    ? `2px solid ${tab.color}`
                    : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          <AnimatePresence mode="wait">
            {activePanel === "agent" && (
              <motion.div
                key="agent"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div style={S.panelTitle}>⬡ Super Agent</div>
                <select
                  style={{ ...S.select, marginBottom: 6 }}
                  value={agentTask}
                  onChange={(e) => setAgentTask(e.target.value)}
                >
                  {AGENT_TASKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  {["local", "oracle", "both"].map((tgt) => (
                    <button
                      key={tgt}
                      onClick={() => setAgentTarget(tgt)}
                      style={{
                        ...S.btn(
                          agentTarget === tgt
                            ? "#00c8ff"
                            : "rgba(200,200,255,0.3)",
                        ),
                        flex: 1,
                        fontSize: 9,
                        padding: "4px 2px",
                        background:
                          agentTarget === tgt
                            ? "rgba(0,200,255,0.15)"
                            : "transparent",
                      }}
                    >
                      {tgt.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  style={{
                    ...S.btn("#00c8ff", true),
                    opacity: agentRunning ? 0.5 : 1,
                    marginBottom: 15,
                  }}
                  onClick={runAgentTask}
                  disabled={agentRunning}
                >
                  {agentRunning ? "⟳ RUNNING..." : "▶ EXECUTE"}
                </button>
                <div style={S.panelTitle}>Task Log</div>
                {agentTasks.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(0,200,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: 10, color: "#00c8ff" }}>
                        {t.task}
                      </span>
                      <span
                        style={{
                          ...S.tag(
                            t.status === "done"
                              ? "#00ff9d"
                              : t.status === "running"
                                ? "#fbbc04"
                                : "#ff6b35",
                          ),
                          fontSize: 8,
                        }}
                      >
                        {t.status}
                      </span>
                    </div>
                    {t.result && (
                      <div
                        style={{
                          fontSize: 9,
                          color: "rgba(200,200,255,0.6)",
                          marginTop: 3,
                          background: "rgba(0,200,255,0.04)",
                          padding: "4px 6px",
                          borderRadius: 2,
                        }}
                      >
                        {t.result}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {activePanel === "ssh" && (
              <motion.div
                key="ssh"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div style={S.panelTitle}>⬡ SSH · ubuntu@${ORACLE_HOST}</div>
                <div style={{ display: "flex", gap: 4, marginBottom: 15 }}>
                  <input
                    style={{ ...S.input, flex: 1, fontSize: 11 }}
                    placeholder="command..."
                    value={sshCmd}
                    onChange={(e) => setSshCmd(e.target.value)}
                    onKeyDown={onSSHKey}
                  />
                  <button
                    style={{ ...S.btn("#00ff9d"), padding: "5px 8px" }}
                    onClick={runSSH}
                    disabled={sshRunning}
                  >
                    ▶
                  </button>
                </div>
                <div
                  style={{
                    background: "rgba(0,255,157,0.02)",
                    padding: "8px",
                    minHeight: "200px",
                    fontFamily: "monospace",
                    border: "1px solid rgba(0,255,157,0.1)",
                  }}
                >
                  {sshLog.map((entry, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ color: "#00ff9d", fontSize: 10 }}>
                        ubuntu@oracle:~$ {entry.cmd}
                      </div>
                      {entry.out && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "rgba(200,255,220,0.7)",
                            marginTop: 2,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {entry.out}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activePanel === "metrics" && (
              <motion.div
                key="metrics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div style={S.panelTitle}>⬡ Live Metrics</div>
                {[
                  {
                    label: "CPU",
                    val: metrics.cpu_pct || 0,
                    unit: "%",
                    color: "#00c8ff",
                  },
                  {
                    label: "RAM",
                    val: metrics.mem_pct || 0,
                    unit: "%",
                    color: "#c97cf6",
                  },
                  {
                    label: "DISK",
                    val: metrics.disk_pct || 0,
                    unit: "%",
                    color: "#fbbc04",
                  },
                ].map((m) => (
                  <div key={m.label} style={{ marginBottom: 15 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          color: "rgba(200,200,255,0.5)",
                          letterSpacing: 2,
                        }}
                      >
                        {m.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: m.val > 80 ? "#ff6b35" : m.color,
                          fontWeight: 700,
                        }}
                      >
                        {m.val.toFixed(1)}${m.unit}
                      </span>
                    </div>
                    <div
                      style={{
                        background: "rgba(200,200,255,0.06)",
                        borderRadius: 2,
                        height: 4,
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(m.val, 100)}%` }}
                        transition={{ duration: 1 }}
                        style={{
                          height: 4,
                          borderRadius: 2,
                          background: `linear-gradient(90deg,${m.color},${m.val > 80 ? "#ff6b35" : m.color})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activePanel === "sentiment" && (
              <motion.div
                key="sentiment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* LIVE INGESTION CONTROLS */}
                <div>
                  <div style={S.panelTitle}>⬡ Live Data Streams</div>
                  <div
                    style={{
                      background: "rgba(0,15,30,0.6)",
                      border: "1px solid rgba(0,200,255,0.1)",
                      borderRadius: 6,
                      padding: 10,
                    }}
                  >
                    {["twitter", "yelp", "google"].map((plat) => (
                      <div
                        key={plat}
                        style={{
                          marginBottom: 10,
                          paddingBottom: 10,
                          borderBottom:
                            plat !== "google"
                              ? "1px solid rgba(0,200,255,0.05)"
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <label
                            style={{
                              fontSize: 10,
                              color: "#c8ddf0",
                              textTransform: "uppercase",
                            }}
                          >
                            {plat} Stream
                          </label>
                          <input
                            type="checkbox"
                            checked={
                              liveSources[plat as keyof typeof liveSources]
                                .enabled
                            }
                            onChange={(e) =>
                              setLiveSources((p) => ({
                                ...p,
                                [plat]: {
                                  ...p[plat as keyof typeof liveSources],
                                  enabled: e.target.checked,
                                },
                              }))
                            }
                          />
                        </div>
                        {liveSources[plat as keyof typeof liveSources]
                          .enabled && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            <input
                              style={{ ...S.input, fontSize: 10, padding: 5 }}
                              placeholder={`API Key or Bearer Token`}
                              type="password"
                              value={
                                liveSources[plat as keyof typeof liveSources]
                                  .apiKey
                              }
                              onChange={(e) =>
                                setLiveSources((p) => ({
                                  ...p,
                                  [plat]: {
                                    ...p[plat as keyof typeof liveSources],
                                    apiKey: e.target.value,
                                  },
                                }))
                              }
                            />
                            <input
                              style={{ ...S.input, fontSize: 10, padding: 5 }}
                              placeholder="Query / Place ID / Biz ID"
                              value={
                                liveQueries[plat as keyof typeof liveQueries]
                              }
                              onChange={(e) =>
                                setLiveQueries((p) => ({
                                  ...p,
                                  [plat]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      style={{
                        ...S.btn(isStreaming ? "#ff6b35" : "#00ff9d", true),
                        marginTop: 5,
                        opacity: isAnalyzing ? 0.7 : 1,
                      }}
                      onClick={() => setIsStreaming(!isStreaming)}
                    >
                      {isStreaming
                        ? isAnalyzing
                          ? "FETCHING DATA..."
                          : "■ STOP STREAM"
                        : "▶ CONNECT & STREAM"}
                    </button>
                  </div>
                </div>

                {/* EXECUTIVE SUMMARY */}
                <div>
                  <div style={S.panelTitle}>Executive Summary</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(200,200,255,0.8)",
                      lineHeight: 1.5,
                      background: "rgba(255,255,255,0.02)",
                      padding: 10,
                      borderRadius: 4,
                      borderLeft: "2px solid #c97cf6",
                    }}
                  >
                    {sentimentDashboard.summary}
                  </div>
                </div>

                {/* REAL-TIME TREND CHART */}
                <div>
                  <div style={S.panelTitle}>Sentiment Trend</div>
                  <div
                    style={{
                      height: 120,
                      width: "100%",
                      background: "rgba(0,10,20,0.5)",
                      borderRadius: 4,
                      padding: 10,
                      overflow: "hidden",
                    }}
                  >
                    {sentimentDashboard.trend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sentimentDashboard.trend}>
                          <defs>
                            <linearGradient
                              id="colorScore"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#00c8ff"
                                stopOpacity={0.4}
                              />
                              <stop
                                offset="95%"
                                stopColor="#00c8ff"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" hide />
                          <YAxis hide domain={[-1, 1]} />
                          <RechartsTooltip
                            contentStyle={{
                              background: "#0a1128",
                              border: "1px solid #00c8ff",
                              fontSize: 10,
                              color: "#fff",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#00c8ff"
                            fillOpacity={1}
                            fill="url(#colorScore)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(200,200,255,0.4)",
                          textAlign: "center",
                          marginTop: 35,
                        }}
                      >
                        Insufficient data for trend
                      </div>
                    )}
                  </div>
                </div>

                {/* PSEUDO WORD CLOUD */}
                {sentimentDashboard.praises &&
                  sentimentDashboard.praises.length > 0 && (
                    <div>
                      <div style={S.panelTitle}>Topic Cloud</div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          padding: 10,
                          background: "rgba(0,0,0,0.2)",
                          borderRadius: 4,
                        }}
                      >
                        {[
                          ...(sentimentDashboard.praises || []),
                          ...(sentimentDashboard.complaints || []),
                        ]
                          .sort((a, b) => b.count - a.count)
                          .map((topic: any, i: number) => {
                            const isPraise = (
                              sentimentDashboard.praises || []
                            ).includes(topic);
                            const fs = Math.max(
                              9,
                              Math.min(20, 8 + (topic.count || 2)),
                            );
                            const col = isPraise
                              ? `rgba(0,255,157,${Math.max(0.4, topic.count / 10)})`
                              : `rgba(255,107,53,${Math.max(0.4, topic.count / 10)})`;
                            return (
                              <span
                                key={i}
                                style={{
                                  fontSize: fs,
                                  color: col,
                                  lineHeight: 1,
                                }}
                              >
                                {topic.text}
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  )}
              </motion.div>
            )}

            {activePanel === "files" && (
              <motion.div
                key="files"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div style={S.panelTitle}>⬡ File Upload</div>
                <div
                  style={{
                    padding: "20px",
                    border: "1px dashed rgba(0,200,255,0.2)",
                    borderRadius: 4,
                    textAlign: "center",
                  }}
                >
                  <input
                    type="file"
                    id="fileInput"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      console.log("File selected:", e.target.files[0])
                    }
                  />
                  <button
                    style={S.btn("#00c8ff")}
                    onClick={() => document.getElementById("fileInput").click()}
                  >
                    SELECT FILE
                  </button>
                </div>
              </motion.div>
            )}

            {activePanel === "prompts" && (
              <motion.div
                key="prompts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div style={S.panelTitle}>📖 BIBLIOTEKA RÓL / PROMPT LIBRARY</div>
                <p style={{ fontSize: 10, color: "rgba(200, 200, 255, 0.5)", lineHeight: 1.4, marginBottom: 4 }}>
                  Wybierz wyspecjalizowaną rolę AI zainspirowaną Chatbox. Kliknięcie roli stworzy dedykowany i skonfigurowany wątek czatu.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    maxHeight: "65vh",
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {PROMPT_LIBRARY_DATA.map((item, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.03)" }}
                      style={{
                        padding: "12px",
                        background: "rgba(255, 255, 255, 0.01)",
                        border: `1px solid rgba(${hexToRgb(item.accent)}, 0.15)`,
                        borderRadius: 8,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: "bold", color: item.accent }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: 8, color: "rgba(200, 200, 255, 0.4)", fontFamily: "monospace" }}>
                          {item.model}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(200, 200, 255, 0.6)", lineHeight: 1.3, marginBottom: 8 }}>
                        {item.desc}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newId = "thread-" + Date.now();
                            const newThread: Conversation = {
                              id: newId,
                              title: item.title.replace(/[\w\W]*?\s/, ""),
                              messages: [],
                              provider: item.provider,
                              model: item.model,
                              sysPrompt: item.sysPrompt,
                            };
                            setConversations((prev) => [newThread, ...prev]);
                            setActiveThreadId(newId);
                            setInput("");
                            addXP(15);
                            addInsight(`Aktywowano nową rolę: ${item.title}`);
                          }}
                          style={{
                            flex: 1,
                            background: `rgba(${hexToRgb(item.accent)}, 0.15)`,
                            border: `1px solid ${item.accent}`,
                            color: "#fff",
                            fontSize: 9,
                            padding: "4px 8px",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          🚀 UTWÓRZ CZAT
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProvider(item.provider);
                            setModel(item.model);
                            setSysPrompt(item.sysPrompt);
                            addXP(5);
                            addInsight(`Zastosowano system prompt roli: ${item.title}`);
                          }}
                          style={{
                            background: "transparent",
                            border: `1px solid rgba(${hexToRgb(item.accent)}, 0.4)`,
                            color: "rgba(200,200,255,0.8)",
                            fontSize: 9,
                            padding: "4px 8px",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Zastosuj tu
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showPlugins && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(1, 4, 9, 0.8)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              style={{
                background: "rgba(5, 16, 35, 0.95)",
                border: "1px solid rgba(0, 200, 255, 0.25)",
                boxShadow: "0 0 30px rgba(0, 200, 255, 0.15)",
                borderRadius: 8,
                width: "100%",
                maxWidth: 480,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "rgba(0, 200, 255, 0.05)",
                  borderBottom: "1px solid rgba(0, 200, 255, 0.15)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ ...S.panelTitle, margin: 0, fontSize: 11 }}>
                  🔌 ADK SUBAGENT MODULES
                </div>
                <button
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(200, 200, 255, 0.5)",
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                  onClick={() => setShowPlugins(false)}
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  maxHeight: "60vh",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(200, 200, 255, 0.6)",
                    marginBottom: 4,
                    lineHeight: 1.4,
                  }}
                >
                  Configure active subagents inside J.A.R.V.I.S. Nexus. Toggling off excess modules scales down CPU overhead & memory footprints.
                </div>

                {PLUGINS_LIST.map((plugin) => {
                  const isEnabled = activePlugins.includes(plugin.id);
                  return (
                    <div
                      key={plugin.id}
                      style={{
                        padding: "12px",
                        background: isEnabled
                          ? "rgba(0, 255, 157, 0.03)"
                          : "rgba(255, 255, 255, 0.02)",
                        border: isEnabled
                          ? "1px solid rgba(0, 255, 157, 0.2)"
                          : "1px solid rgba(0, 200, 255, 0.08)",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flex: 1,
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{plugin.icon}</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: "bold",
                              color: isEnabled ? "#00ff9d" : "#c8ddf0",
                            }}
                          >
                            {plugin.title}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              color: "rgba(200, 200, 255, 0.5)",
                              marginTop: 2,
                              lineHeight: 1.3,
                            }}
                          >
                            {plugin.desc}
                          </span>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        style={{
                          background: isEnabled ? "#00ff9d" : "rgba(255,255,255,0.05)",
                          border: isEnabled
                            ? "1px solid #00ff9d"
                            : "1px solid rgba(255,255,255,0.15)",
                          color: isEnabled ? "#020810" : "rgba(200,200,255,0.4)",
                          padding: "4px 8px",
                          fontSize: 9,
                          fontWeight: "bold",
                          borderRadius: 3,
                          cursor: "pointer",
                          minWidth: 55,
                          textAlign: "center",
                          transition: "all 0.2s",
                        }}
                        onClick={() => {
                          if (isEnabled) {
                            setActivePlugins(
                              activePlugins.filter((item) => item !== plugin.id)
                            );
                          } else {
                            setActivePlugins([...activePlugins, plugin.id]);
                          }
                        }}
                      >
                        {isEnabled ? "ACTIVE" : "OFF"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "14px 20px",
                  background: "rgba(0, 0, 0, 0.2)",
                  borderTop: "1px solid rgba(0, 200, 255, 0.1)",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  style={{ ...S.btn("#00ff9d"), fontSize: 10 }}
                  onClick={() => setShowPlugins(false)}
                >
                  SAVE & CLOSE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
