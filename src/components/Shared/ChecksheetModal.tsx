import React, { useState, useEffect } from 'react';
import { JobOrder, TestingAttempt, ChecksheetTemplate, ParameterMeasurement } from '../../types';
import { db } from '../../services/db';
import { 
  X, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Camera, 
  Trash2, 
  Upload, 
  AlertCircle,
  Clock
} from 'lucide-react';

interface ChecksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOrder: JobOrder;
  attempt: TestingAttempt;
  terminalId: string;
  onSuccess: () => void;
}

export const ChecksheetModal: React.FC<ChecksheetModalProps> = ({
  isOpen,
  onClose,
  jobOrder,
  attempt,
  terminalId,
  onSuccess
}) => {
  const snapshot = attempt.checksheetSnapshot;
  const groups = snapshot?.groups || [];

  // Local draft state for parameter values
  const [measurements, setMeasurements] = useState<Record<string, { value: any; isGood: boolean; remark?: string }>>({});
  const [overallEvaluation, setOverallEvaluation] = useState<'GOOD' | 'NOT_GOOD' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer for elapsed testing duration
  useEffect(() => {
    if (!attempt.startedAt) return;
    const startMs = new Date(attempt.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt.startedAt]);

  // Load existing measurements or draft
  useEffect(() => {
    if (!isOpen) return;

    const draftKey = `${attempt.id}_draft`;
    const draft = db.getDraft(draftKey);

    const initialMeasurements: Record<string, { value: any; isGood: boolean; remark?: string }> = {};

    groups.forEach((g) => {
      g.parameters.forEach((p) => {
        if (draft && draft.measurements && draft.measurements[p.id] !== undefined) {
          initialMeasurements[p.id] = draft.measurements[p.id];
        } else {
          // Default empty
          if (p.measurementType === 'BOOLEAN_GOOD_NG') {
            initialMeasurements[p.id] = { value: true, isGood: true };
          } else {
            initialMeasurements[p.id] = { value: '', isGood: false };
          }
        }
      });
    });

    setMeasurements(initialMeasurements);
    if (draft) {
      if (draft.overallEvaluation) setOverallEvaluation(draft.overallEvaluation);
      if (draft.remarks) setRemarks(draft.remarks);
      if (draft.evidencePhotos) setEvidencePhotos(draft.evidencePhotos);
    } else {
      // GLT default evidence sample
      setEvidencePhotos(['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80']);
    }
  }, [isOpen, attempt.id]);

  // Parameter value change handler with immediate standard validation
  const handleValueChange = (paramId: string, rawVal: any, param: any) => {
    let isGood = true;

    if (param.measurementType === 'BOOLEAN_GOOD_NG') {
      isGood = rawVal === true;
    } else if (param.measurementType === 'NUMERIC_RANGE' || param.measurementType === 'NOMINAL_TOLERANCE' || param.measurementType === 'EXACT_VALUE') {
      const num = parseFloat(rawVal);
      if (isNaN(num)) {
        isGood = false;
      } else {
        if (param.minVal !== undefined && num < param.minVal) isGood = false;
        if (param.maxVal !== undefined && num > param.maxVal) isGood = false;
      }
    } else if (param.measurementType === 'QUALITATIVE') {
      const num = parseFloat(rawVal);
      if (!isNaN(num) && param.maxVal !== undefined && num > param.maxVal) {
        isGood = false;
      }
    }

    const updated = {
      ...measurements,
      [paramId]: { value: rawVal, isGood }
    };
    setMeasurements(updated);

    // Save parameter-level autosave draft
    db.saveDraft(`${attempt.id}_draft`, {
      measurements: updated,
      overallEvaluation,
      remarks,
      evidencePhotos
    });

    // Auto-reflect overall evaluation: if any parameter is not good, suggest NOT_GOOD
    const anyNG = Object.values(updated).some((m) => m.value !== '' && !m.isGood);
    if (anyNG) {
      setOverallEvaluation('NOT_GOOD');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setEvidencePhotos((prev) => [...prev, String(uploadEvent.target?.result)]);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Calculate filled count
  const allParams = groups.flatMap((g) => g.parameters);
  const totalCount = allParams.length;
  const filledCount = allParams.filter((p) => {
    const val = measurements[p.id]?.value;
    return val !== '' && val !== undefined && val !== null;
  }).length;

  const handleSubmit = () => {
    setError('');

    // Verify all mandatory parameters
    const missingMandatory = allParams.filter((p) => {
      if (!p.isMandatory) return false;
      const val = measurements[p.id]?.value;
      return val === '' || val === undefined || val === null;
    });

    if (missingMandatory.length > 0) {
      setError(`Wajib mengisi semua parameter mandatory (${missingMandatory.map((m) => m.name).join(', ')}).`);
      return;
    }

    if (!overallEvaluation) {
      setError('Pilih Konfirmasi Kelayakan Produk (Dinyatakan Good atau Dinyatakan Not Good).');
      return;
    }

    const hasAnyNgParam = allParams.some((p) => measurements[p.id] && !measurements[p.id].isGood);

    // Hard Rule: Cannot submit GOOD if any parameter is NOT GOOD
    if (overallEvaluation === 'GOOD' && hasAnyNgParam) {
      setError('Tidak dapat menyatakan GOOD jika ada parameter pengujian yang Not Good / Melebihi Toleransi Standard.');
      return;
    }

    if (evidencePhotos.length === 0) {
      setError('Lampirkan minimal 1 foto bukti fisik sebelum submit.');
      return;
    }

    // Prepare measurement payloads
    const measurementPayloads: ParameterMeasurement[] = allParams.map((p) => {
      const item = measurements[p.id] || { value: '', isGood: false };
      return {
        parameterId: p.id,
        parameterName: p.name,
        group: p.group,
        value: item.value,
        unit: p.unit,
        isGood: item.isGood,
        remark: item.remark
      };
    });

    if (attempt.stage === 'GLT') {
      const res = db.submitGltAttempt(
        attempt.id,
        {
          measurements: measurementPayloads,
          overallEvaluation,
          remarks,
          evidencePhotos
        },
        terminalId
      );
      if (res.success) {
        db.clearDraft(`${attempt.id}_draft`);
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Gagal submit GLT checksheet');
      }
    } else {
      // Performance attempt
      const res = db.submitPerformanceAttempt(
        attempt.id,
        {
          measurements: measurementPayloads,
          overallEvaluation,
          remarks,
          evidencePhotos
        },
        terminalId
      );
      if (res.success) {
        db.clearDraft(`${attempt.id}_draft`);
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Gagal submit Performance checksheet');
      }
    }
  };

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-slate-100 text-slate-900 font-mono font-bold text-sm px-3 py-1 rounded-full border border-slate-200">
              {jobOrder.joNumber}
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {jobOrder.componentCategory} • {jobOrder.componentModel} • Assembler: <strong className="text-slate-900">{jobOrder.assembler}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-mono font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
              {attempt.stage === 'PERFORMANCE' ? 'Dynotest' : 'GLT'}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs font-medium text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Groups & Parameters */}
          {groups.map((group, gIdx) => (
            <div key={group.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center">
                    {gIdx + 1}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">{group.name}</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {group.parameters.length} checks
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {group.parameters.map((param) => {
                  const curr = measurements[param.id] || { value: '', isGood: false };
                  const isFilled = curr.value !== '' && curr.value !== undefined;
                  const isGood = curr.isGood;

                  return (
                    <div
                      key={param.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isFilled
                          ? isGood
                            ? 'bg-slate-50/60 border-slate-200/90'
                            : 'bg-red-50/40 border-red-200'
                          : 'bg-slate-50/40 border-slate-200/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <span>{param.name}</span>
                            {param.isMandatory && <span className="text-red-500 font-bold">*</span>}
                          </div>
                          {param.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {param.description}
                            </p>
                          )}
                        </div>

                        {isFilled && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                              isGood
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isGood ? 'Good' : 'Out of Std'}
                          </span>
                        )}
                      </div>

                      {/* Standard label */}
                      <div className="inline-block px-2.5 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-slate-600 mb-3 shadow-2xs">
                        {param.stdDisplay}
                      </div>

                      {/* Input Field or Boolean Buttons */}
                      {param.measurementType === 'BOOLEAN_GOOD_NG' ? (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => handleValueChange(param.id, true, param)}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                              curr.value === true
                                ? 'bg-white border-emerald-500 text-emerald-700 shadow-xs ring-1 ring-emerald-500'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Good</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleValueChange(param.id, false, param)}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                              curr.value === false
                                ? 'bg-white border-red-500 text-red-700 shadow-xs ring-1 ring-red-500'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <X className="w-3.5 h-3.5 text-red-600" />
                            <span>Not Good</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="any"
                              value={curr.value}
                              onChange={(e) => handleValueChange(param.id, e.target.value, param)}
                              placeholder={`(${param.unit || 'Val'})`}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 shadow-2xs"
                            />
                            {param.unit && (
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none">
                                {param.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Konfirmasi Kelayakan Produk */}
          <div className="pt-2 space-y-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1">
                <span>Konfirmasi Kelayakan Produk</span>
                <span className="text-red-500 font-bold">*</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nyatakan hasil akhir evaluasi teknis produk ini:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setOverallEvaluation('GOOD')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                  overallEvaluation === 'GOOD'
                    ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    overallEvaluation === 'GOOD'
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-300 text-slate-400'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Dinyatakan Good (Lolos)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Memenuhi kriteria kelayakan operasional
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOverallEvaluation('NOT_GOOD')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                  overallEvaluation === 'NOT_GOOD'
                    ? 'bg-red-50/70 border-red-500 shadow-xs ring-1 ring-red-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    overallEvaluation === 'NOT_GOOD'
                      ? 'bg-red-600 text-white'
                      : 'border border-slate-300 text-slate-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Dinyatakan Not Good (Masuk MRI)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Terdapat defect/anomali yang memerlukan penanganan
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Catatan Pemeriksaan / Temuan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan Pemeriksaan / Temuan (Opsional)
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Tambahkan catatan observasi pengujian jika ada..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-800"
            />
          </div>

          {/* Foto Bukti Fisik / Evidence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <span>Foto Bukti Fisik / Evidence Pemeriksaan</span>
                  <span className="text-red-500 font-bold">*(Min. 1 Foto)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Capture foto bukti produk/komponen sebelum submit. Bisa melampirkan lebih dari 1 foto.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {evidencePhotos.map((photo, pIdx) => (
                <div
                  key={pIdx}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group shadow-2xs"
                >
                  <img src={photo} alt="evidence" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setEvidencePhotos((prev) => prev.filter((_, idx) => idx !== pIdx))}
                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}

              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 flex flex-col items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <Camera className="w-5 h-5 mb-1 text-slate-400" />
                <span className="text-[10px] font-medium">+ Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">
              {filledCount}/{totalCount} Terisi
            </span>
            <div className="w-28 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-300"
                style={{ width: `${totalCount ? (filledCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Checksheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
