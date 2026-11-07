/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Users,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';

interface QualityMasterViewProps {
  currentTerminal: TerminalConfig;
}

export const QualityMasterView: React.FC<QualityMasterViewProps> = ({ currentTerminal }) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'assemblers'>('templates');
  const [templates, setTemplates] = useState<Record<string, ChecksheetTemplate>>(() =>
    db.getChecksheetTemplates()
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(
    Object.keys(templates)[0] || 'GLT_Engine'
  );
  const [editingParam, setEditingParam] = useState<ChecksheetParameter | null>(null);

  // Assemblers state
  const [assemblers, setAssemblers] = useState<{ name: string; active: boolean }[]>(() => db.getAssemblers());
  const [newAssemblerName, setNewAssemblerName] = useState('');

  useEffect(() => {
    return db.subscribe(() => {
      setTemplates(db.getChecksheetTemplates());
      setAssemblers(db.getAssemblers());
    });
  }, []);

  const activeTemplate = templates[selectedTemplateKey];

  const handlePublishVersion = () => {
    if (!activeTemplate) return;
    db.publishChecksheetTemplate(activeTemplate, currentTerminal.id);
    alert(`Berhasil mempublikasikan Versi ${activeTemplate.version} untuk ${activeTemplate.componentCategory}. Sesuai QC Standard, seluruh pengujian baru otomatis menggunakan standar terbaru ini.`);
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

  const handleAddAssembler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssemblerName.trim()) return;
    const name = newAssemblerName.trim();
    if (assemblers.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      alert('Nama assembler sudah terdaftar.');
      return;
    }
    const updated = [...assemblers, { name, active: true }];
    db.saveAssemblers(updated, currentTerminal.id);
    setNewAssemblerName('');
  };

  const handleToggleAssembler = (idx: number) => {
    const updated = [...assemblers];
    updated[idx].active = !updated[idx].active;
    db.saveAssemblers(updated, currentTerminal.id);
  };

  const handleEditAssemblerName = (idx: number) => {
    const current = assemblers[idx];
    const newName = prompt('Ubah Nama Assembler:', current.name);
    if (!newName || !newName.trim()) return;
    const trimmed = newName.trim();
    const updated = [...assemblers];
    updated[idx].name = trimmed;
    db.saveAssemblers(updated, currentTerminal.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Title & Sub-tabs */}
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
            Konfigurasi template checksheet, parameter teknis, dan manajemen assembler mekanik tersetralisasi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'templates' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Checksheet Templates
            </button>
            <button
              onClick={() => setActiveTab('assemblers')}
              className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'assemblers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manajemen Assembler ({assemblers.filter(a => a.active).length} Aktif)
            </button>
          </div>

          {activeTab === 'templates' && activeTemplate && (
            <button
              onClick={handlePublishVersion}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Publikasikan Versi Baru (Rev {activeTemplate.version + 1}.0)</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'templates' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Component Categories */}
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
                        Rev {tpl.version}.0 • {tpl.fixedStandardDurationMinutes}m duration
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
                      Target SLA: {activeTemplate.slaTargetHours} Jam • Standar Terbit Otomatis Disinkronkan
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                      <span className="text-slate-400">Fixed Duration: </span>
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
                                {param.isMandatory ? (
                                  <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md text-[10px]">Mandatory</span>
                                ) : (
                                  <span className="text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md text-[10px]">Optional</span>
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
          </div>
        </div>
      ) : (
        /* Assembler Management Tab (Priority 2.1) */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Manajemen Assembler Mekanik</h2>
              <p className="text-xs text-slate-500">Tambah, ubah nama, atau nonaktifkan assembler yang terdaftar untuk Job Order.</p>
            </div>

            <form onSubmit={handleAddAssembler} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nama Assembler Baru..."
                value={newAssemblerName}
                onChange={(e) => setNewAssemblerName(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assemblers.map((asm, idx) => (
              <div
                key={asm.name}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  asm.active ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${asm.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                    {asm.active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{asm.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {asm.active ? 'Aktif (Tersedia)' : 'Nonaktif (Arsip)'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditAssemblerName(idx)}
                    title="Ubah Nama"
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleAssembler(idx)}
                    title={asm.active ? 'Nonaktifkan' : 'Aktifkan'}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      asm.active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {asm.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Parameter Standard Modal */}
      {editingParam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Edit Standar Parameter: {editingParam.name}
              </h3>
              <p className="text-xs text-slate-500">Ubah ambang batas toleransi rekayasa teknis & status mandatori</p>
            </div>

            <form onSubmit={handleSaveParamStandard} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Label Teks Standar / Kriteria Lolos *
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
                    Satuan (Unit)
                  </label>
                  <input
                    type="text"
                    value={editingParam.unit ?? ''}
                    onChange={(e) => setEditingParam({ ...editingParam, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status Parameter
                  </label>
                  <select
                    value={editingParam.isMandatory ? 'mandatory' : 'optional'}
                    onChange={(e) => setEditingParam({ ...editingParam, isMandatory: e.target.value === 'mandatory' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="mandatory">Mandatory (Wajib)</option>
                    <option value="optional">Optional (Opsional)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Batas Min (Toleransi)
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
                    Batas Max (Toleransi)
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
                  Simpan Standar & Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
