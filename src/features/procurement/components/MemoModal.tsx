import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import type { PurchaseRequest } from '../api/usePurchaseRequests';
import { Download, FileSpreadsheet, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../../components/ui';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

interface MemoModalProps {
  request: PurchaseRequest;
  onClose: () => void;
}

export const MemoModal: React.FC<MemoModalProps> = ({ request, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    const element = printRef.current;
    if (!element) return;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `Memo_${request.RequestedNo || request.ID}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1000 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadExcel = () => {
    // Generate a simple Excel file for the memo metadata
    const memoData = [
      { Field: 'Department', Value: request.Department || 'Branch Manager' },
      { Field: 'To', Value: 'Management' },
      { Field: 'From', Value: request.CreatedByName || request.CreatedBy || 'DCC Manager' },
      { Field: 'Date', Value: request.PostDate ? format(new Date(request.PostDate), 'dd MMM yy HH:mm') : '—' },
      { Field: 'Memo No', Value: request.RequestedNo || '—' },
      { Field: 'Status', Value: request.Status || 'Closed' },
      { Field: 'Memo Text', Value: request.memo_text || request.Remarks || '' }
    ];

    const ws = XLSX.utils.json_to_sheet(memoData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Internal Memorandum");

    XLSX.writeFile(wb, `Memo_${request.RequestedNo || request.ID}.xlsx`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[95vh]">
        
        {/* Flawless Glassmorphic Theme-colored Header */}
        <div 
          className="text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-lg border-b border-white/20 backdrop-blur-md relative overflow-hidden"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 85%, transparent)' }}
        >
          {/* Subtle light overlay for extra glass depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <h2 className="text-[16px] font-extrabold flex items-center gap-2.5 tracking-wide drop-shadow-sm">
              <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Internal Memorandums Tracker Console
            </h2>
            <div className="flex items-center gap-3 ml-6">
              <Button 
                onClick={handleDownloadExcel}
                className="bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border-0 py-1.5 px-4 h-auto text-[12px] font-bold shadow-sm rounded-lg transition-all hover:scale-105 hover:shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-green-600" />
                Download Excel
              </Button>
              <Button 
                onClick={handleDownloadPDF}
                className="bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border-0 py-1.5 px-4 h-auto text-[12px] font-bold shadow-sm rounded-lg transition-all hover:scale-105 hover:shadow-md"
              >
                <Download className="w-4 h-4 mr-1.5 text-red-500" />
                Download PDF
              </Button>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-all relative z-10">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Printable Content */}
        <div className="overflow-y-auto p-8 flex-1 bg-slate-50">
          <div 
            ref={printRef}
            className="bg-white text-slate-800 shadow-sm border border-slate-200 mx-auto px-10 py-10"
            style={{ width: '100%', maxWidth: '1000px', minHeight: '500px' }}
          >
            {/* Company Info */}
            <div className="flex gap-4 mb-6">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-glass-sm"
                style={{ background: 'var(--color-primary)' }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-extrabold" style={{ color: 'var(--color-primary)' }}>DCC Sales APP</h2>
                <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed font-medium">
                  5th Floor, IT Plaza, Ohio Street/Garden Avenue P.O.Box 20419 Dar es Salaam, Tanzania,
                </p>
              </div>
            </div>

            {/* Memorandum Badge */}
            <div className="inline-block bg-[#fceea7] text-[#8a6d00] font-bold text-[11px] px-3 py-1 mb-6 uppercase tracking-wider rounded-sm shadow-sm border border-[#f0d869]">
              INTERNAL MEMORANDUM
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-6 text-[12px]">
              <div className="flex gap-2">
                <span className="font-bold text-slate-700 w-28">DEPARTMENT:</span>
                <span className="text-slate-600 font-medium">{request.Department || 'Branch Manager'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700 w-24">MEMO NO:</span>
                <span className="text-slate-600 font-medium">{request.RequestedNo || '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700 w-28">TO:</span>
                <span className="text-slate-600 font-medium">Management</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700 w-24">REQUEST NO:</span>
                <span className="text-slate-600 font-medium">{request.ID || '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700 w-28">FROM:</span>
                <span className="text-slate-600 font-medium">{request.CreatedByName || request.CreatedBy || 'DCC Manager'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700 w-24">STATUS:</span>
                <span className="text-slate-600 font-medium">{request.Status || 'Closed'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700 w-28">DATE:</span>
                <span className="text-slate-600 font-medium">{request.PostDate ? format(new Date(request.PostDate), 'dd MMM yy HH:mm') : '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700 w-24">PROJECT:</span>
                <span className="text-slate-600 font-medium">—</span>
              </div>
            </div>

            {/* Memo Text Box */}
            <div className="border border-slate-300 rounded min-h-[160px] p-4 text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner bg-slate-50/50 mb-4">
              {request.memo_text || request.Remarks || ''}
            </div>

            {/* Footer Logs */}
            <div className="border-t border-slate-300 border-dashed pt-4 mt-8">
              <span className="text-[10px] text-slate-400 font-bold tracking-wide">Memo Reference Tracker Pipeline Logs:</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
