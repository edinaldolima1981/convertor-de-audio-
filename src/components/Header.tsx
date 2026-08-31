import { Disc, Cpu, Milestone, Scale, MessageSquareCode } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const tabs = [
    { id: "converter", label: "Estúdio de Conversão", icon: Disc },
    { id: "blueprint", label: "Esboço Técnico", icon: Cpu },
    { id: "roadmap", label: "Roteiro de Dev", icon: Milestone },
    { id: "legal", label: "Direitos & Ética", icon: Scale },
    { id: "chat", label: "Consultor Especialista", icon: MessageSquareCode },
  ];

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-50" id="main-header">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3" id="app-brand-container">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20" id="app-logo">
            <Disc className="h-6 w-6 animate-spin-slow text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300" id="app-title">
              SonicRip Studio
            </h1>
            <p className="text-xs text-slate-400" id="app-subtitle">
              Extrator de Áudio de Gravações de Tela & Suíte Arquitetural
            </p>
          </div>
        </div>

        {/* Tab navigation bar - Flattened clean structure */}
        <nav className="flex flex-wrap items-center bg-white/5 p-1.5 rounded-xl border border-white/10" id="main-navigation">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
