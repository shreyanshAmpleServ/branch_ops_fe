import React, { useRef } from 'react';
import type { PurchaseOrder } from '../api/usePurchaseOrders';
import { format } from 'date-fns';
import { ArrowLeft, Download, FileSpreadsheet, Paperclip, ExternalLink, Printer, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '../../../../components/ui';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';

import { getAttachmentUrl, getFileName } from '../../../../lib/api';

interface PurchaseOrderReceiptViewProps {
  order: PurchaseOrder;
  onBack: () => void;
}

export const PurchaseOrderReceiptView: React.FC<PurchaseOrderReceiptViewProps> = ({ order, onBack }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const currency = order.Currency || 'TZS';

  const handleDownloadPDF = () => {
    const element = printRef.current;
    if (!element) return;

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `Purchase_Order_${order.OrderCode || order.ID}.pdf`,
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
    const items = order.items?.map(item => ({
      'SNO': item.LineNum,
      'VENDOR': order.CustCode || '',
      'ITEM CODE': item.ItemCode || (item.ItemID ? `ITM-${item.ItemID}` : ''),
      'ITEM NAME': item.ItemName || '',
      'QTY': Number(item.Quantity || 0),
      'UOM': item.UoM || 'pcs',
      'UNIT PRICE': Number(item.UnitPrice || 0).toFixed(2),
      'DISCOUNT %': Number(item.DiscPrcnt || 0).toFixed(2),
      'TOTAL EXCLUSIVE': (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)).toFixed(2),
      'TAX AMOUNT': Number(item.LineTax || 0).toFixed(2),
      'TOTAL INCLUSIVE': Number(item.LineTotalLC || 0).toFixed(2),
      'WAREHOUSE': item.WhsCode || '',
      'PROJECT': item.project || '',
      'COST CENTER': item.cost_center || ''
    })) || [];

    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Order");
    XLSX.writeFile(wb, `Purchase_Order_${order.OrderCode || order.ID}.xlsx`);
  };

  const subtotal = order.items?.reduce((sum, item) => sum + (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)), 0) || 0;
  const headerDisc = Number(order.DiscPrcnt || 0);
  const discountAmount = subtotal * (headerDisc / 100);
  const amountInWords = "Tanzanian Shillings " + Number(order.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Only";

  const aprStatus = order.AprStatus || 'P';

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
              Purchase Order #{order.OrderCode || order.ID}
            </span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
              aprStatus === 'Y' || order.Status === 'O' || order.Status === 'Open'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : aprStatus === 'N' || order.Status === 'C' || order.Status === 'Closed'
                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
            }`}>
              {aprStatus === 'Y' ? <CheckCircle2 className="w-3.5 h-3.5" /> : aprStatus === 'N' ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {aprStatus === 'Y' ? 'Approved' : aprStatus === 'N' ? 'Rejected' : 'Pending Approval'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="secondary"
            icon={<Printer className="h-4 w-4" />}
            onClick={handlePrint}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold rounded-xl"
          >
            Print
          </Button>
          <Button
            variant="secondary"
            icon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
            onClick={handleDownloadExcel}
            className="hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-semibold rounded-xl"
          >
            Export Excel
          </Button>
          <Button
            variant="primary"
            icon={<Download className="h-4 w-4" />}
            onClick={handleDownloadPDF}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-semibold rounded-xl shadow-md"
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="flex justify-center">
        <div 
          ref={printRef}
          className="w-full max-w-[1100px] bg-white text-gray-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-gray-100 space-y-8 text-sm leading-relaxed"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header Branding */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-200 pb-6 gap-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center text-white font-bold text-xl shadow-md">
                  PO
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">PURCHASE ORDER</h1>
                  <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider">PROCUREMENT DEPARTMENT</p>
                </div>
              </div>
            </div>
            <div className="text-right sm:text-right w-full sm:w-auto">
              <div className="inline-block bg-teal-50 border border-teal-200 rounded-xl p-3 text-right">
                <div className="text-xs text-teal-700 font-bold uppercase tracking-wider">Order No</div>
                <div className="text-lg font-black text-teal-900">{order.OrderCode || `PO-${order.ID}`}</div>
                {order.RequestedNo && (
                  <div className="text-xs text-gray-500 font-medium">Ref / Base PR: {order.RequestedNo}</div>
                )}
                {(order as any).relation_from && (
                  <div className="text-[11px] text-teal-800 font-semibold">Relation: {(order as any).relation_from}</div>
                )}
              </div>
            </div>
          </div>

          {/* Info Card: Balanced 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/80 rounded-2xl p-6 border border-gray-200/80">
            {/* Left Column: Vendor & Order Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider border-b border-gray-200 pb-1">
                Vendor & Header Info
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="font-semibold text-gray-500">Vendor:</span>
                <span className="col-span-2 font-bold text-gray-900">{order.CustName || order.CustCode || 'N/A'}</span>

                <span className="font-semibold text-gray-500">Vendor Code:</span>
                <span className="col-span-2 text-gray-800 font-medium">{order.CustCode || 'N/A'}</span>

                {order.RequestType && (
                  <>
                    <span className="font-semibold text-gray-500">Request Type:</span>
                    <span className="col-span-2 text-gray-800 font-medium">{order.RequestType}</span>
                  </>
                )}

                {order.TypeRequest && (
                  <>
                    <span className="font-semibold text-gray-500">Type Request:</span>
                    <span className="col-span-2 text-gray-800 font-medium">{order.TypeRequest}</span>
                  </>
                )}

                {order.Department && (
                  <>
                    <span className="font-semibold text-gray-500">Department:</span>
                    <span className="col-span-2 text-gray-800 font-medium">{order.Department}</span>
                  </>
                )}

                {(order.ExpenseType || order.Expense_type) && (
                  <>
                    <span className="font-semibold text-gray-500">Expense Type:</span>
                    <span className="col-span-2 text-gray-800 font-medium">{order.ExpenseType || order.Expense_type}</span>
                  </>
                )}

                {order.TypePayment && (
                  <>
                    <span className="font-semibold text-gray-500">Payment Type:</span>
                    <span className="col-span-2 text-gray-800 font-medium">{order.TypePayment}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Dates & Status */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider border-b border-gray-200 pb-1">
                Dates & Status
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="font-semibold text-gray-500">Posting Date:</span>
                <span className="col-span-2 text-gray-800 font-medium">
                  {order.PostDate ? format(new Date(order.PostDate), 'dd MMM yyyy') : 'N/A'}
                </span>

                {order.PODate && (
                  <>
                    <span className="font-semibold text-gray-500">PO Date:</span>
                    <span className="col-span-2 text-gray-800 font-medium">
                      {format(new Date(order.PODate), 'dd MMM yyyy')}
                    </span>
                  </>
                )}

                {order.ReceiptDate && (
                  <>
                    <span className="font-semibold text-gray-500">Expected Receipt:</span>
                    <span className="col-span-2 text-gray-800 font-medium">
                      {format(new Date(order.ReceiptDate), 'dd MMM yyyy')}
                    </span>
                  </>
                )}

                <span className="font-semibold text-gray-500">Doc Status:</span>
                <span className="col-span-2 text-gray-800 font-medium capitalize">
                  {order.Status === 'O' ? 'Open' : order.Status === 'C' ? 'Closed' : order.Status || 'Pending'}
                </span>

                <span className="font-semibold text-gray-500">Created By:</span>
                <span className="col-span-2 text-gray-800 font-medium">{order.CreatedByName || `User #${order.CreatedBy || '-'}`}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Order Material Lines & Details
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-gray-100 text-gray-700 font-bold border-b border-gray-200">
                    <th className="py-3 px-3 text-center w-12">#</th>
                    <th className="py-3 px-4">Item Code & Name</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-3 text-center">UoM</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Disc %</th>
                    <th className="py-3 px-3 text-right">Tax Amount</th>
                    <th className="py-3 px-4 text-right">Total ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => {
                      const qty = Number(item.Quantity || 0);
                      const price = Number(item.UnitPrice || 0);
                      const disc = Number(item.DiscPrcnt || 0);
                      const lineTax = Number(item.LineTax || 0);
                      const lineTotal = Number(item.LineTotalLC || 0);

                      return (
                        <tr key={item.ID || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-3 text-center font-medium text-gray-500">{item.LineNum || idx + 1}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            <div>{item.ItemName || 'Unnamed Item'}</div>
                            {item.ItemCode && <div className="text-[10px] text-gray-400">{item.ItemCode}</div>}
                            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-1">
                              {item.WhsCode && <span>Whs: {item.WhsCode}</span>}
                              {item.project && <span>Prj: {item.project}</span>}
                              {item.cost_center && <span>CC: {item.cost_center}</span>}
                            </div>
                            {item.Remarks && <div className="text-[10px] text-gray-500 italic mt-0.5">{item.Remarks}</div>}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-gray-800">{qty}</td>
                          <td className="py-3 px-3 text-center text-gray-600">{item.UoM || 'pcs'}</td>
                          <td className="py-3 px-3 text-right text-gray-700">{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-3 text-right text-gray-600">{disc > 0 ? `${disc}%` : '-'}</td>
                          <td className="py-3 px-3 text-right text-gray-600">{lineTax > 0 ? lineTax.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                          <td className="py-3 px-4 text-right font-bold text-teal-800">{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400 italic">
                        No line items found.
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
              {order.Remarks && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-1">
                  <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">Remarks / Notes</div>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{order.Remarks}</p>
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
                <span className="font-semibold text-gray-800">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
              </div>
              {headerDisc > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Header Discount ({headerDisc}%):</span>
                  <span className="font-semibold">-{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-600">
                <span>Tax Total:</span>
                <span className="font-semibold text-gray-800">{Number(order.TaxTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
              </div>
              {Number(order.Freight || 0) > 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Freight Charges:</span>
                  <span className="font-semibold text-gray-800">{Number(order.Freight).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-3 flex justify-between items-center text-sm font-black text-gray-900">
                <span>Grand Total:</span>
                <span className="text-lg text-teal-700">{Number(order.DocTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          {order.attachments && order.attachments.length > 0 && (
            <div className="space-y-3 border-t border-gray-200 pt-4 avoid-page-break">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <Paperclip className="h-4 w-4 text-teal-600" />
                <span>Attachments ({order.attachments.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.attachments.map((att, idx) => {
                  const url = getAttachmentUrl(att.Attachment);
                  const filename = getFileName(att.Attachment);
                  return (
                    <a
                      key={att.ID || idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-teal-50 hover:border-teal-200 transition-all text-xs group"
                    >
                      <span className="font-medium text-gray-700 group-hover:text-teal-900 truncate max-w-[80%]">
                        {filename}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-teal-600 flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signatures & Approval Footer */}
          <div className="border-t border-gray-200 pt-8 mt-12 grid grid-cols-3 gap-6 text-center text-xs avoid-page-break">
            <div className="space-y-8">
              <div className="border-b border-gray-300 pb-1 font-semibold text-gray-700">Prepared By</div>
              <div className="text-gray-500 font-medium">{order.CreatedByName || `User #${order.CreatedBy || '-'}`}</div>
            </div>
            <div className="space-y-8">
              <div className="border-b border-gray-300 pb-1 font-semibold text-gray-700">Checked By</div>
              <div className="text-gray-400 italic">Signature & Date</div>
            </div>
            <div className="space-y-8">
              <div className="border-b border-gray-300 pb-1 font-semibold text-gray-700">Authorized Approval</div>
              <div className="text-gray-400 italic">Signature & Stamp</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
