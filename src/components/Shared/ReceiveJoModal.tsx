import React, { useState } from 'react';
import { ComponentCategory } from '../../types';
import { db } from '../../services/db';
import { X, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';

interface ReceiveJoModalProps {
  isOpen: boolean;
  onClose: () => void;
  terminalId: string;
  defaultCategory?: ComponentCategory;
}

const CATEGORIES: ComponentCategory[] = [
  'Engine',
  'Power Train',
  'Cylinder',
  'Pump Front/Rear',
  'Motor',
  'Final Drive GD',
  'Final Drive PC-DZ',
  'Differential',
  'Axle & Final Drive HD',
  'Front Brake & Front Axle',
  'Power Module All Series',
  'Transmission GD',
  'Transmission WA',
  'Torqflow',
  'PTO'
];

const COMMON_ASSEMBLERS = ['Budi', 'Andi', 'Rina', 'Joko', 'Agus', 'Yanto', 'Rian Pratama', 'Budi Santoso'];

export const ReceiveJoModal: React.FC<ReceiveJoModalProps> = ({
  isOpen,
  onClose,
  terminalId,
  defaultCategory = 'Power Train'
}) => {
  const [joNumber, setJoNumber] = useState(`241000${Math.floor(7300 + Math.random() * 500)}`);
  const [componentCategory, setComponentCategory] = useState<ComponentCategory>(defaultCategory);
  const [componentModel, setComponentModel] = useState('');
  const [unitModel, setUnitModel] = useState('');
  const [assembler, setAssembler] = useState(COMMON_ASSEMBLERS[0]);
  const [assemblyDate, setAssemblyDate] = useState(new Date().toISOString().slice(0, 16));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!joNumber.trim()) {
      setError('Job Order Number wajib diisi');
      return;
    }
    if (!componentModel.trim()) {
      setError('Component Model wajib diisi (contoh: PC2000-8 Final Drive)');
      return;
    }
    if (!unitModel.trim()) {
      setError('Unit Model wajib diisi (contoh: PC2000-8)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await db.receiveJobOrder(
        {
          joNumber: joNumber.trim(),
          componentCategory,
          componentModel: componentModel.trim(),
          unitModel: unitModel.trim(),
          assembler: assembler.trim(),
          assemblyDate
        },
        terminalId
      );

      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Gagal menerima Job Order');
      }
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan ke Firestore');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Receive New JO (Gate 1)</h3>
              <p className="text-xs text-slate-500">Pendaftaran komponen masuk untuk inspeksi GLT awal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Job Order Number *
            </label>
            <input
              type="text"
              required
              value={joNumber}
              onChange={(e) => setJoNumber(e.target.value)}
              placeholder="e.g. 2410007295"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Kategori Komponen *
              </label>
              <select
                value={componentCategory}
                onChange={(e) => setComponentCategory(e.target.value as ComponentCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assembler Mekanik *
              </label>
              <select
                value={assembler}
                onChange={(e) => setAssembler(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                {COMMON_ASSEMBLERS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Component Model & Spec *
            </label>
            <input
              type="text"
              required
              value={componentModel}
              onChange={(e) => setComponentModel(e.target.value)}
              placeholder="e.g. PC2000-8 Transmission / HD785-7 Engine Assy"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unit Model *
              </label>
              <input
                type="text"
                required
                value={unitModel}
                onChange={(e) => setUnitModel(e.target.value)}
                placeholder="e.g. PC2000-8 / HD785-7"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assembly Date *
              </label>
              <input
                type="datetime-local"
                required
                value={assemblyDate}
                onChange={(e) => setAssemblyDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Mendaftarkan ke Cloud...' : 'Simpan & Daftarkan ke Antrean GLT'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
