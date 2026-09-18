import React, { useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Printer,
  Receipt,
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
} from 'lucide-react';
import { useARInvoice } from './api/useARInvoices';
import { Button, Spinner, Badge } from '../../components/ui';

export const ARInvoiceViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: invoice, isLoading, error } = useARInvoice(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <Spinner className="w-8 h-8 text-teal-600" />
        <p className="text-xs text-slate-500">Loading AR invoice details...</p>
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

  const handlePrint = () => {
    window.print();
  };

  const status = (invoice.Status || 'O').toUpperCase();
  const isPaid = status === 'C' || status === 'CLOSED' || status === 'PAID';

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-20">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Link
            to="/invoice"
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Tax Invoice #{invoice.InvoiceCode || `INV/${invoice.ID}`}
              </h1>
              <Badge variant={isPaid ? 'success' : 'warning'} dot>
                {isPaid ? 'Paid' : 'Unpaid / Open'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Billed to {invoice.CustName} ({invoice.CustCode})
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
            onClick={() => navigate(`/invoice/edit/${invoice.ID}`)}
            className="border-slate-200 dark:border-slate-700 text-xs py-2 px-4 rounded-xl flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4 text-indigo-600" /> Edit
          </Button>
        </div>
      </div>

      {/* Printable Invoice Card */}
      <div ref={printRef} className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-8">
        {/* Document Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 dark:border-slate-700/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-teal-600 font-bold text-xl mb-1">
              <Receipt className="w-6 h-6" /> COMMERCIAL TAX INVOICE
            </div>
            <p className="text-xs text-slate-400">Accounts Receivable (AR) Sales Invoice</p>
          </div>

          <div className="text-right sm:text-right space-y-1 text-xs">
            <div>
              <span className="text-slate-400">Invoice Number: </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {invoice.InvoiceCode || `INV/${invoice.ID}`}
              </span>
            </div>
            {invoice.SAPDocNum && (
              <div>
                <span className="text-slate-400">SAP Doc #: </span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-100">
                  {invoice.SAPDocNum}
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-400">Invoice Date: </span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {invoice.PostDate ? new Date(invoice.PostDate).toLocaleDateString() : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Payment Due: </span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {invoice.DueDate ? new Date(invoice.DueDate).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Origin Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Billed Customer
            </h3>
            <div className="text-sm font-semibold text-teal-700 dark:text-teal-400">{invoice.CustName}</div>
            <div className="text-slate-500">Customer Code: {invoice.CustCode}</div>
            {invoice.Address && <div className="text-slate-500">{invoice.Address}</div>}
            {invoice.CustRefNo && (
              <div className="text-slate-500 font-medium">Customer PO Ref: {invoice.CustRefNo}</div>
            )}
            {invoice.order && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">Origin Sales Order: </span>
                <Link
                  to={`/deals/view/${invoice.order.ID}`}
                  className="underline text-teal-600 font-semibold"
                >
                  {invoice.order.OrderCode || `Order #${invoice.order.ID}`}
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-teal-600" /> Payment & Dispatch Status
            </h3>
            <div className="text-slate-500">Billed By: {invoice.CreatedByName || 'Billing Officer'}</div>
            {invoice.VehicleId && <div className="text-slate-500">Vehicle / Truck No: {invoice.VehicleId}</div>}
            {invoice.DriverName && <div className="text-slate-500">Driver: {invoice.DriverName}</div>}
            <div>
              <span className="text-slate-400">Payment Terms: </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {isPaid ? 'Fully Paid / Settled' : 'Open Receivable (Net 15/30)'}
              </span>
            </div>
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
              {(invoice.items || []).map((item, idx) => (
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
                    {item.WhsCode ? `Whs ${item.WhsCode}` : 'Default'}
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
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Invoice Remarks & Banking:</h4>
            <p className="whitespace-pre-line">{invoice.Remarks || 'Payment due within agreed credit period. Wire payments to registered company bank account.'}</p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-medium">${Number(invoice.TotalBefDisc || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax Total:</span>
              <span className="font-medium">${Number(invoice.TaxTotal || 0).toFixed(2)}</span>
            </div>
            {Number(invoice.DiscPrcnt || 0) > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Discount ({invoice.DiscPrcnt}%):</span>
                <span className="font-medium text-emerald-600">Applied</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-teal-600 dark:text-teal-400 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span>Invoice Total:</span>
              <span>${Number(invoice.DocTotal || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARInvoiceViewPage;
