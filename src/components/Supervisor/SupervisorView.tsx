import React, { useState } from 'react';
import { JobOrder, TerminalConfig, Workstation, MriRecord } from '../../types';
import { db } from '../../services/db';
import { AiDispatchPanel } from './AiDispatchPanel';
import { WorkstationBentoGrid } from './WorkstationBentoGrid';
import { SlaConfigModal } from './SlaConfigModal';
import { JoPipelineTable } from '../Shared/JoPipelineTable';
import { CertificateModal } from '../Shared/CertificateModal';
import { MriModal } from '../Shared/MriModal';
import { 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  RotateCcw, 
  XCircle, 
  Edit3,
  Calendar,
  BarChart3,
  Flame,
  FileSpreadsheet,
  Download
} from 'lucide-react';

interface SupervisorViewProps {
  currentTerminal: TerminalConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({
  currentTerminal,
  activeTab,
  setActiveTab
}) => {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(() => db.getJobOrders());
  const [workstations, setWorkstations] = useState<Workstation[]>(() => db.getWorkstations());
  const [timeFilter, setTimeFilter] = useState<'MONTH' | 'YEAR' | 'ALL'>('MONTH');
  const [productFilter, setProductFilter] = useState<'ALL' | 'ENGINE' | 'POWER_TRAIN'>('ALL');

  // Modals state
  const [viewCertJo, setViewCertJo] = useState<JobOrder | null>(null);
  const [viewMriRecord, setViewMriRecord] = useState<MriRecord | null>(null);
  const [reopenTargetJo, setReopenTargetJo] = useState<JobOrder | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenStage, setReopenStage] = useState<'GLT' | 'PERFORMANCE'>('PERFORMANCE');
  const [cancelTargetJo, setCancelTargetJo] = useState<JobOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  React.useEffect(() => {
    return db.subscribe(() => {
      setJobOrders(db.getJobOrders());
      setWorkstations(db.getWorkstations());
    });
  }, []);

  const urgentTasksCount = jobOrders.filter((j) => j.isUrgent && j.status !== 'DONE' && j.status !== 'CANCELLED').length;
  const finishGltCount = jobOrders.filter((j) => j.finalGltResult === 'GOOD').length;
  const finishPerfCount = jobOrders.filter((j) => j.status === 'DONE').length;
  const activeWipCount = jobOrders.filter((j) => j.status !== 'DONE' && j.status !== 'CANCELLED').length;

  const nextGltJo = jobOrders.find((j) => j.status === 'WAITING_GLT');
  const nextPerfJo = jobOrders.find((j) => j.status === 'ALLOCATED' && j.isUrgent) || jobOrders.find((j) => j.status === 'ALLOCATED');

