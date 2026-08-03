import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface Branch {
  id: number;
  code: string;
  name: string;
  address: string;
  active: boolean;
}

export interface BranchParams {
  search?: string;
  activeOnly?: boolean;
}

interface GenericResponse<T> {
  status: string;
  data: T;
}

export function useBranchesList(params: BranchParams = {}) {
  return useQuery<GenericResponse<Branch[]>>({
    queryKey: ['branches-list', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.set('search', params.search);
      if (params.activeOnly) queryParams.set('activeOnly', 'true');
      
      const { data } = await api.get<GenericResponse<Branch[]>>(`/branches?${queryParams}`);
      return data;
    },
    staleTime: 5000,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { code: string; name: string; address?: string; active?: boolean }) => {
      const { data } = await api.post<GenericResponse<Branch>>('/branches', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches-list'] });
      queryClient.invalidateQueries({ queryKey: ['master-branches'] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: { code?: string; name?: string; address?: string; active?: boolean } }) => {
      const { data } = await api.put<GenericResponse<Branch>>(`/branches/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches-list'] });
      queryClient.invalidateQueries({ queryKey: ['master-branches'] });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete<GenericResponse<null>>(`/branches/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches-list'] });
      queryClient.invalidateQueries({ queryKey: ['master-branches'] });
    },
  });
}
