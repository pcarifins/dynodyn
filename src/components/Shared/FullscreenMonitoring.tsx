import React, { useState, useEffect } from 'react';
import { JobOrder, Workstation } from '../../types';
import { db } from '../../services/db';
import { 
  Tv, 
  X, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Gauge, 
  Flame, 
  Zap,
  Maximize2
} from 'lucide-react';

interface FullscreenMonitoringProps {
  onClose: () => void;
}

export const FullscreenMonitoring: React.FC<FullscreenMonitoringProps> = ({ onClose }) => {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(() => db.getJobOrders());
  const [workstations, setWorkstations] = useState<Workstation[]>(() => db.getWorkstations());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return db.subscribe(() => {
      setJobOrders(db.getJobOrders());
      setWorkstations(db.getWorkstations());
    });
  }, []);

  const testingJobs = jobOrders.filter((j) => j.status === 'IN_PERFORMANCE');
  const queuedJobs = jobOrders.filter((j) => j.status === 'ALLOCATED');
  const waitingGltJobs = jobOrders.filter((j) => j.status === 'WAITING_GLT');

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0f17] text-white flex flex-col justify-between p-6 sm:p-8 font-sans overflow-hidden">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-bold text-2xl shadow-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                DynoDyn Shop Floor Operations
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE SYNCHRONIZED</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              16:9 Central Quality Gate & Testing Bay Telemetry Display
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-mono font-bold tracking-wider text-slate-200">
              {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-mono">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-colors cursor-pointer"
            title="Keluar dari Fullscreen"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Floor Grid: 8 Workstation Nodes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6 flex-1 overflow-y-auto">
        {workstations.map((station) => {
          const activeJo = jobOrders.find((j) => j.id === station.activeJoId || (j.approvedWorkstationId === station.id && j.status === 'IN_PERFORMANCE'));
          const queueItems = station.currentQueue
            .map((id) => jobOrders.find((j) => j.id === id || j.joNumber === id))
            .filter(Boolean) as JobOrder[];

          const isTesting = station.operationalState === 'TESTING' || !!activeJo;
          const isEnabled = station.availabilityState === 'ENABLED';

          return (
            <div
              key={station.id}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
                !isEnabled
                  ? 'bg-red-950/30 border-red-800/80'
                  : isTesting
                  ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg shadow-amber-950/20'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div>
                {/* Node Title */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-slate-800 font-mono font-bold text-xs flex items-center justify-center text-slate-200">
                      {station.id}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-100">{station.name}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">{station.type}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      !isEnabled
                        ? 'bg-red-500 text-white'
                        : isTesting
                        ? 'bg-amber-500 text-black font-extrabold animate-pulse'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {!isEnabled ? station.availabilityState : isTesting ? 'TESTING' : 'IDLE'}
                  </span>
                </div>

                {/* Active Testing Detail */}
                {isTesting && activeJo ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-extrabold text-amber-400">
                        {activeJo.joNumber}
                      </span>
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
                        ACTIVE TEST
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-slate-200 line-clamp-1">
                      {activeJo.componentModel}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Assembler: <strong className="text-slate-200">{activeJo.assembler}</strong>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Elapsed:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {activeJo.agingHours.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 py-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    Line Siap / Menunggu
                  </div>
                )}
              </div>

              {/* Station Queue Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Antrean: <strong className="text-slate-200">{queueItems.length} JO</strong></span>
                {queueItems[0] && (
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[100px]">
                    Next: {queueItems[0].joNumber}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom KPI Ticker */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-slate-500">Active WIP:</span>{' '}
            <strong className="text-slate-200">{testingJobs.length + queuedJobs.length} Units</strong>
          </div>
          <div>
            <span className="text-slate-500">In Test Bench:</span>{' '}
            <strong className="text-amber-400">{testingJobs.length} Running</strong>
          </div>
          <div>
            <span className="text-slate-500">GLT Inbound:</span>{' '}
            <strong className="text-sky-400">{waitingGltJobs.length} Units</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span>Asia/Makassar Shift (07:30 - 16:30)</span>
          <span>•</span>
          <span>Dual SLA Guard Active</span>
        </div>
      </div>
    </div>
  );
};
