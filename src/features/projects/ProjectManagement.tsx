import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  RefreshCw,
  Plus,
  Search,
  FileSpreadsheet,
  Layers,
  DollarSign,
  TrendingUp,
  User,
  Building,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  X,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Briefcase,
} from 'lucide-react';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  type ProjectItem,
} from './api/useProjects';
import { useBranches, useProjects as useMasterProjects } from '../users/api/useMasterData';
import { useRetailers } from '../customers/api/useRetailers';
import { useUsers } from '../users/api/useUsers';
import { DataTable, type ColumnDef } from '../../components/table/DataTable';
import { Button, Tooltip, Spinner, SearchableSelect, type SearchableSelectOption } from '../../components/ui';

export const ProjectManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals & Drawer
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [viewingProject, setViewingProject] = useState<ProjectItem | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ProjectItem>>({
    code: '',
    name: '',
    description: '',
    clientCode: '',
    clientName: '',
    manager: '',
    managerEmail: '',
    branchId: 1,
    status: 'In Progress',
    stage: 'Planning',
    priority: 'Medium',
    budget: 0,
    progressPercent: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  // Queries
  const { data, isLoading, refetch, isRefetching } = useProjects({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    stage: stageFilter !== 'all' ? stageFilter : undefined,
    branchId: selectedBranchId !== 'all' ? Number(selectedBranchId) : undefined,
  });

  const { data: branchesResponse } = useBranches();
  const branches = branchesResponse?.data || [];

  const { data: masterProjectsResponse } = useMasterProjects();
  const masterProjects = masterProjectsResponse?.data || [];

  const { data: retailersData } = useRetailers({ cardType: 'C', aprStatus: 'all' });
  const retailers = Array.isArray(retailersData) ? retailersData : (retailersData as any)?.data || [];

  const { data: usersResponse } = useUsers({ limit: 100 });
  const users = usersResponse?.users || [];

  // Options for Searchable Selects
  const sapProjectOptions: SearchableSelectOption[] = useMemo(() => {
    return masterProjects.map((p) => ({
      value: p.code,
      label: `${p.code} - ${p.name}`,
      subtext: `SAP Project Code: ${p.code}`,
      raw: p,
    }));
  }, [masterProjects]);

  const clientOptions: SearchableSelectOption[] = useMemo(() => {
    return retailers.map((r) => ({
      value: r.Code,
      label: `${r.Code} - ${r.Name}`,
      subtext: r.TIN ? `TIN: ${r.TIN} | ${r.Address || ''}` : r.Address || undefined,
      badge: r.CardType || undefined,
      raw: r,
    }));
  }, [retailers]);

  const managerOptions: SearchableSelectOption[] = useMemo(() => {
    return users.map((u) => ({
      value: u.fullName || u.email || String(u.id),
      label: u.fullName || u.email || `User #${u.id}`,
      subtext: u.email ? `${u.email} • ${u.role}` : u.department || u.role,
      badge: u.role?.toUpperCase(),
      raw: u,
    }));
  }, [users]);

  const locationOptions: SearchableSelectOption[] = useMemo(() => {
    return branches.map((b) => ({
      value: b.id,
      label: b.name,
      subtext: `Branch Code: ${b.code}`,
      raw: b,
    }));
  }, [branches]);

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const handleOpenAdd = () => {
    setEditingProject(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      clientCode: '',
      clientName: '',
      manager: '',
      managerEmail: '',
      branchId: branches[0]?.id || 1,
      status: 'In Progress',
      stage: 'Planning',
      priority: 'Medium',
      budget: 0,
      progressPercent: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (project: ProjectItem) => {
    setEditingProject(project);
    setFormData({ ...project });
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Please enter a project name');
      return;
    }

    try {
      const selectedBranch = branches.find((b) => b.id === formData.branchId);
      const payload = {
        ...formData,
        branchName: selectedBranch?.name || 'HQ',
      };

      if (editingProject) {
        await updateMutation.mutateAsync({
          id: editingProject.id,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsAddModalOpen(false);
      setEditingProject(null);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    try {
      await deleteMutation.mutateAsync(deletingProject.id);
      setDeletingProject(null);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete project');
    }
  };

  const projectsList = data?.projects ?? [];

  const handleExportCSV = () => {
    if (!projectsList || projectsList.length === 0) return;
    const headers = [
      'ID',
      'PROJECT CODE',
      'PROJECT NAME',
      'STATUS',
      'STAGE',
      'PRIORITY',
      'MANAGER',
      'BRANCH',
      'BUDGET',
      'ACTUAL SPEND',
      'PROGRESS (%)',
      'START DATE',
      'TARGET END DATE',
    ];
    const csvRows = [
      headers.join(','),
      ...projectsList.map((p) => [
        p.id,
        `"${p.code}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.status}"`,
        `"${p.stage}"`,
        `"${p.priority}"`,
        `"${p.manager || ''}"`,
        `"${p.branchName || ''}"`,
        p.budget || 0,
        p.actualSpend || 0,
        `${p.progressPercent || 0}%`,
        `"${p.startDate || ''}"`,
        `"${p.endDate || ''}"`,
      ].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ProjectsExport-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    const raw = (status || 'IN PROGRESS').toUpperCase();
    let badgeStyle = 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400';

    if (raw === 'COMPLETED' || raw === 'DONE') {
      badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400';
    } else if (raw === 'ON HOLD' || raw === 'HOLD') {
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400';
    } else if (raw === 'PLANNING' || raw === 'NOT STARTED') {
      badgeStyle = 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-400';
    } else if (raw === 'CANCELLED' || raw === 'REJECTED') {
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400';
    }

    return (
      <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${badgeStyle}`}>
        {status}
      </span>
    );
  };

  // Priority Badge Helper
  const renderPriorityBadge = (priority: string) => {
    const raw = (priority || 'MEDIUM').toUpperCase();
    let style = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300';

    if (raw === 'CRITICAL') {
      style = 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400';
    } else if (raw === 'HIGH') {
      style = 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400';
    } else if (raw === 'MEDIUM') {
      style = 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-400';
    }

    return (
      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border tracking-wide uppercase ${style}`}>
        {priority}
      </span>
    );
  };

  // Table Columns Definition
  const columns: ColumnDef<ProjectItem, unknown>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'code',
      header: 'PROJECT CODE',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'PROJECT NAME',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
            {row.original.name}
          </span>
          {row.original.description && (
            <span className="text-[10px] text-slate-400 truncate block">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'clientName',
      header: 'CLIENT / BP',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block truncate">
            {row.original.clientName || '—'}
          </span>
          {row.original.clientCode && (
            <span className="text-[10px] text-slate-400 font-mono block">
              {row.original.clientCode}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ row }) => renderStatusBadge(row.original.status),
    },
    {
      accessorKey: 'stage',
      header: 'STAGE',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {row.original.stage}
        </span>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'PRIORITY',
      cell: ({ row }) => renderPriorityBadge(row.original.priority),
    },
    {
      accessorKey: 'manager',
      header: 'MANAGER',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {row.original.manager || 'Unassigned'}
        </span>
      ),
    },
    {
      accessorKey: 'branchName',
      header: 'BRANCH',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {row.original.branchName || 'HQ'}
        </span>
      ),
    },
    {
      accessorKey: 'budget',
      header: 'BUDGET',
      cell: ({ row }) => {
        const amt = Number(row.original.budget || 0);
        return (
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono whitespace-nowrap">
            ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      accessorKey: 'actualSpend',
      header: 'ACTUAL SPEND',
      cell: ({ row }) => {
        const amt = Number(row.original.actualSpend || 0);
        return (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap">
            ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      accessorKey: 'progressPercent',
      header: 'PROGRESS',
      cell: ({ row }) => (
        <div className="w-24 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>{row.original.progressPercent || 0}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${row.original.progressPercent || 0}%`,
                background: (row.original.progressPercent || 0) >= 100 ? '#10b981' : '#0d9488',
              }}
            />
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'START DATE',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
          {row.original.startDate || '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'ACTION',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewingProject(row.original)}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95"
            title="View Details"
          >
            <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => handleOpenEdit(row.original)}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow transition-all hover:scale-105 active:scale-95"
            title="Edit Project"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingProject(row.original)}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/30 text-rose-600 flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Project Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, track and manage company capital projects and milestone statuses
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="secondary"
            onClick={handleExportCSV}
            className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-medium py-2 rounded-xl"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            Export CSV
          </Button>

          <Button
            variant="primary"
            onClick={handleOpenAdd}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md transition-all hover:shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Main Table or Grid Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Spinner className="w-8 h-8 text-teal-600" />
            <p className="text-xs text-slate-500">Loading projects...</p>
          </div>
        ) : viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={projectsList}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search project code, name, client, manager..."
            extraFilters={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Planning">Planning</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Stages</option>
                  <option value="Planning">Planning</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Execution">Execution</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Handover">Handover</option>
                </select>

                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value="all">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))}
                </select>

                <Tooltip content="Refresh" position="top">
                  <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="p-2 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>
              </div>
            }
            onRowClick={(row) => setViewingProject(row)}
          />
        ) : (
          <div className="space-y-4">
            {/* Grid Search & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Planning">Planning</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Stages</option>
                  <option value="Planning">Planning</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Execution">Execution</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Handover">Handover</option>
                </select>
              </div>
            </div>

            {/* Grid Cards Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {projectsList.map((prj) => {
                return (
                  <div
                    key={prj.id}
                    onClick={() => setViewingProject(prj)}
                    className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">
                          {prj.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {renderPriorityBadge(prj.priority)}
                          {renderStatusBadge(prj.status)}
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2 line-clamp-1">
                        {prj.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 h-8">
                        {prj.description || 'Enterprise capital initiative.'}
                      </p>

                      {prj.clientName && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          <Briefcase className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{prj.clientName}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <User className="w-3.5 h-3.5 text-teal-600" />
                          <span className="truncate">{prj.manager || 'PM Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Building className="w-3.5 h-3.5 text-teal-600" />
                          <span className="truncate">{prj.branchName || 'HQ'}</span>
                        </div>
                      </div>

                      <div className="mt-4 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">Stage: {prj.stage}</span>
                          <span className="text-teal-600 font-bold">{prj.progressPercent || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${prj.progressPercent || 0}%`,
                              background: (prj.progressPercent || 0) >= 100 ? '#10b981' : '#0d9488',
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs pt-1">
                          <span className="text-[11px] text-slate-400">Budget: ${Number(prj.budget || 0).toLocaleString()}</span>
                          <span className="text-[11px] font-bold text-emerald-600">Spent: ${Number(prj.actualSpend || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11px] text-slate-400">{prj.startDate || 'No date'}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewingProject(prj)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(prj)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingProject(prj)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT PROJECT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto border border-slate-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingProject ? 'Edit Project Details' : 'Create New Capital Project'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form id="project-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* SECTION 1: GENERAL INFORMATION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    General Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      PROJECT CODE (SAP OPRJ)
                    </label>
                    <SearchableSelect
                      placeholder="Select or enter SAP project code..."
                      value={formData.code || ''}
                      options={sapProjectOptions}
                      onChange={(val, opt) => {
                        setFormData((prev) => ({
                          ...prev,
                          code: val,
                          name: (!prev.name && opt?.raw?.name) ? opt.raw.name : prev.name,
                        }));
                      }}
                      clearable
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      PROJECT NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Masaki Warehouse Build"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-medium transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      CLIENT / BUSINESS PARTNER
                    </label>
                    <SearchableSelect
                      placeholder="Search client / BP name or code..."
                      value={formData.clientCode || ''}
                      options={clientOptions}
                      onChange={(val, opt) => {
                        setFormData((prev) => ({
                          ...prev,
                          clientCode: val,
                          clientName: opt?.raw?.Name || '',
                        }));
                      }}
                      clearable
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      PROJECT MANAGER
                    </label>
                    <SearchableSelect
                      placeholder="Search project manager..."
                      value={formData.manager || ''}
                      options={managerOptions}
                      onChange={(val, opt) => {
                        setFormData((prev) => ({
                          ...prev,
                          manager: val,
                          managerEmail: opt?.raw?.email || '',
                        }));
                      }}
                      clearable
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      LOCATION / SITE
                    </label>
                    <SearchableSelect
                      placeholder="Select branch / location..."
                      value={formData.branchId ?? ''}
                      options={locationOptions}
                      onChange={(val, opt) => {
                        setFormData((prev) => ({
                          ...prev,
                          branchId: Number(val),
                          branchName: opt?.raw?.name || 'HQ',
                        }));
                      }}
                      clearable={false}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      PROJECT STATUS
                    </label>
                    <select
                      value={formData.status || 'In Progress'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-medium transition-all shadow-sm cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TIMELINES & HIGH-LEVEL BUDGET */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Timelines & High-Level Budget
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      START DATE
                    </label>
                    <input
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-medium transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      ESTIMATED END DATE
                    </label>
                    <input
                      type="date"
                      value={formData.endDate || ''}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-medium transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      TOTAL BUDGET ($ / TZS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.budget || 0}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-medium transition-all shadow-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      TARGET MILESTONE / STAGE
                    </label>
                    <select
                      value={formData.stage || 'Planning'}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-medium transition-all shadow-sm cursor-pointer"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Procurement">Procurement</option>
                      <option value="Execution">Execution</option>
                      <option value="Inspection">Inspection</option>
                      <option value="Handover">Handover</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      PRIORITY
                    </label>
                    <select
                      value={formData.priority || 'Medium'}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-medium transition-all shadow-sm cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      PROGRESS PERCENTAGE ({formData.progressPercent || 0}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.progressPercent || 0}
                      onChange={(e) => setFormData({ ...formData, progressPercent: Number(e.target.value) })}
                      className="w-full accent-teal-600 mt-2"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      PROJECT DESCRIPTION & OBJECTIVES
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter scope of work, technical requirements, deliverables..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-medium transition-all shadow-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Fixed Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="project-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {editingProject ? 'Update Project' : 'Save Project'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PROJECT DRAWER */}
      {viewingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto border-l border-slate-200 dark:border-slate-700 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600">Project Overview</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {viewingProject.name}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingProject(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-500">Project Code</span>
                  <span className="font-bold text-teal-600 font-mono">{viewingProject.code}</span>
                </div>

                {viewingProject.clientName && (
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-indigo-50/30 dark:bg-indigo-950/20">
                    <span className="text-[10px] text-indigo-500 font-bold block uppercase">Client / Business Partner</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{viewingProject.clientName}</span>
                    {viewingProject.clientCode && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{viewingProject.clientCode}</span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-[10px] text-slate-400 block uppercase">Manager</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5 block">{viewingProject.manager || 'Unassigned'}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-[10px] text-slate-400 block uppercase">Branch</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5 block">{viewingProject.branchName || 'HQ'}</span>
                  </div>
                </div>

                {/* Status & Priority */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-1">Status</span>
                    {renderStatusBadge(viewingProject.status)}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase mb-1">Priority</span>
                    {renderPriorityBadge(viewingProject.priority)}
                  </div>
                </div>

                {/* Progress */}
                <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Phase: {viewingProject.stage}</span>
                    <span className="font-bold text-teal-600">{viewingProject.progressPercent || 0}% Complete</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${viewingProject.progressPercent || 0}%`,
                        background: (viewingProject.progressPercent || 0) >= 100 ? '#10b981' : '#0d9488',
                      }}
                    />
                  </div>
                </div>

                {/* Financial Ledger */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500">Allocated Budget</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">${Number(viewingProject.budget || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500">Committed (POs)</span>
                    <span className="font-semibold text-blue-600 font-mono">${Number(viewingProject.committedSpend || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500">Actual Spend</span>
                    <span className="font-semibold text-emerald-600 font-mono">${Number(viewingProject.actualSpend || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500">Timeline</span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono">{viewingProject.startDate || '—'} → {viewingProject.endDate || 'Ongoing'}</span>
                  </div>
                </div>

                {viewingProject.description && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Scope & Details:</span>
                    {viewingProject.description}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <Button
                onClick={() => {
                  const prj = viewingProject;
                  setViewingProject(null);
                  handleOpenEdit(prj);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Project
              </Button>
              <Button
                variant="outline"
                onClick={() => setViewingProject(null)}
                className="text-xs px-4"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-150">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Project?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">{deletingProject.name}</strong> ({deletingProject.code})?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingProject(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {deleteMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
