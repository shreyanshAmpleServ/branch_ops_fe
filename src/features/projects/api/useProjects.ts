import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface ProjectItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  clientCode?: string;
  clientName?: string;
  manager?: string;
  managerEmail?: string;
  branchId?: number;
  branchName?: string;
  status: 'Not Started' | 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  stage: 'Planning' | 'Procurement' | 'Execution' | 'Inspection' | 'Handover';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  budget: number;
  actualSpend: number;
  committedSpend: number;
  invoicedSpend: number;
  progressPercent: number;
  startDate?: string;
  endDate?: string;
  createdDate: string;
}

export interface ProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  stage?: string;
  branchId?: number;
}

export interface ProjectsResponse {
  status: string;
  projects: ProjectItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
    totalBudget: number;
    totalActualSpend: number;
    totalCommittedSpend: number;
    avgProgress: number;
  };
}

export interface ProjectAnalyticsResponse {
  status: string;
  data: {
    summary: {
      totalProjects: number;
      totalBudget: number;
      totalSpend: number;
      totalCommitted: number;
      burnRatePercent: number;
      avgCompletion: number;
    };
    stageBreakdown: {
      Planning: number;
      Procurement: number;
      Execution: number;
      Inspection: number;
      Handover: number;
    };
    statusBreakdown: {
      notStarted: number;
      inProgress: number;
      onHold: number;
      completed: number;
    };
    priorityBreakdown: {
      Low: number;
      Medium: number;
      High: number;
      Critical: number;
    };
    topProjectsByCost: {
      id: number;
      code: string;
      name: string;
      budget: number;
      actualSpend: number;
      progressPercent: number;
      status: string;
    }[];
  };
}

export interface ProjectFinanceResponse {
  status: string;
  data: {
    summary: {
      totalBudget: number;
      totalCommitted: number;
      totalActualSpend: number;
      totalInvoiced: number;
      totalVariance: number;
      overallUtilization: number;
    };
    stageFinancials: {
      stage: string;
      allocatedBudget: number;
      committed: number;
      incurred: number;
      invoiced: number;
      projectCount: number;
    }[];
    projectFinancialRows: {
      id: number;
      code: string;
      name: string;
      stage: string;
      manager?: string;
      budget: number;
      committedSpend: number;
      actualSpend: number;
      invoicedSpend: number;
      variance: number;
      utilization: number;
      health: 'Healthy' | 'Warning' | 'Over Budget';
      progressPercent: number;
    }[];
  };
}

export function useProjects(params: ProjectsParams = {}) {
  return useQuery<ProjectsResponse>({
    queryKey: ['projects', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.search) queryParams.set('search', params.search);
      if (params.status) queryParams.set('status', params.status);
      if (params.stage) queryParams.set('stage', params.stage);
      if (params.branchId) queryParams.set('branchId', String(params.branchId));

      const { data } = await api.get<ProjectsResponse>(`/projects?${queryParams}`);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useProjectAnalytics() {
  return useQuery<ProjectAnalyticsResponse['data']>({
    queryKey: ['projects-analytics'],
    queryFn: async () => {
      const { data } = await api.get<ProjectAnalyticsResponse>('/projects/analytics');
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useProjectFinance() {
  return useQuery<ProjectFinanceResponse['data']>({
    queryKey: ['projects-finance'],
    queryFn: async () => {
      const { data } = await api.get<ProjectFinanceResponse>('/projects/finance');
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProjectItem>) => {
      const { data } = await api.post('/projects', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['projects-finance'] });
      queryClient.invalidateQueries({ queryKey: ['master-projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: payload }: { id: number; data: Partial<ProjectItem> }) => {
      const { data } = await api.put(`/projects/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['projects-finance'] });
      queryClient.invalidateQueries({ queryKey: ['master-projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/projects/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['projects-finance'] });
      queryClient.invalidateQueries({ queryKey: ['master-projects'] });
    },
  });
}
