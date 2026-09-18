import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGoodsReceipt } from './api/useGoodsReceipts';
import { GoodsReceiptReceiptView } from './components/GoodsReceiptReceiptView';
import { Spinner } from '../../../components/ui';

export const GoodsReceiptViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id, 10) : null;

  const { data: receipt, isLoading, error } = useGoodsReceipt(numericId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Spinner className="w-8 h-8 text-teal-600" />
        <p className="text-xs text-slate-500">Loading goods receipt details...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-lg font-bold text-rose-600">Goods Receipt Not Found</h2>
        <p className="text-xs text-slate-500">The requested goods receipt could not be loaded or does not exist.</p>
        <button
          onClick={() => navigate('/procurement/grpo')}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl"
        >
          Back to Goods Receipts
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <GoodsReceiptReceiptView
        receipt={receipt}
        onBack={() => navigate('/procurement/grpo')}
      />
    </div>
  );
};
