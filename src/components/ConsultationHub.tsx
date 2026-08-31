import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send, Loader2, Sparkles, MessageSquareCode, ShieldAlert, Trash2, Database, Wifi, WifiOff } from "lucide-react";
import { getChatMessages, saveChatMessage, clearChatMessages, isSupabaseConfigured } from "../utils/supabaseClient";

export default function ConsultationHub() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load messages on mount
  useEffect(() => {
    async function initChat() {
      try {
        const history = await getChatMessages();
        if (history && history.length > 0) {
          setMessages(
            history.map((h, index) => ({
              id: h.id || `msg-${index}`,
              role: h.role === "assistant" ? "model" : "user",
              content: h.content,
              timestamp: h.created_at ? new Date(h.created_at) : new Date()
            }))
          );
        } else {
          // If empty, set the welcome message
          const initialMsg: ChatMessage = {
            id: "initial",
            role: "model",
            content: "Olá! Sou seu Arquiteto Técnico e Especialista em Propriedade Intelectual. Estou totalmente preparado para prestar consultoria sobre pipelines de áudio, variáveis do FFmpeg, compilação WebAssembly no navegador ou limites de direitos autorais ao converter gravações de tela. Quais perguntas técnicas ou jurídicas posso responder para você hoje?",
            timestamp: new Date()
          };
          setMessages([initialMsg]);
          // Save the initial welcoming message
          await saveChatMessage({
            role: "assistant",
            content: initialMsg.content
          });
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setInitialLoading(false);
      }
    }
    initChat();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    // Save user message to Supabase
    await saveChatMessage({
      role: "user",
      content: textToSend
    });

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error("Falha ao se comunicar com o servidor proxy de consulta");
      }

      const data = await response.json();
      const botContent = data.text || "Não foi possível formular uma resposta. Por favor, reformule sua pergunta.";
      const assistantMessage: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        content: botContent,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to Supabase
      await saveChatMessage({
        role: "assistant",
        content: botContent
      });
    } catch (err: any) {
      console.error(err);
      const errContent = `⚠️ Erro de Consulta: ${err.message || "Não foi possível conectar ao servidor. Verifique se ele está rodando."}`;
      const errorMessage: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        content: errContent,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);

      await saveChatMessage({
        role: "assistant",
        content: errContent
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Tem certeza de que deseja limpar seu histórico de consultas?")) {
      await clearChatMessages();
      const initialMsg: ChatMessage = {
        id: "initial",
        role: "model",
        content: "Histórico de consultas limpo. Como posso ajudar com suas dúvidas sobre arquitetura ou questões jurídicas hoje?",
        timestamp: new Date()
      };
      setMessages([initialMsg]);
      await saveChatMessage({
        role: "assistant",
        content: initialMsg.content
      });
    }
  };

  const samplePrompts = [
    { label: "Sincronia de Quadros Variáveis (VFR)", query: "Explique as taxas de quadros variáveis (VFR) em gravações de tela e como o FFmpeg gerencia o descompasso de sincronização." },
    { label: "Mascaramento Psicoacústico LAME", query: "Como o filtro de mascaramento psicoacústico do MP3 LAME decide quais frequências de áudio descartar?" },
    { label: "Legalidade da Seção 1201 do DMCA", query: "Explique a Seção 1201 do DMCA sobre contornar medidas de proteção tecnológica para download vs. gravação de tela." },
    { label: "Desempenho Wasm vs Nativo", query: "Compare o desempenho da decodificação com a API Web Audio no cliente com o processamento completo do ffmpeg.wasm em WebAssembly." }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-180px)] min-h-[550px]" id="consultation-root">
      {/* Sidebar - Context Guard info */}
      <div className="lg:col-span-4 space-y-4 flex flex-col" id="consultation-sidebar">
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 text-blue-400">
            <MessageSquareCode className="h-5 w-5" />
            <h3 className="font-bold text-slate-100 text-sm md:text-base">Sala de Consultoria</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Interaja com um assistente de IA instruído especificamente para avaliar a arquitetura de implementação, sugerir comandos do FFmpeg e analisar riscos jurídicos de direitos autorais.
          </p>

          {/* Supabase Status indicator */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-slate-500" />
              Sincronização de Banco:
            </span>
            {isSupabaseConfigured ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Wifi className="h-3.5 w-3.5" />
                Supabase Nuvem Ativo
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <WifiOff className="h-3.5 w-3.5" />
                Modo Offline Local
              </span>
            )}
          </div>
        </div>

        {/* Suggestion Prompts */}
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-3 flex-1 flex flex-col overflow-hidden" id="consultation-suggestions">
          <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            Consultas Sugeridas
          </h4>
          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                id={`sample-prompt-${idx}`}
                onClick={() => handleSendMessage(p.query)}
                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-xs text-slate-300 font-medium leading-relaxed"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legal Disclaimer Block */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-start gap-3 shrink-0" id="legal-disclaimer">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-amber-400">Aviso Operacional Importante</div>
            <p className="text-[10px] text-amber-200/90 leading-normal">
              As orientações da IA servem apenas para arquitetura técnica, viabilidade e análise educacional. Elas não constituem aconselhamento jurídico profissional ou assessoria advocatícia.
            </p>
          </div>
        </div>
      </div>

      {/* Main chat window */}
      <div className="lg:col-span-8 flex flex-col bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden h-full" id="consultation-chat-window">
        {/* Chat header with Clear button */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5" id="chat-header">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feed de Consulta Especializada</span>
          </div>
          <button
            onClick={handleClearHistory}
            className="text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20"
            title="Limpar Histórico do Chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpar Sala</span>
          </button>
        </div>

        {/* Chat feed messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[250px]" id="chat-feed">
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 text-slate-400 py-12" id="chat-init-loader">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <span className="text-xs">Restaurando transcrições das consultas...</span>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  id={`chat-msg-${m.id}`}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? "bg-blue-600 text-white font-medium rounded-tr-none shadow-md shadow-blue-600/10"
                      : "bg-white/5 text-slate-200 border border-white/10 rounded-tl-none whitespace-pre-wrap"
                  }`}>
                    {m.content}
                  </div>
                </div>
              );
            })
          )}
          {loading && (
            <div className="flex justify-start" id="chat-loading-indicator">
              <div className="bg-white/5 text-slate-400 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span>Formulando resposta de arquitetura...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <form
          id="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="p-4 border-t border-white/10 flex gap-3 bg-[#090d22]/30"
        >
          <input
            id="chat-input-field"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Pergunte sobre scripts do FFmpeg, parâmetros LAME, limitações de memória do navegador ou exceções de Uso Justo..."
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-[#090d22] text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
            disabled={loading || initialLoading}
          />
          <button
            id="chat-submit-btn"
            type="submit"
            disabled={loading || initialLoading || !inputValue.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-slate-600 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Perguntar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
