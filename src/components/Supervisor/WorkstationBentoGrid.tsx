import React, { useState } from 'react';
import { JobOrder, Workstation, TerminalRole } from '../../types';
import { db } from '../../services/db';
import { isWorkstationCompatible } from '../../services/aiDispatch';
import { 
  ArrowUpDown, 
  ArrowLeftRight, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Clock, 
  Plus, 
  Trash2, 
  ShieldAlert,
  ChevronUp,
  ChevronDown,
  Layers,
  Settings,
  X
} from 'lucide-react';

interface WorkstationBentoGridProps {
  terminalId: string;
}

export const WorkstationBentoGrid: React.FC<WorkstationBentoGridProps> = ({ terminalId }) => {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(() => db.getJobOrders());
  const [workstations, setWorkstations] = useState<Workstation[]>(() => db.getWorkstations());
  const [productFilter, setProductFilter] = useState<'ALL' | 'ENGINE' | 'POWER_TRAIN'>('ALL');

  // Modals state
  const [transferJo, setTransferJo] = useState<JobOrder | null>(null);
  const [transferTargetWs, setTransferTargetWs] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  
  const [availabilityWs, setAvailabilityWs] = useState<Workstation | null>(null);
  const [availabilityState, setAvailabilityState] = useState<'ENABLED' | 'BREAKDOWN' | 'MAINTENANCE'>('ENABLED');
  const [availabilityReason, setAvailabilityReason] = useState<string>('');

  React.useEffect(() => {
    return db.subscribe(() => {
      setJobOrders(db.getJobOrders());
      setWorkstations(db.getWorkstations());
    });
  }, []);

  const filteredStations = workstations.filter((ws) => {
    if (productFilter === 'ENGINE') return ws.category === 'ENGINE';
    if (productFilter === 'POWER_TRAIN') return ws.category === 'POWER_TRAIN' || ws.category === 'CYLINDER';
    return true;
  });

  const unallocatedJobs = jobOrders.filter(
    (j) => j.status === 'READY_FOR_ALLOCATION' && !j.approvedWorkstationId
  );

  const handleMoveUp = (ws: Workstation, index: number) => {
    if (index <= 0) return;
    const newQueue = [...ws.currentQueue];
    const temp = newQueue[index - 1];
    newQueue[index - 1] = newQueue[index];
    newQueue[index] = temp;
    db.reorderWorkstationQueue(ws.id, newQueue, terminalId);
  };

  const handleMoveDown = (ws: Workstation, index: number) => {
    if (index >= ws.currentQueue.length - 1) return;
    const newQueue = [...ws.currentQueue];
    const temp = newQueue[index + 1];
    newQueue[index + 1] = newQueue[index];
    newQueue[index] = temp;
    db.reorderWorkstationQueue(ws.id, newQueue, terminalId);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferJo || !transferTargetWs) return;

    if (transferJo.status === 'IN_PERFORMANCE' && !transferReason.trim()) {
      alert('Alasan transfer wajib diisi untuk Job Order yang sedang aktif diuji (Section 17 Controlled Transfer).');
      return;
    }

    const res = await db.controlledTransferJobOrder(
      transferJo.id,
      transferTargetWs,
      transferReason.trim() || 'Manual supervisor transfer',
      terminalId
    );

    if (res.success) {
      setTransferJo(null);
      setTransferTargetWs('');
      setTransferReason('');
    } else {
      alert(res.error || 'Gagal melakukan transfer');
    }
  };

  const handleExecuteAvailabilityChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availabilityWs) return;

    if (availabilityState !== 'ENABLED' && !availabilityReason.trim()) {
      alert('Alasan wajib diisi untuk status Breakdown atau Maintenance (Section 16).');
      return;
    }

    const res = await db.setWorkstationAvailability(
      availabilityWs.id,
      availabilityState,
      availabilityReason.trim(),
      terminalId
    );

    if (res.success) {
      setAvailabilityWs(null);
      setAvailabilityReason('');
    } else {
      alert(res.error || 'Gagal mengubah ketersediaan workstation');
    }
  };

  const totalAssignedJobsCount = workstations.reduce((acc, w) => acc + w.currentQueue.length, 0);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Bar matching Screenshot 21 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Performance Test Area
            </h1>
            <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
              SUPERVISOR DISPATCHER
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign Job Orders ke Line Test Bench & atur urutan prioritas pengujian.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Product:</span>
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
        </div>
      </div>

      {/* Capacity & Bento Summary Pills */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
        <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <span>Line Capacity & Queues: <strong>{workstations.length} Lines</strong></span>
        </span>
        <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Current Test Job: <strong>{totalAssignedJobsCount} Units</strong></span>
        </span>
        {unallocatedJobs.length > 0 && (
          <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Unallocated Pool: <strong>{unallocatedJobs.length} Units Menunggu</strong></span>
          </span>
        )}
      </div>

      {/* Bento Grid (Screenshot 21) */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Line Capacity & Workstation Bento Grid</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kapasitas dan antrean Job Order per line. Gunakan panah urutan atau tombol transfer untuk memindahkan JO antar-line.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((station) => {
            const queueItems = station.currentQueue
              .map((id) => jobOrders.find((j) => j.id === id || j.joNumber === id))
              .filter(Boolean) as JobOrder[];

            const isAvailable = station.availabilityState === 'ENABLED';

            return (
              <div
                key={station.id}
                className={`bg-white rounded-3xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                  !isAvailable
                    ? 'border-red-300 bg-red-50/20'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Station Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs font-mono text-slate-800">
                        {station.id}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-950 flex items-center gap-1.5">
                          <span>{station.name}</span>
                          {!isAvailable && (
                            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded-sm uppercase">
                              {station.availabilityState}
                            </span>
                          )}
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          {station.type === 'Dyno' ? 'Engine Test Bay' : 'Power Train Test Bay'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                        {queueItems.length} JO Antre
                      </span>
                      <button
                        onClick={() => {
                          setAvailabilityWs(station);
                          setAvailabilityState(station.availabilityState);
                          setAvailabilityReason(station.breakdownReason || '');
                        }}
                        title="Ubah Status Ketersediaan (Breakdown/Maintenance)"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Station Breakdown Notice if any */}
                  {!isAvailable && (
                    <div className="mt-3 p-2.5 bg-red-100/70 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                      <div>
                        <span className="font-bold">Workstation {station.availabilityState}:</span>{' '}
                        <span>{station.breakdownReason || 'Dalam penanganan teknisi'}</span>
                      </div>
                    </div>
                  )}

                  {/* Queued Cards List */}
                  <div className="mt-4 space-y-2.5">
                    {queueItems.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                        Antrean kosong
                      </div>
                    ) : (
                      queueItems.map((jo, qIdx) => {
                        const isFirst = qIdx === 0;
                        const isLast = qIdx === queueItems.length - 1;
                        const isTesting = jo.status === 'IN_PERFORMANCE';
                        const isOverdue = jo.agingHours > 4;

                        return (
                          <div
                            key={jo.id}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              isTesting
                                ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300'
                                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {qIdx + 1}
                                </span>
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono font-extrabold text-xs text-slate-950">
                                      {jo.joNumber}
                                    </span>
                                    {jo.isUrgent && (
                                      <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-bold bg-amber-500 text-white uppercase">
                                        Urgent
                                      </span>
                                    )}
                                    {isFirst && !isTesting && (
                                      <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-bold bg-slate-200 text-slate-800 uppercase">
                                        Next
                                      </span>
                                    )}
                                    {isTesting && (
                                      <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-bold bg-amber-600 text-white uppercase animate-pulse">
                                        Testing
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-semibold text-slate-800 mt-0.5">
                                    {jo.componentModel}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                                    <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <span>Aging: {jo.agingHours.toFixed(0)}h {Math.round((jo.agingHours % 1) * 60)}m</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons: Transfer, Up, Down */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setTransferJo(jo);
                                    setTransferTargetWs('');
                                  }}
                                  title="Transfer ke Line Lain (Controlled Transfer)"
                                  className="p-1 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                >
                                  <ArrowLeftRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  disabled={isFirst}
                                  onClick={() => handleMoveUp(station, qIdx)}
                                  title="Prioritaskan Ke Atas"
                                  className="p-1 text-slate-400 hover:text-slate-900 hover:bg-white disabled:opacity-20 rounded-lg transition-colors cursor-pointer"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  disabled={isLast}
                                  onClick={() => handleMoveDown(station, qIdx)}
                                  title="Pindahkan Ke Bawah"
                                  className="p-1 text-slate-400 hover:text-slate-900 hover:bg-white disabled:opacity-20 rounded-lg transition-colors cursor-pointer"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer Quick Assign from Unallocated Pool */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Utilisasi: {station.currentLoadPercent || (queueItems.length * 25)}%</span>
                    {unallocatedJobs.length > 0 && isAvailable && (
                      <button
                        onClick={async () => {
                          const compatibleJo = unallocatedJobs.find((j) =>
                            isWorkstationCompatible(j.componentCategory, station)
                          );
                          if (compatibleJo) {
                            const res = await db.allocateJobOrder(compatibleJo.id, station.id, terminalId);
                            if (!res.success) {
                              alert(res.error || 'Gagal mengalokasikan JO');
                            }
                          } else {
                            alert(`Tidak ada JO yang kompatibel di Unallocated Pool untuk ${station.name}`);
                          }
                        }}
                        className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tarik JO</span>
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transfer Modal (Section 17 Controlled Transfer) */}
      {transferJo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Controlled Transfer JO</h3>
                  <p className="text-xs text-slate-500">Pindahkan alokasi unit antar line test bench</p>
                </div>
              </div>
              <button
                onClick={() => setTransferJo(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{transferJo.joNumber} - {transferJo.componentModel}</div>
                <div className="text-slate-500 mt-0.5">Kategori: {transferJo.componentCategory}</div>
                {transferJo.status === 'IN_PERFORMANCE' && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-semibold">
                    ⚠️ JO ini sedang aktif diuji. Transfer akan meng-ABORT attempt aktif dengan alasan wajib dicatat (Section 17).
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Workstation Tujuan *
                </label>
                <select
                  required
                  value={transferTargetWs}
                  onChange={(e) => setTransferTargetWs(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">-- Pilih Line Tujuan --</option>
                  {workstations
                    .filter((w) => w.id !== transferJo.approvedWorkstationId && isWorkstationCompatible(transferJo.componentCategory, w))
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.availabilityState}) - Antrean: {w.currentQueue.length} JO
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Alasan Pemindahan / Transfer {transferJo.status === 'IN_PERFORMANCE' && '*'}
                </label>
                <textarea
                  rows={2}
                  required={transferJo.status === 'IN_PERFORMANCE'}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Workstation load balancing / Tooling changeover optimization..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferJo(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Konfirmasi Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workstation Availability Modal (Breakdown / Maintenance - Section 16) */}
      {availabilityWs && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Workstation Status: {availabilityWs.name}</h3>
                  <p className="text-xs text-slate-500">Kelola ketersediaan operasional bay/bench</p>
                </div>
              </div>
              <button
                onClick={() => setAvailabilityWs(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAvailabilityChange} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Status Ketersediaan *
                </label>
                <select
                  value={availabilityState}
                  onChange={(e) => setAvailabilityState(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                >
                  <option value="ENABLED">ENABLED (Siap Beroperasi)</option>
                  <option value="BREAKDOWN">BREAKDOWN (Kerusakan Mesin)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Pemeliharaan Berkala)</option>
                </select>
              </div>

              {availabilityState !== 'ENABLED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Alasan Kerusakan / Perawatan *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={availabilityReason}
                    onChange={(e) => setAvailabilityReason(e.target.value)}
                    placeholder="e.g. Masalah pompa hidrolik supply / Penggantian oli dyno..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Section 16: Alasan wajib dicatat ke dalam audit log dan dashboard status.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAvailabilityWs(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Simpan Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
