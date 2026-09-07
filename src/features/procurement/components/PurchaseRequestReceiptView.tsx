import React, { useRef } from 'react';
import type { PurchaseRequest } from '../api/usePurchaseRequests';
import { format } from 'date-fns';
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../../components/ui';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface PurchaseRequestReceiptViewProps {
  request: PurchaseRequest;
  onBack: () => void;
}

export const PurchaseRequestReceiptView: React.FC<PurchaseRequestReceiptViewProps> = ({ request, onBack }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    const element = printRef.current;
    if (!element) return;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `Purchase_Request_${request.RequestedNo || request.ID}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1123 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: 'css', avoid: ['.avoid-page-break', 'tr'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadExcel = () => {
    // Flatten items for excel
    const items = request.items?.map(item => ({
      'SNO': item.LineNum,
      'VENDOR': request.CustCode || '',
      'ITEM CODE': item.ItemCode || '',
      'ITEM NAME': item.ItemName || '',
      'QTY': item.Quantity,
      'UOM': item.UoM || '',
      'UNIT PRICE': Number(item.UnitPrice).toFixed(2),
      'DISCOUNT %': Number(item.DiscPrcnt || 0).toFixed(2),
      'TOTAL EXCLUSIVE': (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)).toFixed(2),
      'TAX AMOUNT': Number(item.LineTax || 0).toFixed(2),
      'TOTAL INCLUSIVE': Number(item.LineTotalLC || 0).toFixed(2),
      'WAREHOUSE': item.WhsCode || '',
      'PROJECT': item.project || ''
    })) || [];

    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Request");

    XLSX.writeFile(wb, `Purchase_Request_${request.RequestedNo || request.ID}.xlsx`);
  };

  const subtotal = request.items?.reduce((sum, item) => sum + (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)), 0) || 0;
  
  // Convert numbers to words (simple placeholder, ideally use a library like number-to-words)
  const amountInWords = "Tanzanian Shillings " + Number(request.DocTotal || 0).toLocaleString() + " Only";

  return (
    <div className="space-y-6">
      {/* Top Action Bar - Not printable */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={onBack}
            className="hover:scale-95 transition-all text-xs font-bold"
          >
            Back
          </Button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 hidden sm:block">Receipt View Screen</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            icon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={handleDownloadExcel}
            className="bg-[#20b2aa] hover:bg-[#1ca09a] text-white border-0 shadow-sm transition-all hover:scale-95 text-xs font-bold px-4 rounded-lg"
          >
            Download Excel
          </Button>
          <Button 
            icon={<Download className="h-4 w-4" />}
            onClick={handleDownloadPDF}
            className="bg-[#20b2aa] hover:bg-[#1ca09a] text-white border-0 shadow-sm transition-all hover:scale-95 text-xs font-bold px-4 rounded-lg"
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Printable Area Container */}
      <div className="flex justify-center overflow-x-auto pb-8 w-full">
        <div 
          ref={printRef}
          className="bg-white text-black print:shadow-none shadow-xl border border-gray-200 min-w-[900px] w-full max-w-[1123px] mx-auto shrink-0"
          style={{ minHeight: '794px', position: 'relative' }} // roughly A4 Landscape proportions
        >
          {/* Header Line */}
          <div className="w-full text-center py-5 border-b-2 border-dashed border-[#20b2aa] mb-6">
            <h1 className="text-2xl font-bold tracking-wider text-slate-800 uppercase">Purchase Request</h1>
          </div>

          <div className="px-10">
            {/* Top Info Grid */}
            <div className="flex justify-between items-start gap-8 mb-8">
              {/* Left Side: Company Info */}
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-[#005f73] rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-[#005f73]">DCC Sales APP</h2>
                  <p className="text-xs text-slate-700 max-w-xs leading-relaxed">
                    5th Floor, IT Plaza, Ohio Street/Garden Avenue P.O.Box 20419 Dar es Salaam, Tanzania,<br />
                    Phone: +255-22-2112161<br />
                    Email: sales@doubleclick.co.tz
                  </p>
                  
                  <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-1.5 mt-5 text-xs">
                    <span className="text-slate-500 font-semibold">TIN:</span>
                    <span className="font-bold text-slate-800">TIN12345</span>
                    <span className="text-slate-500 font-semibold">VRN:</span>
                    <span className="font-bold text-slate-800">VRN12345</span>
                    <span className="text-slate-500 font-semibold">E-Mail:</span>
                    <span className="font-bold text-slate-800">admin@admin.com</span>
                    <span className="text-slate-500 font-semibold">Phone:</span>
                    <span className="font-bold text-slate-800">+255-22-2112161</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Meta Data Card */}
              <div className="bg-slate-50/80 rounded border border-slate-200 p-4 w-[400px]">
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">CreatedBy</span>
                    <span className="font-bold text-slate-800">{request.CreatedByName || request.CreatedBy || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Date/Time</span>
                    <span className="font-bold text-slate-800">
                      {request.PostDate ? format(new Date(request.PostDate), 'yyyy-MM-dd') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">PR. No.</span>
                    <span className="font-bold text-slate-800">{request.RequestedNo || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Dated</span>
                    <span className="font-bold text-slate-800">
                      {request.CreatedDate ? format(new Date(request.CreatedDate), 'dd-MM-yyyy') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Requested By</span>
                    <span className="font-bold text-slate-800">{request.CustName || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">BOL No.</span>
                    <span className="font-bold text-slate-800">{request.BOL || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Department</span>
                    <span className="font-bold text-slate-800">{request.Department || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Request Terms</span>
                    <span className="font-bold text-slate-800">Cash Payment</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Activity Name</span>
                    <span className="font-bold text-slate-800">{request.ActivityName || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Branch</span>
                    <span className="font-bold text-slate-800">Dcc_branch</span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-slate-500 font-medium">Currency</span>
                    <span className="font-bold text-[#20b2aa]">{request.Currency || 'TZS'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="w-full border border-slate-300 rounded overflow-hidden mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                    <th className="py-2 px-3 border-r border-b border-slate-300 w-12 text-center">SNO.</th>
                    <th className="py-2 px-3 border-r border-b border-slate-300">VENDOR</th>
                    <th className="py-2 px-3 border-r border-b border-slate-300">ITEM CODE</th>
                    <th className="py-2 px-3 border-r border-b border-slate-300">ITEM NAME</th>
                    <th className="py-2 px-3 border-r border-b border-slate-300 text-right">QTY</th>
                    <th className="py-2 px-3 border-r border-b border-slate-300 text-center">UOM</th>
                    <th className="py-2 px-3 border-r border-b border-slate-300 text-right">UNIT PRICE</th>
                    <th className="py-2 px-3 border-r border-b border-slate-300 text-right">TOTAL EXCLUSIVE</th>
                    <th className="py-2 px-3 border-r border-b border-slate-300 text-right">TAX AMOUNT</th>
                    <th className="py-2 px-3 border-r border-b border-slate-300 text-right">TOTAL INCLUSIVE</th>
                    <th className="py-2 px-3 border-r border-b border-slate-300">WAREHOUSE</th>
                    <th className="py-2 px-3 border-b border-slate-300">PROJECT</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] text-slate-700">
                  {request.items?.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-200 last:border-b-0 bg-white">
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-mono">
                        {String(item.LineNum).padStart(3, '0')}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300">{request.CustCode || ''}</td>
                      <td className="py-2 px-3 border-r border-slate-300 font-mono">{item.ItemCode}</td>
                      <td className="py-2 px-3 border-r border-slate-300">{item.ItemName}</td>
                      <td className="py-2 px-3 border-r border-slate-300 text-right font-mono">
                        {Number(item.Quantity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-center">{item.UoM || 'pcs'}</td>
                      <td className="py-2 px-3 border-r border-slate-300 text-right font-mono">
                        {Number(item.UnitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-right font-mono">
                        {(Number(item.Quantity || 0) * Number(item.UnitPrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-right font-mono">
                        {Number(item.LineTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-right font-mono">
                        {Number(item.LineTotalLC || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300">{item.WhsCode || 'Kigambooni Station'}</td>
                      <td className="py-2 px-3">{item.project || ''}</td>
                    </tr>
                  ))}
                  {(!request.items || request.items.length === 0) && (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">No items found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Section */}
            <div className="flex justify-between items-start pt-4 mb-16 avoid-page-break">
              <div className="w-[55%] space-y-5">
                <div>
                  <span className="text-[11px] font-bold text-slate-800">Total Amount (In Words) : </span>
                  <span className="text-[11px] text-slate-800">{amountInWords}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block mb-1">Remarks:</span>
                  <p className="text-[11px] text-slate-600 max-w-sm whitespace-pre-wrap leading-relaxed">
                    {request.Remarks || '—'}
                  </p>
                </div>
              </div>
              
              <div className="w-[35%] space-y-2 text-[11px] pr-4">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Order Subtotal:</span>
                  <span className="font-mono">{request.Currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Total Before VAT:</span>
                  <span className="font-mono">{request.Currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Freight:</span>
                  <span className="font-mono">{request.Currency} {Number(request.Freight || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>VAT Amount:</span>
                  <span className="font-mono">{request.Currency} {Number(request.TaxTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-300">
                  <span className="font-bold text-[#20b2aa] text-[13px]">Total Amount:</span>
                  <span className="font-bold font-mono text-[#20b2aa] text-[13px]">
                    {request.Currency} {Number(request.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Rules */}
            <div className="border-t border-slate-800 pt-3 text-[11px] font-medium text-slate-800 space-y-1 avoid-page-break">
              <div>Memo No: {request.RequestedNo || '—'}</div>
              <div>Purchase Request No: {request.ID}, Approvals:</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
