import React, { useState } from "react";
import { Activity, ShieldCheck, Zap } from "lucide-react";

export function EvoPanel({ curTheme }) {
  const [xp, setXp] = useState(parseInt(localStorage.getItem("nexus_xp") || "0"));
  const [milestone, setMilestone] = useState(1);
  const [evoScores, setEvoScores] = useState([{ts:"00:00", score:xp}]);

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

  const currentMs = EVO_MILESTONES.slice().reverse().find(m => xp >= m.xp) || EVO_MILESTONES[0];
  const nextMs = EVO_MILESTONES.find(m => m.xp > xp);
  const pct = nextMs ? Math.min(100, Math.round(((xp - currentMs.xp) / (nextMs.xp - currentMs.xp)) * 100)) : 100;

  return (
    <div className="text-xs leading-normal select-none font-mono">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase mb-2 pb-1 border-b" style={{ color: curTheme.primary, borderColor: curTheme.border }}>
        <Activity size={11} className="animate-pulse" />
        Evolution & Neural Metrics
      </div>
      
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-bold text-white">LEVEL {currentMs.id}: {currentMs.label}</span>
        <span className="text-[9px]" style={{ color: curTheme.primary }}>{xp} XP</span>
      </div>
      
      <div className="h-2 w-full rounded-full bg-black/60 relative overflow-hidden border" style={{ borderColor: curTheme.border }}>
        <div className="absolute top-0 bottom-0 left-0 transition-all duration-1000" style={{ width: `${pct}%`, background: curTheme.primary, boxShadow: `0 0 10px ${curTheme.primary}` }} />
      </div>
      <div className="flex justify-between mt-1 text-[7.5px] opacity-50 text-white uppercase tracking-widest">
        <span>Current: {currentMs.xp}</span>
        <span>{nextMs ? `Next: ${nextMs.xp}` : 'MAX LEVEL'}</span>
      </div>

      <div className="mt-4 border rounded p-2" style={{ borderColor: curTheme.border, background: "rgba(0,0,0,0.2)" }}>
        <div className="text-[8.5px] text-white/60 mb-2 uppercase tracking-wide">Evolution Trajectory</div>
        <div className="space-y-1.5 h-32 overflow-y-auto scrollbar-thin">
          {EVO_MILESTONES.map(m => {
            const unlocked = xp >= m.xp;
            return (
              <div key={m.id} className="flex items-center justify-between opacity-80" style={{ color: unlocked ? curTheme.primary : "rgba(255,255,255,0.3)" }}>
                <div className="flex items-center gap-2 text-[8.5px]">
                  {unlocked ? <ShieldCheck size={10} /> : <div className="w-2.5 h-2.5" />}
                  <span>Lvl {m.id} - {m.label}</span>
                </div>
                <div className="text-[7px]">{m.xp} XP</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
