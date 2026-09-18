import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApInvoice } from './api/useApInvoices';
import { APInvoiceReceiptView } from './components/APInvoiceReceiptView';
import { Spinner } from '../../../components/ui';

export const APInvoiceViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id, 10) : null;

  const { data: invoice, isLoading, error } = useApInvoice(numericId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Spinner className="w-8 h-8 text-teal-600" />
        <p className="text-xs text-slate-500">Loading AP Invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-lg font-bold text-rose-600">AP Invoice Not Found</h2>
        <p className="text-xs text-slate-500">The requested AP invoice could not be loaded or does not exist.</p>
        <button
          onClick={() => navigate('/procurement/ap-invoice')}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl"
        >
          Back to AP Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <APInvoiceReceiptView
        invoice={invoice}
        onBack={() => navigate('/procurement/ap-invoice')}
      />
    </div>
  );
};
