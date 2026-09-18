import React, { useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Printer,
  Receipt,
  Handshake,
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Truck,
} from 'lucide-react';
import { useSalesOrder } from './api/useSalesOrders';
import { Button, Spinner, Badge } from '../../components/ui';

export const SalesOrderViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: order, isLoading, error } = useSalesOrder(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <Spinner className="w-8 h-8 text-teal-600" />
        <p className="text-xs text-slate-500">Loading sales order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-rose-600 font-semibold">Sales Order not found.</p>
        <Button onClick={() => navigate('/deals')}>Back to Sales Orders</Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const status = (order.Status || 'O').toUpperCase();
  const isInvoiced = status === 'C' || status === 'CLOSED';

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-20">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Link
            to="/deals"
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Sales Order #{order.OrderCode || `SO/${order.ID}`}
              </h1>
              <Badge variant={isInvoiced ? 'success' : 'warning'} dot>
                {isInvoiced ? 'Invoiced / Closed' : 'Open'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customer: {order.CustName} ({order.CustCode})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handlePrint}
            className="border-slate-200 dark:border-slate-700 text-xs py-2 px-4 rounded-xl flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/deals/edit/${order.ID}`)}
            className="border-slate-200 dark:border-slate-700 text-xs py-2 px-4 rounded-xl flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4 text-indigo-600" /> Edit
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/invoice/new?copyFromOrder=${order.ID}`)}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md flex items-center gap-2"
          >
            <Receipt className="w-4 h-4" /> Generate AR Invoice
          </Button>
        </div>
      </div>

      {/* Printable Order Card */}
      <div ref={printRef} className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-8">
        {/* Document Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 dark:border-slate-700/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-teal-600 font-bold text-xl mb-1">
              <Handshake className="w-6 h-6" /> SALES ORDER
            </div>
            <p className="text-xs text-slate-400">Confirmed customer order for delivery and billing</p>
          </div>

          <div className="text-right sm:text-right space-y-1 text-xs">
            <div>
              <span className="text-slate-400">Order Number: </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {order.OrderCode || `SO/${order.ID}`}
              </span>
            </div>
            {order.SAPDocNum && (
              <div>
                <span className="text-slate-400">SAP Doc #: </span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-100">
                  {order.SAPDocNum}
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-400">Order Date: </span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {order.PostDate ? new Date(order.PostDate).toLocaleDateString() : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Delivery Due: </span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {order.DueDate ? new Date(order.DueDate).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Logistics Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Customer & Shipping Details
            </h3>
            <div className="text-sm font-semibold text-teal-700 dark:text-teal-400">{order.CustName}</div>
            <div className="text-slate-500">Customer Code: {order.CustCode}</div>
            {order.Address && <div className="text-slate-500">Delivery Address: {order.Address}</div>}
            {order.CustRefNo && (
              <div className="text-slate-500 font-medium">Customer PO Ref: {order.CustRefNo}</div>
            )}
            {order.quotation && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">Origin Quotation: </span>
                <Link
                  to={`/quotations/view/${order.quotation.ID}`}
                  className="underline text-teal-600 font-semibold"
                >
                  {order.quotation.QuotCode || `QT/${order.quotation.ID}`}
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-teal-600" /> Logistics & Processing
            </h3>
            <div className="text-slate-500">Prepared By: {order.CreatedByName || 'Sales Staff'}</div>
            {order.VehicleId && <div className="text-slate-500">Vehicle / Truck No: {order.VehicleId}</div>}
            {order.DriverName && <div className="text-slate-500">Driver: {order.DriverName}</div>}
            {order.ar_invoices && order.ar_invoices.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-medium text-emerald-600">Issued Invoices: </span>
                {order.ar_invoices.map(inv => (
                  <Link
                    key={inv.ID}
                    to={`/invoice/view/${inv.ID}`}
                    className="underline text-teal-600 ml-1 font-semibold"
                  >
                    {inv.InvoiceCode || `INV #${inv.ID}`}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-3 w-12">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 w-28">Warehouse</th>
                <th className="py-2.5 px-3 w-24 text-right">Qty</th>
                <th className="py-2.5 px-3 w-20 text-center">UoM</th>
                <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                <th className="py-2.5 px-3 w-20 text-right">Disc %</th>
                <th className="py-2.5 px-3 w-20 text-right">Tax %</th>
                <th className="py-2.5 px-3 w-28 text-right">Total ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(order.items || []).map((item, idx) => (
                <tr key={item.ID || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="py-3 px-3 text-slate-400 font-medium">{item.LineNum || idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {item.ItemName || item.Items?.Name || '—'}
                    </div>
                    {(item.ItemCode || item.Items?.Code) && (
                      <div className="text-[11px] text-slate-400">{item.ItemCode || item.Items?.Code}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {item.Warehouses?.Name || (item.WhsCode ? `Whs ${item.WhsCode}` : 'Default')}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white">
                    {Number(item.Quantity || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500">{item.UoM || 'Pcs'}</td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                    ${Number(item.UnitPrice || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">{Number(item.DiscPrcnt || 0)}%</td>
                  <td className="py-3 px-3 text-right text-slate-500">{Number(item.VATPer || 0)}%</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    ${Number(item.LineTotalLC || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start pt-6 border-t border-slate-100 dark:border-slate-800 gap-6">
          <div className="max-w-md text-xs text-slate-500">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Delivery Notes:</h4>
            <p className="whitespace-pre-line">{order.Remarks || 'Standard dispatch and delivery terms apply.'}</p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-medium">${Number(order.TotalBefDisc || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax Total:</span>
              <span className="font-medium">${Number(order.TaxTotal || 0).toFixed(2)}</span>
            </div>
            {Number(order.DiscPrcnt || 0) > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Discount ({order.DiscPrcnt}%):</span>
                <span className="font-medium text-emerald-600">Applied</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-teal-600 dark:text-teal-400 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span>Grand Total:</span>
              <span>${Number(order.DocTotal || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderViewPage;
