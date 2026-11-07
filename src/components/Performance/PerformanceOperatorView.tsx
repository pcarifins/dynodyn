import React, { useState } from 'react';
import { JobOrder, TerminalConfig, TestingAttempt, MriRecord, Workstation } from '../../types';
import { db } from '../../services/db';
import { JoPipelineTable } from '../Shared/JoPipelineTable';
import { ChecksheetModal } from '../Shared/ChecksheetModal';
import { MriModal } from '../Shared/MriModal';
import { CertificateModal } from '../Shared/CertificateModal';
import { 
  Play, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Gauge, 
  Wrench, 
  ArrowRight,
  ShieldAlert,
  Flame
} from 'lucide-react';

interface PerformanceOperatorViewProps {
  currentTerminal: TerminalConfig;
}

export const PerformanceOperatorView: React.FC<PerformanceOperatorViewProps> = ({ currentTerminal }) => {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(() => db.getJobOrders());
  const [workstations, setWorkstations] = useState<Workstation[]>(() => db.getWorkstations());
  const [activeChecksheetJo, setActiveChecksheetJo] = useState<JobOrder | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<TestingAttempt | null>(null);
  const [activeMriRecord, setActiveMriRecord] = useState<MriRecord | null>(null);
  const [viewCertJo, setViewCertJo] = useState<JobOrder | null>(null);

  React.useEffect(() => {
    return db.subscribe(() => {
      setJobOrders(db.getJobOrders());
      setWorkstations(db.getWorkstations());
    });
  }, []);

  const ws = workstations.find((w) => w.id === currentTerminal.id) || workstations[0];

  // Assigned to this workstation
  const assignedJobs = jobOrders.filter(
    (j) => j.approvedWorkstationId === ws.id && j.status !== 'DONE' && j.status !== 'CANCELLED'
  );

  // Incoming unassigned pool
  const incomingUnassigned = jobOrders.filter(
    (j) => j.status === 'READY_FOR_ALLOCATION' && !j.approvedWorkstationId
  );

  const totalMriCount = assignedJobs.filter((j) => j.hasMriB).length;

  const handleStartTest = (jo: JobOrder) => {
    const existingAttempt = db.getActiveAttempt(ws.id, jo.id);
    if (existingAttempt) {
      setActiveAttempt(existingAttempt);
      setActiveChecksheetJo(jo);
    } else {
      const res = db.startPerformanceAttempt(jo.id, ws.id, currentTerminal.id);
      if (res.success && res.attempt) {
        setActiveAttempt(res.attempt);
        setActiveChecksheetJo(jo);
      } else {
        alert(res.error || 'Gagal memulai Performance Test');
      }
    }
  };

  const handleOpenMri = (mriId: string) => {
    const mri = db.getMriRecords().find((m) => m.id === mriId);
    if (mri) {
      setActiveMriRecord(mri);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Performance Test Area
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {ws.name} Workbench
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Eksekusi checksheet performa untuk Job Order yang dialokasikan ke Line Anda.
        </p>
      </div>

      {/* KPI Cards (Screenshot 33 & 34) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Incoming Queue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Incoming Queue</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              Waiting
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
              {incomingUnassigned.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1.5">units</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Unassigned to lines</span>
          </div>
        </div>

        {/* Assigned to Me */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Assigned to Me</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Active
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
              {assignedJobs.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1.5">units waiting</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Ready for checksheet</span>
          </div>
        </div>

        {/* Leadtime Perf (Avg) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Leadtime Perf (Avg)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Wait → Test</span>
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
              2h 51m
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span>SLA: {ws.type === 'Dyno' ? '4 hours' : '3 hours'}</span>
          </div>
        </div>

        {/* Total MRI */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total MRI</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
              Defects
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
              {totalMriCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1.5">issues logged</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>Flagged in October 2026</span>
          </div>
        </div>
      </div>

      {/* Workbench Queue Table (Screenshot 33 & 34) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-950">
            My Workbench - {ws.name} ({assignedJobs.length} units)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem menyajikan urutan prioritas sesuai instruksi Supervisor. Mulai pengujian dan isi checksheet pada unit di urutan teratas.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Urutan</th>
                <th className="py-3 px-3">Line / Test Bench</th>
                <th className="py-3 px-4">Job Order</th>
                <th className="py-3 px-4">Model & Component</th>
                <th className="py-3 px-3">Assembler</th>
                <th className="py-3 px-3">Time In (GLT Out)</th>
                <th className="py-3 px-4">Aging Status</th>
                <th className="py-3 px-2 text-center">MRI-B</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignedJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Antrean kosong. Tidak ada Job Order yang sedang menunggu di workbench ini.
                  </td>
                </tr>
              ) : (
                assignedJobs.map((jo, idx) => {
                  const isOverdue = jo.agingHours > 4;
                  const isActivelyTesting = jo.status === 'IN_PERFORMANCE';

                  return (
                    <tr key={jo.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Urutan */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        #{idx + 1}
                      </td>

                      {/* Line */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{ws.name}</span>
                        </span>
                      </td>

                      {/* Job Order */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-slate-950">
                            {jo.joNumber}
                          </span>
                          {jo.isUrgent && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                              Urgent
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Model & Component */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{jo.componentCategory}</div>
                        <div className="text-[11px] text-slate-500">{jo.componentModel}</div>
                      </td>

                      {/* Assembler */}
                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        {jo.assembler}
                      </td>

                      {/* Time In */}
                      <td className="py-3.5 px-3 text-slate-500">
                        {jo.gltCompletedAt ? (
                          new Date(jo.gltCompletedAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        ) : (
                          '23 Oct 2026, 10:06'
                        )}
                      </td>

                      {/* Aging Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-slate-900 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{jo.agingHours.toFixed(0)}h {Math.round((jo.agingHours % 1) * 60)}m</span>
                          </span>
                          {isOverdue ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                              <span>Overdue</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              On Time
                            </span>
                          )}
                        </div>
                      </td>

                      {/* MRI-B */}
                      <td className="py-3.5 px-2 text-center">
                        {jo.hasMriB ? (
                          <button
                            onClick={() => jo.latestMriBId && handleOpenMri(jo.latestMriBId)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                          >
                            Defect
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleStartTest(jo)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                            isActivelyTesting
                              ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isActivelyTesting ? 'Lanjutkan Test' : 'Mulai Pengujian'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded JO Pipeline underneath */}
      <div className="pt-2">
        <JoPipelineTable
          jobOrders={jobOrders}
          role={currentTerminal.role}
          scope={ws.type === 'Dyno' ? 'ENGINE' : 'POWER_TRAIN'}
          onViewCertificate={(jo) => setViewCertJo(jo)}
          onViewMri={handleOpenMri}
        />
      </div>

      {/* Checksheet Modal */}
      {activeChecksheetJo && activeAttempt && (
        <ChecksheetModal
          isOpen={true}
          onClose={() => {
            setActiveChecksheetJo(null);
            setActiveAttempt(null);
          }}
          jobOrder={activeChecksheetJo}
          attempt={activeAttempt}
          terminalId={currentTerminal.id}
          onSuccess={() => {
            setJobOrders(db.getJobOrders());
            setWorkstations(db.getWorkstations());
          }}
        />
      )}

      {activeMriRecord && (
        <MriModal
          isOpen={true}
          onClose={() => setActiveMriRecord(null)}
          mriRecord={activeMriRecord}
          terminalId={currentTerminal.id}
          role={currentTerminal.role}
          onSuccess={() => setJobOrders(db.getJobOrders())}
        />
      )}

      {viewCertJo && (
        <CertificateModal
          isOpen={true}
          onClose={() => setViewCertJo(null)}
          certificate={db.getCertificate(viewCertJo.id)}
        />
      )}
    </div>
  );
};
