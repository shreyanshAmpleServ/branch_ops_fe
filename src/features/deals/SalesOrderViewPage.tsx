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
  Handshake,
  ExternalLink,
  Truck,
} from 'lucide-react';
import { useSalesOrder } from './api/useSalesOrders';
import { Button, Spinner } from '../../components/ui';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import '../procurement/purchase-quotations/components/view.css';

export const SalesOrderViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: order, isLoading, error } = useSalesOrder(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <Spinner className="w-8 h-8 text-teal-600" />
        <p className="text-xs text-slate-500 font-medium">Loading sales order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-rose-600 font-semibold">Sales Order not found.</p>
        <Button onClick={() => navigate('/orders')}>Back to Sales Orders</Button>
      </div>
    );
  }

  const currency = order.Currency || 'TZS';

  const handleDownloadPDF = () => {
    const element = printRef.current;
    if (!element) return;

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3] as [number, number, number, number],
      filename: `Sales_Order_${order.OrderCode || order.ID}.pdf`,
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
    const items = order.items?.map((item, idx) => ({
      'SNO': item.LineNum || idx + 1,
      'CUSTOMER': order.CustCode || '',
      'ITEM CODE': item.ItemCode || (item.Items?.Code ? item.Items.Code : `ITM-${item.ItemID}`),
      'ITEM NAME': item.ItemName || item.Items?.Name || '',
      'QTY': Number(item.Quantity || 0),
      'DELIVERED QTY': Number(item.DeliveredQty || 0),
      'UOM': item.UoM || 'pcs',
      'UNIT PRICE': Number(item.UnitPrice || 0).toFixed(2),
      'DISCOUNT %': Number(item.DiscPrcnt || 0).toFixed(2),
      'TOTAL EXCLUSIVE': (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)).toFixed(2),
      'TAX AMOUNT': Number(item.LineTax || 0).toFixed(2),
      'TOTAL INCLUSIVE': Number(item.LineTotalLC || 0).toFixed(2),
      'WAREHOUSE': item.Warehouses?.Name || (item.WhsCode ? `Whs ${item.WhsCode}` : ''),
      'PROJECT': item.project || ''
    })) || [];

    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Order');
    XLSX.writeFile(wb, `Sales_Order_${order.OrderCode || order.ID}.xlsx`);
  };

  const subtotal = order.items?.reduce(
    (sum, item) => sum + (Number(item.Quantity || 0) * Number(item.UnitPrice || 0)),
    0
  ) || Number(order.TotalBefDisc || 0);

  const headerDisc = Number(order.DiscPrcnt || 0);
  const discountAmount = subtotal * (headerDisc / 100);
  const totalExclusive = subtotal - discountAmount;
  const taxTotal = Number(order.TaxTotal || 0);
  const finalDocTotal = Number(order.DocTotal || (totalExclusive + taxTotal));

  const amountInWords = "Tanzanian Shillings " + finalDocTotal.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " Only";

  const rawStatus = (order.Status || 'O').toUpperCase();
  const isClosed = rawStatus === 'C' || rawStatus === 'CLOSED' || rawStatus === 'L';
  const isApproved = rawStatus === 'A' || rawStatus === 'APPROVED';

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full animate-fade-in pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/orders')}
            className="hover:scale-95 transition-all text-xs font-bold rounded-xl"
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
                Sales Order Details
              </h2>
              <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                {order.OrderCode || `SO/${order.ID}`}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Official Sales Order Document View
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="secondary"
            icon={<Edit2 className="h-4 w-4 text-teal-600" />}
            onClick={() => navigate(`/orders/edit/${order.ID}`)}
            className="text-xs font-bold rounded-xl hover:scale-95 transition-all text-slate-700 dark:text-slate-200"
          >
            Edit
          </Button>
          <Button
            onClick={() => navigate(`/invoice/new?copyFromOrder=${order.ID}`)}
            className="bg-teal-700 hover:bg-teal-800 text-white border-0 shadow-sm transition-all hover:scale-95 text-xs font-bold px-3.5 rounded-xl flex items-center gap-1.5"
          >
            <Receipt className="h-4 w-4" /> Generate AR Invoice
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
                SALES &amp; DISTRIBUTION MODULE
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight uppercase text-white">
                SALES ORDER
              </h1>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 uppercase tracking-wider">
                {isClosed ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Fulfilled / Closed
                  </>
                ) : isApproved ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-300" /> Approved Order
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-300" /> Confirmed / Open
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
                    <span className="text-slate-500">Order Code</span>
                    <span className="font-bold text-[#005f73] font-mono text-sm">
                      {order.OrderCode || `SO/${order.ID}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Customer</span>
                    <span className="font-bold text-slate-800 truncate max-w-[220px]" title={order.CustName || order.CustCode || ''}>
                      {order.CustName ? `${order.CustName} (${order.CustCode})` : order.CustCode || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Customer PO / Ref</span>
                    <span className="font-semibold text-slate-700">{order.CustRefNo || '—'}</span>
                  </div>
                  {order.QuotationCode && (
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Base Quotation</span>
                      <Link
                        to={order.QuotationId ? `/quotations/view/${order.QuotationId}` : '/quotations'}
                        className="font-mono font-bold text-teal-600 hover:underline"
                      >
                        {order.QuotationCode}
                      </Link>
                    </div>
                  )}
                  {order.SAPDocNum && (
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">SAP Doc Number</span>
                      <span className="font-mono font-bold text-slate-700">{order.SAPDocNum}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Order Date</span>
                    <span className="font-semibold text-slate-700">
                      {order.PostDate ? format(new Date(order.PostDate), 'yyyy-MM-dd') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Delivery Due Date</span>
                    <span className="font-semibold text-slate-700">
                      {order.DueDate ? format(new Date(order.DueDate), 'yyyy-MM-dd') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Created By</span>
                    <span className="font-semibold text-slate-700">{order.CreatedByName || 'Sales Representative'}</span>
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
                  {order.items?.map((item, idx) => {
                    const qty = Number(item.Quantity || 0);
                    const price = Number(item.UnitPrice || 0);
                    const disc = Number(item.DiscPrcnt || 0);
                    const itemTotalExcl = qty * price * (1 - disc / 100);
                    const taxAmt = Number(item.LineTax || 0);
                    const itemTotalIncl = Number(item.LineTotalLC || (itemTotalExcl + taxAmt));
                    const itemCode = item.ItemCode || (item.Items?.Code ? item.Items.Code : (item.ItemID ? `ITM-${item.ItemID}` : '—'));
                    const itemName = item.ItemName || item.Items?.Name || '—';
                    const whsName = item.Warehouses?.Name || (item.WhsCode ? `Whs ${item.WhsCode}` : 'Default Whs');

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                          {String(item.LineNum || idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-600">{order.CustCode || '—'}</td>
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
                  {(!order.items || order.items.length === 0) && (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 italic">No line items found in this order</td>
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
                    Remarks &amp; Delivery Instructions
                  </span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                    {order.Remarks || 'Standard commercial sales terms and delivery conditions apply.'}
                  </p>
                </div>

                {/* Transport / Driver details */}
                {(order.VehicleId || order.DriverName) && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs flex items-center gap-3">
                    <Truck className="h-5 w-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800">Transport Logistics: </span>
                      <span className="text-slate-600">
                        {order.VehicleId && `Vehicle: ${order.VehicleId}`}
                        {order.VehicleId && order.DriverName && ' | '}
                        {order.DriverName && `Driver: ${order.DriverName}`}
                      </span>
                    </div>
                  </div>
                )}

                {order.ar_invoices && order.ar_invoices.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      Generated AR Invoices ({order.ar_invoices.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {order.ar_invoices.map((inv) => (
                        <Link
                          key={inv.ID}
                          to={`/invoice/view/${inv.ID}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-all"
                        >
                          <Receipt className="h-3.5 w-3.5 text-teal-600" />
                          <span>{inv.InvoiceCode || `Invoice #${inv.ID}`}</span>
                          <ExternalLink className="h-3 w-3 text-teal-400" />
                        </Link>
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
                  {order.CreatedByName || 'Sales Executive'}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-800">Logistics &amp; Dispatch:</p>
                <div className="mt-10 border-b border-slate-300 w-44"></div>
                <p className="mt-1 text-[11px] text-slate-500">Warehouse Operations</p>
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

export default SalesOrderViewPage;
