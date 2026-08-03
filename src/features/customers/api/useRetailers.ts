import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface Retailer {
  ID: number;
  Code: string;
  Name: string;
  Address: string | null;
  AreaID: number | null;
  Owner: string | null;
  OwnerMobileNo: string | null;
  OwnerEmail: string | null;
  BPGroup: number | null;
  BPClass: number | null;
  Balance: number | null;
  CrLimit: number | null;
  CreatedDate: string;
  Latitude: number | null;
  Longitude: number | null;
  AlternateOwnerMobileNo: string | null;
  CGuid: string | null;
  DocType: number | null;
  CreatedBy: number | null;
  ApprovedBy: number | null;
  ApprovalRemark: string | null;
  IsApproved: string;
  TIN: string | null;
  VAT: string | null;
  CreditDays: number | null;
  AprStatus: string;
  AprBy: string | null;
  AprDate: string | null;
  AprRemark: string | null;
  PaymentTerms: string | null;
  Route: string | null;
  CardType: string;
  Email: string | null;
  contacts?: any[];
  addresses?: any[];
}

export const retailersKeys = {
  all: ['retailers'] as const,
  lists: () => [...retailersKeys.all, 'list'] as const,
  list: (cardType: string, search: string, aprStatus: string, startDate?: string, endDate?: string) => 
    [...retailersKeys.lists(), { cardType, search, aprStatus, startDate, endDate }] as const,
  details: () => [...retailersKeys.all, 'detail'] as const,
  detail: (id: number) => [...retailersKeys.details(), id] as const,
  orders: (code: string) => [...retailersKeys.all, 'orders', code] as const,
  notes: (code: string) => [...retailersKeys.all, 'notes', code] as const,
  complaints: (code: string) => [...retailersKeys.all, 'complaints', code] as const,
};

interface GetRetailersResponse {
  status: string;
  data: Retailer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RetailerResponse {
  status: string;
  data: Retailer;
}

export const useRetailers = (filters: { 
  cardType: 'C' | 'S'; 
  search?: string; 
  aprStatus?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: retailersKeys.list(
      filters.cardType, 
      filters.search || '', 
      filters.aprStatus || 'all',
      filters.startDate,
      filters.endDate
    ),
    queryFn: async () => {
      const { data } = await api.get<GetRetailersResponse>('/retailers', {
        params: {
          cardType: filters.cardType,
          search: filters.search || undefined,
          aprStatus: filters.aprStatus || 'all',
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          limit: 100, // Fetch up to 100 at a time for search/filter simplicity
        },
      });
      return data.data || [];
    },
  });
};

export const useRetailer = (id: number | null) => {
  return useQuery({
    queryKey: retailersKeys.detail(id || 0),
    queryFn: async () => {
      const { data } = await api.get<RetailerResponse>(`/retailers/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useUpdateRetailer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Retailer> }) => {
      const { data: response } = await api.put<RetailerResponse>(`/retailers/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: retailersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: retailersKeys.detail(data.ID) });
    },
  });
};

export const useApproveRetailer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, aprStatus, remark }: { id: number; aprStatus: 'Y' | 'N'; remark?: string }) => {
      const { data: response } = await api.put<RetailerResponse>(`/retailers/${id}/approve`, { aprStatus, remark });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: retailersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: retailersKeys.detail(data.ID) });
    },
  });
};

export const useDeleteRetailer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/retailers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retailersKeys.lists() });
    },
  });
};

export const useRetailerOrders = (code: string | null) => {
  return useQuery({
    queryKey: retailersKeys.orders(code || ''),
    queryFn: async () => {
      const { data } = await api.get<{ status: string; data: any[] }>(`/retailers/${code}/orders`);
      return data.data || [];
    },
    enabled: !!code,
  });
};

export const useRetailerNotes = (code: string | null) => {
  return useQuery({
    queryKey: retailersKeys.notes(code || ''),
    queryFn: async () => {
      const { data } = await api.get<{ status: string; data: any[] }>(`/retailers/${code}/notes`);
      return data.data || [];
    },
    enabled: !!code,
  });
};

export const useRetailerComplaints = (code: string | null) => {
  return useQuery({
    queryKey: retailersKeys.complaints(code || ''),
    queryFn: async () => {
      const { data } = await api.get<{ status: string; data: any[] }>(`/retailers/${code}/complaints`);
      return data.data || [];
    },
    enabled: !!code,
  });
};
