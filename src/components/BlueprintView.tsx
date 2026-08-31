import { useState } from "react";
import { technicalTopics } from "../data/blueprintData";
import { ChevronRight, FileCode, CheckCircle2, Copy, Check } from "lucide-react";

export default function BlueprintView() {
  const [selectedTopicId, setSelectedTopicId] = useState(technicalTopics[0].id);
  const [copied, setCopied] = useState(false);

  const activeTopic = technicalTopics.find((t) => t.id === selectedTopicId) || technicalTopics[0];

  const handleCopyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="blueprint-root">
      {/* Sidebar - Topics List */}
      <div className="lg:col-span-4 space-y-3" id="blueprint-sidebar">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-2">
          Módulos de Arquitetura
        </h3>
        <div className="space-y-1">
          {technicalTopics.map((topic) => (
            <button
              key={topic.id}
              id={`blueprint-topic-${topic.id}`}
              onClick={() => setSelectedTopicId(topic.id)}
              className={`w-full text-left p-4 rounded-xl transition-all border flex items-center justify-between ${
                selectedTopicId === topic.id
                  ? "bg-blue-600 border-blue-500/30 text-white shadow-lg shadow-blue-600/20"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
              }`}
            >
              <div className="space-y-1">
                <div className="font-semibold text-sm">{topic.title.split(". ")[1]}</div>
                <div className="text-xs text-slate-400 line-clamp-1">{topic.summary}</div>
              </div>
              <ChevronRight
                className={`h-4 w-4 shrink-0 transition-transform ${
                  selectedTopicId === topic.id ? "text-white translate-x-1" : "text-slate-500"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Visual Pipeline Block */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-4" id="blueprint-flow-diagram">
          <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            Fluxo de Dados Técnico
          </h4>
          <div className="space-y-3">
            {[
              { label: "Origem da Gravação de Tela (.mp4)", desc: "Faixas de vídeo + áudio codificadas" },
              { label: "Desmultiplexador de Contêiner", desc: "Isola e descarta quadros de vídeo H.264" },
              { label: "Decodificador de Hardware PCM", desc: "Traduz AAC/Opus para Float32 PCM" },
              { label: "Motor de Edição de Áudio", desc: "Aplica ganhos offline & cortes de precisão" },
              { label: "Compressão MP3 LAME", desc: "Executa mascaramento espectral & codificação Huffman" },
              { label: "MP3 de Alta Fidelidade (.mp3)", desc: "Pronto para reprodução e download" }
            ].map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 relative" id={`flow-step-${idx}`}>
                {idx < 5 && (
                  <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-white/10" />
                )}
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 ${
                  idx === 0 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                  idx === 5 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                }`}>
                  {idx + 1}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">{step.label}</div>
                  <div className="text-[10px] text-slate-400">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Details Display Panel */}
      <div className="lg:col-span-8 space-y-6" id="blueprint-details-panel">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-6">
          {/* Header */}
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{activeTopic.title}</h2>
            <p className="text-sm text-slate-400 mt-1">{activeTopic.summary}</p>
          </div>

          {/* Deep-Dive Bullet List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              Operações Técnicas Centrais
            </h4>
            <ul className="space-y-3">
              {activeTopic.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-300" id={`topic-detail-${idx}`}>
                  <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Code Console block */}
          <div className="space-y-3">
            <div className="flex items-center justify-between" id="code-console-header">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-500">
                  {activeTopic.codeTitle} ({activeTopic.language})
                </span>
              </div>
              <button
                onClick={() => handleCopyCode(activeTopic.codeSnippet)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs text-blue-400 bg-white/5 border border-white/10 hover:bg-white/10 rounded-md transition-colors"
                id="copy-code-btn"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-300 font-medium">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#090d22]/90 border border-white/5 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed max-h-96">
              <code>{activeTopic.codeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
