import React, { useState } from 'react';
import { JobOrder, TerminalRole } from '../../types';
import { 
  Search, 
  Filter, 
  FileText, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MoreVertical, 
  RotateCcw, 
  XCircle,
  Eye,
  Edit3
} from 'lucide-react';

interface JoPipelineTableProps {
  jobOrders: JobOrder[];
  role: TerminalRole;
  scope?: 'ALL' | 'ENGINE' | 'POWER_TRAIN';
  onViewCertificate?: (jo: JobOrder) => void;
  onViewMri?: (mriId: string) => void;
  onOpenChecksheet?: (jo: JobOrder) => void;
  onReopenJo?: (jo: JobOrder) => void;
  onCancelJo?: (jo: JobOrder) => void;
  onCorrectJo?: (jo: JobOrder) => void;
}

export const JoPipelineTable: React.FC<JoPipelineTableProps> = ({
  jobOrders,
  role,
  scope = 'ALL',
  onViewCertificate,
  onViewMri,
  onOpenChecksheet,
  onReopenJo,
  onCancelJo,
  onCorrectJo
}) => {
  const [productFilter, setProductFilter] = useState<'ALL' | 'ENGINE' | 'POWER_TRAIN'>(scope);
  const [statusTab, setStatusTab] = useState<'ALL' | 'GLT' | 'PERF' | 'CLOSED' | 'OVERDUE' | 'MRI'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJoForActions, setSelectedJoForActions] = useState<string | null>(null);

  // Filter based on product
  let filtered = jobOrders;
  if (productFilter === 'ENGINE') {
    filtered = filtered.filter((j) => j.componentCategory.toLowerCase().includes('engine'));
  } else if (productFilter === 'POWER_TRAIN') {
    filtered = filtered.filter((j) => !j.componentCategory.toLowerCase().includes('engine'));
  }

  // Filter based on status tabs
  if (statusTab === 'GLT') {
    filtered = filtered.filter((j) => j.status === 'WAITING_GLT' || j.status === 'IN_GLT');
  } else if (statusTab === 'PERF') {
    filtered = filtered.filter((j) => j.status === 'READY_FOR_ALLOCATION' || j.status === 'ALLOCATED' || j.status === 'IN_PERFORMANCE');
  } else if (statusTab === 'CLOSED') {
    filtered = filtered.filter((j) => j.status === 'DONE' || j.status === 'CANCELLED');
  } else if (statusTab === 'OVERDUE') {
    filtered = filtered.filter((j) => j.agingHours > (j.slaLimitHours || 24));
  } else if (statusTab === 'MRI') {
    filtered = filtered.filter((j) => j.hasMriA || j.hasMriB);
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (j) =>
        j.joNumber.toLowerCase().includes(q) ||
        j.componentModel.toLowerCase().includes(q) ||
        j.assembler.toLowerCase().includes(q) ||
        j.unitModel.toLowerCase().includes(q)
    );
  }

  // Counts for pills
  const totalCount = jobOrders.length;
  const gltCount = jobOrders.filter((j) => j.status === 'WAITING_GLT' || j.status === 'IN_GLT').length;
  const perfCount = jobOrders.filter((j) => j.status === 'READY_FOR_ALLOCATION' || j.status === 'ALLOCATED' || j.status === 'IN_PERFORMANCE').length;
  const closedCount = jobOrders.filter((j) => j.status === 'DONE' || j.status === 'CANCELLED').length;
  const overdueCount = jobOrders.filter((j) => j.agingHours > (j.slaLimitHours || 24)).length;
  const mriCount = jobOrders.filter((j) => j.hasMriA || j.hasMriB).length;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING_GLT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            <span>Received</span>
          </span>
        );
      case 'IN_GLT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span>In GLT</span>
          </span>
        );
      case 'READY_FOR_ALLOCATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Finish GLT</span>
          </span>
        );
      case 'ALLOCATED':
      case 'IN_PERFORMANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>In Performance</span>
          </span>
        );
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Done</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header & Filters */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">Job Order Pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stage tracking, lead times, and SLA compliance monitoring.
          </p>
        </div>

        {/* Product selector pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1">Product:</span>
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

      {/* Filter Tabs & Search Bar */}
      <div className="px-6 py-3.5 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setStatusTab('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>All Jobs</span>
            <span className="text-[10px] font-mono px-1 rounded-sm bg-black/20 text-white">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('GLT')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTab === 'GLT'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>In GLT</span>
            <span className="text-[10px] font-mono px-1 rounded-sm bg-black/20 text-white">
              {gltCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('PERF')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTab === 'PERF'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>In Performance</span>
            <span className="text-[10px] font-mono px-1 rounded-sm bg-black/20 text-white">
              {perfCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('CLOSED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTab === 'CLOSED'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Closed</span>
            <span className="text-[10px] font-mono px-1 rounded-sm bg-black/20 text-white">
              {closedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('OVERDUE')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTab === 'OVERDUE'
                ? 'bg-red-700 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-red-600 hover:bg-red-50'
            }`}
          >
            <span>Overdue</span>
            <span className="text-[10px] font-mono px-1 rounded-sm bg-red-100 text-red-800">
              {overdueCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('MRI')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTab === 'MRI'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            <span>MRI Review (A/B)</span>
            <span className="text-[10px] font-mono px-1 rounded-sm bg-amber-100 text-amber-800">
              {mriCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by JO, assembler, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Table Data matching screenshots */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Job Order</th>
              <th className="py-3 px-3">Group</th>
              <th className="py-3 px-4">Model & Component</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-2 text-center">MRI-A</th>
              <th className="py-3 px-2 text-center">MRI-B</th>
              <th className="py-3 px-3">Assembler</th>
              <th className="py-3 px-3">Assembly Date</th>
              <th className="py-3 px-3">Receive Date</th>
              <th className="py-3 px-3">GLT Leadtime</th>
              <th className="py-3 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400">
                  Tidak ada Job Order yang sesuai filter.
                </td>
              </tr>
            ) : (
              filtered.map((jo) => {
                const isOverdue = jo.agingHours > (jo.slaLimitHours || 24);

                return (
                  <tr key={jo.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Job Order */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-950">
                      <div className="flex items-center gap-1.5">
                        <span>{jo.joNumber}</span>
                        {jo.isUrgent && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Urgent Task"></span>
                        )}
                        {isOverdue && (
                          <span className="w-2 h-2 rounded-full bg-red-500" title="Overdue"></span>
                        )}
                      </div>
                    </td>

                    {/* Group */}
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {jo.componentCategory.includes('Engine') ? 'Engine' : 'Power Train'}
                    </td>

                    {/* Model */}
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="font-bold text-slate-900">{jo.componentModel}</div>
                      <div className="text-[11px] text-slate-500">{jo.unitModel}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {renderStatusBadge(jo.status)}
                    </td>

                    {/* MRI-A */}
                    <td className="py-3 px-2 text-center">
                      {jo.hasMriA ? (
                        <button
                          onClick={() => jo.latestMriAId && onViewMri && onViewMri(jo.latestMriAId)}
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                        >
                          Defect
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No</span>
                      )}
                    </td>

                    {/* MRI-B */}
                    <td className="py-3 px-2 text-center">
                      {jo.hasMriB ? (
                        <button
                          onClick={() => jo.latestMriBId && onViewMri && onViewMri(jo.latestMriBId)}
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                        >
                          Defect
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No</span>
                      )}
                    </td>

                    {/* Assembler */}
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {jo.assembler}
                    </td>

                    {/* Assembly Date */}
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(jo.assemblyDate).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Receive Date */}
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(jo.receivedAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* GLT Leadtime */}
                    <td className="py-3 px-3 text-slate-700 font-mono">
                      {jo.gltLeadtimeDisplay || (jo.status === 'WAITING_GLT' ? (
                        <span className="italic text-slate-400">Waiting Checksheet</span>
                      ) : (
                        '-'
                      ))}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Certificate Button if DONE */}
                        {jo.status === 'DONE' && (
                          <button
                            onClick={() => onViewCertificate && onViewCertificate(jo)}
                            title="Lihat Sertifikat Uji"
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Supervisor Actions */}
                        {role === 'SPV_QC' && (
                          <>
                            {jo.status === 'WAITING_GLT' && onCancelJo && (
                              <button
                                onClick={() => onCancelJo(jo)}
                                title="Batalkan JO (Sebelum Mulai GLT)"
                                className="p-1.5 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {(jo.status === 'DONE' || jo.status === 'CANCELLED') && onReopenJo && (
                              <button
                                onClick={() => onReopenJo(jo)}
                                title="Reopen Job Order"
                                className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
