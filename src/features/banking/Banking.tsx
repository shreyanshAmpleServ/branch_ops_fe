import React from 'react';
import { Card, Button } from '../../components/ui';
import { Landmark, ArrowUpRight, ArrowDownRight, Building } from 'lucide-react';

export const Banking: React.FC = () => {
  const transactions = [
    { id: 'TXN-001', desc: 'Payment from Acme Corp', amount: '+$12,000', date: '2026-07-14', type: 'incoming' },
    { id: 'TXN-002', desc: 'Office Supplies', amount: '-$450', date: '2026-07-13', type: 'outgoing' },
    { id: 'TXN-003', desc: 'Software Subscriptions', amount: '-$1,200', date: '2026-07-12', type: 'outgoing' },
    { id: 'TXN-004', desc: 'Payment from Stark Industries', amount: '+$45,000', date: '2026-07-11', type: 'incoming' },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Banking Overview</h1>
        <div className="flex gap-2">
          <Button variant="ghost">Add Account</Button>
          <Button><Landmark className="h-4 w-4 mr-2" /> Make Transfer</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-primary to-indigo-600 text-white border-none shadow-lg shadow-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white/80">Main Operating Account</h3>
            <Building className="h-6 w-6 text-white/50" />
          </div>
          <p className="text-4xl font-bold mb-1">$124,500.00</p>
          <p className="text-sm text-white/60">**** **** **** 4567</p>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white/80">Savings Account</h3>
            <Building className="h-6 w-6 text-white/50" />
          </div>
          <p className="text-4xl font-bold mb-1">$50,000.00</p>
          <p className="text-sm text-white/60">**** **** **** 8821</p>
        </Card>
      </div>

      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>Recent Transactions</h2>
      <Card>
        <div className="space-y-4">
          {transactions.map(txn => (
            <div key={txn.id} className="flex items-center justify-between p-3 hover:bg-surface-hover rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${txn.type === 'incoming' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                  {txn.type === 'incoming' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{txn.desc}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{txn.date} · {txn.id}</p>
                </div>
              </div>
              <span className={`font-bold ${txn.type === 'incoming' ? 'text-success' : 'text-error'}`}>
                {txn.amount}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
