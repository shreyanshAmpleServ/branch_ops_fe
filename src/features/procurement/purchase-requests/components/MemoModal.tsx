import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import type { PurchaseRequest } from '../api/usePurchaseRequests';
import { Download, FileSpreadsheet, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../../../components/ui';
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
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadExcel = () => {
    const data = [
      { 'Field': 'Memo No', 'Value': request.RequestedNo || '—' },
      { 'Field': 'Posting Date', 'Value': request.PostDate ? format(new Date(request.PostDate), 'dd-MM-yyyy') : '—' },
      { 'Field': 'Vendor Code', 'Value': request.CustCode || '—' },
      { 'Field': 'Vendor Name', 'Value': request.CustName || '—' },
      { 'Field': 'Doc Total', 'Value': request.DocTotal || '0' },
      { 'Field': 'Memo Text', 'Value': request.memo_text || request.Remarks || '—' },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Memo Details");
    XLSX.writeFile(wb, `Memo_${request.RequestedNo || request.ID}.xlsx`);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
              PR
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Memo Details — {request.RequestedNo || `ID #${request.ID}`}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Purchase Request Internal Memorandum
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
              onClick={handleDownloadExcel}
              className="text-xs font-semibold"
            >
              Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="h-4 w-4 text-teal-600" />}
              onClick={handleDownloadPDF}
              className="text-xs font-semibold"
            >
              PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div 
            ref={printRef} 
            className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-gray-800 space-y-6 text-sm"
          >
            {/* Memo Document Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-teal-700">MEMORANDUM</h2>
                <p className="text-xs text-gray-500 mt-0.5">Internal Requisition & Purchase Document</p>
              </div>
              <div className="text-right text-xs space-y-1">
                <div><span className="font-semibold text-gray-500">Memo No:</span> <span className="font-bold text-gray-900">{request.RequestedNo || 'N/A'}</span></div>
                <div><span className="font-semibold text-gray-500">Date:</span> <span className="font-medium">{request.PostDate ? format(new Date(request.PostDate), 'PPP') : 'N/A'}</span></div>
                <div><span className="font-semibold text-gray-500">Status:</span> <span className="font-semibold text-teal-600 uppercase">{request.Status === 'O' ? 'Open' : request.Status === 'C' ? 'Closed' : request.Status}</span></div>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 text-xs">
              <div>
                <span className="font-semibold text-gray-500 block mb-0.5">Vendor / Requester</span>
                <span className="font-bold text-gray-900">{request.CustName || request.CustCode || 'N/A'}</span>
                {request.CustCode && <span className="text-gray-400 text-[11px] block">({request.CustCode})</span>}
              </div>
              <div>
                <span className="font-semibold text-gray-500 block mb-0.5">Expense / Request Type</span>
                <span className="font-bold text-gray-900">{request.TypeRequest || request.Expense_type || 'General'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block mb-0.5">Total Amount</span>
                <span className="font-bold text-teal-700 text-sm">{request.Currency || 'TZS'} {Number(request.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block mb-0.5">Approval Status</span>
                <span className={`font-bold inline-block px-2 py-0.5 rounded text-[10px] ${request.AprStatus === 'Y' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {request.AprStatus === 'Y' ? 'Approved' : 'Pending Approval'}
                </span>
              </div>
            </div>

            {/* Memo Text Content */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Memo Content / Justification</h4>
              <div className="p-4 bg-teal-50/40 rounded-lg border border-teal-100 text-gray-700 text-xs leading-relaxed whitespace-pre-wrap font-sans min-h-[100px]">
                {request.memo_text || request.Remarks || 'No detailed memo text provided for this request.'}
              </div>
            </div>

            {/* Line Items Summary */}
            {request.items && request.items.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Requested Items Summary ({request.items.length})</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {request.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium">{item.ItemName || item.ItemCode || '—'}</td>
                          <td className="py-2 px-3 text-right font-mono">{Number(item.Quantity || 0).toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono">{Number(item.UnitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">{Number(item.LineTotalLC || (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Signature / Footer */}
            <div className="pt-8 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs text-gray-500">
              <div>
                <p className="font-semibold text-gray-700">Prepared By:</p>
                <div className="mt-8 border-b border-gray-300 w-48"></div>
                <p className="mt-1 text-[11px]">{request.CreatedByName || 'Authorized User'}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="font-semibold text-gray-700">Approval / Authorized Sign:</p>
                <div className="mt-8 border-b border-gray-300 w-48"></div>
                <p className="mt-1 text-[11px]">Management Signature</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            className="text-xs font-semibold px-4"
          >
            Close
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
};
