import React, { useRef } from 'react';
import type { ApInvoice } from '../api/useApInvoices';
import { format } from 'date-fns';
import { ArrowLeft, Download, FileSpreadsheet, Paperclip, ExternalLink, Printer } from 'lucide-react';
import { Button } from '../../../../components/ui';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { getAttachmentUrl, getFileName } from '../../../../lib/api';

interface APInvoiceReceiptViewProps {
  invoice: ApInvoice;
  onBack: () => void;
}

export const APInvoiceReceiptView: React.FC<APInvoiceReceiptViewProps> = ({ invoice, onBack }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const currency = invoice.Currency || 'TZS';

  const handleDownloadPDF = () => {
    const element = printRef.current;
    if (!element) return;

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `AP_Invoice_${invoice.OrderCode || invoice.ID}.pdf`,
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
    const items = invoice.items?.map(item => ({
      'SNO': item.LineNum,
      'VENDOR': item.vendor || invoice.CustName || invoice.CustCode || '',
      'ITEM CODE': item.ItemCode || (item.ItemID ? `ITM-${item.ItemID}` : 'SERVICE'),
      'DESCRIPTION': item.ItemName || item.Remarks || '',
      'QTY': Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0),
      'UOM': item.UoM || 'pcs',
      'UNIT PRICE': Number(item.UnitPrice || 0).toFixed(2),
      'DISCOUNT %': Number(item.DiscPrcnt || 0).toFixed(2),
      'TOTAL EXCLUSIVE': (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)).toFixed(2),
      'TAX AMOUNT': Number(item.LineTax || 0).toFixed(2),
      'TOTAL INCLUSIVE': Number(item.LineTotalLC || 0).toFixed(2),
      'WAREHOUSE': item.WhsCode || '',
      'PROJECT': item.project || ''
    })) || [];

    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AP Invoice");
    XLSX.writeFile(wb, `AP_Invoice_${invoice.OrderCode || invoice.ID}.xlsx`);
  };

  const subtotal = invoice.items?.reduce((sum, item) => sum + (Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0) * Number(item.UnitPrice || 0)), 0) || 0;
  const headerDisc = Number(invoice.DiscPrcnt || 0);
  const discountAmount = subtotal * (headerDisc / 100);
  const totalExclusive = subtotal - discountAmount;
  const isService = (invoice.TypeRequest || invoice.RequestType || '').toLowerCase() === 'service';

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
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
                A/P Invoice Voucher
              </h2>
              <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                {invoice.OrderCode || `ID #${invoice.ID}`}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {invoice.TypeRequest || 'Item'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Accounts Payable Invoice Tax Document View
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            icon={<Printer className="h-4 w-4" />}
            onClick={handlePrint}
            className="text-xs font-bold rounded-xl"
          >
            Print
          </Button>
          <Button
            variant="outline"
            icon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={handleDownloadExcel}
            className="text-xs font-bold text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/40 rounded-xl"
          >
            Export Excel
          </Button>
          <Button
            variant="primary"
            icon={<Download className="h-4 w-4" />}
            onClick={handleDownloadPDF}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/20"
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div 
        ref={printRef}
        className="bg-white text-gray-900 p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-200 print:border-none print:shadow-none print:p-0 max-w-5xl mx-auto"
        style={{ minHeight: '842px', fontFamily: "'Inter', sans-serif" }}
      >
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-8 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-8 w-2 bg-teal-600 rounded-full inline-block"></span>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">
                ACCOUNTS PAYABLE INVOICE
              </h1>
            </div>
            <p className="text-xs text-gray-500 font-mono">
              OFFICIAL TAX & PROCUREMENT INVOICE
            </p>
            <div className="text-xs space-y-1 text-gray-600 pt-2">
              <p className="font-semibold text-gray-800">Branch Operations & Procurement</p>
              <p>Dar es Salaam, Tanzania</p>
              <p>TIN: 100-234-567 | VRN: 40-001234-Z</p>
            </div>
          </div>

          <div className="text-right space-y-2">
            <div className="inline-block bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left min-w-[200px]">
              <div className="text-[10px] uppercase font-bold text-gray-400">Invoice Number</div>
              <div className="text-base font-black text-teal-700 font-mono">
                {invoice.OrderCode || `INV-${invoice.ID}`}
              </div>
              <div className="text-[10px] uppercase font-bold text-gray-400 mt-2">Posting Date</div>
              <div className="text-xs font-bold text-gray-800">
                {invoice.PostDate ? format(new Date(invoice.PostDate), 'dd MMM yyyy') : 'N/A'}
              </div>
              {invoice.DueDate && (
                <>
                  <div className="text-[10px] uppercase font-bold text-gray-400 mt-2">Due Date</div>
                  <div className="text-xs font-bold text-rose-600">
                    {format(new Date(invoice.DueDate), 'dd MMM yyyy')}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Vendor & Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-b border-gray-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Vendor / Supplier</span>
            <span className="font-bold text-gray-900 text-sm block">
              {invoice.CustName || invoice.CustCode || 'N/A'}
            </span>
            <span className="font-mono text-gray-500 text-[11px] block">
              Code: {invoice.CustCode}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Base Document / Ref</span>
            <span className="font-semibold text-gray-800 block">
              {invoice.purchaseOrder || invoice.RequestedNo || invoice.relation_from || 'Direct Invoice'}
            </span>
            <span className="text-[11px] text-gray-500 block">
              Payment: {invoice.TypePayment || 'Cash'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Type & Currency</span>
            <span className="font-bold text-gray-800 block">
              {invoice.TypeRequest || 'Item'} Procurement
            </span>
            <span className="font-mono text-gray-500 text-[11px] block">
              Currency: {currency}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Department / Branch</span>
            <span className="font-semibold text-gray-800 block">
              {invoice.Department || 'Procurement'}
            </span>
            <span className="text-gray-500 text-[11px] block">
              {invoice.ExpenseType || 'Operational'}
            </span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900 text-[10px] font-black uppercase text-gray-900 tracking-wider">
                <th className="py-2.5 px-2 w-10 text-center">#</th>
                <th className="py-2.5 px-3">{isService ? 'Service Description' : 'Item Description & Code'}</th>
                {!isService && <th className="py-2.5 px-3 text-right w-20">Qty</th>}
                {!isService && <th className="py-2.5 px-3 text-center w-16">UoM</th>}
                <th className="py-2.5 px-3 text-right w-28">{isService ? 'Fee / Amount' : 'Unit Price'}</th>
                <th className="py-2.5 px-2 text-right w-16">Disc %</th>
                <th className="py-2.5 px-3 text-right w-24">Tax</th>
                <th className="py-2.5 px-3 text-right w-32">Total ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-2 text-center text-gray-400 font-mono text-[11px]">
                      {item.LineNum || idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">
                        {item.ItemName || item.Remarks || (item.ItemCode ? `Item ${item.ItemCode}` : 'Procurement Item')}
                      </div>
                      {item.ItemCode && item.ItemCode !== 'SERVICE' && (
                        <div className="text-[10px] text-gray-500 font-mono">
                          Code: {item.ItemCode}
                        </div>
                      )}
                      {item.project && (
                        <div className="text-[10px] text-teal-600">
                          Project: {item.project}
                        </div>
                      )}
                    </td>
                    {!isService && (
                      <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                        {Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0).toLocaleString()}
                      </td>
                    )}
                    {!isService && (
                      <td className="py-3 px-3 text-center text-gray-600">
                        {item.UoM || 'pcs'}
                      </td>
                    )}
                    <td className="py-3 px-3 text-right font-mono text-gray-800">
                      {Number(item.UnitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-gray-600">
                      {Number(item.DiscPrcnt || 0)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-gray-600">
                      {Number(item.LineTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                      {Number(item.LineTotalLC || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isService ? 6 : 8} className="py-8 text-center text-gray-400 italic">
                    No line items recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Calculations & Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t border-gray-200">
          <div className="sm:col-span-7 space-y-4">
            {invoice.Remarks && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <span className="font-bold text-gray-900 block mb-1">Remarks / Terms:</span>
                <p className="text-gray-600 whitespace-pre-wrap">{invoice.Remarks}</p>
              </div>
            )}

            {invoice.attachments && invoice.attachments.length > 0 && (
              <div className="text-xs space-y-2">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-teal-600" />
                  Attached Documentation ({invoice.attachments.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {invoice.attachments.map((att, index) => {
                    const fileUrl = getAttachmentUrl(att.Attachment);
                    const fileName = getFileName(att.Attachment) || `Attachment-${index + 1}`;
                    return (
                      <a
                        key={index}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {fileName}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="sm:col-span-5">
            <div className="space-y-2 text-xs text-gray-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between">
                <span>Subtotal (Exclusive):</span>
                <span className="font-mono font-bold text-gray-900">
                  {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                </span>
              </div>
              {headerDisc > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Document Discount ({headerDisc}%):</span>
                  <span className="font-mono font-bold">
                    - {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Total Tax Amount:</span>
                <span className="font-mono font-bold text-gray-900">
                  {Number(invoice.TaxTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                </span>
              </div>
              {Number(invoice.Freight || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Freight / Shipping:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {Number(invoice.Freight || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              )}
              <div className="border-t-2 border-gray-900 pt-2 mt-2 flex justify-between text-sm font-black text-gray-900">
                <span>Grand Total:</span>
                <span className="font-mono text-teal-600">
                  {Number(invoice.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures & Footer */}
        <div className="grid grid-cols-3 gap-6 pt-16 mt-8 border-t border-gray-200 text-center text-xs text-gray-500">
          <div>
            <div className="border-b border-gray-300 pb-8 mb-2"></div>
            <p className="font-bold text-gray-800">Prepared By</p>
            <p className="text-[10px] text-gray-400">{invoice.CreatedByName || 'Accounts Payable'}</p>
          </div>
          <div>
            <div className="border-b border-gray-300 pb-8 mb-2"></div>
            <p className="font-bold text-gray-800">Checked & Verified</p>
            <p className="text-[10px] text-gray-400">Finance Department</p>
          </div>
          <div>
            <div className="border-b border-gray-300 pb-8 mb-2"></div>
            <p className="font-bold text-gray-800">Authorized Signatory</p>
            <p className="text-[10px] text-gray-400">Chief Financial Officer</p>
          </div>
        </div>
      </div>
    </div>
  );
};
