import React, { useState } from "react";
import { Terminal, Shield, Zap, Search, Key, Box } from "lucide-react";

export function AgentPanel({ curTheme }) {
  const [agentTasks, setAgentTasks] = useState([]);
  const [agentTask, setAgentTask] = useState("system_info");
  const [agentTarget, setAgentTarget] = useState("oracle");
  const [agentRunning, setAgentRunning] = useState(false);

  async function runAgent() {
    setAgentRunning(true);
    const tid = `${agentTask}_${Date.now().toString(36)}`;
    const entry = { id: tid, task: agentTask, target: agentTarget, status: "running", ts: new Date().toLocaleTimeString() };
    setAgentTasks(p => [entry, ...p.slice(0, 14)]);

    try {
      const r = await fetch(`/api/agent/run`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: agentTask, target: agentTarget, payload: {} })
      });
      const d = await r.json();
      setAgentTasks(p => p.map(t => t.id === tid ? { ...d, id: tid } : t));
    } catch (e) {
      setAgentTasks(p => p.map(t => t.id === tid ? { ...t, status: "error", result: e.message } : t));
    }
    setAgentRunning(false);
  }

  const AGENT_TASKS = ["system_info", "health_check", "disk", "memory", "cpu", "processes", "network", "uptime", "shell", "ping"];
  
  return (
    <div className="text-xs leading-normal select-none">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase mb-2 font-mono pb-1 border-b" style={{ color: curTheme.primary, borderColor: curTheme.border }}>
        <Zap size={11} className="animate-pulse" />
        Super Agent Commander
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2 font-mono">
        <div>
          <label className="text-[7.5px] opacity-60 mb-1 block">TARGET NODE</label>
          <select 
            value={agentTarget} 
            onChange={e => setAgentTarget(e.target.value)} 
            className="w-full bg-black/60 border rounded px-2 py-1 text-[9px] outline-none"
            style={{ borderColor: curTheme.border, color: curTheme.textLight }}
          >
            <option value="oracle">Oracle Cloud (141.147.9.41)</option>
            <option value="local">Local Development</option>
            <option value="cluster">K8s Cluster</option>
          </select>
        </div>
        <div>
          <label className="text-[7.5px] opacity-60 mb-1 block">ACTIVE TASK</label>
          <select 
            value={agentTask} 
            onChange={e => setAgentTask(e.target.value)} 
            className="w-full bg-black/60 border rounded px-2 py-1 text-[9px] outline-none"
            style={{ borderColor: curTheme.border, color: curTheme.textLight }}
          >
            {AGENT_TASKS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <button 
        onClick={runAgent} 
        disabled={agentRunning}
        className="w-full py-1.5 rounded font-mono text-[9px] font-bold uppercase tracking-widest mb-3 hover:brightness-125 transition-all"
        style={{ background: curTheme.border, color: curTheme.primary, border: `1px solid ${curTheme.primary}` }}
      >
        {agentRunning ? "EXECUTING..." : "LAUNCH SUBROUTINE"}
      </button>

      <div className="font-mono text-[8.5px] max-h-32 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
        {agentTasks.map(t => (
          <div key={t.id} className="p-1.5 rounded border" style={{ borderColor: curTheme.border, background: "rgba(0,0,0,0.3)" }}>
            <div className="flex justify-between items-center opacity-80 mb-1 text-[7.5px]">
              <span className="text-white">[{t.ts}] {t.target}</span>
              <span style={{ color: t.status === "error" ? "#ff4444" : t.status === "done" ? "#00ff9d" : curTheme.primary }}>
                {t.status.toUpperCase()}
              </span>
            </div>
            <div className="text-[9px] font-bold" style={{ color: curTheme.textLight }}>
              $&gt; {t.task}
            </div>
            {t.result && (
              <div className="mt-1 p-1 rounded bg-black/60 opacity-80 overflow-hidden text-ellipsis whitespace-nowrap text-[8px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                {t.result}
              </div>
            )}
          </div>
        ))}
        {agentTasks.length === 0 && <div className="text-center opacity-40 mt-3 italic">No tasks executed in this session.</div>}
      </div>
    </div>
  );
}
