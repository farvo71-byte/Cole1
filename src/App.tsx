import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ColetteCMD from "./components/ColetteCMD";
import JarvisNexus from "./components/JarvisNexus";

export default function App() {
  const [activeApp, setActiveApp] = useState<"menu" | "jarvis" | "colette">("menu");
  const [userName, setUserName] = useState(() => localStorage.getItem("nexus_username") || "Commanding Officer");
  const [logMsgs, setLogMsgs] = useState<string[]>([]);
  const [timeStr, setTimeStr] = useState("");

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("pl-PL") + " UTC");
    };
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  // Set initial system log scroll
  useEffect(() => {
    const logs = [
      "SYSTEM INITIATED - CODENAME: QUANTUM HUB",
      "SECURE NODE HOST: 141.147.9.41 ONLINE",
      "DOCKER PORT STATUS: 3000 BOUND VIA REVERSE PROXY",
      "COLETTE NEURAL CORE v6.0 FOUND & MOUNTED",
      "JARVIS NEXUS CORE v6.0 FOUND & MOUNTED",
      "PARSING USER IDENTITY... OK",
      "SANDBOX CONTEXT: STANDALONE MODE STAGES COMPLETE",
      "READY TO DEPLOY USER SELECTION."
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setLogMsgs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${logs[i]}`].slice(-6));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const saveName = (val: string) => {
    setUserName(val);
    localStorage.setItem("nexus_username", val);
  };

  if (activeApp === "colette") {
    return <ColetteCMD onBack={() => setActiveApp("menu")} />;
  }

  if (activeApp === "jarvis") {
    return <JarvisNexus onBack={() => setActiveApp("menu")} />;
  }

  return (
    <div
      id="main-quantum-menu"
      className="relative w-screen h-screen overflow-hidden flex flex-col justify-between select-none"
      style={{
        background: "radial-gradient(circle at 50% 50%, #030d22 0%, #01040a 100%)",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        color: "#c8ddf0"
      }}
    >
      {/* Visual FX background */}
      <div className="absolute inset-0 pointer-events-none opacity-10" style={{ zIndex: 0 }}>
        <svg width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22d3ee" strokeWidth="0.8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Cyber overlay/scanning line */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden z-0"
        style={{
          background: "linear-gradient(rgba(0, 201, 239, 0.015) 50%, rgba(0, 0, 0, 0.25) 50%)",
          backgroundSize: "100% 4px"
        }}
      >
        <div
          className="absolute left-0 right-0 h-1"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.15), transparent)",
            animation: "scan_hub 8s linear infinite",
            top: 0
          }}
        />
      </div>

      {/* ── TOP NAV BAR ──────────────────────────────── */}
      <header
        className="relative z-10 mx-5 mt-5 p-4 rounded-xl flex items-center justify-between"
        style={{
          background: "rgba(3, 14, 34, 0.6)",
          border: "1px solid rgba(0, 200, 255, 0.15)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 0 20px rgba(0,200,255,0.02)"
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <span className="text-cyan-400 text-lg animate-pulse font-bold">⬡</span>
            <div className="absolute inset-0 rounded border border-cyan-400/20" style={{ animation: "spin 12s linear infinite" }} />
          </div>
          <div>
            <h1 className="text-[12px] font-bold tracking-[3px] text-white">NEXUS MULTI-SERVICE SUITE</h1>
            <p className="text-[9px] text-[#22d3ee]/50 tracking-wider">SECURE HYBRID COMMAND HOVER CENTRAL</p>
          </div>
        </div>

        {/* User profile identifier */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-gray-500 tracking-wider font-semibold">COMMAND OFFICER</span>
            <input
              type="text"
              value={userName}
              onChange={(e) => saveName(e.target.value)}
              className="text-[11px] text-cyan-400 bg-transparent border-b border-transparent focus:border-cyan-400/30 text-right outline-none w-36 font-semibold"
              placeholder="Enter name..."
            />
          </div>
          <div className="px-3 py-1.5 rounded border border-cyan-400/10 bg-cyan-400/5 text-right font-mono text-[10px] text-cyan-400">
            {timeStr}
          </div>
        </div>
      </header>

      {/* ── CENTRAL HUB CONTENT ─────────────────────── */}
      <main className="relative z-10 max-w-4xl w-full mx-auto p-4 flex-1 flex flex-col justify-center items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <span className="inline-block px-2 py-0.5 rounded border border-cyan-400/30 text-[8px] tracking-[4px] text-cyan-400 font-semibold bg-cyan-400/10 mb-4 uppercase">
            Awaiting Command Directives
          </span>
          <h2 className="text-2xl font-black text-white tracking-[6px] uppercase">
            Cluster Terminal
          </h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Welcome, <span className="text-cyan-400">{userName}</span>. Select which localized executive module to activate within our sandbox workspace interface.
          </p>
        </motion.div>

        {/* Selector Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-2 px-4">
          {/* JARVIS Card */}
          <motion.div
            id="jarvis-select-card"
            whileHover={{ scale: 1.025, translateY: -4 }}
            className="group relative cursor-pointer p-6 rounded-xl overflow-hidden transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(3,25,50,0.85) 0%, rgba(1,9,20,0.95) 100%)",
              border: "1px solid rgba(0, 200, 255, 0.18)",
              boxShadow: "0 0 35px rgba(0, 200, 255, 0.02)"
            }}
            onClick={() => setActiveApp("jarvis")}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/5 border border-cyan-400/20 flex items-center justify-center text-cyan-400 text-lg shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]">
                ◈
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-widest group-hover:text-cyan-400 transition-colors">
                  J.A.R.V.I.S. NEXUS v6.0
                </h3>
                <span className="inline-block text-[8px] tracking-wider text-cyan-400 font-semibold uppercase">
                  AI OS Mainframe
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed mb-6">
              Full-scale operating system simulator. Integrates multi-provider generative chats (Claude, Gemini, Groq), system shell orchestration, secure proxy tunneling, and automated system telemetry monitors.
            </p>

            <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
              ACTIVATE CORE ENGINE <span className="translate-x-0 group-hover:translate-x-1 transition-transform">▶</span>
            </span>
          </motion.div>

          {/* COLETTE Card */}
          <motion.div
            id="colette-select-card"
            whileHover={{ scale: 1.025, translateY: -4 }}
            className="group relative cursor-pointer p-6 rounded-xl overflow-hidden transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(23,10,45,0.8) 0%, rgba(5,2,15,0.95) 100%)",
              border: "1px solid rgba(201, 124, 246, 0.18)",
              boxShadow: "0 0 35px rgba(201, 124, 246, 0.02)"
            }}
            onClick={() => setActiveApp("colette")}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/5 border border-purple-400/20 flex items-center justify-center text-purple-400 text-lg shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]">
                ⬡
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-widest group-hover:text-purple-400 transition-colors">
                  COLETTE NEURAL CORE
                </h3>
                <span className="inline-block text-[8px] tracking-wider text-purple-400 font-semibold uppercase">
                  Sub-Agent Hub CLI
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed mb-6">
              Holographic supervisory cli dashboard featuring the glowing SVG interactive energy orb, digital matrix rain particle background systems, terminal diagnostics toolbeds, and adaptive sub-agents.
            </p>

            <span className="flex items-center gap-1 text-[10px] text-purple-400 font-bold tracking-widest uppercase">
              CONNECT SYMPHONIZE <span className="translate-x-0 group-hover:translate-x-1 transition-transform">▶</span>
            </span>
          </motion.div>
        </div>
      </main>

      {/* ── FOOTER STATUS LOG ───────────────────────── */}
      <footer
        className="relative z-10 mx-5 mb-5 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
        style={{
          background: "rgba(1, 6, 18, 0.8)",
          border: "1px solid rgba(0, 200, 255, 0.08)",
          backdropFilter: "blur(6px)"
        }}
      >
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <span className="text-[7px] text-gray-500 tracking-widest uppercase font-bold">SYSTEM BOOT TELEMETRY FEED</span>
          <div className="flex flex-col gap-0.5 font-mono text-[9px] text-cyan-400/70 overflow-hidden h-[54px]">
            {logMsgs.map((msg, i) => (
              <div key={i} className="truncate select-text">
                {msg}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-6 border-t md:border-t-0 border-cyan-400/10 pt-3 md:pt-0">
          <div className="flex flex-col items-start md:items-end grid-cols-2">
            <span className="text-[7px] text-gray-500 tracking-wider">HOST DEPLOYED</span>
            <span className="text-[10px] text-gray-300 font-bold">ORACLE / CLOUD RUN</span>
          </div>
          <div className="w-px h-8 bg-cyan-400/10 hidden md:block" />
          <div className="flex flex-col items-start md:items-end">
            <span className="text-[7px] text-gray-500 tracking-wider">WORKSPACE STATE</span>
            <span className="text-[10px] text-[#00ff9d] font-bold flex items-center gap-1">
              ● STANDBY ACTIVE
            </span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes scan_hub {
          0% { top: -100px; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
