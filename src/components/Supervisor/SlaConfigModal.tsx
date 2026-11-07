import React, { useState } from 'react';
import { WorkingCalendarConfig } from '../../types';
import { db } from '../../services/db';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  CalendarX,
  Sparkles
} from 'lucide-react';

interface SlaConfigModalProps {
  terminalId: string;
}

export const SlaConfigModal: React.FC<SlaConfigModalProps> = ({ terminalId }) => {
  const [calendar, setCalendar] = useState<WorkingCalendarConfig>(() => db.getWorkingCalendar());
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideType, setOverrideType] = useState<'HOLIDAY' | 'SPECIAL_SHIFT'>('HOLIDAY');
  const [overrideDescription, setOverrideDescription] = useState('');

  React.useEffect(() => {
    return db.subscribe(() => {
      setCalendar(db.getWorkingCalendar());
    });
  }, []);

  const handleAddOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideDate) return;

    const newOverrides = [
      ...(calendar.overrides || []),
      {
        date: overrideDate,
        type: overrideType,
        description: overrideDescription.trim() || (overrideType === 'HOLIDAY' ? 'Libur Nasional' : 'Jadwal Khusus'),
        workingHours: overrideType === 'HOLIDAY' ? 0 : 8
      }
    ];

    const updated = {
      ...calendar,
      overrides: newOverrides
    };

    db.updateWorkingCalendar(updated, terminalId);
    setOverrideDate('');
    setOverrideDescription('');
  };

  const handleDeleteOverride = (index: number) => {
    const newOverrides = calendar.overrides.filter((_, idx) => idx !== index);
    db.updateWorkingCalendar({ ...calendar, overrides: newOverrides }, terminalId);
  };

  const totalExceptions = calendar.overrides?.length || 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title & Info Bar matching Screenshot 22 */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-950">Supervisor SLA & Working Hours</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Konfigurasi jam kerja operasional (Asia/Makassar) untuk perhitungan Dual SLA: Total SLA & Controllable SLA.
        </p>
      </div>

      {/* Standard Shift Notice Bar */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center gap-3 text-xs text-slate-700 shadow-2xs">
        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
        <div>
          <span>Standard: </span>
          <strong className="text-slate-900">Senin–Jumat ({calendar.shiftStartTime} – {calendar.shiftEndTime})</strong>
          <span className="text-slate-400 mx-1.5">•</span>
          <span>Istirahat {calendar.breakDurationMinutes}m</span>
          <span className="text-slate-400 mx-1.5">•</span>
          <span className="font-mono text-slate-500">Timezone: {calendar.timezone}</span>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Add Schedule Override */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-sm text-slate-900">Add Schedule Override</h3>
          </div>

          <form onSubmit={handleAddOverride} className="mt-5 space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Exception Type *
              </label>
              <select
                value={overrideType}
                onChange={(e) => setOverrideType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="HOLIDAY">Holiday (Zero Hours)</option>
                <option value="SPECIAL_SHIFT">Special Shift / Overtime Push</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={overrideDescription}
                onChange={(e) => setOverrideDescription(e.target.value)}
                placeholder="e.g. Eid al-Fitr / Year-End Push"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Override</span>
            </button>
          </form>
        </div>

        {/* Right: Configured SLA Schedule Exceptions */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Configured SLA Schedule Exceptions
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Total: {totalExceptions} pengecualian
              </span>
            </div>

            <div className="mt-4">
              {totalExceptions === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-300">
                    <CalendarX className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-slate-500">
                    No schedule overrides defined. Standard working hours apply.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {calendar.overrides.map((ov, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs hover:bg-white transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{ov.date}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              ov.type === 'HOLIDAY'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {ov.type}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">{ov.description}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteOverride(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Perhitungan Dual SLA secara otomatis memperhitungkan shift 8 jam dan mengecualikan jam libur kalender.
          </div>
        </div>
      </div>
    </div>
  );
};
