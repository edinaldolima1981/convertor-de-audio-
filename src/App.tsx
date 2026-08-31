/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import Header from "./components/Header";
import ConverterStudio from "./components/ConverterStudio";
import BlueprintView from "./components/BlueprintView";
import RoadmapView from "./components/RoadmapView";
import LegalCenter from "./components/LegalCenter";
import ConsultationHub from "./components/ConsultationHub";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("converter");

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col font-sans text-slate-200 antialiased relative overflow-hidden" id="app-root">
      {/* Background blurs for Frosted Glass Luxury */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Header and Tab Navigator */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative z-10" id="main-content-section">
        <div className="transition-opacity duration-200" id="tab-renderer-container">
          {activeTab === "converter" && <ConverterStudio />}
          {activeTab === "blueprint" && <BlueprintView />}
          {activeTab === "roadmap" && <RoadmapView />}
          {activeTab === "legal" && <LegalCenter />}
          {activeTab === "chat" && <ConsultationHub />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-md py-6 relative z-10" id="app-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500" id="footer-copyright">
            &copy; 2026 MediaExtract Suite. Criado como uma demonstração profissional de viabilidade arquitetural.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500" id="footer-links">
            <span id="pwa-badge" className="bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono text-[10px] text-slate-400">
              Núcleo Offline Ativo
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
