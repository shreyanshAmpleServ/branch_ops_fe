import React, { useState } from 'react';
import { Plus, Eye, Edit3, Trash2, Search, SlidersHorizontal, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/table';
import { Button, Badge, DateRangePicker, type DateRange } from '../../components/ui';
import { 
  usePurchaseRequests, 
  useDeletePurchaseRequest, 
  type PurchaseRequest 
} from './api/usePurchaseRequests';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { MemoModal } from './components/MemoModal';

export const PurchaseRequestList: React.FC = () => {
  const navigate = useNavigate();

  // Local filter states for input controls (applied immediately)
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [status, setStatus] = useState<string>('all');
  const [docType, setDocType] = useState<string>('all');

  // Client-side quick filter query
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Memo Modal State
  const [selectedMemoRequest, setSelectedMemoRequest] = useState<PurchaseRequest | null>(null);

  // Fetch data with applied filters
  const { data: requests = [], isLoading } = usePurchaseRequests({
    search: debouncedSearch || undefined,
    status: status !== 'all' ? status : undefined,
    typeRequest: docType !== 'all' ? docType : undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
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

  const handleExportExcel = () => {
    const headers = [
      'ID', 
      'DOCNUM', 
      'DOC STATUS',
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
        `"${r.RequestedNo || ''}"`,
        `"${r.Status || 'Pending'}"`,
        `"${r.CustRefNo || ''}"`,
        `"${r.CustName || ''}"`,
        `"${r.CreatedBy || 'Admin'}"`,
        `"${r.Department || ''}"`,
        `"${r.PostDate ? new Date(r.PostDate).toISOString().split('T')[0] : ''}"`,
        r.DocTotal || 0,
        `"${r.TypeRequest || 'Item'}"`,
        `"${r.AprDate ? new Date(r.AprDate).toISOString().split('T')[0] : ''}"`,
        `"${r.AprStatus || 'P'}"`,
        '"View"',
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
      cell: ({ row }) => <span className="font-semibold text-xs text-gray-600 dark:text-gray-300">{row.original.ID}</span>,
    },
    {
      accessorKey: 'RequestedNo',
      header: 'DOCNUM',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
          {row.original.RequestedNo || ''}
        </span>
      ),
    },
    {
      accessorKey: 'Status',
      header: 'DOC STATUS',
      cell: ({ row }) => {
        const val = row.original.Status;
        const displayVal = val === 'O' ? 'Open' : val === 'C' ? 'Closed' : val;
        
        let variant: 'success' | 'warning' | 'error' | 'info' | 'default' = 'default';
        if (displayVal === 'Closed') variant = 'info';
        else if (displayVal === 'Approved') variant = 'success';
        else if (displayVal === 'Rejected') variant = 'error';
        else if (displayVal === 'Pending' || displayVal === 'Open') variant = 'warning';

        return (
          <Badge variant={variant} className={displayVal === 'Closed' ? 'bg-blue-600 text-white border-blue-600' : ''}>
            {displayVal || 'Pending'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'CustRefNo',
      header: 'REF NO.',
      cell: ({ row }) => <span className="text-xs text-gray-600 dark:text-gray-300">{row.original.CustRefNo || '—'}</span>,
    },
    {
      accessorKey: 'CustName',
      header: 'USERS',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {row.original.CustName || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'CreatedBy',
      header: 'CREATED BY',
      cell: ({ row }) => <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{row.original.CreatedByName || row.original.CreatedBy || '—'}</span>,
    },
    {
      accessorKey: 'Department',
      header: 'DEPARTMENT',
      cell: ({ row }) => <span className="text-xs text-gray-600 dark:text-gray-300">{row.original.Department || '—'}</span>,
    },
    {
      accessorKey: 'PostDate',
      header: 'POSTING DATE',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          {row.original.PostDate ? new Date(row.original.PostDate).toISOString().split('T')[0] : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'DocTotal',
      header: 'DOC TOTAL',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {row.original.DocTotal !== null && row.original.DocTotal !== undefined
            ? Number(row.original.DocTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0.00'}
        </span>
      ),
    },
    {
      accessorKey: 'TypeRequest',
      header: 'REQUEST TYPE',
      cell: ({ row }) => (
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {row.original.TypeRequest || 'Item'}
        </span>
      ),
    },
    {
      accessorKey: 'AprDate',
      header: 'APRDATE',
      cell: ({ row }) => (
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {row.original.AprDate ? new Date(row.original.AprDate).toISOString().split('T')[0] : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'AprStatus',
      header: 'APR STATUS',
      cell: ({ row }) => {
        const val = row.original.AprStatus;
        const displayVal = val === 'Y' ? 'Approved' : val === 'N' ? 'Rejected' : 'Pending';
        
        let variant: 'success' | 'warning' | 'error' | 'info' | 'default' = 'default';
        if (displayVal === 'Approved') variant = 'success';
        else if (displayVal === 'Rejected') variant = 'error';
        else if (displayVal === 'Pending') variant = 'warning';

        return (
          <Badge variant={variant}>
            {displayVal}
          </Badge>
        );
      },
    },
    {
      id: 'purchase_request',
      header: 'PURCHASE REQUEST',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/procurement/request/view/${row.original.ID}`);
          }}
          className="px-3 py-1 text-white text-xs font-medium rounded transition-all shadow-glass-sm hover:brightness-110 hover:-translate-y-0.5"
          style={{ background: 'var(--color-primary)' }}
        >
          View
        </button>
      ),
    },
    {
      id: 'memo',
      header: 'MEMO',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedMemoRequest(row.original);
          }}
          className="px-3 py-1 text-white text-xs font-medium rounded transition-all shadow-glass-sm hover:brightness-110 hover:-translate-y-0.5"
          style={{ background: 'var(--color-primary)' }}
        >
          Memo
        </button>
      ),
    },
    {
      id: 'actions',
      header: 'ACTION',
      cell: ({ row }) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            title="Edit Request"
            className="p-1.5 text-white rounded transition-all shadow-glass-sm hover:brightness-110 hover:-translate-y-0.5"
            style={{ background: 'var(--color-primary)' }}
            onClick={() => navigate(`/procurement/request/edit/${row.original.ID}`)}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container animate-slide-up space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
            Purchase Requests
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track all purchase requests
          </p>
        </div>
        <Button 
          className="text-white shadow-glass-sm rounded-lg px-4 py-2 flex items-center gap-2 transition-all hover:brightness-110 hover:-translate-y-0.5"
          style={{ background: 'var(--color-primary)' }}
          onClick={() => navigate('/procurement/request/new')}
        >
          <Plus className="h-4 w-4" />
          <span className="font-semibold text-sm">Create Request</span>
        </Button>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          data={requests}
          columns={columns}
          isLoading={isLoading}
          enableRowSelection={false}
          enableSearch={true}
          enableExport={true}
          enableViewToggle={true}
          enableColumnVisibility={true}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onRowClick={(row) => navigate(`/procurement/request/view/${row.ID}`)}
          className="border-0 shadow-none rounded-none"
          extraFilters={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full whitespace-nowrap shadow-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                />
              </div>
              
              <div className="relative min-w-[140px]">
                <select
                  className="w-full appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-full px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm font-medium"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Closed">Closed</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div className="relative min-w-[140px]">
                <select
                  className="w-full appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-full px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm font-medium"
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="Item">Item</option>
                  <option value="Service">Service</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          }
        />
      </div>

      {/* Render the Memo Modal if selected */}
      {selectedMemoRequest && (
        <MemoModal
          request={selectedMemoRequest}
          onClose={() => setSelectedMemoRequest(null)}
        />
      )}
    </div>
  );
};
export default PurchaseRequestList;

