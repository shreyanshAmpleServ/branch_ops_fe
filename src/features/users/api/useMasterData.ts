import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface MasterDataItem {
  id: number;
  code: string;
  name: string;
  dimCode?: number | null;
}

export interface AccountItem {
  acctCode: string;
  acctName: string;
}

export interface FreightChargeItem {
  id: number;
  name: string;
  remarks: string;
}

export interface ExpenseItem {
  id: number;
  type: string;
  description: string;
}

export interface ActivitySubjectItem {
  id: number;
  name: string;
  typeId: number;
}

interface GenericResponse<T> {
  status: string;
  data: T;
}

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useAreas() {
  return useQuery<GenericResponse<MasterDataItem[]>>({
    queryKey: ['master-areas'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<MasterDataItem[]>>('/master/areas');
      return data;
    },
    staleTime: STALE_TIME,
  });
}

export function useWarehouses() {
  return useQuery<GenericResponse<MasterDataItem[]>>({
    queryKey: ['master-warehouses'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<MasterDataItem[]>>('/master/warehouses');
      return data;
    },
    staleTime: STALE_TIME,
  });
}

export function useProjects() {
  return useQuery<GenericResponse<MasterDataItem[]>>({
    queryKey: ['master-projects'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<MasterDataItem[]>>('/master/projects');
      return data;
    },
    staleTime: STALE_TIME,
  });
}

export function useBranches() {
  return useQuery<GenericResponse<MasterDataItem[]>>({
    queryKey: ['master-branches'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<MasterDataItem[]>>('/master/branches');
      return data;
    },
    staleTime: STALE_TIME,
  });
}

export function useCostCenters() {
  return useQuery<GenericResponse<MasterDataItem[]>>({
    queryKey: ['master-cost-centers'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<MasterDataItem[]>>('/master/cost-centers');
      return data;
    },
    staleTime: STALE_TIME,
  });
}

export function useCostCentersMain() {
  return useQuery<GenericResponse<MasterDataItem[]>>({
    queryKey: ['master-cost-centers-main'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<MasterDataItem[]>>('/master/cost-centers-main');
      return data;
    },
    staleTime: STALE_TIME,
  });
}

export function useAccounts() {
  return useQuery<GenericResponse<AccountItem[]>>({
    queryKey: ['master-accounts'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<AccountItem[]>>('/master/accounts');
      return data;
    },
    staleTime: STALE_TIME,
  });
}

export function useFreightCharges() {
  return useQuery<GenericResponse<FreightChargeItem[]>>({
    queryKey: ['master-freight-charges'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<FreightChargeItem[]>>('/master/freight-charges');
      return data;
    },
    staleTime: STALE_TIME,
  });
}

export function useExpenses() {
  return useQuery<GenericResponse<ExpenseItem[]>>({
    queryKey: ['master-expenses'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<ExpenseItem[]>>('/master/expenses');
      return data;
    },
    staleTime: STALE_TIME,
  });
}

export function useActivityTypes() {
  return useQuery<GenericResponse<MasterDataItem[]>>({
    queryKey: ['master-activity-types'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<MasterDataItem[]>>('/master/activity-types');
      return data;
    },
    staleTime: STALE_TIME,
  });
}

export function useActivityStatuses() {
  return useQuery<GenericResponse<MasterDataItem[]>>({
    queryKey: ['master-activity-statuses'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<MasterDataItem[]>>('/master/activity-statuses');
      return data;
    },
    staleTime: STALE_TIME,
  });
}

export function useActivitySubjects() {
  return useQuery<GenericResponse<ActivitySubjectItem[]>>({
    queryKey: ['master-activity-subjects'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<ActivitySubjectItem[]>>('/master/activity-subjects');
      return data;
    },
    staleTime: STALE_TIME,
  });
}
