import React, { useRef } from 'react';
import type { GoodsReceipt } from '../api/useGoodsReceipts';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Paperclip,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  PackageCheck
} from 'lucide-react';
import { Button } from '../../../../components/ui';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';

import { getAttachmentUrl, getFileName } from '../../../../lib/api';

interface GoodsReceiptReceiptViewProps {
  receipt: GoodsReceipt;
  onBack: () => void;
}

export const GoodsReceiptReceiptView: React.FC<GoodsReceiptReceiptViewProps> = ({ receipt, onBack }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const currency = receipt.Currency || 'TZS';

  const handleDownloadPDF = () => {
    const element = printRef.current;
    if (!element) return;

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `GRPO_${receipt.OrderCode || receipt.ID}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1123 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: 'css', avoid: ['.avoid-page-break', 'tr'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    const items =
      receipt.items?.map(item => ({
        SNO: item.LineNum,
        'VENDOR CODE': receipt.CustCode || '',
        'ITEM CODE': item.ItemCode || (item.ItemID ? `ITM-${item.ItemID}` : ''),
        'ITEM NAME': item.ItemName || '',
        'ORDERED QTY': Number(item.Quantity || 0),
        'RECEIVED QTY': Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0),
        UOM: item.UoM || 'pcs',
        'UNIT PRICE': Number(item.UnitPrice || 0).toFixed(2),
        'DISCOUNT %': Number(item.DiscPrcnt || 0).toFixed(2),
        'TAX AMOUNT': Number(item.LineTax || 0).toFixed(2),
        'TOTAL INCLUSIVE': Number(item.LineTotalLC || 0).toFixed(2),
        WAREHOUSE: item.WhsCode || '',
        PROJECT: item.project || '',
        'COST CENTER': item.cost_center || ''
      })) || [];

    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Goods Receipt');
    XLSX.writeFile(wb, `GRPO_${receipt.OrderCode || receipt.ID}.xlsx`);
  };

  const subtotal =
    receipt.items?.reduce((sum, item) => {
      const q = Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0);
      const p = Number(item.UnitPrice || 0);
      return sum + q * p;
    }, 0) || 0;

  const headerDisc = Number(receipt.DiscPrcnt || 0);
  const discountAmount = subtotal * (headerDisc / 100);
  const aprStatus = receipt.AprStatus || 'P';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={onBack}
            className="hover:scale-95 transition-all text-xs font-bold rounded-xl"
          >
            Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Goods Receipt #{receipt.OrderCode || receipt.ID}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                aprStatus === 'Y' || receipt.Status === 'O' || receipt.Status === 'Open'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : aprStatus === 'N' || receipt.Status === 'C' || receipt.Status === 'Closed'
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {aprStatus === 'Y' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : aprStatus === 'N' ? (
                <XCircle className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              {aprStatus === 'Y' ? 'Approved' : aprStatus === 'N' ? 'Rejected' : 'Pending Approval'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="secondary"
            icon={<Download className="h-4 w-4" />}
            onClick={handleDownloadPDF}
            className="text-xs font-bold rounded-xl shadow-xs"
          >
            PDF
          </Button>
          <Button
            variant="secondary"
            icon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={handleDownloadExcel}
            className="text-xs font-bold rounded-xl shadow-xs"
          >
            Excel
          </Button>
          <Button
            variant="primary"
            icon={<Printer className="h-4 w-4" />}
            onClick={handlePrint}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20"
          >
            Print
          </Button>
        </div>
      </div>

      {/* Printable Receipt Paper Container */}
      <div
        ref={printRef}
        className="bg-white text-slate-800 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 max-w-5xl mx-auto space-y-8 print:p-0 print:border-none print:shadow-none print:m-0"
      >
        {/* Receipt Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-600 text-white rounded-xl">
                <PackageCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  GOODS RECEIPT PURCHASE ORDER
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                  Material Intake & Inventory Receipt Note
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              GRPO Document No.
            </div>
            <div className="text-xl font-black font-mono text-teal-600">
              {receipt.OrderCode || `GR26/${receipt.ID}`}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Date:{' '}
              {receipt.PostDate
                ? format(new Date(receipt.PostDate), 'dd MMM yyyy')
                : format(new Date(), 'dd MMM yyyy')}
            </div>
          </div>
        </div>

        {/* Vendor & Document Metadata Grid */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              SUPPLIER / VENDOR DETAILS
            </div>
            <div className="text-base font-bold text-slate-900">
              {receipt.CustName || 'Direct Vendor'}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">Code: {receipt.CustCode}</div>
            {receipt.Address && <div className="text-xs text-slate-500 mt-1">{receipt.Address}</div>}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">PO Reference</span>
              <span className="font-semibold text-slate-800">
                {receipt.purchaseOrder || (receipt.PurchaseOrderId ? `PO #${receipt.PurchaseOrderId}` : 'Direct')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Currency</span>
              <span className="font-semibold text-slate-800">{currency}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Delivery Date</span>
              <span className="font-semibold text-slate-800">
                {receipt.DeliveryDate ? format(new Date(receipt.DeliveryDate), 'dd MMM yyyy') : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Department</span>
              <span className="font-semibold text-slate-800">{receipt.Department || 'Warehouse'}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-y-2 border-slate-800 text-[10px] font-bold uppercase text-slate-600">
                <th className="py-2.5 px-2 w-8 text-center">#</th>
                <th className="py-2.5 px-2">Item Code</th>
                <th className="py-2.5 px-2">Description</th>
                <th className="py-2.5 px-2 text-right">Ord Qty</th>
                <th className="py-2.5 px-2 text-right">Rec Qty</th>
                <th className="py-2.5 px-2 text-center">UoM</th>
                <th className="py-2.5 px-2 text-right">Unit Price</th>
                <th className="py-2.5 px-2 text-right">Tax</th>
                <th className="py-2.5 px-2 text-right">Total ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(receipt.items || []).map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-2 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-2 font-mono font-medium text-slate-700">{it.ItemCode || '-'}</td>
                  <td className="py-2.5 px-2 font-medium text-slate-900">{it.ItemName || '-'}</td>
                  <td className="py-2.5 px-2 text-right text-slate-500">{Number(it.Quantity || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-teal-700">
                    {Number(it.DeliveredQty !== undefined ? it.DeliveredQty : it.Quantity || 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-500">{it.UoM || 'pcs'}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                    {Number(it.UnitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                    {Number(it.LineTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                    {Number(it.LineTotalLC || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Financials Summary */}
        <div className="flex justify-between items-start pt-4 border-t border-slate-200">
          <div className="max-w-md space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              REMARKS / RECEIVING NOTES
            </span>
            <p className="text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              {receipt.Remarks || 'No special remarks recorded for this goods receipt.'}
            </p>
          </div>

          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">
                {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
              </span>
            </div>

            {headerDisc > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount ({headerDisc}%):</span>
                <span className="font-mono">
                  - {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </span>
              </div>
            )}

            {Number(receipt.Freight || 0) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Freight:</span>
                <span className="font-mono">
                  {Number(receipt.Freight).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>VAT / Tax Total:</span>
              <span className="font-mono">
                {Number(receipt.TaxTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-800 text-sm font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono text-teal-600 text-base">
                {Number(receipt.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Attachments Section if present */}
        {receipt.attachments && receipt.attachments.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Paperclip className="w-3 h-3" /> Attached Delivery Documents
            </div>
            <div className="flex flex-wrap gap-2">
              {receipt.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={getAttachmentUrl(att.Attachment)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-teal-600 hover:underline flex items-center gap-1"
                >
                  {getFileName(att.Attachment)}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-6 pt-12 border-t border-slate-200 text-center text-xs">
          <div className="space-y-8">
            <div className="border-b border-slate-300 pb-1"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Received By (Store Keeper)
            </span>
          </div>
          <div className="space-y-8">
            <div className="border-b border-slate-300 pb-1"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Inspected / Verified By
            </span>
          </div>
          <div className="space-y-8">
            <div className="border-b border-slate-300 pb-1"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Approved By (Warehouse Mgr)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
