import React, { useRef } from 'react';
import type { ApInvoice } from '../api/useApInvoices';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Paperclip,
  ExternalLink,
  Printer,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { Button } from '../../../../components/ui';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import "../../purchase-quotations/components/view.css";
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
      margin: [0.3, 0.3, 0.3, 0.3] as [number, number, number, number],
      filename: `AP_Invoice_${invoice.OrderCode || invoice.ID}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1123 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' as const },
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
      'TOTAL EXCLUSIVE': (Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0) * Number(item.UnitPrice || 0)).toFixed(2),
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

  const subtotal = invoice.items?.reduce((sum, item) => {
    const qty = Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0);
    const price = Number(item.UnitPrice || 0);
    return sum + (qty * price);
  }, 0) || 0;

  const headerDisc = Number(invoice.DiscPrcnt || 0);
  const discountAmount = subtotal * (headerDisc / 100);
  const totalExclusive = subtotal - discountAmount;
  const isService = (invoice.TypeRequest || invoice.RequestType || '').toLowerCase() === 'service';
  const aprStatus = invoice.AprStatus || (invoice.Status === 'C' ? 'Y' : invoice.Status === 'O' ? 'P' : 'P');
  const amountInWords = "Tanzanian Shillings " + Number(invoice.DocTotal || totalExclusive + Number(invoice.TaxTotal || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Only";

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
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                isService
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}>
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

      {/* Main Printable Document Card */}
      <div className="flex justify-center overflow-x-auto pb-8 w-full">
        <div 
          ref={printRef}
          className="purchase-quotation-print bg-white text-slate-800 shadow-2xl rounded-2xl border border-slate-200 min-w-[920px] w-full max-w-[1140px] mx-auto shrink-0 overflow-hidden"
          style={{ position: 'relative' }}
        >
          {/* Header Branding Banner */}
          <div className="w-full bg-gradient-to-r from-[#005f73] via-[#0A9396] to-[#94D2BD] text-white px-10 py-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-xl shadow-md border border-white/30">
                  AP
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200">ACCOUNTS PAYABLE</span>
                  <h1 className="text-2xl font-black tracking-tight uppercase text-white">AP INVOICE VOUCHER</h1>
                </div>
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 uppercase tracking-wider">
                <span className="text-xs text-teal-100 font-bold uppercase tracking-wider">Invoice No:</span>
                <span className="text-sm font-black text-white">{invoice.OrderCode || `INV-${invoice.ID}`}</span>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-800 shadow-xs`}>
                {aprStatus === 'Y' ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-700 font-bold">Approved</span></>
                ) : aprStatus === 'N' ? (
                  <><XCircle className="w-3.5 h-3.5 text-rose-600" /><span className="text-rose-700 font-bold">Rejected</span></>
                ) : (
                  <><Clock className="w-3.5 h-3.5 text-amber-600" /><span className="text-amber-700 font-bold">Pending</span></>
                )}
              </span>
            </div>
          </div>

          <div className="p-8 sm:p-10 space-y-8">
            {/* Balanced 2-Column Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/80 rounded-2xl p-6 border border-gray-200/80">
              {/* Left Column: Vendor & Supplier Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider border-b border-gray-200 pb-1">
                  Vendor & Supplier Info
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span className="font-semibold text-gray-500">Supplier Name:</span>
                  <span className="col-span-2 font-bold text-gray-900">{invoice.CustName || invoice.CustCode || 'N/A'}</span>

                  <span className="font-semibold text-gray-500">Vendor Code:</span>
                  <span className="col-span-2 text-gray-800 font-medium font-mono">{invoice.CustCode || 'N/A'}</span>

                  {invoice.RequestType && (
                    <>
                      <span className="font-semibold text-gray-500">Request Type:</span>
                      <span className="col-span-2 text-gray-800 font-medium">{invoice.RequestType}</span>
                    </>
                  )}

                  {invoice.TypeRequest && (
                    <>
                      <span className="font-semibold text-gray-500">Procurement Type:</span>
                      <span className="col-span-2 text-gray-800 font-medium">{invoice.TypeRequest}</span>
                    </>
                  )}

                  {invoice.Department && (
                    <>
                      <span className="font-semibold text-gray-500">Department:</span>
                      <span className="col-span-2 text-gray-800 font-medium">{invoice.Department}</span>
                    </>
                  )}

                  {invoice.ExpenseType && (
                    <>
                      <span className="font-semibold text-gray-500">Expense Type:</span>
                      <span className="col-span-2 text-gray-800 font-medium">{invoice.ExpenseType}</span>
                    </>
                  )}

                  {invoice.TypePayment && (
                    <>
                      <span className="font-semibold text-gray-500">Payment Terms:</span>
                      <span className="col-span-2 text-gray-800 font-medium">{invoice.TypePayment}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: Dates & References */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider border-b border-gray-200 pb-1">
                  Dates & Document Details
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span className="font-semibold text-gray-500">Posting Date:</span>
                  <span className="col-span-2 text-gray-800 font-medium">
                    {invoice.PostDate ? format(new Date(invoice.PostDate), 'dd MMM yyyy') : 'N/A'}
                  </span>

                  {invoice.DueDate && (
                    <>
                      <span className="font-semibold text-gray-500">Due Date:</span>
                      <span className="col-span-2 text-rose-600 font-bold">
                        {format(new Date(invoice.DueDate), 'dd MMM yyyy')}
                      </span>
                    </>
                  )}

                  {invoice.PODate && (
                    <>
                      <span className="font-semibold text-gray-500">Document Date:</span>
                      <span className="col-span-2 text-gray-800 font-medium">
                        {format(new Date(invoice.PODate), 'dd MMM yyyy')}
                      </span>
                    </>
                  )}

                  <span className="font-semibold text-gray-500">Base Ref / PO:</span>
                  <span className="col-span-2 text-gray-800 font-mono font-medium">
                    {invoice.purchaseOrder || invoice.RequestedNo || invoice.relation_from || 'Direct Invoice'}
                  </span>

                  <span className="font-semibold text-gray-500">Currency:</span>
                  <span className="col-span-2 text-gray-800 font-mono font-bold">{currency}</span>

                  <span className="font-semibold text-gray-500">Created By:</span>
                  <span className="col-span-2 text-gray-800 font-medium">{invoice.CreatedByName || 'Accounts Payable'}</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {isService ? 'Invoice Service Lines & Accounts' : 'Invoiced Material Items & Quantities'}
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-100 to-gray-100 text-gray-700 font-bold border-b border-gray-200">
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-4">{isService ? 'Service Description & GL Account' : 'Item Code & Description'}</th>
                      {!isService && <th className="py-3 px-3 text-center w-20">Qty</th>}
                      {!isService && <th className="py-3 px-3 text-center w-16">UoM</th>}
                      <th className="py-3 px-3 text-right w-28">{isService ? 'Amount' : 'Unit Price'}</th>
                      <th className="py-3 px-3 text-right w-16">Disc %</th>
                      <th className="py-3 px-3 text-right w-24">Tax Amount</th>
                      <th className="py-3 px-4 text-right w-32">Total ({currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, idx) => {
                        const qty = Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0);
                        const price = Number(item.UnitPrice || 0);
                        const disc = Number(item.DiscPrcnt || 0);
                        const lineTax = Number(item.LineTax || 0);
                        const lineTotal = Number(item.LineTotalLC || 0);

                        return (
                          <tr key={item.ID || idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-3 text-center font-medium text-gray-500 font-mono text-[11px]">
                              {item.LineNum || idx + 1}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-900">
                              <div className="font-bold text-gray-900">
                                {item.ItemName || item.Remarks || (item.ItemCode ? `Item ${item.ItemCode}` : 'Procurement Item')}
                              </div>
                              {item.ItemCode && item.ItemCode !== 'SERVICE' && (
                                <div className="text-[10px] text-gray-400 font-mono">Code: {item.ItemCode}</div>
                              )}
                              {item.GLCode && (
                                <div className="text-[10px] text-indigo-600 font-mono">GL: {item.GLCode} {item.GLName ? `(${item.GLName})` : ''}</div>
                              )}
                              <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-0.5">
                                {item.WhsCode && <span>Whs: {item.WhsCode}</span>}
                                {item.project && <span className="text-teal-600 font-semibold">Prj: {item.project}</span>}
                                {item.cost_center && <span>CC: {item.cost_center}</span>}
                              </div>
                            </td>
                            {!isService && (
                              <td className="py-3 px-3 text-center font-bold text-gray-800 font-mono">{qty}</td>
                            )}
                            {!isService && (
                              <td className="py-3 px-3 text-center text-gray-600">{item.UoM || 'pcs'}</td>
                            )}
                            <td className="py-3 px-3 text-right font-mono text-gray-700">
                              {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-gray-600">
                              {disc > 0 ? `${disc}%` : '-'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-gray-600">
                              {lineTax > 0 ? lineTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="py-3 px-4 text-right font-bold font-mono text-teal-800">
                              {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={isService ? 6 : 8} className="py-8 text-center text-gray-400 italic">
                          No line items recorded for this invoice.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations & Remarks Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                {invoice.Remarks && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-1">
                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">Remarks / Notes</div>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{invoice.Remarks}</p>
                  </div>
                )}

                <div className="bg-teal-50/60 rounded-xl p-4 border border-teal-100 space-y-1">
                  <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">Amount in Words</div>
                  <p className="text-xs font-medium text-teal-900 italic">{amountInWords}</p>
                </div>
              </div>

              {/* Totals Box */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subtotal Exclusive:</span>
                  <span className="font-semibold text-gray-800 font-mono">
                    {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
                {headerDisc > 0 && (
                  <div className="flex justify-between text-xs text-rose-600">
                    <span>Document Discount ({headerDisc}%):</span>
                    <span className="font-semibold font-mono">
                      - {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Total Tax:</span>
                  <span className="font-semibold text-gray-800 font-mono">
                    {Number(invoice.TaxTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
                {Number(invoice.Freight || 0) > 0 && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Freight / Shipping:</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {Number(invoice.Freight).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </span>
                  </div>
                )}
                {invoice.Rounding === 'Y' && Number(invoice.RoundingAmnt || 0) !== 0 && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Rounding:</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {Number(invoice.RoundingAmnt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-3 flex justify-between items-center text-sm font-black text-gray-900">
                  <span>Grand Total:</span>
                  <span className="text-lg font-mono text-teal-700">
                    {Number(invoice.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            {invoice.attachments && invoice.attachments.length > 0 && (
              <div className="space-y-3 border-t border-gray-200 pt-4 avoid-page-break">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <Paperclip className="h-4 w-4 text-teal-600" />
                  <span>Attached Documentation ({invoice.attachments.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {invoice.attachments.map((att, idx) => {
                    const url = getAttachmentUrl(att.Attachment);
                    const filename = getFileName(att.Attachment) || `Attachment-${idx + 1}`;
                    return (
                      <a
                        key={att.ID || idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {filename}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Signatures & Footer */}
            <div className="grid grid-cols-3 gap-6 pt-16 mt-8 border-t border-gray-200 text-center text-xs text-gray-500 avoid-page-break">
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
      </div>
    </div>
  );
};
