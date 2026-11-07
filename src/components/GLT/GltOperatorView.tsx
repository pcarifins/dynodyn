import React, { useState } from 'react';
import { JobOrder, TerminalConfig, TestingAttempt, MriRecord } from '../../types';
import { db } from '../../services/db';
import { JoPipelineTable } from '../Shared/JoPipelineTable';
import { ChecksheetModal } from '../Shared/ChecksheetModal';
import { ReceiveJoModal } from '../Shared/ReceiveJoModal';
import { MriModal } from '../Shared/MriModal';
import { CertificateModal } from '../Shared/CertificateModal';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Calendar, 
  User, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface GltOperatorViewProps {
  currentTerminal: TerminalConfig;
}

export const GltOperatorView: React.FC<GltOperatorViewProps> = ({ currentTerminal }) => {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(() => db.getJobOrders());
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [activeChecksheetJo, setActiveChecksheetJo] = useState<JobOrder | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<TestingAttempt | null>(null);
  const [activeMriRecord, setActiveMriRecord] = useState<MriRecord | null>(null);
  const [viewCertJo, setViewCertJo] = useState<JobOrder | null>(null);

  // Subscribe to realtime changes
  React.useEffect(() => {
    return db.subscribe(() => {
      setJobOrders(db.getJobOrders());
    });
  }, []);

  const isEngineScope = currentTerminal.id === 'GLT-E';
  const categoryFilter = isEngineScope ? 'Engine' : 'Power Train';

  const scopedJobs = jobOrders.filter((j) =>
    isEngineScope
      ? j.componentCategory.toLowerCase().includes('engine')
      : !j.componentCategory.toLowerCase().includes('engine')
  );

  // Current GLT Queue: Waiting GLT or in GLT
  const currentQueue = scopedJobs.filter(
    (j) => j.status === 'WAITING_GLT' || j.status === 'IN_GLT'
  );

  // KPI calculations
  const receivedGltCount = scopedJobs.length;
  const waitingChecksheetCount = currentQueue.length;
  const totalMriCount = scopedJobs.filter((j) => j.hasMriA).length;

  const handleStartChecksheet = (jo: JobOrder) => {
    const existingAttempt = db.getActiveAttempt(undefined, jo.id);
    if (existingAttempt) {
      setActiveAttempt(existingAttempt);
      setActiveChecksheetJo(jo);
    } else {
      const res = db.startGltAttempt(jo.id, currentTerminal.id);
      if (res.success && res.attempt) {
        setActiveAttempt(res.attempt);
        setActiveChecksheetJo(jo);
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
      
      {/* Page Title & Receive Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Global Leak Test (GLT) Gate
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {currentTerminal.name} Scope
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            First quality gate. Execute checksheet for incoming components.
          </p>
        </div>

        <button
          onClick={() => setIsReceiveModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Receive New JO</span>
        </button>
      </div>

      {/* KPI Cards (Screenshot 24) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Received GLT */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Received GLT</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              Gate 1
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
              {receivedGltCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1.5">units</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            <span>Received in October 2026</span>
          </div>
        </div>

        {/* Waiting Checksheet */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Waiting Checksheet</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Pending
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
              {waitingChecksheetCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1.5">units waiting</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Received but pending checksheet</span>
          </div>
        </div>

        {/* Leadtime GLT */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Leadtime GLT (Avg)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Receive → Submit</span>
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
              2h 33m
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span>Average turnaround (SLA: 1 Day)</span>
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
            <span>Flagged to MRI in October 2026</span>
          </div>
        </div>
      </div>

      {/* Current Queue Cards (Screenshot 30) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">Current Queue</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {currentQueue.length} items
          </span>
        </div>

        {currentQueue.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
            Tidak ada Job Order yang mengantre di GLT Gate saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentQueue.map((jo) => {
              const isOverdue = jo.agingHours > 24;
              const daysWaiting = Math.floor(jo.agingHours / 24);

              return (
                <div
                  key={jo.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-base text-slate-950">
                          {jo.joNumber}
                        </span>
                        <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {jo.componentModel}
                        </span>
                      </div>

                      {isOverdue ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 shrink-0">
                          Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                          In Queue
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 font-medium mb-4">
                      {isEngineScope ? 'Engine Line' : 'Power Train Line'}
                    </div>

                    {/* Metadata lines */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Assembler:</span>
                        <span className="font-semibold text-slate-800">{jo.assembler}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Assembly Date:</span>
                        <span className="font-medium text-slate-700">
                          {new Date(jo.assemblyDate).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Receive Date:</span>
                        <span className="font-medium text-slate-700">
                          {new Date(jo.receivedAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Wait Time:</span>
                        <span className="font-bold text-red-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{daysWaiting > 0 ? `${daysWaiting} days` : `${jo.agingHours.toFixed(1)}h`}</span>
                        </span>
                      </div>
                    </div>

                    {/* If MRI-A is active */}
                    {jo.hasMriA && (
                      <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs flex items-center justify-between">
                        <span className="font-bold text-red-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>MRI-A Recorded</span>
                        </span>
                        <button
                          onClick={() => jo.latestMriAId && handleOpenMri(jo.latestMriAId)}
                          className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                        >
                          Periksa
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Execute Checksheet Button */}
                  <div className="mt-5">
                    <button
                      onClick={() => handleStartChecksheet(jo)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Execute Checksheet</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded JO Pipeline Table underneath */}
      <div className="pt-4">
        <JoPipelineTable
          jobOrders={scopedJobs}
          role={currentTerminal.role}
          scope={isEngineScope ? 'ENGINE' : 'POWER_TRAIN'}
          onViewCertificate={(jo) => setViewCertJo(jo)}
          onViewMri={handleOpenMri}
          onOpenChecksheet={handleStartChecksheet}
        />
      </div>

      {/* Modals */}
      <ReceiveJoModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        terminalId={currentTerminal.id}
        defaultCategory={categoryFilter as any}
      />

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
