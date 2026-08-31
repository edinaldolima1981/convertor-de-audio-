import { useState } from "react";
import { roadmapPhases } from "../data/roadmapData";
import { Clock, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Code2 } from "lucide-react";

export default function RoadmapView() {
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>("phase-1");

  const togglePhase = (id: string) => {
    setExpandedPhaseId(expandedPhaseId === id ? null : id);
  };

  return (
    <div className="space-y-6" id="roadmap-root">
      {/* Introduction */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10" id="roadmap-intro">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Roteiro de Desenvolvimento Estratégico</h2>
        <p className="text-sm text-slate-400 mt-1">
          Um cronograma de lançamento profissional de 12 semanas projetado para lidar com desempenho, aceleração de hardware, perfis de memória e restrições de sandbox de segurança.
        </p>
      </div>

      {/* Timeline List */}
      <div className="space-y-4" id="roadmap-timeline">
        {roadmapPhases.map((phase, idx) => {
          const isExpanded = expandedPhaseId === phase.id;
          return (
            <div
              key={phase.id}
              id={`roadmap-phase-card-${phase.id}`}
              className={`bg-white/5 backdrop-blur-lg border transition-all rounded-2xl overflow-hidden ${
                isExpanded ? "border-blue-500/30 shadow-lg shadow-blue-500/5" : "border-white/10 hover:border-white/20"
              }`}
            >
              {/* Card Header (Clickable toggler) */}
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  {/* Phase Circle badge */}
                  <div className={`h-10 w-10 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${
                    isExpanded ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300"
                  }`}>
                    F0{phase.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm md:text-base">{phase.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{phase.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`hidden md:inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                    phase.number === 1 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-slate-400 border border-white/5"
                  }`}>
                    {phase.number === 1 ? "Totalmente Detalhado" : "Fase de Planejamento"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Card Expandable Body */}
              {isExpanded && (
                <div className="p-6 border-t border-white/10 bg-white/5 space-y-6" id={`phase-details-${phase.id}`}>
                  {/* Description */}
                  <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">{phase.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tasks Checklist */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                        Entregas da Sprint
                      </h4>
                      <div className="space-y-2.5">
                        {phase.tasks.map((task, tIdx) => (
                          <div key={tIdx} className="flex items-start gap-3" id={`task-item-${idx}-${tIdx}`}>
                            <div className="h-5 w-5 rounded-md border border-white/15 bg-white/5 flex items-center justify-center text-[10px] text-blue-400 font-bold mt-0.5 shrink-0">
                              ✓
                            </div>
                            <span className="text-sm text-slate-300">{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Challenges & Solutions */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                        Análise de Riscos Técnicos
                      </h4>
                      
                      <div className="space-y-3">
                        {/* Challenges list */}
                        {phase.challenges.map((challenge, cIdx) => (
                          <div key={cIdx} className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2" id={`challenge-item-${idx}-${cIdx}`}>
                            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                              <span>Desafio Crítico:</span>
                            </div>
                            <p className="text-xs text-amber-200/90 leading-relaxed">{challenge}</p>
                          </div>
                        ))}

                        {/* Mitigations list */}
                        {phase.mitigations.map((mitigation, mIdx) => (
                          <div key={mIdx} className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2" id={`mitigation-item-${idx}-${mIdx}`}>
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                              <span>Mitigação Arquitetada:</span>
                            </div>
                            <p className="text-xs text-emerald-200/90 leading-relaxed">{mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Code Snippet block if present */}
                  {phase.codeSnippet && (
                    <div className="space-y-3 border-t border-white/10 pt-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Code2 className="h-4 w-4 text-blue-400" />
                        <span>{phase.codeTitle || "Snippet de Integração"}</span>
                      </div>
                      <pre className="p-4 rounded-xl bg-[#090d22]/90 border border-white/5 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed">
                        <code>{phase.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
