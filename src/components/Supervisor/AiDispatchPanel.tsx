import React, { useState } from 'react';
import { JobOrder, Workstation, AiRecommendation, AiDispatchWeights } from '../../types';
import { db } from '../../services/db';
import { calculateAiRecommendations, PRESET_WEIGHTS } from '../../services/aiDispatch';
import { 
  Sparkles, 
  RotateCw, 
  Check, 
  AlertTriangle, 
  Clock, 
  Gauge, 
  CheckCircle2, 
  Sliders, 
  Zap, 
  Search,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface AiDispatchPanelProps {
  terminalId: string;
}

export const AiDispatchPanel: React.FC<AiDispatchPanelProps> = ({ terminalId }) => {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(() => db.getJobOrders());
  const [workstations, setWorkstations] = useState<Workstation[]>(() => db.getWorkstations());
  const [weights, setWeights] = useState<AiDispatchWeights>(() => db.getAiWeights());
  const [filterType, setFilterType] = useState<'ALL' | 'ENGINE' | 'POWER_TRAIN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);

  React.useEffect(() => {
    return db.subscribe(() => {
      setJobOrders(db.getJobOrders());
      setWorkstations(db.getWorkstations());
      setWeights(db.getAiWeights());
    });
  }, []);

  const recommendations = calculateAiRecommendations(jobOrders, workstations, weights);

  const filteredRecs = recommendations.filter((r) => {
    const jo = jobOrders.find((j) => j.id === r.joId || j.joNumber === r.joNumber);
    if (!jo) return false;

    if (filterType === 'ENGINE' && !jo.componentCategory.toLowerCase().includes('engine')) return false;
    if (filterType === 'POWER_TRAIN' && jo.componentCategory.toLowerCase().includes('engine')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.joNumber.toLowerCase().includes(q) ||
        jo.componentModel.toLowerCase().includes(q) ||
        r.recommendedWorkstationName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApplyAllocation = async (rec: AiRecommendation) => {
    const res = await db.allocateJobOrder(rec.joId, rec.recommendedWorkstationId, terminalId);
    if (!res.success) {
      alert(res.error || 'Gagal menerapkan alokasi');
    }
  };

  const handleApplyAll = async () => {
    let successCount = 0;
    for (const rec of filteredRecs) {
      const res = await db.allocateJobOrder(rec.joId, rec.recommendedWorkstationId, terminalId);
      if (res.success) successCount++;
    }
    alert(`Berhasil menerapkan ${successCount} alokasi cerdas AI.`);
  };

  const handlePresetSelect = (presetKey: string) => {
    if (PRESET_WEIGHTS[presetKey]) {
      db.updateAiWeights(PRESET_WEIGHTS[presetKey], terminalId);
    }
  };

  const criticalCount = recommendations.filter((r) => r.criticalSlaRisk).length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Neural-Dispatch AI Engine Hero Card (Screenshot 19) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700 shadow-2xs">
              <Sparkles className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  DynoDyn Neural-Dispatch AI Engine
                </h2>
                <span className="bg-slate-100 text-slate-700 text-xs font-mono font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                  v4.2 Heuristic Optimizer
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Live Heuristics Active</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Analisis cerdas multi-variabel untuk alokasi workstation: memprioritaskan <strong>critical aging (&gt;36 jam)</strong>, mencegah penumpukan antrean (load balancing), serta meminimalisir waktu bongkar-pasang adaptor (tooling changeover).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              onClick={() => setJobOrders(db.getJobOrders())}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Hitung Ulang AI</span>
            </button>
            <button
              onClick={handleApplyAll}
              disabled={filteredRecs.length === 0}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Semua Rekomendasi</span>
            </button>
          </div>
        </div>

        {/* 4 Mini KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Critical SLA Risk (&gt;36h)</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {criticalCount}
            </div>
            <span className="text-[11px] font-semibold text-red-600 mt-0.5 block">
              Wajib diprioritaskan
            </span>
          </div>

          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Antrean Menunggu</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {recommendations.length}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              dari {jobOrders.length} JO Masuk
            </span>
          </div>

          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Estimasi Waktu Dihemat</span>
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-700">
              +150m
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Via Tooling Batching
            </span>
          </div>

          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Akurasi Rekomendasi</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              98.2%
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Confidence Score
            </span>
          </div>
        </div>

        {/* Live Workstation Load & Capacity Balancing (Screenshot 19) */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Live Workstation Load & Capacity Balancing ({workstations.length} Nodes)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              3 Dyno • 5 Bench
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {workstations.map((station) => {
              const load = station.currentLoadPercent || (station.currentQueue.length * 25);
              const colorClass =
                load > 80 ? 'bg-red-500' : load > 60 ? 'bg-amber-500' : 'bg-emerald-500';

              return (
                <div
                  key={station.id}
                  className="bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{station.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{station.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Utilisasi:</span>
                    <span className="font-mono font-bold text-slate-800">{load}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${colorClass} rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(100, load)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preset Weights & Recommendation Cards (Screenshot 18) */}
      <div className="space-y-4">
        {/* Preset Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => handlePresetSelect('SLA_FIRST')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                weights.activePreset === 'SLA_FIRST'
                  ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-red-500" />
              <span>SLA & Aging-First</span>
            </button>

            <button
              onClick={() => handlePresetSelect('QUEUE_BALANCE')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                weights.activePreset === 'QUEUE_BALANCE'
                  ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>Queue Load Balancing</span>
            </button>

            <button
              onClick={() => handlePresetSelect('THROUGHPUT_FIRST')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                weights.activePreset === 'THROUGHPUT_FIRST'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span>Tooling Batch</span>
            </button>

            <span className="text-slate-300 mx-1 hidden sm:inline">|</span>

            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semua ({recommendations.length})
            </button>
            <button
              onClick={() => setFilterType('ENGINE')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterType === 'ENGINE'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Engine (Dyno)
            </button>
            <button
              onClick={() => setFilterType('POWER_TRAIN')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterType === 'POWER_TRAIN'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Power Train (Bench)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari JO, model, line..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* List of Recommendation Cards (Screenshot 18) */}
        {filteredRecs.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
            Tidak ada JO yang memerlukan alokasi AI saat ini. Semua JO telah teralokasikan.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecs.map((rec) => {
              const jo = jobOrders.find((j) => j.id === rec.joId || j.joNumber === rec.joNumber);
              if (!jo) return null;

              const isEngine = jo.componentCategory.toLowerCase().includes('engine');
              const agingRatio = jo.agingHours / (jo.slaLimitHours || 48);
              const agingPercent = Math.min(100, Math.round(agingRatio * 100));

              return (
                <div
                  key={rec.joId}
                  className="bg-white rounded-3xl border border-red-100/80 p-6 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 hover:border-slate-300 transition-all"
                >
                  {/* Left Column: JO Specs & Aging Progress */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-base text-slate-950">
                        {rec.joNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isEngine
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isEngine ? 'ENGINE' : 'POWER TRAIN'}
                      </span>
                      {rec.criticalSlaRisk && (
                        <span className="bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          <span>Critical SLA Risk</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {jo.componentModel}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {jo.unitModel} • Assembler: <strong className="text-slate-800">{jo.assembler}</strong>
                      </p>
                    </div>

                    {/* Aging Bar */}
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span className="font-bold text-slate-700">Aging: {jo.agingHours.toFixed(1)}h</span>
                        <span className="text-[11px] text-slate-400">Batas SLA: {jo.slaLimitHours || 48}h</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-300"
                          style={{ width: `${agingPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Workstation Recommendation Box (Screenshot 18) */}
                  <div className="lg:w-96 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>REKOMENDASI LINE AI</span>
                        </span>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          {rec.fitPercentage}% Fit
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-slate-950">
                            {rec.recommendedWorkstationName}
                          </span>
                          <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Antrean #{rec.queuePosition}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          Durasi Uji: ~{rec.estimatedDurationMinutes}m
                        </span>
                      </div>

                      {/* Insight Notice */}
                      <div className="mt-2.5 p-2 bg-amber-50/80 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 leading-snug">
                        💡 {rec.priorityNote}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-700">
                        Hemat Waktu: +{rec.savedTimeMinutes}m
                      </span>
                      <button
                        onClick={() => handleApplyAllocation(rec)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Terapkan Alokasi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
