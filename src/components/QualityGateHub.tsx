import React, { useState } from 'react';
import { TerminalConfig } from '../types';
import { TERMINALS } from '../data/seedData';
import { 
  Shield, 
  Settings, 
  Gauge, 
  Wrench, 
  CheckCircle2, 
  Search, 
  Tv, 
  ArrowRight,
  Sparkles,
  Server,
  Layers,
  Laptop
} from 'lucide-react';

interface QualityGateHubProps {
  onSelectTerminal: (terminal: TerminalConfig) => void;
  onOpenFullscreen: () => void;
}

export const QualityGateHub: React.FC<QualityGateHubProps> = ({
  onSelectTerminal,
  onOpenFullscreen
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCode, setQuickCode] = useState('');
  const [quickCodeError, setQuickCodeError] = useState('');

  const filteredTerminals = TERMINALS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickCodeGo = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickCodeError('');
    const code = quickCode.trim().toUpperCase();
    if (!code) return;

    const match = TERMINALS.find(
      (t) =>
        t.id.toUpperCase() === code ||
        t.code.toUpperCase() === code ||
        t.name.toUpperCase().includes(code)
    );

    if (match) {
      onSelectTerminal(match);
    } else {
      setQuickCodeError(`Terminal '${code}' tidak ditemukan. Coba: D1, TB1, SPV, QM, GLT-E`);
    }
  };

  const governanceTerminals = filteredTerminals.filter((t) => t.group === 'GOVERNANCE');
  const engineTerminals = filteredTerminals.filter((t) => t.group === 'ENGINE');
  const gltTerminals = filteredTerminals.filter((t) => t.group === 'GLT');
  const benchTerminals = filteredTerminals.filter((t) => t.group === 'POWER_TRAIN' || t.group === 'CYLINDER');

  const renderIcon = (type: string) => {
    switch (type) {
      case 'shield':
        return <Shield className="w-3.5 h-3.5 text-gray-700" />;
      case 'settings':
        return <Settings className="w-3.5 h-3.5 text-gray-700" />;
      case 'gauge':
        return <Gauge className="w-3.5 h-3.5 text-amber-700" />;
      case 'check-circle':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />;
      case 'wrench':
        return <Wrench className="w-3.5 h-3.5 text-blue-700" />;
      case 'cylinder':
        return <Layers className="w-3.5 h-3.5 text-cyan-700" />;
      case 'truck':
        return <Laptop className="w-3.5 h-3.5 text-indigo-700" />;
      default:
        return <Server className="w-3.5 h-3.5 text-gray-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header Section */}
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xl shadow-xs">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-gray-950">DynoDyn Quality Gate</h1>
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
                  12 Workstations
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Industrial Station Control Hub • Pilih terminal untuk otorisasi akses
              </p>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari D1, TB1, SPV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
              />
            </div>
            <button
              onClick={() => {
                const sample = TERMINALS[Math.floor(Math.random() * TERMINALS.length)];
                setQuickCode(sample.id);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 rounded-xl text-xs font-medium transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Mode Badge / ID</span>
            </button>
            <button
              onClick={onOpenFullscreen}
              title="16:9 Big Screen Operations Board"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-medium transition-colors shadow-xs"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">16:9 Monitor</span>
            </button>
          </div>
        </div>

        {/* Workstation Grid Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* 1. COMMAND & GOVERNANCE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <Shield className="w-4 h-4 text-slate-700" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    COMMAND & GOVERNANCE
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  2 Roles
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {governanceTerminals.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTerminal(t)}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50/70 hover:bg-white hover:border-slate-300 border border-slate-200/80 rounded-xl text-center group transition-all duration-150 cursor-pointer hover:shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-full border border-slate-200 bg-white flex flex-col items-center justify-center shadow-2xs mb-2.5 group-hover:scale-105 transition-transform">
                      <span className="font-bold text-base text-slate-900">{t.id}</span>
                      <div className="mt-0.5">{renderIcon(t.iconType)}</div>
                    </div>
                    <span className="font-semibold text-sm text-slate-900">{t.name}</span>
                    <span className="text-[10px] tracking-wider text-slate-400 uppercase font-mono mt-0.5">
                      {t.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
              Akses kontrol otorisasi QA, audit kepatuhan & konfigurasi master data.
            </p>
          </div>

          {/* 2. ENGINE DYNAMOMETER BAYS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 rounded-lg">
                    <Gauge className="w-4 h-4 text-amber-600" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    ENGINE DYNAMOMETER BAYS
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  3 Bays • MRI-B
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {engineTerminals.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTerminal(t)}
                    className="flex flex-col items-center justify-center p-3.5 bg-slate-50/70 hover:bg-white hover:border-amber-300 border border-slate-200/80 rounded-xl text-center group transition-all duration-150 cursor-pointer hover:shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-full border border-slate-200 bg-white flex flex-col items-center justify-center shadow-2xs mb-2 group-hover:scale-105 transition-transform">
                      <span className="font-bold text-sm text-slate-900">{t.id}</span>
                      <div className="mt-0.5">{renderIcon(t.iconType)}</div>
                    </div>
                    <span className="font-semibold text-xs text-slate-900">{t.name}</span>
                    <span className="text-[10px] tracking-wider text-slate-400 uppercase font-mono mt-0.5">
                      {t.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
              Uji performa daya, torsi, temperatur gas buang, dan tekanan blowby mesin.
            </p>
          </div>

          {/* 3. GLT INSPECTION GATES */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    GLT INSPECTION GATES
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  MRI-A
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {gltTerminals.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTerminal(t)}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50/70 hover:bg-white hover:border-emerald-300 border border-slate-200/80 rounded-xl text-center group transition-all duration-150 cursor-pointer hover:shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-full border border-slate-200 bg-white flex flex-col items-center justify-center shadow-2xs mb-2.5 group-hover:scale-105 transition-transform">
                      <span className="font-bold text-sm text-slate-900">{t.id}</span>
                      <div className="mt-0.5">{renderIcon(t.iconType)}</div>
                    </div>
                    <span className="font-semibold text-sm text-slate-900">{t.name}</span>
                    <span className="text-[10px] tracking-wider text-slate-400 uppercase font-mono mt-0.5">
                      {t.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
              Gerbang pemeriksaan awal sebelum unit dialokasikan ke dyno / test bench.
            </p>
          </div>

          {/* 4. POWER TRAIN & BENCH STATIONS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Wrench className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    POWER TRAIN & BENCH STATIONS
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  5 Benches • MRI-B
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {benchTerminals.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTerminal(t)}
                    className="flex flex-col items-center justify-center p-3 bg-slate-50/70 hover:bg-white hover:border-blue-300 border border-slate-200/80 rounded-xl text-center group transition-all duration-150 cursor-pointer hover:shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-full border border-slate-200 bg-white flex flex-col items-center justify-center shadow-2xs mb-1.5 group-hover:scale-105 transition-transform">
                      <span className="font-bold text-xs text-slate-900">{t.id}</span>
                      <div className="mt-0.5">{renderIcon(t.iconType)}</div>
                    </div>
                    <span className="font-semibold text-xs text-slate-900 truncate w-full">{t.name}</span>
                    <span className="text-[9px] tracking-wider text-slate-400 uppercase font-mono mt-0.5 truncate w-full">
                      {t.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
              Uji transmisi, konverter torsi, hidrolik silinder & motor bench portabel.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Status & Quick Code Bar */}
      <footer className="max-w-7xl mx-auto w-full mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <form onSubmit={handleQuickCodeGo} className="flex items-center gap-2">
          <span className="font-mono text-slate-500 font-medium">Quick Code:</span>
          <input
            type="text"
            placeholder="KETIK D1, TB1, SPV.."
            value={quickCode}
            onChange={(e) => {
              setQuickCode(e.target.value);
              setQuickCodeError('');
            }}
            className="w-44 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono uppercase focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Go
          </button>
          {quickCodeError && (
            <span className="text-red-600 text-xs ml-2">{quickCodeError}</span>
          )}
        </form>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-700">12 Industrial Nodes Synchronized</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-400">Preset b0 • React Aria</span>
        </div>
      </footer>
    </div>
  );
};
