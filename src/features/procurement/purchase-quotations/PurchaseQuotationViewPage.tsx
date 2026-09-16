import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePurchaseQuotation } from './api/usePurchaseQuotations';
import { PurchaseQuotationReceiptView } from './components/PurchaseQuotationReceiptView';
import { Spinner } from '../../../components/ui';

export const PurchaseQuotationViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id) : null;

  const { data: quotation, isLoading } = usePurchaseQuotation(numericId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-sm font-bold text-rose-500">Purchase Quotation not found.</p>
        <button
          onClick={() => navigate('/procurement/quotation')}
          className="px-4 py-2 text-xs font-bold rounded-xl border"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PurchaseQuotationReceiptView
        quotation={quotation}
        onBack={() => navigate('/procurement/quotation')}
      />
    </div>
  );
};

export default PurchaseQuotationViewPage;
