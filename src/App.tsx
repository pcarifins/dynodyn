import React, { useState } from 'react';
import { TerminalConfig } from './types';
import { Header } from './components/Header';
import { QualityGateHub } from './components/QualityGateHub';
import { SupervisorView } from './components/Supervisor/SupervisorView';
import { QualityMasterView } from './components/QualityMaster/QualityMasterView';
import { GltOperatorView } from './components/GLT/GltOperatorView';
import { PerformanceOperatorView } from './components/Performance/PerformanceOperatorView';
import { FullscreenMonitoring } from './components/Shared/FullscreenMonitoring';

export default function App() {
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalConfig | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleSelectTerminal = (terminal: TerminalConfig) => {
    setSelectedTerminal(terminal);
    if (terminal.role === 'SPV_QC') {
      setActiveTab('dashboard');
    } else if (terminal.role === 'QUALITY_MASTER') {
      setActiveTab('templates');
    } else if (terminal.role === 'GLT_OPERATOR') {
      setActiveTab('glt_gate');
    } else {
      setActiveTab('perf_gate');
    }
  };

  const handleExitTerminal = () => {
    setSelectedTerminal(null);
  };

  // If in 16:9 Fullscreen Mode
  if (isFullscreen) {
    return <FullscreenMonitoring onClose={() => setIsFullscreen(false)} />;
  }

  // If on Landing Page (Terminal Selection Hub)
  if (!selectedTerminal) {
    return (
      <QualityGateHub
        onSelectTerminal={handleSelectTerminal}
        onOpenFullscreen={() => setIsFullscreen(true)}
      />
    );
  }

  // Active Terminal View
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <Header
        currentTerminal={selectedTerminal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExitTerminal={handleExitTerminal}
        onOpenFullscreen={() => setIsFullscreen(true)}
      />

      <main className="flex-1 pb-16">
        {selectedTerminal.role === 'SPV_QC' && (
          <SupervisorView
            currentTerminal={selectedTerminal}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

        {selectedTerminal.role === 'QUALITY_MASTER' && (
          <QualityMasterView currentTerminal={selectedTerminal} />
        )}

        {selectedTerminal.role === 'GLT_OPERATOR' && (
          <GltOperatorView currentTerminal={selectedTerminal} />
        )}

        {selectedTerminal.role === 'PERF_OPERATOR' && (
          <PerformanceOperatorView currentTerminal={selectedTerminal} />
        )}
      </main>
    </div>
  );
}
