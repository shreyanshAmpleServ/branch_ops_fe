import React, { useState } from 'react';
import { Plus, Eye, Edit3, Trash2, Search, SlidersHorizontal, FileText } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Button, Badge, DateRangePicker, type DateRange } from '../../components/ui';
import { 
  usePurchaseRequests, 
  useDeletePurchaseRequest, 
  type PurchaseRequest 
} from './api/usePurchaseRequests';
import { useNavigate } from 'react-router-dom';

export const PurchaseRequestList: React.FC = () => {
  const navigate = useNavigate();

  // Local filter states for input controls (applied on Search Records click)
  const today = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: today, endDate: today });
  const [status, setStatus] = useState<string>('Pending');
  const [docType, setDocType] = useState<string>('all');

  // Active query parameters applied to backend API call
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: today,
    endDate: today,
    status: 'Pending',
    typeRequest: 'all',
  });

  // Client-side quick filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data with applied filters
  const { data: requests = [], isLoading } = usePurchaseRequests({
    status: appliedFilters.status !== 'all' ? appliedFilters.status : undefined,
    typeRequest: appliedFilters.typeRequest !== 'all' ? appliedFilters.typeRequest : undefined,
    startDate: appliedFilters.startDate || undefined,
    endDate: appliedFilters.endDate || undefined,
  });

  const deleteMutation = useDeletePurchaseRequest();

  const handleDelete = async (id: number, reqNo: string | null) => {
    if (confirm(`Are you sure you want to delete purchase request "${reqNo || id}"?`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error(err);
        alert('Failed to delete purchase request');
      }
    }
  };

  const handleSearchRecords = () => {
    setAppliedFilters({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      status: status,
      typeRequest: docType,
    });
  };

  const handleExportExcel = () => {
    const headers = [
      'ID', 
      'DOCNUM', 
      'REF NO.', 
      'USERS', 
      'CREATED BY', 
      'DEPARTMENT', 
      'POSTING DATE', 
      'DOC TOTAL', 
      'REQUEST TYPE', 
      'APRDATE', 
      'APR STATUS', 
      'PURCHASE REQUEST', 
      'MEMO'
    ];
    
    const csvContent = [
      headers.join(','),
      ...requests.map(r => [
        r.ID,
        `"${r.RequestedNo || `PR-${r.ID}`}"`,
        `"${r.CustRefNo || ''}"`,
        `"${r.CustName || ''}"`,
        `"${r.CreatedBy || 'Admin'}"`,
        `"${r.Department || ''}"`,
        `"${r.PostDate ? new Date(r.PostDate).toISOString().split('T')[0] : ''}"`,
        r.DocTotal || 0,
        `"${r.TypeRequest || 'Item'}"`,
        `"${r.AprDate ? new Date(r.AprDate).toISOString().split('T')[0] : ''}"`,
        `"${r.AprStatus || 'P'}"`,
        `"${r.Status || 'Pending'}"`,
        `"${r.Remarks || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'PurchaseRequestsExport.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Columns definition matching exactly the screenshot
  const columns: ColumnDef<PurchaseRequest, unknown>[] = [
    {
      accessorKey: 'ID',
      header: 'ID',
      cell: ({ row }) => <span className="font-semibold text-xs" style={{ color: 'var(--color-text)' }}>{row.original.ID}</span>,
    },
    {
      accessorKey: 'RequestedNo',
      header: 'DOCNUM',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-primary cursor-pointer hover:underline animate-pulse-soft" onClick={() => navigate(`/procurement/request/view/${row.original.ID}`)}>
          {row.original.RequestedNo || `PR-${row.original.ID}`}
        </span>
      ),
    },
    {
      accessorKey: 'CustRefNo',
      header: 'REF NO.',
      cell: ({ row }) => <span className="text-xs" style={{ color: 'var(--color-text)' }}>{row.original.CustRefNo || '—'}</span>,
    },
    {
      accessorKey: 'CustName',
      header: 'USERS',
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-semibold mb-0" style={{ color: 'var(--color-text)' }}>
            {row.original.CustName || '—'}
          </p>
          <p className="text-[10px] font-mono mb-0" style={{ color: 'var(--color-text-secondary)' }}>
            {row.original.CustCode}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'CreatedBy',
      header: 'CREATED BY',
      cell: ({ row }) => <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{row.original.CreatedBy ? `User ${row.original.CreatedBy}` : 'Admin'}</span>,
    },
    {
      accessorKey: 'Department',
      header: 'DEPARTMENT',
      cell: ({ row }) => <span className="text-xs" style={{ color: 'var(--color-text)' }}>{row.original.Department || '—'}</span>,
    },
    {
      accessorKey: 'PostDate',
      header: 'POSTING DATE',
      cell: ({ row }) => (
        <span className="text-xs font-medium font-mono" style={{ color: 'var(--color-text)' }}>
          {row.original.PostDate ? new Date(row.original.PostDate).toISOString().split('T')[0] : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'DocTotal',
      header: 'DOC TOTAL',
      cell: ({ row }) => (
        <span className="text-xs font-mono font-bold text-primary">
          {row.original.DocTotal !== null && row.original.DocTotal !== undefined
            ? Number(row.original.DocTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0.00'}{' '}
          {row.original.Currency || 'TZS'}
        </span>
      ),
    },
    {
      accessorKey: 'TypeRequest',
      header: 'REQUEST TYPE',
      cell: ({ row }) => (
        <Badge variant={row.original.TypeRequest === 'Item' ? 'primary' : 'info'}>
          {row.original.TypeRequest}
        </Badge>
      ),
    },
    {
      accessorKey: 'AprDate',
      header: 'APRDATE',
      cell: ({ row }) => (
        <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
          {row.original.AprDate ? new Date(row.original.AprDate).toISOString().split('T')[0] : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'AprStatus',
      header: 'APR STATUS',
      cell: ({ row }) => {
        const val = row.original.AprStatus;
        let label = 'Awaiting';
        let variant: 'success' | 'warning' | 'error' | 'info' = 'warning';

        if (val === 'Y') {
          label = 'Approved';
          variant = 'success';
        } else if (val === 'N') {
          label = 'Rejected';
          variant = 'error';
        }

        return (
          <Badge variant={variant} dot>
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'Status',
      header: 'PURCHASE REQUEST',
      cell: ({ row }) => {
        const val = row.original.Status;
        let variant: 'success' | 'warning' | 'error' | 'info' = 'warning';
        if (val === 'Approved') variant = 'success';
        if (val === 'Closed') variant = 'info';
        if (val === 'Rejected') variant = 'error';

        return (
          <Badge variant={variant}>
            {val}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'Remarks',
      header: 'MEMO',
      cell: ({ row }) => (
        <span className="text-xs truncate max-w-[150px] block" title={row.original.Remarks || ''} style={{ color: 'var(--color-text-secondary)' }}>
          {row.original.Remarks || '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'ACTION',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            title="View Details"
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary transition-colors"
            onClick={() => navigate(`/procurement/request/view/${row.original.ID}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            title="Edit Request"
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-amber-500 transition-colors"
            onClick={() => navigate(`/procurement/request/edit/${row.original.ID}`)}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            title="Delete Request"
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-rose-600 transition-colors"
            onClick={() => handleDelete(row.original.ID, row.original.RequestedNo)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container animate-slide-up space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display" style={{ color: 'var(--color-text)' }}>
            Purchase Requests Log
          </h1>
          <p className="text-xs animate-pulse-soft" style={{ color: 'var(--color-text-secondary)' }}>
            {requests.length} purchase requests loaded from database
          </p>
        </div>
        <Button 
          icon={<Plus className="h-4 w-4" />} 
          onClick={() => navigate('/procurement/request/new')}
        >
          Add Purchase Request
        </Button>
      </div>

      {/* Modern Search Filters Card */}
      <div className="rounded-2xl border p-4 shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 border-b pb-2 mb-4" style={{ borderColor: 'var(--color-border)' }}>
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider m-0" style={{ color: 'var(--color-text)' }}>
            Search Filters
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Purchased Date Created
            </label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select Date Range"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Status
            </label>
            <select
              className="input-base w-full text-xs font-semibold outline-none border transition-all py-2 px-3 rounded-xl"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Doc Type
            </label>
            <select
              className="input-base w-full text-xs font-semibold outline-none border transition-all py-2 px-3 rounded-xl"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              value={docType}
              onChange={e => setDocType(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Item">Item</option>
              <option value="Service">Service</option>
            </select>
          </div>
          <div>
            <Button
              className="w-full flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white border-0 py-2.5 rounded-xl font-bold text-xs"
              onClick={handleSearchRecords}
              icon={<Search className="h-4 w-4" />}
            >
              Search Records
            </Button>
          </div>
        </div>
      </div>

      {/* Export to Excel & Floating Quick Search Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button
          variant="secondary"
          className="flex items-center gap-2 text-xs font-bold border rounded-xl"
          icon={<FileText className="h-4.5 w-4.5 text-emerald-600" />}
          onClick={handleExportExcel}
        >
          Export Table to Excel
        </Button>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
            Search:
          </span>
          <input
            type="text"
            className="input-base text-xs font-semibold py-2 px-3.5 w-full sm:w-[220px]"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter records..."
          />
        </div>
      </div>

      {/* Main Grid Table (Search and Export toolbar disabled to use custom layout) */}
      <DataTable
        data={requests}
        columns={columns}
        isLoading={isLoading}
        enableRowSelection
        enableSearch={false}
        enableExport={false}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onRowClick={(row) => navigate(`/procurement/request/view/${row.ID}`)}
      />
    </div>
  );
};
export default PurchaseRequestList;