  const handleExecuteReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenTargetJo || !reopenReason.trim()) return;

    const res = await db.reopenJobOrder(reopenTargetJo.id, reopenStage, reopenReason.trim(), currentTerminal.id);
    if (res.success) {
      setReopenTargetJo(null);
      setReopenReason('');
    } else {
      alert(res.error || 'Gagal reopen Job Order');
    }
  };

  const handleExecuteCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTargetJo || !cancelReason.trim()) return;

    const res = await db.cancelJobOrder(cancelTargetJo.id, cancelReason.trim(), currentTerminal.id);
    if (res.success) {
      setCancelTargetJo(null);
      setCancelReason('');
    } else {
      alert(res.error || 'Gagal membatalkan Job Order');
    }
  };

  const handleExportCsv = () => {
    const headers = ['JO Number', 'Component Category', 'Model', 'Unit', 'Assembler', 'Status', 'Aging (Hours)', 'Result'];
    const rows = jobOrders.map((j) => [
      j.joNumber,
      j.componentCategory,
      `"${j.componentModel}"`,
      `"${j.unitModel}"`,
      j.assembler,
      j.status,
      j.agingHours,
      j.finalPerformanceResult || j.finalGltResult || 'IN_PROGRESS'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DynoDyn_Quality_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Tab: Real-time Operations Dashboard (Screenshot 20) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Dashboard Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Real-time Operations
                </h1>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Supervisor View
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Real-time overview of GLT, Performance Testing, Lead time & Aging.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Time Range Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setTimeFilter('MONTH')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'MONTH' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setTimeFilter('YEAR')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'YEAR' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  This Year
                </button>
                <button
                  onClick={() => setTimeFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Time
                </button>
              </div>

              {/* Product Range Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setProductFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    productFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setProductFilter('ENGINE')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    productFilter === 'ENGINE' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Engine
                </button>
                <button
                  onClick={() => setProductFilter('POWER_TRAIN')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    productFilter === 'POWER_TRAIN' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Power Train
                </button>
              </div>

              <button
                onClick={handleExportCsv}
                title="Ekspor Laporan CSV"
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-semibold"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Urgent Priority Tasks Alert Banner (Screenshot 20) */}
          {urgentTasksCount > 0 && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-amber-950">
                    {urgentTasksCount} Urgent Priority Tasks in Performance Gate
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Immediate testing required to meet delivery SLA.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('ai_dispatch')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-end sm:self-auto"
              >
                <span>Open Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 4 Main KPI Cards (Screenshot 20) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Finish GLT Qty */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Finish GLT Qty</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  Gate 1
                </span>
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                  {finishGltCount}
                </span>
                <span className="text-xs font-semibold text-slate-500 ml-1.5">units</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                <span>Recorded this month</span>
              </div>
            </div>

            {/* Finish Dyno / Test Bench */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Finish Dyno / Test Bench</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Gate 2
                </span>
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                  {finishPerfCount}
                </span>
                <span className="text-xs font-semibold text-slate-500 ml-1.5">passed</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Passed Final Performance Test</span>
              </div>
            </div>

            {/* Leadtime Average */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Leadtime Average</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Cycle
                </span>
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                  0.2 hari
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span>GLT to Final Test completion</span>
              </div>
            </div>

            {/* Current Aging */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Current Aging</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  WIP
                </span>
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                  4.0 hari
                </span>
                <span className="text-xs font-semibold text-slate-500 ml-1">avg</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>{activeWipCount} Units Active in Process</span>
              </div>
            </div>
          </div>

          {/* Next in Queues Cards (Screenshot 20) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Next in GLT Queue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Next in GLT Queue
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {jobOrders.filter((j) => j.status === 'WAITING_GLT').length}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('pipeline')}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {nextGltJo ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-900 flex items-center justify-center shrink-0">
                      #1
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{nextGltJo.joNumber}</span>
                        <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded-md font-medium text-slate-700">
                          {nextGltJo.componentModel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Assembler: <strong className="text-slate-700">{nextGltJo.assembler}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <span className="font-bold text-slate-800">2 days</span>
                    <span className="block text-slate-400">Waiting in queue</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">Tidak ada antrean GLT</div>
              )}
            </div>

            {/* Next in Performance Queue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Next in Performance Queue
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {jobOrders.filter((j) => j.status === 'ALLOCATED').length}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('bento_grid')}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {nextPerfJo ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      #1
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{nextPerfJo.joNumber}</span>
                        {nextPerfJo.isUrgent && (
                          <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-sm uppercase">
                            Urgent
                          </span>
                        )}
                        <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded-md font-medium text-slate-700">
                          {nextPerfJo.componentModel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Line: <strong className="text-slate-700">{nextPerfJo.approvedWorkstationId || 'Bench 1'}</strong> (Seq #1)
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <span className="font-bold text-slate-800">2 days</span>
                    <span className="block text-emerald-600 font-semibold">GLT Finished</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">Tidak ada antrean Performance</div>
              )}
            </div>
          </div>

          {/* Embedded JO Pipeline Table directly beneath KPI cards (Section 23) */}
          <div className="pt-2">
            <JoPipelineTable
              jobOrders={jobOrders}
              role={currentTerminal.role}
              scope={productFilter}
              onViewCertificate={(jo) => setViewCertJo(jo)}
              onViewMri={(mriId) => {
                const mri = db.getMriRecords().find((m) => m.id === mriId);
                if (mri) setViewMriRecord(mri);
              }}
              onReopenJo={(jo) => setReopenTargetJo(jo)}
              onCancelJo={(jo) => setCancelTargetJo(jo)}
            />
          </div>
        </div>
      )}

      {/* Tab: AI Dispatch & Allocation */}
      {activeTab === 'ai_dispatch' && (
        <AiDispatchPanel terminalId={currentTerminal.id} />
      )}

      {/* Tab: Bento Grid Workstation Capacity */}
      {activeTab === 'bento_grid' && (
        <WorkstationBentoGrid terminalId={currentTerminal.id} />
      )}

      {/* Tab: JO Pipeline */}
      {activeTab === 'pipeline' && (
        <JoPipelineTable
          jobOrders={jobOrders}
          role={currentTerminal.role}
          onViewCertificate={(jo) => setViewCertJo(jo)}
          onViewMri={(mriId) => {
            const mri = db.getMriRecords().find((m) => m.id === mriId);
            if (mri) setViewMriRecord(mri);
          }}
          onReopenJo={(jo) => setReopenTargetJo(jo)}
          onCancelJo={(jo) => setCancelTargetJo(jo)}
        />
      )}

      {/* Tab: SLA Calendar */}
      {activeTab === 'sla_calendar' && (
        <SlaConfigModal terminalId={currentTerminal.id} />
      )}

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                Operational & Quality Analytics
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Deep dive lead times, first pass yield, workstation occupancy, and ETA precision.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Lengkap CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">First Pass Yield (FPY)</span>
              <div className="text-3xl font-extrabold text-slate-950">92.4%</div>
              <p className="text-xs text-slate-500">Persentase pengujian lolos tanpa masuk MRI-A atau MRI-B.</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SLA Achievement Rate</span>
              <div className="text-3xl font-extrabold text-emerald-700">96.8%</div>
              <p className="text-xs text-slate-500">Tercapai berdasarkan jam kerja shift operasional (Asia/Makassar).</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Dispatch Acceptance</span>
              <div className="text-3xl font-extrabold text-blue-700">98.2%</div>
              <p className="text-xs text-slate-500">Tingkat persetujuan rekomendasi alokasi oleh Supervisor.</p>
            </div>
          </div>
        </div>
      )}

      {/* Reopen JO Modal (Section 29) */}
      {reopenTargetJo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Reopen Job Order</h3>
                <p className="text-xs text-slate-500">{reopenTargetJo.joNumber} - {reopenTargetJo.componentModel}</p>
              </div>
            </div>

            <form onSubmit={handleExecuteReopen} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Restart Stage *
                </label>
                <select
                  value={reopenStage}
                  onChange={(e) => setReopenStage(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white"
                >
                  <option value="PERFORMANCE">Performance Gate (Prasyarat GLT Terpenuhi)</option>
                  <option value="GLT">GLT Gate (Mulai Ulang Dari Awal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Alasan Reopen (Wajib Audit) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Ditemukan rembesan saat mounting ke sasis unit..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Section 29: Membuka siklus baru (Cycle ID baru) dan secara otomatis membatalkan sertifikat lama.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReopenTargetJo(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Konfirmasi Reopen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel JO Modal (Section 28) */}
      {cancelTargetJo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-red-50 text-red-700 rounded-xl">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Cancel Job Order</h3>
                <p className="text-xs text-slate-500">{cancelTargetJo.joNumber}</p>
              </div>
            </div>

            <form onSubmit={handleExecuteCancel} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-800">
                ⚠️ Sesuai Section 28: Pembatalan hanya diizinkan sebelum Start GLT.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Alasan Pembatalan (Mandatory) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Duplikat Job Order fisik / Komponen dikembalikan ke subkon..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelTargetJo(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Konfirmasi Pembatalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {viewCertJo && (
        <CertificateModal
          isOpen={true}
          onClose={() => setViewCertJo(null)}
          certificate={db.getCertificate(viewCertJo.id)}
        />
      )}

      {/* MRI Modal */}
      {viewMriRecord && (
        <MriModal
          isOpen={true}
          onClose={() => setViewMriRecord(null)}
          mriRecord={viewMriRecord}
          terminalId={currentTerminal.id}
          role={currentTerminal.role}
          onSuccess={() => setJobOrders(db.getJobOrders())}
        />
      )}
    </div>
  );
};
