import React from 'react';
import { TestCertificate } from '../../types';
import { X, Download, Printer, ShieldCheck, CheckCircle2, Award } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate?: TestCertificate;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certificate
}) => {
  if (!isOpen || !certificate) return null;

  const handleDownload = () => {
    if (certificate.pdfDataUri) {
      const link = document.createElement('a');
      link.href = certificate.pdfDataUri;
      link.download = `${certificate.certificateNumber}.pdf`;
      link.click();
    }
  };

  const handlePrint = () => {
    if (certificate.pdfDataUri) {
      const printWindow = window.open(certificate.pdfDataUri);
      printWindow?.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">Certificate of Quality Compliance</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Official
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500">
                {certificate.certificateNumber} • Issued: {certificate.issuedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Preview Body */}
        <div className="my-5 overflow-y-auto pr-2 space-y-6 flex-1 text-slate-800">
          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  DYNODYN PERFORMANCE GATE & QUALITY SYSTEM
                </span>
                <h2 className="text-xl font-bold text-slate-950 mt-0.5">
                  Component Test Certificate
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-800 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>FINAL RESULT: GOOD (PASSED)</span>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium text-[11px]">Job Order</span>
                <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{certificate.joNumber}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[11px]">Component Category</span>
                <p className="font-semibold text-slate-900 mt-0.5">{certificate.componentCategory}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[11px]">Model & Spec</span>
                <p className="font-semibold text-slate-900 mt-0.5">{certificate.componentModel}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[11px]">Unit Model</span>
                <p className="font-semibold text-slate-900 mt-0.5">{certificate.unitModel}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[11px]">Assembler</span>
                <p className="font-semibold text-slate-900 mt-0.5">{certificate.assembler}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[11px]">Workstation / Bay</span>
                <p className="font-semibold text-slate-900 mt-0.5">{certificate.workstationName}</p>
              </div>
            </div>

            {/* Table of Checked Standards */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Summary Parameter Standards & Actual Values ({certificate.measurementsSummary?.length || 0} checks)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Parameter</th>
                      <th className="py-2 px-3">Engineering Standard</th>
                      <th className="py-2 px-3">Actual Value</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certificate.measurementsSummary?.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-medium text-slate-900">{m.parameterName}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{m.standard}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">{m.actualValue}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PASS</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Digital Signature Block */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">Electronically Verified via DynoDyn Quality Gate</p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">SHA256-AUTHENTIC-VERIFIED-AUTOMATIC</p>
              </div>
              <div className="border border-slate-200 rounded-xl px-4 py-2 bg-white text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">QC Status</span>
                <p className="font-bold text-emerald-700">RELEASED & COMPLIANT</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handleDownload}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Resmi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
