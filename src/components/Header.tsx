import React from 'react';
import { TerminalConfig } from '../types';
import { 
  Bell, 
  LogOut, 
  Tv, 
  Shield, 
  Settings, 
  Gauge, 
  Wrench, 
  CheckCircle2, 
  LayoutDashboard,
  Cpu,
  Layers,
  Calendar,
  BarChart3,
  GitBranch
} from 'lucide-react';

interface HeaderProps {
  currentTerminal: TerminalConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExitTerminal: () => void;
  onOpenFullscreen: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTerminal,
  activeTab,
  setActiveTab,
  onExitTerminal,
  onOpenFullscreen,
  unreadCount = 1
}) => {
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-2.5 flex items-center justify-between shadow-xs">
      {/* Brand & Tabs */}
      <div className="flex items-center gap-6">
        <div 
          onClick={onExitTerminal}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-950">DynoDyn</span>
        </div>

        {/* Dynamic Navigation according to Role */}
        <nav className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-sm font-medium">
          {currentTerminal.role === 'SPV_QC' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('ai_dispatch')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'ai_dispatch'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>AI Dispatch & Allocation</span>
              </button>
              <button
                onClick={() => setActiveTab('bento_grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'bento_grid'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Performance Test (Allocation)</span>
              </button>
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'pipeline'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                <span>JO Pipeline</span>
              </button>
              <button
                onClick={() => setActiveTab('sla_calendar')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'sla_calendar'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Supervisor SLA</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </>
          )}

          {currentTerminal.role === 'QUALITY_MASTER' && (
            <>
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'templates'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Checksheet Standards</span>
              </button>
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'pipeline'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                <span>JO Pipeline</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Quality Metrics</span>
              </button>
            </>
          )}

          {currentTerminal.role === 'GLT_OPERATOR' && (
            <>
              <button
                onClick={() => setActiveTab('glt_gate')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'glt_gate'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{currentTerminal.name}</span>
              </button>
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'pipeline'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                <span>JO Pipeline</span>
              </button>
            </>
          )}

          {currentTerminal.role === 'PERF_OPERATOR' && (
            <>
              <button
                onClick={() => setActiveTab('perf_gate')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'perf_gate'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Gauge className="w-4 h-4 text-blue-600" />
                <span>Performance ({currentTerminal.name})</span>
              </button>
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'pipeline'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                <span>JO Pipeline</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Fullscreen TV Monitor button */}
        <button
          onClick={onOpenFullscreen}
          title="Buka Monitor Layar Penuh (16:9 Floor TV)"
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors"
        >
          <Tv className="w-4 h-4" />
          <span className="hidden sm:inline">16:9 Monitor</span>
        </button>

        {/* Connection Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span>{isOnline ? 'Cloud Synced' : 'Offline Draft Mode'}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative cursor-pointer p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>

        {/* Terminal / Role Pill */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900 leading-tight">
              {currentTerminal.name}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {currentTerminal.role === 'SPV_QC'
                ? 'Supervisor'
                : currentTerminal.role === 'QUALITY_MASTER'
                ? 'Master Admin'
                : 'Operator'}
            </div>
          </div>

          <button
            onClick={onExitTerminal}
            title="Ganti Terminal / Logout"
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
