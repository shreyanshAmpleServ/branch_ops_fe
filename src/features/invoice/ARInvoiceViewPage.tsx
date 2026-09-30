import React, { useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Receipt,
  ExternalLink,
  CreditCard,
  Truck,
} from 'lucide-react';
import { useARInvoice } from './api/useARInvoices';
import { Button, Spinner } from '../../components/ui';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import '../procurement/purchase-quotations/components/view.css';

export const ARInvoiceViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: invoice, isLoading, error } = useARInvoice(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <Spinner className="w-8 h-8 text-teal-600" />
        <p className="text-xs text-slate-500 font-medium">Loading AR invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-rose-600 font-semibold">AR Invoice not found.</p>
        <Button onClick={() => navigate('/invoice')}>Back to AR Invoices</Button>
      </div>
    );
  }

  const currency = invoice.Currency || 'TZS';

  const handleDownloadPDF = () => {
    const element = printRef.current;
    if (!element) return;

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3] as [number, number, number, number],
      filename: `AR_Invoice_${invoice.InvoiceCode || invoice.ID}.pdf`,
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
    const items = invoice.items?.map((item, idx) => ({
      'SNO': item.LineNum || idx + 1,
      'CUSTOMER': invoice.CustCode || '',
      'ITEM CODE': item.ItemCode || (item.Items?.Code ? item.Items.Code : `ITM-${item.ItemID}`),
      'ITEM NAME': item.ItemName || item.Items?.Name || '',
      'QTY': Number(item.Quantity || 0),
      'UOM': item.UoM || 'pcs',
      'UNIT PRICE': Number(item.UnitPrice || 0).toFixed(2),
      'DISCOUNT %': Number(item.DiscPrcnt || 0).toFixed(2),
      'TOTAL EXCLUSIVE': (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)).toFixed(2),
      'TAX AMOUNT': Number(item.LineTax || 0).toFixed(2),
      'TOTAL INCLUSIVE': Number(item.LineTotalLC || 0).toFixed(2),
      'WAREHOUSE': item.WhsCode ? `Whs ${item.WhsCode}` : '',
      'PROJECT': item.project || ''
    })) || [];

    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AR Invoice');
    XLSX.writeFile(wb, `AR_Invoice_${invoice.InvoiceCode || invoice.ID}.xlsx`);
  };

  const subtotal = invoice.items?.reduce(
    (sum, item) => sum + (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)),
    0
  ) || Number(invoice.TotalBefDisc || 0);

  const headerDisc = Number(invoice.DiscPrcnt || 0);
  const discountAmount = subtotal * (headerDisc / 100);
  const totalExclusive = subtotal - discountAmount;
  const taxTotal = Number(invoice.TaxTotal || 0);
  const finalDocTotal = Number(invoice.DocTotal || (totalExclusive + taxTotal));

  const amountInWords = "Tanzanian Shillings " + finalDocTotal.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " Only";

  const status = (invoice.Status || 'O').toUpperCase();
  const isPaid = status === 'C' || status === 'CLOSED' || status === 'PAID';

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full animate-fade-in pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/invoice')}
            className="hover:scale-95 transition-all text-xs font-bold rounded-xl"
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
                A/R Tax Invoice Details
              </h2>
              <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                {invoice.InvoiceCode || `INV/${invoice.ID}`}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Official Commercial Tax Invoice Document View
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="secondary"
            icon={<Edit2 className="h-4 w-4 text-teal-600" />}
            onClick={() => navigate(`/invoice/edit/${invoice.ID}`)}
            className="text-xs font-bold rounded-xl hover:scale-95 transition-all text-slate-700 dark:text-slate-200"
          >
            Edit
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

      {/* Printable Area Container */}
      <div className="flex justify-center overflow-x-auto pb-8 w-full">
        <div
          ref={printRef}
          className="purchase-quotation-print printable-voucher sales-document-print bg-white text-slate-800 shadow-2xl rounded-2xl border border-slate-200 min-w-[920px] w-full max-w-[1140px] mx-auto shrink-0 overflow-hidden"
          style={{ position: 'relative' }}
        >
          {/* Header Banner */}
          <div className="w-full bg-gradient-to-r from-[#005f73] via-[#0A9396] to-[#94D2BD] text-white px-10 py-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200">
                COMMERCIAL &amp; FINANCE MODULE
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight uppercase text-white">
                TAX INVOICE (A/R)
              </h1>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 uppercase tracking-wider">
                {isPaid ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Paid in Full
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-300" /> Payment Due
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
                        5th Floor, IT Plaza, Ohio Street/Garden Avenue<br />
                        P.O.Box 20419 Dar es Salaam, Tanzania
                      </p>
                      <p className="text-slate-500 text-[11px] pt-1">
                        Phone: <span className="font-semibold text-slate-700">+255-22-2112161</span> | Email:{' '}
                        <span className="font-semibold text-slate-700">sales@doubleclick.co.tz</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200/60 text-xs bg-white/60 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">TIN Number</span>
                    <span className="font-extrabold text-slate-800 font-mono text-xs">TIN12345</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">VRN Number</span>
                    <span className="font-extrabold text-slate-800 font-mono text-xs">VRN12345</span>
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
                    <span className="text-slate-500">Invoice Number</span>
                    <span className="font-bold text-[#005f73] font-mono text-sm">
                      {invoice.InvoiceCode || `INV/${invoice.ID}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Customer</span>
                    <span className="font-bold text-slate-800 truncate max-w-[220px]" title={invoice.CustName || invoice.CustCode || ''}>
                      {invoice.CustName ? `${invoice.CustName} (${invoice.CustCode})` : invoice.CustCode || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Customer PO / Ref</span>
                    <span className="font-semibold text-slate-700">{invoice.CustRefNo || '—'}</span>
                  </div>
                  {invoice.order && (
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Origin Sales Order</span>
                      <Link
                        to={`/orders/view/${invoice.order.ID}`}
                        className="font-mono font-bold text-teal-600 hover:underline"
                      >
                        {invoice.order.OrderCode || `Order #${invoice.order.ID}`}
                      </Link>
                    </div>
                  )}
                  {invoice.SAPDocNum && (
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">SAP Doc Number</span>
                      <span className="font-mono font-bold text-slate-700">{invoice.SAPDocNum}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Invoice Date</span>
                    <span className="font-semibold text-slate-700">
                      {invoice.PostDate ? format(new Date(invoice.PostDate), 'yyyy-MM-dd') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Payment Due Date</span>
                    <span className="font-semibold text-rose-600">
                      {invoice.DueDate ? format(new Date(invoice.DueDate), 'yyyy-MM-dd') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Billed By</span>
                    <span className="font-semibold text-slate-700">{invoice.CreatedByName || 'Finance Accounts'}</span>
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
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Item Code</th>
                    <th className="py-3 px-3">Item Description</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-3 text-center">UoM</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Excl. Total</th>
                    <th className="py-3 px-3 text-right">Tax (VAT)</th>
                    <th className="py-3 px-3 text-right">Incl. Total</th>
                    <th className="py-3 px-3">Warehouse</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                  {invoice.items?.map((item, idx) => {
                    const qty = Number(item.Quantity || 0);
                    const price = Number(item.UnitPrice || 0);
                    const disc = Number(item.DiscPrcnt || 0);
                    const itemTotalExcl = qty * price * (1 - disc / 100);
                    const taxAmt = Number(item.LineTax || 0);
                    const itemTotalIncl = Number(item.LineTotalLC || (itemTotalExcl + taxAmt));
                    const itemCode = item.ItemCode || (item.Items?.Code ? item.Items.Code : (item.ItemID ? `ITM-${item.ItemID}` : '—'));
                    const itemName = item.ItemName || item.Items?.Name || '—';
                    const whsName = item.WhsCode ? `Whs ${item.WhsCode}` : 'Default Whs';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                          {String(item.LineNum || idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-600">{invoice.CustCode || '—'}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-[#005f73]">{itemCode}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          <div>{itemName}</div>
                          {item.Remarks && (
                            <div className="text-[10px] text-slate-400 font-normal italic mt-0.5">
                              {item.Remarks}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{item.UoM || 'pcs'}</td>
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
                        <td className="py-2.5 px-3 text-slate-500">{whsName}</td>
                      </tr>
                    );
                  })}
                  {(!invoice.items || invoice.items.length === 0) && (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 italic">No line items found in this invoice</td>
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

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                    Payment Instructions &amp; Bank Remittance
                  </span>
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 leading-relaxed">
                    <p className="font-semibold text-slate-700">Please make payment to:</p>
                    <p>Bank: <span className="font-medium text-slate-800">CRDB Bank Plc</span> | Account Name: <span className="font-medium text-slate-800">DoubleClick Company Ltd</span></p>
                    <p>Account No (TZS): <span className="font-mono font-bold text-slate-800">0150245678900</span> | SWIFT: <span className="font-mono text-slate-800">CORUTZTZ</span></p>
                    {invoice.Remarks && (
                      <p className="pt-1 text-slate-500 border-t border-slate-200/60 mt-1 whitespace-pre-wrap">
                        {invoice.Remarks}
                      </p>
                    )}
                  </div>
                </div>

                {/* Transport / Driver details if present */}
                {(invoice.VehicleId || invoice.DriverName || invoice.TransporterName) && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs flex items-center gap-3">
                    <Truck className="h-5 w-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800">Delivery Information: </span>
                      <span className="text-slate-600">
                        {invoice.VehicleId && `Vehicle: ${invoice.VehicleId}`}
                        {invoice.VehicleId && invoice.DriverName && ' | '}
                        {invoice.DriverName && `Driver: ${invoice.DriverName}`}
                        {invoice.TransporterName && ` (${invoice.TransporterName})`}
                      </span>
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
                      -{currency} {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Before Tax</span>
                  <span className="font-mono font-semibold">
                    {currency} {totalExclusive.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>VAT / Tax Total</span>
                  <span className="font-mono font-semibold">
                    {currency} {taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-300">
                  <span className="font-extrabold text-slate-900 text-sm">Grand Total</span>
                  <span className="font-black font-mono text-emerald-700 text-lg">
                    {currency} {finalDocTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  {invoice.CreatedByName || 'Accounts Billing'}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-800">Verified By:</p>
                <div className="mt-10 border-b border-slate-300 w-44"></div>
                <p className="mt-1 text-[11px] text-slate-500">Finance &amp; Accounts Head</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="font-bold text-slate-800">Customer Receiver:</p>
                <div className="mt-10 border-b border-slate-300 w-44"></div>
                <p className="mt-1 text-[11px] text-slate-500">Authorized Signature &amp; Stamp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARInvoiceViewPage;
