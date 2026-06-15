import React, { useState } from "react";
import { Database, Plus, Trash2 } from "lucide-react";

export function MemoryPanel({ curTheme }) {
  const [facts, setFacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nexus_facts") || "[]"); }
    catch { return []; }
  });
  const [factInput, setFactInput] = useState("");

  const addFact = () => {
    if(!factInput.trim()) return;
    const newFacts = [{ id: Date.now().toString(36), text: factInput, ts: new Date().toLocaleTimeString() }, ...facts];
    setFacts(newFacts);
    localStorage.setItem("nexus_facts", JSON.stringify(newFacts));
    setFactInput("");
  };

  const removeFact = (id) => {
    const newFacts = facts.filter(f => f.id !== id);
    setFacts(newFacts);
    localStorage.setItem("nexus_facts", JSON.stringify(newFacts));
  };

  return (
    <div className="text-xs leading-normal select-none font-mono flex flex-col h-full">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase mb-2 pb-1 border-b flex-shrink-0" style={{ color: curTheme.primary, borderColor: curTheme.border }}>
        <Database size={11} className="animate-pulse" />
        Neural Memory Vault
      </div>
      
      <div className="flex gap-1 mb-3 flex-shrink-0">
        <input 
          value={factInput} 
          onChange={e => setFactInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addFact()}
          placeholder="Inject system fact..."
          className="flex-1 bg-black/60 border rounded px-2 py-1.5 text-[9.5px] outline-none text-white/90"
          style={{ borderColor: curTheme.border }}
        />
        <button 
          onClick={addFact}
          className="px-2 py-1.5 rounded flex items-center justify-center transition-all hover:brightness-125"
          style={{ background: curTheme.border, color: curTheme.primary }}
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1 min-h-0">
        {facts.map(f => (
          <div key={f.id} className="p-2 rounded border group relative" style={{ borderColor: curTheme.border, background: "rgba(0,0,0,0.2)" }}>
            <div className="text-[7px] opacity-40 mb-1" style={{ color: curTheme.textLight }}>DECLARATION LOG: {f.ts}</div>
            <div className="text-[9.5px] text-white/80 leading-relaxed pr-6">{f.text}</div>
            <button 
              onClick={() => removeFact(f.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}
        {facts.length === 0 && (
          <div className="text-center opacity-40 italic mt-6 text-[9px]">Neural vault is currently empty.</div>
        )}
      </div>
    </div>
  );
}
