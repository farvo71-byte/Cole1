import React, { useState, useEffect } from "react";
import { 
  Network, 
  RefreshCw, 
  Copy, 
  Check, 
  Terminal, 
  Settings, 
  Zap, 
  Square, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Save,
  Server,
  Unlock,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";

interface ProxyConfig {
  status: string;
  authToken: string;
  activeProvider: string;
  nvidiaApiKey: string;
  openrouterApiKey: string;
  deepseekApiKey: string;
  localLlmUrl: string;
  modelMapping: {
    opus: string;
    sonnet: string;
    haiku: string;
  };
  stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    tokensUsed: number;
  };
}

export function ProxyPanel({ curTheme }: { curTheme: any }) {
  const [config, setConfig] = useState<ProxyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Fields
  const [authToken, setAuthToken] = useState("");
  const [activeProvider, setActiveProvider] = useState("nvidia");
  const [nvidiaApiKey, setNvidiaApiKey] = useState("");
  const [openrouterApiKey, setOpenrouterApiKey] = useState("");
  const [deepseekApiKey, setDeepseekApiKey] = useState("");
  const [localLlmUrl, setLocalLlmUrl] = useState("");
  
  const [mappingOpus, setMappingOpus] = useState("");
  const [mappingSonnet, setMappingSonnet] = useState("");
  const [mappingHaiku, setMappingHaiku] = useState("");

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/config");
      if (res.ok) {
        const data: ProxyConfig = await res.json();
        setConfig(data);
        
        // Feed states
        setAuthToken(data.authToken || "");
        setActiveProvider(data.activeProvider || "nvidia");
        setNvidiaApiKey(data.nvidiaApiKey || "");
        setOpenrouterApiKey(data.openrouterApiKey || "");
        setDeepseekApiKey(data.deepseekApiKey || "");
        setLocalLlmUrl(data.localLlmUrl || "http://localhost:1234/v1");
        
        setMappingOpus(data.modelMapping?.opus || "");
        setMappingSonnet(data.modelMapping?.sonnet || "");
        setMappingHaiku(data.modelMapping?.haiku || "");
      }
    } catch (e) {
      console.error("Failed to load proxy config:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (updatedStatus?: string) => {
    setSaveSuccess(false);
    const updatedPayload = {
      status: updatedStatus !== undefined ? updatedStatus : (config?.status || "online"),
      authToken,
      activeProvider,
      nvidiaApiKey,
      openrouterApiKey,
      deepseekApiKey,
      localLlmUrl,
      modelMapping: {
        opus: mappingOpus,
        sonnet: mappingSonnet,
        haiku: mappingHaiku
      }
    };

    try {
      const res = await fetch("/api/proxy/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload)
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save configuration:", e);
    }
  };

  const handleCopyUsage = () => {
    const curDomain = window.location.host || "YOUR_IP";
    const protocol = window.location.protocol || "http:";
    
    // Constructing exact commands
    const textToCopy = `export ANTHROPIC_BASE_URL=${protocol}//${curDomain}/api/proxy\nexport ANTHROPIC_AUTH_TOKEN=${authToken || "nexus-proxy-token"}\nclaude`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentDomain = window.location.host || "YOUR_IP";
  const currentProtocol = window.location.protocol || "http:";

  if (loading && !config) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-cyan-400 font-mono gap-3">
        <RefreshCw className="animate-spin text-cyan-400" size={24} />
        <span className="text-[10px] uppercase tracking-widest animate-pulse">Inicjowanie Mostka Proxy...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Controller Status Band */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/5 border border-white/5 p-3 rounded-lg select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/15">
            <Network className="animate-pulse" style={{ color: curTheme.primary }} size={18} />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Free Claude Code Proxy
            </h3>
            <p className="text-[9px] text-zinc-400 font-mono">
              Przekierowuje zapytania Claude CLI na darmowe i tańsze modele LLM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button 
            type="button"
            onClick={fetchConfig}
            className="p-1.5 rounded hover:bg-white/10 border border-transparent hover:border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Odśwież status"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
          
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/5 text-[9px] uppercase font-bold">
            <span className="text-[8px] text-zinc-500">STAN:</span>
            {config?.status === "online" ? (
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping inline-block" />
                ● ONLINE
              </span>
            ) : (
              <span className="text-red-400">● OFFLINE</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSave(config?.status === "online" ? "offline" : "online")}
            className={`px-2.5 py-1 rounded text-[9px] font-bold tracking-wider cursor-pointer uppercase transition-all duration-200 ${
              config?.status === "online" 
                ? "bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20"
                : "bg-green-500/10 hover:bg-green-500/25 text-green-400 border border-green-500/20"
            }`}
          >
            {config?.status === "online" ? "⏹ WYŁĄCZ PROXY" : "▶ WŁĄCZ PROXY"}
          </button>
        </div>
      </div>

      {/* Grid of panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Panel 1: Autoryzacja i CLI Usage */}
        <div className="bg-black/30 border border-white/5 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-mono text-[9px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5">
              <Unlock size={11} className="text-cyan-400" /> Token Dostępowy (CLI Token)
            </span>
            <span className="text-[8px] text-zinc-500 font-mono">SECURED CONSOLE SHA</span>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-mono font-semibold text-zinc-300">
              AUTH TOKEN PROXY
            </label>
            <div className="relative flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type={showToken ? "text" : "password"}
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-cyan-200 focus:outline-none focus:border-cyan-500/40"
                  placeholder="Dowolny domyślny token..."
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1.5 text-zinc-400 hover:text-white transition-colors"
                >
                  {showToken ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(authToken);
                  setCopiedToken(true);
                  setTimeout(() => setCopiedToken(false), 2000);
                }}
                className="px-2 py-1 hover:bg-white/5 border border-white/10 rounded cursor-pointer text-zinc-400 hover:text-white transition-all text-[9px]"
                title="Kopiuj token"
              >
                {copiedToken ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
              </button>
            </div>
          </div>

          <div className="pt-1.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1">
                <Terminal size={11} className="text-amber-400" /> Eksport Środowiska CLI (Copypasta)
              </label>
              <button
                type="button"
                onClick={handleCopyUsage}
                className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded text-cyan-300 transition-all cursor-pointer uppercase"
              >
                {copied ? (
                  <>
                    <Check size={9} className="text-green-400" /> Skopiowano!
                  </>
                ) : (
                  <>
                    <Copy size={9} /> Kopiuj Instrukcje
                  </>
                )}
              </button>
            </div>
            
            <pre className="text-[8px] leading-relaxed p-2 bg-black/95 border border-white/5 rounded text-green-400 select-all font-mono">
              # Wyeksportuj zmienne w terminalu przed uruchomieniem Claude CLI:<br />
              <span className="text-orange-300">export</span> ANTHROPIC_BASE_URL=<span className="text-yellow-105 select-all">{currentProtocol}//{currentDomain}/api/proxy</span><br />
              <span className="text-orange-300">export</span> ANTHROPIC_AUTH_TOKEN=<span className="text-cyan-300 select-all">{authToken || "nexus-proxy-token"}</span><br />
              <br />
              # Teraz uruchoń claude (płynnie i darmowo przez proxy)<br />
              claude
            </pre>
          </div>
        </div>

        {/* Panel 2: Dostawcy (Providers Setup) */}
        <div className="bg-black/30 border border-white/5 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-mono text-[9px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5">
              <Server size={11} className="text-amber-400" /> Dostawca Chmurowy (Upstream)
            </span>
            <span className="text-[8px] text-zinc-500 font-mono">INTEGRATIVE GATEWAY</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[8px] font-mono font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                WYBIERZ AKTYWNEGO DOSTAWCĘ
              </label>
              <select
                value={activeProvider}
                onChange={(e) => setActiveProvider(e.target.value)}
                className="w-full bg-black/70 border border-white/10 rounded px-2 py-1 font-mono text-[10px] text-white focus:outline-none focus:border-cyan-500/40 cursor-pointer"
              >
                <option value="nvidia">NVIDIA NIM (40 req/min Free Hub)</option>
                <option value="openrouter">OpenRouter (Darmowe & Otwarte modele)</option>
                <option value="deepseek">DeepSeek (Super tani oryginalny API)</option>
                <option value="local">LM Studio / Llama.cpp (100% lokalny host)</option>
                <option value="gemini">Google Gemini Fallback (Zintegrowany z Workspace)</option>
              </select>
            </div>

            {/* Conditionally render API key inputs based on provider */}
            {activeProvider === "nvidia" && (
              <div className="space-y-1">
                <label className="block text-[9px] font-mono text-zinc-400">NVIDIA NIM API Key</label>
                <input
                  type="password"
                  value={nvidiaApiKey}
                  onChange={(e) => setNvidiaApiKey(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-[9px] font-mono text-zinc-300 focus:outline-none"
                  placeholder="nvapi-sk-............................."
                />
              </div>
            )}

            {activeProvider === "openrouter" && (
              <div className="space-y-1">
                <label className="block text-[9px] font-mono text-zinc-400">OpenRouter API Key (Supports free models)</label>
                <input
                  type="password"
                  value={openrouterApiKey}
                  onChange={(e) => setOpenrouterApiKey(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-[9px] font-mono text-zinc-300 focus:outline-none"
                  placeholder="sk-or-v1-........................................"
                />
              </div>
            )}

            {activeProvider === "deepseek" && (
              <div className="space-y-1">
                <label className="block text-[9px] font-mono text-zinc-400">DeepSeek API Key (Tanie i niesamowicie wydajne)</label>
                <input
                  type="password"
                  value={deepseekApiKey}
                  onChange={(e) => setDeepseekApiKey(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-[9px] font-mono text-zinc-300 focus:outline-none"
                  placeholder="sk-................................"
                />
              </div>
            )}

            {activeProvider === "local" && (
              <div className="space-y-1">
                <label className="block text-[9px] font-mono text-zinc-400">Lokalny Endpoint URL (Local model execution URL)</label>
                <input
                  type="text"
                  value={localLlmUrl}
                  onChange={(e) => setLocalLlmUrl(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-[9px] font-mono text-zinc-300 focus:outline-none"
                  placeholder="e.g. http://localhost:1234/v1"
                />
              </div>
            )}

            {activeProvider === "gemini" && (
              <div className="p-2 border border-green-500/10 rounded bg-green-950/10 text-[9.5px] font-mono leading-relaxed text-green-300">
                <ShieldCheck size={12} className="inline mr-1.5 text-green-400 mb-0.5" />
                Dzięki bezpiecznej integracji z systemem Google AI Studio, żaden zewnętrzny klucz API nie jest wymagany! Zapytania będą przesyłane bezpośrednio przez stabilny kanał Gemini (2.0-flash / 1.5-pro) całkowicie <strong>ZA DARMO</strong> i bez ograniczeń.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Frame 3: Model Mapping */}
      <div className="bg-black/30 border border-white/5 rounded-lg p-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
          <span className="font-mono text-[9px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5">
            <Settings size={11} className="text-cyan-400" /> Konfiguracja Mapowania Modelu (Model Translation Matrix)
          </span>
          <span className="text-[8px] text-zinc-500 font-mono">DOCKER ROUTING</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Opus mapping */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-mono font-bold text-zinc-300">
                opus
              </label>
              <span className="text-[7.5px] text-purple-400 font-mono font-semibold uppercase">Premium Heavyweight</span>
            </div>
            <input
              type="text"
              value={mappingOpus}
              onChange={(e) => setMappingOpus(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[9.5px] font-mono text-white focus:outline-none focus:border-cyan-500/40"
              placeholder="z-ai/glm-4-plus"
            />
            <p className="text-[7.5px] font-mono text-zinc-500">Mówi do Opus &rarr; Wywołuje to</p>
          </div>

          {/* Sonnet mapping */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-mono font-bold text-zinc-300">
                sonnet
              </label>
              <span className="text-[7.5px] text-cyan-400 font-mono font-semibold uppercase">Balanced Core (Default)</span>
            </div>
            <input
              type="text"
              value={mappingSonnet}
              onChange={(e) => setMappingSonnet(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[9.5px] font-mono text-white focus:outline-none focus:border-cyan-500/40"
              placeholder="moonshotai/kimi-k2"
            />
            <p className="text-[7.5px] font-mono text-zinc-500">Mówi do Sonnet &rarr; Wywołuje to</p>
          </div>

          {/* Haiku mapping */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-mono font-bold text-zinc-300">
                haiku
              </label>
              <span className="text-[7.5px] text-amber-400 font-mono font-semibold uppercase">Ultra-Fast Efficiency</span>
            </div>
            <input
              type="text"
              value={mappingHaiku}
              onChange={(e) => setMappingHaiku(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[9.5px] font-mono text-white focus:outline-none focus:border-cyan-500/40"
              placeholder="stepfun/step-3.5-flash"
            />
            <p className="text-[7.5px] font-mono text-zinc-500">Mówi do Haiku &rarr; Wywołuje to</p>
          </div>
        </div>

        {/* Informational table on provider defaults */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 border-t border-white/5 pt-3 mt-3 select-none">
          {[
            { tag: "NVIDIA NIM", desc: "40 req/min FREE", colors: "border-green-500/10 text-green-400 bg-green-500/5" },
            { tag: "OpenRouter", desc: "Free models", colors: "border-indigo-500/10 text-indigo-400 bg-indigo-500/5" },
            { tag: "DeepSeek", desc: "Cheap API", colors: "border-amber-500/10 text-amber-400 bg-amber-500/5" },
            { tag: "LM Studio", desc: "100% Local", colors: "border-cyan-500/10 text-cyan-400 bg-cyan-500/5" },
            { tag: "llama.cpp", desc: "Local server", colors: "border-rose-500/10 text-rose-400 bg-rose-500/5" }
          ].map((prov, i) => (
            <div key={i} className={`p-1.5 rounded border text-center font-mono leading-snug cursor-help ${prov.colors}`}>
              <div className="text-[8px] font-bold uppercase tracking-wider">{prov.tag}</div>
              <div className="text-[7px] text-white/50">{prov.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action panel & Live stats metrics */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 select-none">
        
        {/* Statistics details */}
        <div className="flex-1 grid grid-cols-4 gap-2 text-center bg-white/5 border border-white/5 p-2 rounded-lg font-mono text-[9px]">
          <div>
            <div className="text-zinc-500">CYKLE API (TRY)</div>
            <div className="text-white font-bold">{config?.stats?.totalRequests || 0}</div>
          </div>
          <div>
            <div className="text-zinc-500">SUKCESY (+)</div>
            <div className="text-green-400 font-bold">{config?.stats?.successfulRequests || 0}</div>
          </div>
          <div>
            <div className="text-zinc-500">BŁĘDY (-)</div>
            <div className="text-red-400 font-bold">{config?.stats?.failedRequests || 0}</div>
          </div>
          <div>
            <div className="text-zinc-500">EST TOKENS</div>
            <div className="text-cyan-400 font-bold">{Math.ceil(config?.stats?.tokensUsed || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={async () => {
              // Resets counters or stops sessions
              const updatedPayload = {
                stats: {
                  totalRequests: 0,
                  successfulRequests: 0,
                  failedRequests: 0,
                  tokensUsed: 0
                }
              };
              const res = await fetch("/api/proxy/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedPayload)
              });
              if (res.ok) {
                const data = await res.json();
                setConfig(data.config);
              }
            }}
            className="px-3 py-1.5 rounded text-[9px] font-bold text-zinc-400 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer uppercase flex items-center gap-1"
          >
            <Square size={10} className="fill-current text-red-500/80" /> WYCZYŚĆ LOGI SESJI
          </button>
          
          <a
            href="/api/proxy/status"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded text-[9px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all cursor-pointer uppercase flex items-center gap-1"
          >
            <ExternalLink size={10} /> OTWÓRZ PANEL API
          </a>

          <button
            type="button"
            onClick={() => handleSave()}
            className="px-4 py-1.5 rounded text-[9px] font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all cursor-pointer uppercase flex items-center gap-1 shadow-md shadow-cyan-400/20 border border-cyan-300"
          >
            <Save size={10} /> ZAPISZ KONFIGURACJĘ
          </button>
        </div>

      </div>

      {saveSuccess && (
        <div className="flex items-center gap-1.5 p-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-[9px] font-mono uppercase tracking-wider select-none animate-bounce">
          <CheckCircle size={12} /> Zmiany w rdzeniu proxy zostały trwale zapisane w proxy-config.json i załadowane!
        </div>
      )}
    </div>
  );
}
