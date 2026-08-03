import React, { useMemo } from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { Plus, Download, Edit, Eye, Trash } from 'lucide-react';
import { DataTable, type RowAction } from '../../components/table/DataTable';
import { type ColumnDef } from '@tanstack/react-table';

interface DummyModulePageProps {
  title: string;
}

export const DummyModulePage: React.FC<DummyModulePageProps> = ({ title }) => {
  // Generate some dummy data based on the title length to make it look slightly different per page
  const seed = title.length;
  
  const stats = [
    { label: 'Total Records', value: 124 + seed * 10 },
    { label: 'Active', value: 89 + seed * 5, color: 'text-success' },
    { label: 'Pending Action', value: 12 + seed, color: 'text-warning' },
    { label: 'Needs Attention', value: 3 + (seed % 4), color: 'text-error' },
  ];

  const data = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7, 8].map(item => ({
      id: `REF-${new Date().getFullYear()}-00${item * seed}`,
      description: `Sample record entry ${item} for ${title.toLowerCase()}`,
      date: `2026-07-${10 + item}`,
      status: item % 3 === 0 ? 'Pending' : item % 2 === 0 ? 'Completed' : 'Active',
      statusVariant: item % 3 === 0 ? 'warning' : item % 2 === 0 ? 'success' : 'primary'
    }));
  }, [title, seed]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID Reference',
      cell: info => <span className="font-medium text-primary">{info.getValue()}</span>
    },
    {
      accessorKey: 'description',
      header: 'Description / Details',
    },
    {
      accessorKey: 'date',
      header: 'Date Added',
      cell: info => <span className="text-text-secondary">{info.getValue()}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => (
        <Badge variant={info.row.original.statusVariant as any}>
          {info.getValue()}
        </Badge>
      )
    }
  ], []);

  const rowActions: RowAction<any>[] = [
    { label: 'View Details', icon: <Eye className="h-4 w-4" />, onClick: (row) => console.log('View', row.id) },
    { label: 'Edit Record', icon: <Edit className="h-4 w-4" />, onClick: (row) => console.log('Edit', row.id) },
    { label: 'Delete', icon: <Trash className="h-4 w-4" />, variant: 'danger', onClick: (row) => console.log('Delete', row.id) }
  ];

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{title}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage and track your {title.toLowerCase()} records efficiently.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost"><Download className="h-4 w-4 mr-2" /> Export</Button>
          <Button><Plus className="h-4 w-4 mr-2" /> Create New</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</p>
            <p className={`text-2xl font-bold mt-2 ${stat.color || ''}`} style={!stat.color ? { color: 'var(--color-text)' } : {}}>
              {stat.value.toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      <DataTable 
        data={data}
        columns={columns}
        rowActions={rowActions}
        enableRowSelection
        enableViewToggle
        defaultViewMode="table"
        searchPlaceholder={`Search ${title}...`}
      />
    </div>
  );
};
