import React from 'react';
import { Badge, Button } from '../../components/ui';
import { Plus, Download } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import type { RowAction } from '../../components/table/DataTable';

interface Quotation {
  id: string;
  client: string;
  amount: string;
  date: string;
  status: string;
}

export const Quotations: React.FC = () => {
  const quotations: Quotation[] = [
    { id: 'QT-2026-001', client: 'Acme Corp', amount: '$12,500', date: '2026-07-10', status: 'Sent' },
    { id: 'QT-2026-002', client: 'Stark Industries', amount: '$45,000', date: '2026-07-11', status: 'Accepted' },
    { id: 'QT-2026-003', client: 'Wayne Enterprises', amount: '$8,200', date: '2026-07-13', status: 'Draft' },
  ];

  // Define Columns
  const columns: ColumnDef<Quotation, unknown>[] = [
    {
      accessorKey: 'id',
      header: 'Quote ID',
      cell: ({ row }) => (
        <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'client',
      header: 'Client',
      cell: ({ row }) => <span style={{ color: 'var(--color-text)' }}>{row.original.client}</span>,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{row.original.amount}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => <span style={{ color: 'var(--color-text-secondary)' }}>{row.original.date}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={status === 'Accepted' ? 'success' : status === 'Sent' ? 'primary' : 'default'} dot>
            {status}
          </Badge>
        );
      },
    },
  ];

  // Define Row Actions
  const rowActions: RowAction<Quotation>[] = [
    {
      label: 'Download PDF',
      icon: <Download className="h-3.5 w-3.5" />,
      onClick: (row) => console.log('Download', row.id),
    },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Quotations</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{quotations.length} records found</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> New Quotation</Button>
      </div>

      <DataTable
        data={quotations}
        columns={columns}
        rowActions={rowActions}
        enableRowSelection
        enableExport
        exportFileName="quotations-list"
        enableViewToggle
        defaultViewMode="table"
      />
    </div>
  );
};
export default Quotations;
