import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApInvoice } from '../api/useApInvoices';
import { useDeleteApInvoice } from '../api/useApInvoices';
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
  XCircle,
  Edit2,
  Trash2,
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
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const deleteMutation = useDeleteApInvoice();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(invoice.ID);
      setIsDeleteModalOpen(false);
      onBack();
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    }
  };

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
      pagebreak: { mode: 'css', avoid: ['.avoid-page-break', 'tr'] },
    };

    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    const items =
      invoice.items?.map((item) => ({
        SNO: item.LineNum,
        VENDOR: invoice.CustCode || '',
        'ITEM CODE': item.ItemCode || (item.ItemID ? `ITM-${item.ItemID}` : ''),
        'ITEM NAME': item.ItemName || '',
        QTY: Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0),
        UOM: item.UoM || 'pcs',
        'UNIT PRICE': Number(item.UnitPrice || 0).toFixed(2),
        'DISCOUNT %': Number(item.DiscPrcnt || 0).toFixed(2),
        'TOTAL EXCLUSIVE': (
          Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0) *
          Number(item.UnitPrice || 0)
        ).toFixed(2),
        'TAX AMOUNT': Number(item.LineTax || 0).toFixed(2),
        'TOTAL INCLUSIVE': Number(item.LineTotalLC || 0).toFixed(2),
        WAREHOUSE: item.WhsCode || '',
        PROJECT: item.project || '',
      })) || [];

    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AP Invoice');
    XLSX.writeFile(wb, `AP_Invoice_${invoice.OrderCode || invoice.ID}.xlsx`);
  };

  const subtotal =
    invoice.items?.reduce((sum, item) => {
      const qty = Number(item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0);
      const price = Number(item.UnitPrice || 0);
      return sum + qty * price;
    }, 0) || 0;

  const headerDisc = Number(invoice.DiscPrcnt || 0);
  const discountAmount = subtotal * (headerDisc / 100);
  const totalExclusive = subtotal - discountAmount;
  const isService = (invoice.TypeRequest || invoice.RequestType || '').toLowerCase() === 'service';
  const aprStatus = invoice.AprStatus || (invoice.Status === 'C' ? 'Y' : invoice.Status === 'O' ? 'P' : 'P');
  const totalTax = Number(invoice.TaxTotal || invoice.VatTotal || 0);
  const finalDocTotal = Number(invoice.DocTotal || totalExclusive + totalTax);

  const amountInWords =
    'Tanzanian Shillings ' +
    finalDocTotal.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) +
    ' Only';

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
                A/P Invoice Details
              </h2>
              <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                {invoice.OrderCode || `ID #${invoice.ID}`}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isService
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {invoice.TypeRequest || 'Item'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Official Accounts Payable Invoice Document View
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            icon={<Edit2 className="h-4 w-4" />}
            onClick={() => navigate(`/procurement/ap-invoice/edit/${invoice.ID}`)}
            className="text-xs font-bold rounded-xl text-teal-600 border-teal-300 hover:bg-teal-50 dark:border-teal-800 dark:hover:bg-teal-950/40"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            icon={<Trash2 className="h-4 w-4 text-rose-500" />}
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-xs font-bold rounded-xl text-rose-600 border-rose-300 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40"
          >
            Delete
          </Button>
          <Button
            icon={<Printer className="h-4 w-4" />}
            onClick={handlePrint}
            variant="secondary"
            className="text-xs font-bold rounded-xl hover:scale-95 transition-all"
          >
            Print
          </Button>
          <Button
            icon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={handleDownloadExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm transition-all hover:scale-95 text-xs font-bold px-4 rounded-xl"
          >
            Excel
          </Button>
          <Button
            icon={<Download className="h-4 w-4" />}
            onClick={handleDownloadPDF}
            className="bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-md shadow-teal-500/20 transition-all hover:scale-95 text-xs font-bold px-4 rounded-xl"
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200">
                ACCOUNTS PAYABLE
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight uppercase text-white">
                AP INVOICE VOUCHER
              </h1>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 uppercase tracking-wider">
                {aprStatus === 'Y' && (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Approved
                  </>
                )}
                {aprStatus === 'N' && (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-rose-300" /> Rejected
                  </>
                )}
                {aprStatus === 'P' && (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-300" /> Pending Approval
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-10 space-y-8">
            {/* Top Info Grid - Balanced 2 Equal Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Left Card: Issuer Company Details */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#005f73] mb-3 pb-1 border-b border-slate-200">
                    Issuer Company Details
                  </h3>
                  <div className="flex gap-4 items-start">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#005f73] to-[#0A9396] rounded-2xl shadow-md flex items-center justify-center shrink-0 text-white font-black text-xl tracking-wider">
                      DCC
                    </div>
                    <div className="space-y-1 text-xs">
                      <h2 className="text-base font-extrabold text-[#005f73]">DCC Sales APP</h2>
                      <p className="text-slate-600 leading-relaxed">
                        5th Floor, IT Plaza, Ohio Street/Garden Avenue
                        <br />
                        P.O.Box 20419 Dar es Salaam, Tanzania
                      </p>
                      <p className="text-slate-500 text-[11px] pt-1">
                        Phone: <span className="font-semibold text-slate-700">+255-22-2112161</span>{' '}
                        | Email:{' '}
                        <span className="font-semibold text-slate-700">
                          sales@doubleclick.co.tz
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200/60 text-xs bg-white/60 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      TIN Number
                    </span>
                    <span className="font-extrabold text-slate-800 font-mono text-xs">
                      TIN12345
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      VRN Number
                    </span>
                    <span className="font-extrabold text-slate-800 font-mono text-xs">
                      VRN12345
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Card: Document Metadata */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#005f73] mb-3 pb-1 border-b border-slate-200">
                  Document Metadata
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Invoice Code</span>
                    <span className="font-bold text-[#005f73] font-mono text-sm">
                      {invoice.OrderCode || `INV-${invoice.ID}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Supplier / Vendor</span>
                    <span
                      className="font-bold text-slate-800 truncate max-w-[220px]"
                      title={invoice.CustName || invoice.CustCode || ''}
                    >
                      {invoice.CustName
                        ? `${invoice.CustName} (${invoice.CustCode})`
                        : invoice.CustCode || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Base Ref / PO</span>
                    <span className="font-semibold text-slate-700">
                      {invoice.purchaseOrder ||
                        invoice.RequestedNo ||
                        invoice.relation_from ||
                        'Direct Invoice'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Posting Date</span>
                    <span className="font-semibold text-slate-700">
                      {invoice.PostDate ? format(new Date(invoice.PostDate), 'yyyy-MM-dd') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Due Date</span>
                    <span className="font-semibold text-rose-600">
                      {invoice.DueDate ? format(new Date(invoice.DueDate), 'yyyy-MM-dd') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Department</span>
                    <span className="font-semibold text-slate-700">
                      {invoice.Department || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Created By</span>
                    <span className="font-semibold text-slate-700">
                      {invoice.CreatedByName || 'Accounts Payable'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-500">Currency</span>
                    <span className="font-bold text-teal-600 font-mono">{currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="w-full border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3">Item Code</th>
                    <th className="py-3 px-3">
                      {isService ? 'Service Description & GL Account' : 'Item Description'}
                    </th>
                    {!isService && <th className="py-3 px-3 text-right">Qty</th>}
                    {!isService && <th className="py-3 px-3 text-center">UoM</th>}
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Excl. Total</th>
                    <th className="py-3 px-3 text-right">Tax (VAT)</th>
                    <th className="py-3 px-3 text-right">Incl. Total</th>
                    <th className="py-3 px-3">Warehouse</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                  {invoice.items?.map((item, idx) => {
                    const qty = Number(
                      item.DeliveredQty !== undefined ? item.DeliveredQty : item.Quantity || 0
                    );
                    const price = Number(item.UnitPrice || 0);
                    const disc = Number(item.DiscPrcnt || 0);
                    const itemTotalExcl = qty * price * (1 - disc / 100);
                    const taxAmt = Number(item.LineTax || 0);
                    const itemTotalIncl = Number(item.LineTotalLC || itemTotalExcl + taxAmt);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                          {String(item.LineNum || idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-[#005f73]">
                          {item.ItemCode || (item.ItemID ? `ITM-${item.ItemID}` : '—')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          <div>
                            {item.ItemName ||
                              item.Remarks ||
                              (item.ItemCode ? `Item ${item.ItemCode}` : 'Procurement Item')}
                          </div>
                          {item.GLCode && (
                            <div className="text-[10px] text-indigo-600 font-mono mt-0.5">
                              GL: {item.GLCode} {item.GLName ? `(${item.GLName})` : ''}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-normal mt-0.5">
                            {item.project && <span>Prj: {item.project}</span>}
                            {item.cost_center && <span>CC: {item.cost_center}</span>}
                          </div>
                        </td>
                        {!isService && (
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            {qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        )}
                        {!isService && (
                          <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                            {item.UoM || 'pcs'}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {itemTotalExcl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-700">
                          {itemTotalIncl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {item.WhsCode ? `Whs ${item.WhsCode}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {(!invoice.items || invoice.items.length === 0) && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                        No invoice line items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Section: Remarks & Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-4 avoid-page-break">
              {/* Left Column (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#005f73] block">
                    Amount in Words
                  </span>
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">{amountInWords}</p>
                </div>

                {invoice.Remarks && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      Remarks & Payment Terms
                    </span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                      {invoice.Remarks}
                    </p>
                  </div>
                )}

                {invoice.attachments && invoice.attachments.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      Attached Documentation ({invoice.attachments.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {invoice.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={getAttachmentUrl(att.Attachment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-slate-500" />
                          <span>{getFileName(att.Attachment) || `Attachment-${idx + 1}`}</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Financial Calculation Card (5 cols) */}
              <div className="md:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs shadow-sm">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#005f73] pb-1 border-b border-slate-200">
                  Financial Calculation
                </h4>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Subtotal Excl. Tax</span>
                  <span className="font-mono font-semibold">
                    {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {headerDisc > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Discount ({headerDisc}%)</span>
                    <span className="font-mono text-rose-600">
                      -{currency}{' '}
                      {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Before Tax</span>
                  <span className="font-mono font-semibold">
                    {currency}{' '}
                    {totalExclusive.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {Number(invoice.Freight || 0) > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Freight / Shipping</span>
                    <span className="font-mono font-semibold">
                      {currency}{' '}
                      {Number(invoice.Freight || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600">
                  <span>VAT / Tax Total</span>
                  <span className="font-mono font-semibold">
                    {currency}{' '}
                    {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {invoice.Rounding === 'Y' && Number(invoice.RoundingAmnt || 0) !== 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Rounding</span>
                    <span className="font-mono font-semibold">
                      {currency}{' '}
                      {Number(invoice.RoundingAmnt).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-300">
                  <span className="font-extrabold text-slate-900 text-sm">Grand Total</span>
                  <span className="font-black font-mono text-emerald-700 text-lg">
                    {currency}{' '}
                    {finalDocTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature & Approval Block */}
            <div className="pt-10 border-t border-slate-200 grid grid-cols-3 gap-8 text-xs text-slate-600 avoid-page-break">
              <div>
                <p className="font-bold text-slate-800">Prepared By:</p>
                <div className="mt-10 border-b border-slate-300 w-44"></div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {invoice.CreatedByName || 'Accounts Payable'}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-800">Checked & Verified:</p>
                <div className="mt-10 border-b border-slate-300 w-44"></div>
                <p className="mt-1 text-[11px] text-slate-500">Finance Department</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="font-bold text-slate-800">Authorized Signatory:</p>
                <div className="mt-10 border-b border-slate-300 w-44"></div>
                <p className="mt-1 text-[11px] text-slate-500">Chief Financial Officer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white/90 dark:bg-slate-800/90 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 dark:border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete AP Invoice
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete invoice{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {invoice.OrderCode || `#${invoice.ID}`}
                  </span>
                  ?
                </p>
              </div>
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30">
              This action will permanently delete this accounts payable record from the system.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APInvoiceReceiptView;
