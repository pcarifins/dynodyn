import React, { useState } from 'react';
import { ChecksheetTemplate, ChecksheetParameter, TerminalConfig } from '../../types';
import { db } from '../../services/db';
import { 
  Settings, 
  Layers, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sliders, 
  Upload, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface QualityMasterViewProps {
  currentTerminal: TerminalConfig;
}

export const QualityMasterView: React.FC<QualityMasterViewProps> = ({ currentTerminal }) => {
  const [templates, setTemplates] = useState<Record<string, ChecksheetTemplate>>(() =>
    db.getChecksheetTemplates()
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(
    Object.keys(templates)[0] || 'GLT_Engine'
  );
  const [editingParam, setEditingParam] = useState<ChecksheetParameter | null>(null);

  React.useEffect(() => {
    return db.subscribe(() => {
      setTemplates(db.getChecksheetTemplates());
    });
  }, []);

  const activeTemplate = templates[selectedTemplateKey];

  const handlePublishVersion = () => {
    if (!activeTemplate) return;
    db.publishChecksheetTemplate(activeTemplate, currentTerminal.id);
    alert(`Berhasil mempublikasikan Versi ${activeTemplate.version} untuk ${activeTemplate.componentCategory}. Sesuai Decision #59, seluruh pengujian baru otomatis menggunakan standar terbaru ini.`);
  };

  const handleSaveParamStandard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParam || !activeTemplate) return;

    for (const group of activeTemplate.groups) {
      const idx = group.parameters.findIndex((p) => p.id === editingParam.id);
      if (idx !== -1) {
        group.parameters[idx] = { ...editingParam };
        break;
      }
    }

    db.publishChecksheetTemplate(activeTemplate, currentTerminal.id);
    setEditingParam(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Quality Master Standards Hub
            </h1>
            <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
              QC-MASTER
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Konfigurasi template checksheet 15 kategori, parameter teknis, durasi standar & publikasi versi resmi.
          </p>
        </div>

        {activeTemplate && (
          <button
            onClick={handlePublishVersion}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Publikasikan Versi Baru (Rev {activeTemplate.version + 1}.0)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 15 Component Categories */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              15 Kategori Komponen
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {Object.keys(templates).length} Templates
            </span>
          </div>

          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
            {Object.entries(templates).map(([key, tpl]) => {
              const isSelected = key === selectedTemplateKey;
              const isGLT = key.startsWith('GLT');

              return (
                <button
                  key={key}
                  onClick={() => setSelectedTemplateKey(key)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-white text-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm uppercase tracking-wider ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : isGLT
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isGLT ? 'GLT GATE' : 'PERF TEST'}
                      </span>
                      <span className="font-bold text-xs">{tpl.componentCategory}</span>
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      Rev {tpl.version}.0 • {tpl.fixedStandardDurationMinutes}m standard duration
                    </div>
                  </div>

                  <span
                    className={`text-xs font-mono font-semibold ${
                      isSelected ? 'text-emerald-300' : 'text-slate-400'
                    }`}
                  >
                    {tpl.groups.reduce((acc, g) => acc + g.parameters.length, 0)} checks
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Parameters & Engineering Standards */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-6">
          {activeTemplate ? (
            <div className="space-y-6">
              {/* Template Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-950">
                      {activeTemplate.componentCategory}
                    </h2>
                    <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Rev {activeTemplate.version}.0 (Published)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Dipublikasikan pada: {new Date(activeTemplate.publishedAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })} • Target SLA: {activeTemplate.slaTargetHours} Jam
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                    <span className="text-slate-400">Fixed Std Duration: </span>
                    <strong className="font-mono">{activeTemplate.fixedStandardDurationMinutes} Menit</strong>
                  </div>
                </div>
              </div>

              {/* Group & Parameters List */}
              <div className="space-y-5">
                {activeTemplate.groups.map((group, gIdx) => (
                  <div key={group.name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                        {gIdx + 1}. {group.name} ({group.parameters.length} Parameter)
                      </h4>
                    </div>

                    <div className="space-y-2.5">
                      {group.parameters.map((param) => (
                        <div
                          key={param.id}
                          className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl flex items-center justify-between text-xs hover:bg-white transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{param.name}</span>
                              {param.isMandatory && (
                                <span className="text-red-500 font-bold">*Mandatory</span>
                              )}
                              <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.2 rounded-md font-mono text-[10px]">
                                {param.measurementType}
                              </span>
                            </div>
                            <div className="font-mono text-slate-600 text-[11px]">
                              {param.stdDisplay} {param.unit && `(${param.unit})`}
                            </div>
                            {param.description && (
                              <p className="text-slate-400 text-[11px] line-clamp-1">
                                {param.description}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => setEditingParam({ ...param })}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit Standar</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">Pilih template kategori di sebelah kiri</div>
          )}

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Decision #59: Setiap publikasi versi baru bersifat immutable dan otomatis menjadi standar snapshot untuk retest berikutnya.</span>
          </div>
        </div>
      </div>

      {/* Edit Parameter Standard Modal */}
      {editingParam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Edit Standar: {editingParam.name}
              </h3>
              <p className="text-xs text-slate-500">Ubah nilai ambang batas toleransi rekayasa teknis</p>
            </div>

            <form onSubmit={handleSaveParamStandard} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Label Teks Standar *
                </label>
                <input
                  type="text"
                  required
                  value={editingParam.stdDisplay}
                  onChange={(e) => setEditingParam({ ...editingParam, stdDisplay: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Batas Min (Nilai)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingParam.minVal ?? ''}
                    onChange={(e) => setEditingParam({ ...editingParam, minVal: parseFloat(e.target.value) || undefined })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Batas Max (Nilai)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingParam.maxVal ?? ''}
                    onChange={(e) => setEditingParam({ ...editingParam, maxVal: parseFloat(e.target.value) || undefined })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingParam(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Simpan Standar & Terbitkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
