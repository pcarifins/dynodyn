import React, { useState } from 'react';
import { MriRecord } from '../../types';
import { db } from '../../services/db';
import { X, AlertTriangle, CheckCircle, Wrench, ShieldAlert } from 'lucide-react';

interface MriModalProps {
  isOpen: boolean;
  onClose: () => void;
  mriRecord: MriRecord;
  terminalId: string;
  role: string;
  onSuccess: () => void;
}

export const MriModal: React.FC<MriModalProps> = ({
  isOpen,
  onClose,
  mriRecord,
  terminalId,
  role,
  onSuccess
}) => {
  const [correctiveActionRemark, setCorrectiveActionRemark] = useState(
    mriRecord.generalCorrectiveAction || ''
  );
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!correctiveActionRemark.trim()) {
      setError('Sesuai Decision #57: Tindakan perbaikan (General Corrective Action) wajib dicatat sebelum pengujian ulang dapat dimulai.');
      return;
    }

    const res = db.recordCorrectiveAction(
      mriRecord.id,
      correctiveActionRemark,
      terminalId,
      role
    );

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Gagal menyimpan corrective action');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-red-700 rounded-2xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900">{mriRecord.mriType} Record</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    mriRecord.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {mriRecord.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {mriRecord.componentCategory} • {mriRecord.componentModel} • Assembler: {mriRecord.assembler}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Failed Parameters List */}
        <div className="mt-4 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Daftar Parameter Anomali / Defect Terdeteksi:
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {mriRecord.failedParameters.map((p, idx) => (
              <div
                key={idx}
                className="p-3 bg-red-50/60 border border-red-200/80 rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{p.parameterName}</span>
                  <span className="text-red-600 font-mono">Nilai Aktual: {p.actualValue} {p.unit || ''}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold">Standar:</span> {p.standard}
                </div>
                {p.defectDescription && (
                  <div className="text-[11px] text-red-700 italic">
                    {p.defectDescription}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Corrective Action Form */}
        <form onSubmit={handleSaveAction} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-slate-600" />
              <span>General Corrective Action (Tindakan Perbaikan) *</span>
            </label>
            <textarea
              required
              rows={3}
              value={correctiveActionRemark}
              onChange={(e) => setCorrectiveActionRemark(e.target.value)}
              placeholder="Jelaskan tindakan perbaikan/penyetelan yang telah dilakukan pada komponen ini..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Decision #57: Satu catatan perbaikan umum mencakup seluruh defect terdaftar.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Simpan Tindakan Perbaikan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
