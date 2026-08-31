import { useState } from "react";
import { legalRisks, ethicsQuestions, ethicsRatingDescriptions } from "../data/legalData";
import { AlertCircle, ShieldAlert, CheckCircle, HelpCircle, Scale } from "lucide-react";

export default function LegalCenter() {
  // Store state of checked ethics answers. Checked = "Yes", Unchecked = "No"
  const [answers, setAnswers] = useState<Record<string, boolean>>({
    "question-ownership": false,
    "question-purpose": false,
    "question-distribution": false,
    "question-market": false,
  });

  const toggleAnswer = (id: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Calculate cumulative score based on weights
  const score = ethicsQuestions.reduce((acc, q) => {
    return acc + (answers[q.id] ? q.weight : 0);
  }, 0);

  // Determine description rating block based on score
  let ratingInfo = ethicsRatingDescriptions.highRisk;
  if (score >= 80) {
    ratingInfo = ethicsRatingDescriptions.aligned;
  } else if (score >= 50) {
    ratingInfo = ethicsRatingDescriptions.moderate;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="legal-center-root">
      {/* Left Pane - Legal Risks list */}
      <div className="lg:col-span-7 space-y-6" id="legal-risks-pane">
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10" id="legal-intro">
          <div className="flex items-center gap-3 text-blue-400">
            <Scale className="h-6 w-6" />
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Matriz de Riscos Jurídicos</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            Uma revisão abrangente e profissional dos estatutos de propriedade intelectual, marcos regulatórios de direitos autorais e termos de uso aplicáveis a pipelines de extração de áudio.
          </p>
        </div>

        {/* Risks Grid */}
        <div className="space-y-4" id="legal-risks-grid">
          {legalRisks.map((risk) => {
            const isCritical = risk.riskLevel === "Critical";
            const isHigh = risk.riskLevel === "High";

            const categoryMap = {
              "YouTube ToS": "Termos do YouTube",
              "Copyright Law": "Direitos Autorais",
              "Fair Use": "Uso Justo",
              "DMCA": "DMCA / Porto Seguro"
            };

            const riskLevelMap = {
              "Critical": "Crítico",
              "High": "Alto",
              "Medium": "Médio",
              "Low": "Baixo"
            };
            
            return (
              <div
                key={risk.id}
                id={`risk-card-${risk.id}`}
                className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-4"
              >
                {/* Risk Title & Status Pill */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">{categoryMap[risk.category]}</div>
                    <h3 className="font-bold text-slate-200 text-sm md:text-base">{risk.title}</h3>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                    isCritical ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    isHigh ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    <AlertCircle className="h-3 w-3" />
                    <span>Risco {riskLevelMap[risk.riskLevel]}</span>
                  </span>
                </div>

                {/* References */}
                <div className="text-xs text-slate-500 font-mono">
                  <span className="font-semibold text-slate-400">Estatuto/Referência:</span> {risk.legalReference}
                </div>

                {/* Impact Details */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-400">Conflito Jurídico &amp; Impacto Operacional:</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{risk.impactDescription}</p>
                </div>

                {/* Mitigation strategies */}
                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-1">
                  <h4 className="text-xs font-bold text-blue-400">Defesas de Arquitetura &amp; Mitigações:</h4>
                  <p className="text-xs text-blue-200/90 leading-relaxed">{risk.mitigationStrategy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Pane - Ethics Alignment Calculator */}
      <div className="lg:col-span-5 space-y-6" id="ethics-calculator-pane">
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 sticky top-24 space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-200 text-base">Calculadora de Alinhamento Ético</h3>
            <p className="text-xs text-slate-400">
              Selecione as afirmações que correspondem ao seu cenário de implementação pretendido para estimar os limites de conformidade ética e jurídica.
            </p>
          </div>

          {/* Core Interactive Questions */}
          <div className="space-y-4" id="ethics-questions-list">
            {ethicsQuestions.map((q) => {
              const isChecked = answers[q.id];
              return (
                <button
                  key={q.id}
                  id={`ethics-q-btn-${q.id}`}
                  onClick={() => toggleAnswer(q.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex gap-3 items-start ${
                    isChecked
                      ? "border-blue-500/30 bg-blue-500/10 shadow-lg shadow-blue-500/5"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    isChecked ? "bg-blue-600 border-blue-500 text-white" : "border-white/20 bg-white/5"
                  }`}>
                    {isChecked && <CheckCircle className="h-3.5 w-3.5" />}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-200">{q.question}</div>
                    <div className="text-[11px] text-slate-400 leading-normal">{q.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Score Visualization */}
          <div className="border-t border-white/10 pt-5 space-y-4" id="ethics-score-visualization">
            <div className="flex items-center justify-between" id="ethics-score-text">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pontuação de Alinhamento Ético</span>
              <span className={`text-lg font-extrabold ${
                score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400"
              }`}>
                {score}%
              </span>
            </div>

            {/* Micro-gauge meter bar */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden" id="ethics-score-bar-container">
              <div
                className={`h-full transition-all duration-500 ${
                  score >= 80 ? "bg-emerald-500 shadow-md shadow-emerald-500/20" : score >= 50 ? "bg-amber-500 shadow-md shadow-amber-500/20" : "bg-red-500 shadow-md shadow-red-500/20"
                }`}
                style={{ width: `${score}%` }}
                id="ethics-score-bar-fill"
              />
            </div>

            {/* Dynamic Status block */}
            <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
              score >= 80 ? "text-emerald-300 bg-emerald-950/20 border-emerald-500/20" :
              score >= 50 ? "text-amber-300 bg-amber-950/20 border-amber-500/20" :
              "text-red-300 bg-red-950/20 border-red-500/20"
            }`} id="ethics-status-description">
              <div className="font-bold flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4" />
                <span>{ratingInfo.title}</span>
              </div>
              <p className="opacity-90 leading-relaxed">{ratingInfo.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
