import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface ExpenseEntry {
  id: number;
  expenseDate: string;
  expenseTypeId: number;
  expenseType: string;
  amount: number;
  remarks: string | null;
  createdById: number;
}

interface GenericResponse<T> {
  status: string;
  data: T;
}

export function useExpenseEntries(search?: string) {
  return useQuery<GenericResponse<ExpenseEntry[]>>({
    queryKey: ['expense-entries', search],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      const { data } = await api.get<GenericResponse<ExpenseEntry[]>>(`/expense-entry?${queryParams}`);
      return data;
    },
    staleTime: 5000,
  });
}

export function useCreateExpenseEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { expenseTypeId: number; amount: number; remarks?: string }) => {
      const { data } = await api.post<GenericResponse<ExpenseEntry>>('/expense-entry', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-entries'] });
    },
  });
}

export function useUpdateExpenseEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: { expenseTypeId?: number; amount?: number; remarks?: string } }) => {
      const { data } = await api.put<GenericResponse<ExpenseEntry>>(`/expense-entry/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-entries'] });
    },
  });
}

export function useDeleteExpenseEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete<GenericResponse<null>>(`/expense-entry/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-entries'] });
    },
  });
}
