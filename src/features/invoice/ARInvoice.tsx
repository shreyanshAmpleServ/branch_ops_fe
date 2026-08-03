import React from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Receipt, CreditCard, Download } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import type { RowAction } from '../../components/table/DataTable';

interface Invoice {
  id: string;
  customer: string;
  amount: string;
  date: string;
  dueDate: string;
  status: string;
}

export const ARInvoice: React.FC = () => {
  const invoices: Invoice[] = [
    { id: 'INV-001', customer: 'Global Tech', amount: '$5,400', date: '2026-07-01', dueDate: '2026-07-15', status: 'Unpaid' },
    { id: 'INV-002', customer: 'Acme Corp', amount: '$12,000', date: '2026-06-25', dueDate: '2026-07-10', status: 'Overdue' },
    { id: 'INV-003', customer: 'Prime Logistics', amount: '$3,200', date: '2026-06-15', dueDate: '2026-06-30', status: 'Paid' },
  ];

  // Define Columns
  const columns: ColumnDef<Invoice, unknown>[] = [
    {
      accessorKey: 'id',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => <span style={{ color: 'var(--color-text)' }}>{row.original.customer}</span>,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <span className="font-bold" style={{ color: 'var(--color-text)' }}>{row.original.amount}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => <span style={{ color: 'var(--color-text-secondary)' }}>{row.original.date}</span>,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => <span style={{ color: 'var(--color-text-secondary)' }}>{row.original.dueDate}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={status === 'Paid' ? 'success' : status === 'Overdue' ? 'error' : 'warning'} dot>
            {status}
          </Badge>
        );
      },
    },
  ];

  // Define Row Actions
  const rowActions: RowAction<Invoice>[] = [
    {
      label: 'Record Payment',
      icon: <CreditCard className="h-3.5 w-3.5" />,
      onClick: (row) => console.log('Payment', row.id),
    },
    {
      label: 'Download Invoice',
      icon: <Download className="h-3.5 w-3.5" />,
      onClick: (row) => console.log('Download', row.id),
    },
  ];

  return (
    <div className="page-container p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Receipt className="h-7 w-7 text-primary" /> A/R Invoices
          </h1>
          <p className="text-sm opacity-70 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Track and process sales accounts receivable invoices.
          </p>
        </div>
        <Button><Receipt className="h-4 w-4 mr-2" /> Create Invoice</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-success/10 border-success/20 p-5">
          <p className="text-xs text-success font-bold uppercase tracking-wider">Total Paid</p>
          <p className="text-3xl font-black mt-1 text-success">$45,200</p>
        </Card>
        <Card className="bg-warning/10 border-warning/20 p-5">
          <p className="text-xs text-warning font-bold uppercase tracking-wider">Total Unpaid</p>
          <p className="text-3xl font-black mt-1 text-warning">$18,400</p>
        </Card>
        <Card className="bg-error/10 border-error/20 p-5">
          <p className="text-xs text-error font-bold uppercase tracking-wider">Total Overdue</p>
          <p className="text-3xl font-black mt-1 text-error">$12,000</p>
        </Card>
      </div>

      <DataTable
        data={invoices}
        columns={columns}
        rowActions={rowActions}
        enableRowSelection
        enableExport
        exportFileName="ar-invoices-list"
        enableViewToggle
        defaultViewMode="table"
      />
    </div>
  );
};
export default ARInvoice;
